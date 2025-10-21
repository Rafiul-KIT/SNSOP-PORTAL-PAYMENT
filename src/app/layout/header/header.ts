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
    { label: 'Settings', link: environment.portals.masterSettings, icon: 'fas fa-cog' },
    { label: 'Survey CTO', icon: 'fas fa-poll' },
  ];

  constructor(private router: Router, private apiService: ApiService,) {
    this.menuList = [
      {
        label: 'Dashboard',
        icon: 'fas fa-project-dashboard',
        routerLink: 'dashboard',
        routerLinkActiveOptions: 'active',
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
        label: 'Creating Wage Request',
        icon: 'fas fa-plus',
        routerLink: 'dashboard',
        routerLinkActiveOptions: 'active',
      },
        {
        label: 'Beneficiary Attendance',
        icon: 'fas fa-plus',
        routerLink: 'beneficiary-attendance',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Creating Payroll',
        icon: 'fas fa-file-circle-plus',
        routerLink: 'dashboard',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Payroll Download',
        icon: 'fas fa-download',
        routerLink: 'dashboard',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Sub Payroll',
        icon: 'fas fa-list',
        routerLink: 'dashboard',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Supplementary Payroll',
        icon: 'fas fa-list',
        routerLink: 'dashboard',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Payroll for Mobile Wallet',
        icon: 'fas fa-list',
        routerLink: 'dashboard',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Payroll Reconcile',
        icon: 'fas fa-list',
        routerLink: 'dashboard',
        routerLinkActiveOptions: 'active',
      },
    ];

     effect(() => {
      this.userInfo = this.apiService.loginState()?.user;
      // if (this.userInfo?.roleId) {
      //   this.loadMenusForUser(this.userInfo.roleId);
      // }
    });
  }

  goToProfile = () => {
    window.location.href = `${environment.portals.master}/home/profile`;
  };

    logout() {
    this.apiService.logout();
    window.location.href = `${environment.portals.master}/#/landing`;
  }
}
