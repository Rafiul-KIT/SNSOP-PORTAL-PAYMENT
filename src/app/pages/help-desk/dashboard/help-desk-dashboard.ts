import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-help-desk-dashboard',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule, TableModule, ButtonModule, TagModule],
  templateUrl: './help-desk-dashboard.html',
  styleUrls: ['./help-desk-dashboard.scss']
})
export class HelpDeskDashboard {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Help Desk' }, { label: 'Dashboard' }];

  stats = {
    totalRequests: 128,
    newRequests: 16,
    inProgress: 41,
    resolved: 58,
    slaBreached: 13
  };

  recentTickets = [
    { trackingNo: 'SNSOP-SUP-2026-000121', issue: 'Payment report mismatch issue', status: 'In Progress', priority: 'High', assignedTo: 'Developer Team', sla: '72 hrs' },
    { trackingNo: 'SNSOP-SUP-2026-000122', issue: 'User role assignment problem', status: 'New Request', priority: 'Medium', assignedTo: 'Not Assigned', sla: '72 hrs' },
    { trackingNo: 'SNSOP-SUP-2026-000123', issue: 'Change request for payroll export layout', status: 'Unresolved', priority: 'High', assignedTo: 'System Analyst', sla: '144 hrs' }
  ];

  quickInsights = {
    avgResolution: '39 hrs',
    reopened: 7,
    userRating: '4.4 / 5',
    activeAgents: 12
  };

  notifications = [
    'Ticket 000121 assigned to Developer Team',
    'Ticket 000118 marked resolved',
    'New request submitted by County MIS Officer'
  ];

  constructor(private router: Router) {}

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (status) {
      case 'In Progress': return 'warn';
      case 'New Request': return 'info';
      case 'Resolved': return 'success';
      case 'Unresolved': return 'danger';
      default: return 'secondary';
    }
  }

  getPrioritySeverity(priority: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (priority) {
      case 'High': return 'danger';
      case 'Medium': return 'warn';
      case 'Low': return 'info';
      default: return 'secondary';
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
