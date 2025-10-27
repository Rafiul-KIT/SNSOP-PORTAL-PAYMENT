import { Component, effect, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { MenubarModule } from 'primeng/menubar';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-header',
  imports: [RouterModule, ButtonModule, PopoverModule, MenubarModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  showPortalOptions: boolean = false;
  showUsermenu: boolean = false;
  menuList: any = [];
  userInfo: any = null;
  userMenuList: any = [];

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
    { label: 'Survey CTO', icon: 'fas fa-poll' },
  ];

  constructor(private router: Router, private apiService: ApiService) {
    this.menuList = [
      {
        label: 'Dashboard',
        icon: 'fas fa-dashboard',
        routerLink: 'dashboard',
        routerLinkActiveOptions: { exact: true },
      },
      {
        label: 'Project',
        icon: 'fas fa-project-diagram',
        routerLink: 'project-list',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Sub-Project',
        icon: 'fas fa-tasks',
        routerLink: 'sub-project-list',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Creating Wage Request ',
        icon: 'fas fa-hand-holding-usd',
        items: [
          {
            label: 'Wages Request For LIPW',
            icon: 'fas fa-list',
            routerLink: '/apply-wage-request/lipw',
          },
          {
            label: 'Wages Request For DIS',
            icon: 'fas fa-list',
            routerLink: '/apply-wage-request/dis',
          },
        ],
      },
          {
        label: 'Repot',
        icon: 'fas fa-chart-line',
        items: [
          {
            label: ' Reconciliation Detail',
            icon: 'fas fa-list',
            routerLink: '/report/details',
          },
          {
            label: 'Reconciliation Summary',
            icon: 'fas fa-list',
            routerLink: '/report/summary' ,
          },
        ],
      },
      {
        label: 'Beneficiary Attendance',
        icon: 'fas fa-users',
         routerLink: 'beneficiary-attendance',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Creating Payroll',
        icon: 'fas fa-file-invoice-dollar',
        routerLink: 'dashboard',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Payroll Download',
        icon: 'fas fa-download',
        routerLink: 'dashboard',
        routerLinkActiveOptions: 'active',
      },
      // {
      //   label: 'Sub Payroll',
      //   icon: 'fas fa-list-alt',
      //   routerLink: 'dashboard',
      //   routerLinkActiveOptions: 'active',
      // },
      // {
      //   label: 'Supplementary Payroll',
      //   icon: 'fas fa-clipboard-check',
      //   routerLink: 'dashboard',
      //   routerLinkActiveOptions: 'active',
      // },
      // {
      //   label: 'Payroll for Mobile Wallet',
      //   icon: 'fas fa-mobile-alt',
      //   routerLink: 'dashboard',
      //   routerLinkActiveOptions: 'active',
      // },
      // {
      //   label: 'Payroll Reconcile',
      //   icon: 'fas fa-sync-alt',
      //   routerLink: 'dashboard',
      //   routerLinkActiveOptions: 'active',
      // },
    ];

    effect(() => {
      this.userInfo = this.apiService.loginState()?.user;
      // if (this.userInfo?.roleId) {
      //   this.loadMenusForUser(this.userInfo.roleId);
      // }
    });
  }

  isActive(route: string): boolean {
    return this.router.isActive(route, true);
  }

  goToProfile = () => {
    window.location.href = `${environment.portals.master}/home/profile`;
  };

  logout() {
    this.apiService.logout();
    window.location.href = `${environment.portals.master}/#/landing`;
  }
}
