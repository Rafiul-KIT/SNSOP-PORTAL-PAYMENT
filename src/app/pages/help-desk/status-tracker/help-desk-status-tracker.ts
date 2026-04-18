import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { InputGroupModule } from 'primeng/inputgroup';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ITRequest, ItSupportService } from '../../../services/it-support.service';
import { ApiService } from '../../../services/api.service';


@Component({
  selector: 'app-help-desk-status-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbModule, ButtonModule, InputTextModule, TagModule, InputGroupModule, ProgressSpinnerModule],
  templateUrl: './help-desk-status-tracker.html',
  styleUrls: ['./help-desk-status-tracker.scss']
})
export class HelpDeskStatusTracker {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Help Desk' }, { label: 'Status Tracker' }];

  searchTrackingNo = '';
  ticketResult: ITRequest | null = null;
  isLoading = false;
  notFound = false;
  private readonly actionUiMap: Record<string, { label: string; icon: string; tone: string }> = {
    CREATED: { label: 'Request Created', icon: 'fas fa-plus-circle', tone: 'created' },
    UPDATED: { label: 'Request Updated', icon: 'fas fa-pen', tone: 'updated' },
    STATUS_CHANGED: { label: 'Status Changed', icon: 'fas fa-arrows-rotate', tone: 'status' },
    ATTACHMENT_ADDED: { label: 'Attachment Added', icon: 'fas fa-paperclip', tone: 'attachment' },
  };
  private readonly ignoredFields = ['id', 'requestId', 'createdBy', 'updatedBy'];

  constructor(
    private itSupportService: ItSupportService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private router: Router
  ) {}

  private detectChanges(): void {
    this.cdr.detectChanges();
  }

  async checkStatus(): Promise<void> {
    const trackingNo = this.searchTrackingNo.trim();

    if (!trackingNo) {
      this.ticketResult = null;
      this.notFound = false;
      this.detectChanges();
      return;
    }

    this.isLoading = true;
    this.notFound = false;
    this.ticketResult = null;
    this.detectChanges();

    this.zone.runOutsideAngular(async () => {
      try {
        const result = await this.itSupportService.getRequestByTrackingNumber(trackingNo);

        this.zone.run(() => {
          this.ticketResult = result;
          this.notFound = !result;
          this.isLoading = false;
          this.detectChanges();
        });
      } catch (error) {
        console.error('Error fetching ticket:', error);
        this.zone.run(() => {
          this.ticketResult = null;
          this.notFound = true;
          this.isLoading = false;
          this.detectChanges();
        });
      }
    });
  }

  onView(): void {
    if (this.ticketResult) {
      this.router.navigate(['/help-desk/request-details', this.ticketResult.id]);
    }
  }

  trackRequest(): void {
    this.searchTrackingNo = 'SNSOP-SUP-2026-000121';
    this.checkStatus();
  }

  getStatusSeverity(status: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'info';
      case 'processing':
        return 'warn';
      case 'required_more_info':
        return 'danger';
      case 'resolved':
      case 'closed':
        return 'success';
      case 'reopened':
        return 'contrast';
      case 'addressed':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private prettifyFieldName(field?: string): string {
    if (!field) return 'Field';
    return field
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/^./, (ch) => ch.toUpperCase());
  }

  private parseTimelineChanges(changes?: string): Array<{ field: string; oldValue: string; newValue: string }> {
    const rows: Array<{ field: string; oldValue: string; newValue: string }> = [];

    if (!changes) return rows;

    try {
      const parsed = JSON.parse(changes);
      if (!Array.isArray(parsed)) return rows;

      parsed
        .filter((change) => change?.field && !this.ignoredFields.includes(String(change.field)))
        .forEach((change) => {
          rows.push({
            field: this.prettifyFieldName(String(change.field)),
            oldValue: String(change.oldValue ?? '-'),
            newValue: String(change.newValue ?? '-'),
          });
        });
    } catch {
      return [];
    }

    return rows;
  }

  private normalizeComment(comment?: string): string {
    return String(comment || '').trim();
  }

  private isCommentAlreadyInChanges(
    rows: Array<{ field: string; oldValue: string; newValue: string }>,
    comment: string
  ): boolean {
    if (!comment) return false;
    return rows.some((r) => r.field.toLowerCase() === 'comment' && r.newValue.trim() === comment);
  }

  getTimelineHistory(): {
    action: string;
    title: string;
    icon: string;
    tone: string;
    changeRows: Array<{ field: string; oldValue: string; newValue: string }>;
    note?: string;
    date: string;
  }[] {
    if (!this.ticketResult?.history?.length) {
      return [];
    }

    return this.ticketResult.history.map((h) => {
      const action = (h.action || 'UPDATED').toUpperCase();
      const actionUi = this.actionUiMap[action] || {
        label: action.replace(/_/g, ' '),
        icon: 'fas fa-circle-info',
        tone: 'default',
      };
      const changeRows = this.parseTimelineChanges(h.changes);
      const comment = this.normalizeComment(h.comment);
      const note = this.isCommentAlreadyInChanges(changeRows, comment) ? '' : comment;

      return {
        action,
        title: actionUi.label,
        icon: actionUi.icon,
        tone: actionUi.tone,
        changeRows,
        note: note || undefined,
        date: this.formatDate(h.performedAt),
      };
    });
  }
}
