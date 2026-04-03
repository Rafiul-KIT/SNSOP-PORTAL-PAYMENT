import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-help-desk-user-manual',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule, ButtonModule, AccordionModule],
  templateUrl: './help-desk-user-manual.html',
  styleUrls: ['./help-desk-user-manual.scss']
})
export class HelpDeskUserManual {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Help Desk' }, { label: 'User Manual' }];

  faqs = [
    {
      question: 'How to submit a support request',
      answer: 'Open the Submit Support Request menu, enter issue details, select the correct category and priority, attach supporting files, and submit the request.'
    },
    {
      question: 'How to check request status',
      answer: 'Navigate to the Status Tracker page, enter your tracking number (e.g., SNSOP-SUP-2026-000121), and click "Check" to view the latest status and timeline of your support request.'
    },
    {
      question: 'How re-submission works',
      answer: 'If your issue was not resolved satisfactorily, you can re-submit from the My Requests page or the Status Tracker. Re-submitted requests retain their original tracking number and get re-assigned for further review.'
    },
    {
      question: 'SLA and resolution policy',
      answer: 'Small issues (report clarifications, password resets, minor bugs) target resolution within 72 hours. Large issues (system changes, complex reports, module-level fixes) target 144 hours. SLA breaches are escalated automatically to the helpdesk admin.'
    }
  ];

  popularTopics = [
    'Password reset',
    'Report clarification',
    'User role assignment',
    'Attendance upload issue'
  ];
}
