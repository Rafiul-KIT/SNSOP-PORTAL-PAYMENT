import { ChangeDetectorRef, Component, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { MenubarModule } from 'primeng/menubar';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/api.service';
import { HttpClient } from '@angular/common/http';

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
  showHelpDeskDropdown: boolean = false;
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
      link: environment.portals.underConstruction,
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
    {
      label: 'Help Desk',
      // link: this.getMasterHelpDeskLink(),
      link: environment.portals.underConstruction,
      icon: 'fas fa-headset',
      // newTab: true,
    },
    {
      label: 'Monitoring & Evaluation',
      link: environment.portals.mNe,
      icon: 'fas fa-chart-bar',
    },
         {
        label: 'Economic Opportunities',
        link: environment.portals.underConstruction,
        icon: 'fas fa-briefcase',

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
      // Help Desk access: show when user is logged in
      this.canAccessHelpDesk = !!this.userInfo;
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
            this.helpDeskChildren = [];
          this.canAccessHelpDesk = false;
          this.menusLoaded = true;
          this.cdRef.detectChanges();
          return;
        }

        const allowedNames = responseData.map((menu: any) => menu.name);
        const allMenus = this.getStaticMenus();

        // ✅ Update safely and trigger view refresh
        this.menuList = this.filterMenusByAccess(allMenus, allowedNames);

        // Help Desk access: check if user has 'Help Desk' in allowed names
          // Filter help desk items based on permitted URLs
        const allHelpDeskItems = this.getHelpDeskMenuItems();
        this.helpDeskChildren = allHelpDeskItems.filter(item => this.checkRouteAccess(responseData, item.route));
        this.canAccessHelpDesk = this.helpDeskChildren.length > 0;

        this.menusLoaded = true;
        this.cdRef.detectChanges();
      } else {
        console.warn(`No menus found in sessionStorage for role ${roleId}`);
           this.helpDeskChildren = [];
        this.canAccessHelpDesk = false;
        this.menuList = [];
        this.menusLoaded = true;
        this.cdRef.detectChanges();
      }
    } catch (error) {
      console.error('Error loading menus:', error);
        this.menuList = [];
      this.helpDeskChildren = [];
      this.canAccessHelpDesk = false;
      this.menusLoaded = true;
      this.cdRef.detectChanges();
    }
  }

  removeHelpDesk(menus: any[]): any[] {
    return menus
      .filter((menu) => menu.label !== 'Help Desk') // remove parent if direct
      .map((menu) => {
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
            icon: 'fas fa-tasks',
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
            icon: 'fas fa-bell',
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
          },
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
        ],
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

  getHelpDeskMenuItems(): any[] {
    const items = [
      { label: 'Help Desk Dashboard', route: '/help-desk/dashboard', icon: 'fas fa-tachometer-alt', newTab: true },
      { label: 'Submit Support Request', route: '/help-desk/submit-request', icon: 'fas fa-plus-circle', newTab: true },
      { label: 'My Requests', route: '/help-desk/my-requests', icon: 'fas fa-clipboard-list', newTab: true },
      { label: 'Support Management', route: '/help-desk/support-management', icon: 'fas fa-users-cog', newTab: true },
      { label: 'Status Tracker', route: '/help-desk/status-tracker', icon: 'fas fa-search', newTab: true },
      { label: 'Reports', route: '/help-desk/reports', icon: 'fas fa-chart-bar', newTab: true },
      { separator: true, label: 'User Manual', route: '/help-desk/user-manual', icon: 'fas fa-book', newTab: true }
    ];

    return items.map(item => ({
      ...item,
      link: this.getMasterHelpDeskMenuLink(item.route)
    }));
  }

  private checkRouteAccess(permittedMenus: any[], url: string): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0];
    const urlSegments = cleanUrl.split('/').filter(s => s.length > 0);

    for (const menu of permittedMenus) {
      if (!menu.url) continue;

      const menuUrlSegments = menu.url.split('/').filter((s: string) => s.length > 0);

      if (urlSegments.length === menuUrlSegments.length) {
        let match = true;
        for (let i = 0; i < urlSegments.length; i++) {
          if (menuUrlSegments[i].startsWith(':') || menuUrlSegments[i] === urlSegments[i]) {
            continue;
          } else {
            match = false;
            break;
          }
        }
        if (match) return true;
      }
    }
    return false;
  }

  toggleHelpDeskDropdown = () => {
    this.showHelpDeskDropdown = !this.showHelpDeskDropdown;
  };

  hideHelpDeskDropdown = () => {
    this.showHelpDeskDropdown = false;
  };

  onPortalClick(event: MouseEvent, portal: any): void {
    if (!portal?.newTab || !portal?.link) return;

    event.preventDefault();
    event.stopPropagation();
    this.openInNewTab(portal.link);
  }

  onHelpDeskMenuClick(event: MouseEvent, item: any): void {
    if (!item?.newTab || !item?.link) return;

    event.preventDefault();
    event.stopPropagation();
    this.showHelpDeskDropdown = false;
    this.showUsermenu = false;
    this.openInNewTab(item.link);
  }

  private getMasterHelpDeskLink(): string {
    const explicitHelpDeskLink = (environment.portals as any)?.masterHelpDesk as string | undefined;
    if (explicitHelpDeskLink) {
      return explicitHelpDeskLink;
    }

    const masterPortal = (environment.portals.master ?? '').replace(/\/+$/, '');
    const helpDeskPath = '/help-desk/dashboard';
    const masterUsesHashRouting = (environment.portals.masterSettings ?? '').includes('/#/');

    return masterUsesHashRouting
      ? `${masterPortal}/#${helpDeskPath}`
      : `${masterPortal}${helpDeskPath}`;
  }

  private getMasterHelpDeskMenuLink(route: string): string {
    const dashboardLink = this.getMasterHelpDeskLink();
    const routeSuffix = route.replace(/^\/+/, '').replace(/^help-desk\/?/, '') || 'dashboard';

    if (dashboardLink.endsWith('/dashboard')) {
      return dashboardLink.replace(/\/dashboard$/, `/${routeSuffix}`);
    }

    return `${dashboardLink.replace(/\/+$/, '')}/${routeSuffix}`;
  }

  private openInNewTab(targetUrl: string): void {
    const popup = window.open(targetUrl, '_blank', 'noopener,noreferrer');

  }


  logout() {
    this.apiService.logout();
    window.location.href = `${environment.portals.master}/#/landing`;
  }

  goToProfile = () => {
    this.router.navigateByUrl('/profile');
  };
}
