import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-help-desk-status-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbModule, ButtonModule, InputTextModule],
  templateUrl: './help-desk-status-tracker.html',
  styleUrls: ['./help-desk-status-tracker.scss']
})
export class HelpDeskStatusTracker {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Help Desk' }, { label: 'Status Tracker' }];

  searchTrackingNo = '';
  ticketResult: any = null;

  // Demo data
  private demoTickets: Record<string, any> = {
    'SNSOP-SUP-2026-000121': {
      trackingNo: 'SNSOP-SUP-2026-000121',
      status: 'In Progress',
      assignedRole: 'Developer Team',
      expectedResolution: 'Within 72 hours',
      requester: 'District MIS Officer',
      timeline: [
        { title: 'Request Submitted', detail: '28 Mar 2026, 10:15 AM by District MIS Officer' },
        { title: 'Assigned to Developer Team', detail: '28 Mar 2026, 10:45 AM by Helpdesk Admin' },
        { title: 'Investigation in Progress', detail: 'Root cause analysis ongoing with payroll reporting SQL query review.' },
        { title: 'User Notified', detail: 'Status update sent via email and SMS.' }
      ]
    }
  };

  checkStatus() {
    const key = this.searchTrackingNo.trim();
    this.ticketResult = this.demoTickets[key] || null;
    if (!key) {
      this.ticketResult = null;
    }
  }

  trackRequest() {
    this.searchTrackingNo = 'SNSOP-SUP-2026-000121';
    this.checkStatus();
  }
}
