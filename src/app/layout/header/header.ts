import { ChangeDetectorRef, Component, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { MenubarModule } from 'primeng/menubar';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/api.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterModule, ButtonModule, PopoverModule, MenubarModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header {
  showPortalOptions = false;
  showUsermenu = false;
  menuList: any[] = [];
  userInfo: any = null;
  menusLoaded = false;
  canAccessHelpDesk: boolean = false;
  showHelpDeskDropdown: boolean = false; // Reintroduce showHelpDeskDropdown
  helpDeskChildren: any[] = [];

  portalList = [
    {
      label: 'Beneficiary',
      link: environment.portals.beneficiary,
      icon: 'fas fa-user-friends',
    },
    {
      label: 'Payment',
      link: environment.portals.payment,
      icon: 'fas fa-credit-card',
    },
    { label: 'GRM', link: environment.portals.grm, icon: 'fas fa-sitemap' },
    {
      label: 'Report',
      link: environment.portals.report,
      icon: 'fas fa-chart-line',
    },
    {
      label: 'Settings',
      link: environment.portals.masterSettings,
      icon: 'fas fa-cog',
    },
    {
      label: 'Survey CTO',
      link: environment.portals.surveyCTO,
      icon: 'fas fa-poll',
    },
  ];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private http: HttpClient,
    private cdRef: ChangeDetectorRef
  ) {
    // Watch login state and load menus dynamically
    effect(() => {
      this.userInfo = this.apiService.loginState()?.user;
      if (this.userInfo?.roleId) {
        this.loadMenusForUser(this.userInfo.roleId);
      }
    });
  }

  async loadMenusForUser(roleId: number) {
    try {
      const menus = sessionStorage.getItem(`menus_${roleId}`);
      if (menus) {
        const responseData = JSON.parse(menus);

        // Handle empty response
        if (responseData.length === 0) {
          console.warn(`No menus found for role ${roleId}`);
          this.menuList = [];
          this.menusLoaded = true;
          this.cdRef.detectChanges();
          return;
        }

        const allowedNames = responseData.map((menu: any) => menu.name);
        // Check for 'Help Desk' access
        this.canAccessHelpDesk = allowedNames.includes('Help Desk'); // Use canAccessHelpDesk

        const allMenus = this.getStaticMenus();

        // ✅ Update safely and trigger view refresh
        this.menuList = this.filterMenusByAccess(allMenus, allowedNames);

        // Extract Help Desk menu items if accessible
        const helpDeskMenu = this.menuList.find(menu => menu.label === 'Help Desk');
        this.menuList = this.removeHelpDesk(this.menuList);
        if (helpDeskMenu && helpDeskMenu.items) {
          this.canAccessHelpDesk = true;
          this.helpDeskChildren = helpDeskMenu.items;
        } else {
          this.canAccessHelpDesk = false;
          this.helpDeskChildren = [];
        }

        this.menusLoaded = true;
        this.cdRef.detectChanges();
      } else {
        console.warn(`No menus found in sessionStorage for role ${roleId}`);
        this.menuList = [];
        this.menusLoaded = true;
        this.cdRef.detectChanges();
      }
    } catch (error) {
      console.error('Error loading menus:', error);
      this.menusLoaded = true;
      this.cdRef.detectChanges();
    }
  }
removeHelpDesk(menus: any[]): any[] {
  return menus
    .filter(menu => menu.label !== 'Help Desk') // remove parent if direct
    .map(menu => {
      if (menu.items) {
        menu.items = this.removeHelpDesk(menu.items); // remove from children
      }
      return menu;
    });
}
  getStaticMenus(): any[] {
    return [
      {
        label: 'Dashboard',
        icon: 'fas fa-tachometer-alt',
        routerLink: 'dashboard',
      },

      {
        
        label: 'Project',
        icon: 'fas fa-project-diagram',
        items: [
          {
            label: 'Create New Project',
            icon: 'fas fa-plus',
            routerLink: 'project/add-new',
          },
          {
            label: 'Project List',
            icon: 'fas fa-clipboard',
            routerLink: 'project/list',
          },
        ],
      },
      {
        label: 'Sub-project',
        icon: 'fas fa-sitemap',
        items: [
          {
            label: 'Create New Sub-project',
            icon: 'fas fa-plus',
            routerLink: 'sub-project/add-new',
          },
          {
            label: 'Sub-project List',
            icon: 'fas fa-clipboard',
            routerLink: 'sub-project/list',
          },
          {
            label: 'Sub-project View',
            icon: 'fas fa-clipboard',
            routerLink: 'sub-project/view',
          },
          {
            label: 'Sub-project approval',
            icon: '	fas fa-tasks',
            routerLink: 'sub-project/approval',
          },
        ],
      },
      {
        label: 'Beneficiary Assignment',
        icon: 'fas fa-users-viewfinder',
        items: [
          {
            label: 'Assign Beneficiary',
            icon: 'fas fa-user-plus',
            routerLink: 'beneficiaries/assignment-asign-list',
          },
          {
            label: 'Remove Beneficiary',
            icon: 'fas fa-user-minus',
            routerLink: 'beneficiaries/assignment-remove-list',
          },
        ],
      },
      {
        label: 'Beneficiary Attendance',
        icon: 'fas fa-user-edit',
        routerLink: 'attendance',
      },
      {
        label: 'Training Attendance',
        icon: 'fas fa-user-clock',
        routerLink: 'training-attendance',
      },
      {
        label: 'Wage Request',
        icon: 'fas fa-receipt',
        items: [
          {
            label: 'List of Wage Requests',
            icon: 'fas fa-clipboard',
            routerLink: 'wage-request/list',
          },
          {
            label: 'Apply for LIPW',
            icon: 'fas fa-file-invoice',
            routerLink: 'wage-request/apply-lipw',
          },
          {
            label: 'Apply for DIS',
            icon: 'fas fa-file-invoice',
            routerLink: 'wage-request/apply-dis',
          },
        ],
      },
      {
        label: 'Wage Request Approval',
        icon: 'fas fa-check',
        items: [
          {
            label: 'Draft Requests',
            icon: '	fas fa-bell',
            routerLink: 'wage-request-approval/drafts',
          },
          {
            label: 'Pending Approval',
            icon: 'fas fa-repeat',
            routerLink: 'wage-request-approval/list',
          },
        ],
      },
      {
        label: 'Payroll',
        icon: 'fas fa-donate',
        items: [
          {
            label: 'Payroll Generate',
            icon: 'fas fa-donate',
            routerLink: 'payroll/generate',
          },
          {
            label: 'Cash Payroll Download',
            icon: 'fas fa-donate',
            routerLink: 'payroll/download',
          },
          {
            label: 'Mobile Money',
            icon: 'fas fa-donate',
            routerLink: 'payroll/mobile-money-download',
          },
          {
            label: 'Reconciliation Monitoring',
            icon: 'fas fa-eye',
            routerLink: 'reconciliation-monitoring/list',
          },
        ],
      },
      {
        label: 'Payment Report',
        icon: 'fas fa-file-alt',
        items: [
          {
            label: 'Reconciliation Detail Report',
            icon: 'fas fa-file-alt',
            routerLink: 'report/details',
          },
          {
            label: 'Reconciliation Summary Report',
            icon: 'fas fa-file-alt',
            routerLink: 'report/summary',
          },
          {
            label: 'Total Beneficiary Payment Details',
            icon: 'fas fa-file-alt',
            routerLink: 'report/payment-details',
          },
           {
            label: 'Wage Request Abstract Report',
            icon: 'fas fa-file-alt',
            routerLink: 'report/wage-request-abstract',
          },
           {
            label: 'Multiple Attendance Report',
            icon: 'fas fa-file-alt',
            routerLink: 'report/multiple-attendance',
          },
          {
            label: 'Beneficiary Attendance Report',
            icon: 'fas fa-file-alt',
            routerLink: 'report/beneficiary-attendance',
          },
          {
            label: 'Training Attendance and Participant Summary Report',
            icon: 'fas fa-file-alt',
            routerLink: 'report/training-attendance-and-participant-summary-report',
          },
          {
            label: 'Complementary Social Measures Progress Report',
            icon: 'fas fa-file-alt',
            routerLink: 'report/complementary-social-measures-progress-report',
          }


        ],
      },
      {
        label: 'Invoice',
        icon: 'fas fa-file-alt',
        items: [
          {
            label: 'Wage Paid Request Abstract With Invoice',
            icon: 'fas fa-file-alt',
            routerLink: 'invoice/wage-paid-request-abstract-with-invoice',
          },
          {
            label: 'Paid Date Wise Payment Invoice',
            icon: 'fas fa-file-alt',
            routerLink: 'invoice/paid-date-wise-payment-invoice',
          },
        ]
      },
      {
        label: 'Help Desk',
        icon: 'fas fa-question-circle',
        items: [
          { label: 'Help Desk Dashboard', routerLink: '/help-desk/dashboard', icon: 'fas fa-tachometer-alt' },
          { label: 'Submit Support Request', routerLink: '/help-desk/submit-request', icon: 'fas fa-plus-circle' },
          { label: 'My Requests', routerLink: '/help-desk/my-requests', icon: 'fas fa-clipboard-list' },
          { label: 'Support Management', routerLink: '/help-desk/support-management', icon: 'fas fa-users-cog' },
          { label: 'Status Tracker', routerLink: '/help-desk/status-tracker', icon: 'fas fa-search' },
          { label: 'Reports', routerLink: '/help-desk/reports', icon: 'fas fa-chart-bar' },
         
        ]
      },
      
    ];
  }

  // ✅ Recursive filter: keep only allowed menus (parent and child)
  filterMenusByAccess(menus: any[], allowedNames: string[]): any[] {
    return menus
      .filter((menu) => allowedNames.includes(menu.label)) // filter parent menus
      .map((menu) => ({
        ...menu,
        // Recursively filter child menus if the parent is allowed
        items: menu.items
          ? this.filterMenusByAccess(menu.items, allowedNames)
          : undefined,
      }));
  }

  logout() {
    this.apiService.logout();
    window.location.href = `${environment.portals.master}/#/landing`;
  }
  goToProfile = () => {
    this.router.navigateByUrl('/profile');
  };

  toggleHelpDeskDropdown = () => {
    this.showHelpDeskDropdown = !this.showHelpDeskDropdown;
  };

  hideHelpDeskDropdown = () => {
    this.showHelpDeskDropdown = false;
  };
}
