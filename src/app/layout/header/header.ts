import { Component, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { MenubarModule } from 'primeng/menubar';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  imports: [RouterModule, ButtonModule, PopoverModule, MenubarModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  showPortalOptions: boolean = false;
  showUsermenu: boolean = false;
  portalList: any = [];
  menuList: any = [];
  userMenuList: any = [];

  constructor(private router: Router) {
    this.portalList = [
      {
        label: 'Dashboard',
        link: environment.portals.master,
        icon: 'fas fa-dashboard',
      },
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
    ];

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
        routerLink: 'sub-project',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Creating Wage Request',
        icon: 'fas fa-plus',
        routerLink: 'payment/create-wage-request',
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
        routerLink: 'payment/create-payroll',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Payroll Download',
        icon: 'fas fa-download',
        routerLink: 'payment/payroll-download',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Sub Payroll',
        icon: 'fas fa-list',
        routerLink: 'payment/sub-payroll',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Supplementary Payroll',
        icon: 'fas fa-list',
        routerLink: 'payment/supplementary-payroll',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Payroll for Mobile Wallet',
        icon: 'fas fa-list',
        routerLink: 'payment/mobile-wallet-payroll',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Payroll Reconcile',
        icon: 'fas fa-list',
        routerLink: 'payment/payroll-reconcile',
        routerLinkActiveOptions: 'active',
      },
    ];
  }

  goToProfile = () => {
    window.location.href = `${environment.portals.master}/home/profile`;
  };

  logout = () => {};
}
