import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-help-desk-reports',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule, ButtonModule, TableModule],
  templateUrl: './help-desk-reports.html',
  styleUrls: ['./help-desk-reports.scss']
})
export class HelpDeskReports {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Help Desk' }, { label: 'Reports' }];

  kpis = {
    resolutionWithinSla: '89%',
    avgUserRating: '4.4',
    totalResubmissions: 7,
    openHighPriority: 11
  };

  reportMatrix = [
    { type: 'Total Tickets', current: 128, previous: 116, trend: '+10.3%' },
    { type: 'Resolved Tickets', current: 58, previous: 49, trend: '+18.4%' },
    { type: 'Unresolved Tickets', current: 9, previous: 12, trend: '-25%' },
    { type: 'SLA Breaches', current: 13, previous: 17, trend: '-23.5%' },
    { type: 'User Satisfaction', current: '4.4 / 5', previous: '4.1 / 5', trend: '+7.3%' }
  ];

  getTrendClass(trend: string): string {
    return trend.startsWith('+') ? 'trend-positive' : 'trend-negative';
  }
}
