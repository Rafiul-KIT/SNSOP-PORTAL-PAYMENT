import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-help-desk-my-requests',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule, ButtonModule, TagModule],
  templateUrl: './help-desk-my-requests.html',
  styleUrls: ['./help-desk-my-requests.scss']
})
export class HelpDeskMyRequests {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Help Desk' }, { label: 'My Requests' }];

  summary = {
    total: 12,
    resolved: 7,
    pending: 3,
    reopened: 2
  };

  requests = [
    {
      trackingNo: 'SNSOP-SUP-2026-000121',
      title: 'Payment report mismatch issue',
      description: 'Mismatch found between MIS final report and paysheet data during reconciliation review.',
      status: 'In Progress',
      priority: 'High',
      category: 'Report Related',
      assignedTo: 'Developer Team',
      submittedDate: '28 Mar 2026'
    },
    {
      trackingNo: 'SNSOP-SUP-2026-000118',
      title: 'Unable to update beneficiary record',
      description: 'User received permission error when updating beneficiary information from MIS panel.',
      status: 'Resolved',
      priority: 'Medium',
      category: 'User Management',
      assignedTo: null,
      submittedDate: null,
      rating: '4/5'
    },
    {
      trackingNo: 'SNSOP-SUP-2026-000115',
      title: 'Need clarification on wage sheet discrepancy',
      description: 'Initial explanation shared, but further clarification requested by field team.',
      status: 'Unresolved',
      priority: 'Medium',
      category: 'Clarification',
      assignedTo: null,
      submittedDate: null,
      resubmitAvailable: true
    }
  ];

  feedback = {
    rating: 5,
    comment: 'Quick response and clear guidance from the helpdesk officer.'
  };

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (status) {
      case 'In Progress': return 'warn';
      case 'Resolved': return 'success';
      case 'Unresolved': return 'danger';
      default: return 'secondary';
    }
  }

  getStars(count: number): number[] {
    return Array(count).fill(0);
  }
}
