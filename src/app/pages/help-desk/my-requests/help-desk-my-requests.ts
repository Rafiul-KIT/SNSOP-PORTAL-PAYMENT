import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { Loader } from '../../../components/loader/loader';

import Swal from 'sweetalert2';

import { TableModule } from 'primeng/table';
import { ITRequest, ItSupportService } from '../../../services/it-support.service';
import { ApiService } from '../../../services/api.service';


type WorkflowAction = {
  label: string;
  value: string;
  needsComment: boolean;
  actionType: 'status' | 'submit_info';
};

@Component({
  selector: 'app-help-desk-my-requests',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule, ButtonModule, TagModule, SelectModule, InputTextModule, FormsModule, Loader, TableModule],
  templateUrl: './help-desk-my-requests.html',
  styleUrls: ['./help-desk-my-requests.scss']
})
export class HelpDeskMyRequests implements OnInit {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Help Desk' }, { label: 'My Requests' }];

  isLoading = false;
  requests: ITRequest[] = [];
  filteredRequests: ITRequest[] = [];

  summary = {
    total: 0,
    resolved: 0,
    pending: 0,
    reopened: 0
  };

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'New', value: 'NEW' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Required More Info', value: 'REQUIRED_MORE_INFO' },
    { label: 'Addressed', value: 'ADDRESSED' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' },
    { label: 'Reopened', value: 'REOPENED' }
  ];

  priorityOptions = [
    { label: 'All Priorities', value: '' },
    { label: 'Critical', value: 'CRITICAL' },
    { label: 'High', value: 'HIGH' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'Low', value: 'LOW' }
  ];

  selectedStatus = '';
  selectedPriority = '';

  feedback = {
    rating: 5,
    comment: 'Quick response and clear guidance from the helpdesk officer.'
  };

  constructor(
    private itSupportService: ItSupportService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private apiService: ApiService,
    private router: Router
  ) {}

  private detectChanges(): void {
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.loadRequests();
  }

  async loadRequests(): Promise<void> {
    this.isLoading = true;
    this.detectChanges();

    const params: any = { size: 50 };
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.selectedPriority) params.priority = this.selectedPriority;

    this.zone.runOutsideAngular(async () => {
      try {
        const result = await this.itSupportService.getRequests(params);

        this.zone.run(() => {
          this.requests = result.items;
          this.filteredRequests = result.items;
          this.calculateSummary();
          this.isLoading = false;
          this.detectChanges();
        });
      } catch (error) {
        console.error('Error loading requests:', error);
        this.zone.run(() => {
          this.isLoading = false;
          this.detectChanges();
        });
      }
    });
  }

  filterRequests(): void {
    this.loadRequests();
  }

  calculateSummary(): void {
    this.summary.total = this.requests.length;
    this.summary.resolved = this.requests.filter(
      (r) => r.status?.toLowerCase() === 'resolved' || r.status?.toLowerCase() === 'closed'
    ).length;
    this.summary.pending = this.requests.filter(
      (r) => r.status?.toLowerCase() === 'new' || r.status?.toLowerCase() === 'processing' || r.status?.toLowerCase() === 'required_more_info'
    ).length;
    this.summary.reopened = this.requests.filter((r) => r.status?.toLowerCase() === 'reopened').length;
  }

  onView(request: ITRequest): void {
    this.router.navigate(['/help-desk/request-details', request.id]);
  }

  getStatusActionLabel(request: ITRequest): string {
    const actions = this.getAvailableActions(request);
    if (!actions.length) return 'No Action';
    if (actions.length === 1) return actions[0].label;
    return 'Take Action';
  }

  private getCurrentUser(): any {
    return this.apiService.loginState()?.user || {};
  }

  private getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    const raw = user?.userId ?? user?.id ?? user?.uid ?? user?.sub ?? null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private isRequestCreator(request?: ITRequest | null): boolean {
    if (!request) return false;
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return false;
    return Number(request.createdBy) === currentUserId;
  }

  private canTransition(fromStatus?: string, toStatus?: string): boolean {
    const from = String(fromStatus || '').toUpperCase();
    const to = String(toStatus || '').toUpperCase();

    if (!from || !to) return false;

    return (
      (from === 'ADDRESSED' && to === 'RESOLVED') ||
      (from === 'RESOLVED' && to === 'CLOSED') ||
      (from === 'CLOSED' && to === 'REOPENED')
    );
  }

  getAvailableActions(request: ITRequest): WorkflowAction[] {
    const status = request.status?.toUpperCase() || '';

    if (!this.isRequestCreator(request)) return [];

    switch (status) {
      case 'REQUIRED_MORE_INFO':
        return [{ label: 'Submit Required Info', value: 'PROCESSING', needsComment: false, actionType: 'submit_info' }];
      case 'ADDRESSED':
        return [{ label: 'Mark Resolved', value: 'RESOLVED', needsComment: false, actionType: 'status' }];
      case 'RESOLVED':
        return [{ label: 'Close', value: 'CLOSED', needsComment: true, actionType: 'status' }];
      case 'CLOSED':
        return [{ label: 'Reopen', value: 'REOPENED', needsComment: true, actionType: 'status' }];
      default:
        return [];
    }
  }

  async onAction(request: ITRequest): Promise<void> {
    const actions = this.getAvailableActions(request);
    if (!actions.length) return;

    let selectedAction = actions[0];

    if (actions.length > 1) {
      const { value: selectedValue } = await Swal.fire({
        title: 'Select Next Status',
        input: 'select',
        inputOptions: actions.reduce((acc, action) => {
          acc[action.value] = `${action.label} (${action.value})`;
          return acc;
        }, {} as Record<string, string>),
        inputPlaceholder: 'Select transition',
        showCancelButton: true,
        confirmButtonText: 'Continue',
        confirmButtonColor: '#3085d6',
        inputValidator: (value) => (!value ? 'Please select a status transition.' : null),
      });

      if (!selectedValue) return;
      selectedAction = actions.find((a) => a.value === selectedValue) || actions[0];
    }

    let comment = '';
    if (selectedAction.needsComment) {
      const result = await Swal.fire({
        title: 'Comment Required',
        input: 'textarea',
        inputLabel: `Provide comment for ${selectedAction.value}`,
        inputPlaceholder: 'Type workflow comment',
        showCancelButton: true,
        confirmButtonText: 'Update Status',
        confirmButtonColor: '#3085d6',
        inputValidator: (value) => (!value?.trim() ? 'Comment is required for this transition.' : null),
      });

      if (!result.isConfirmed) return;
      comment = String(result.value || '').trim();
    }

    if (selectedAction.actionType === 'submit_info') {
      const result = await Swal.fire({
        title: 'Submit Required Information',
        html: `
          <div style="text-align: left; font-family: inherit;">
            <p style="font-size: 0.9rem; color: #6c757d; margin-bottom: 1.25rem; border-bottom: 1px solid #e9ecef; padding-bottom: 0.5rem;">
              <i class="fas fa-circle-info" style="color: #3b82f6; margin-right: 6px;"></i>
              Please provide at least one of the following to update your request.
            </p>
            
            <div style="margin-bottom: 1rem;">
              <label for="submit-info-comment" style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; color: #374151;">Workflow Comment</label>
              <textarea id="submit-info-comment" class="swal2-textarea" style="width: 100%; height: 80px; margin: 0; padding: 0.75rem; font-size: 0.9rem; border-radius: 8px; border: 1px solid #d1d5db;" placeholder="Describe your updates or response..."></textarea>
            </div>

            <div style="margin-bottom: 1rem;">
              <label for="submit-info-description" style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; color: #374151;">Updated Description (Optional)</label>
              <textarea id="submit-info-description" class="swal2-textarea" style="width: 100%; height: 80px; margin: 0; padding: 0.75rem; font-size: 0.9rem; border-radius: 8px; border: 1px solid #d1d5db;" placeholder="If you need to update the original description..."></textarea>
            </div>

            <div style="margin-bottom: 0.5rem;">
              <label for="submit-info-files" style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; color: #374151;">Attachments (Optional)</label>
              <input id="submit-info-files" type="file" class="swal2-file" style="width: 100%; margin: 0; font-size: 0.85rem; border: 1px solid #d1d5db; border-radius: 8px; padding: 0.5rem;" multiple />
              <div style="font-size: 0.75rem; color: #9ca3af; mt-1">Select one or more files to upload.</div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Submit Info',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6e7881',
        width: '500px',
        preConfirm: () => {
          const commentValue = String((document.getElementById('submit-info-comment') as HTMLTextAreaElement)?.value || '').trim();
          const descriptionValue = String((document.getElementById('submit-info-description') as HTMLTextAreaElement)?.value || '').trim();
          const files = Array.from((document.getElementById('submit-info-files') as HTMLInputElement)?.files || []);
          if (!commentValue && !descriptionValue && !files.length) {
            Swal.showValidationMessage('Please provide at least a comment, description, or attachment.');
            return null;
          }
          return { commentValue, descriptionValue, files };
        },
      });

      if (!result.isConfirmed || !result.value) return;

      this.isLoading = true;
      this.detectChanges();
      try {
        const submitResponse = await this.itSupportService.submitInfo(
          request.id,
          {
            comment: result.value.commentValue || undefined,
            description: result.value.descriptionValue || undefined,
          },
          result.value.files || []
        );

        if (submitResponse.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Information Submitted',
            text: submitResponse.message || 'Required information submitted and status moved to PROCESSING.',
            confirmButtonColor: '#3085d6',
          });
          this.loadRequests();
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Submit Failed',
            text: submitResponse.message || 'Unable to submit required information.',
            confirmButtonColor: '#d33',
          });
        }
      } catch {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An unexpected error occurred while submitting required information.',
          confirmButtonColor: '#d33',
        });
      } finally {
        this.isLoading = false;
        this.detectChanges();
      }
      return;
    }

    this.isLoading = true;
    this.detectChanges();
    try {
      if (!this.canTransition(request.status, selectedAction.value)) {
        await Swal.fire({
          icon: 'warning',
          title: 'Invalid Transition',
          text: `Invalid status transition from ${request.status} to ${selectedAction.value}.`,
          confirmButtonColor: '#3085d6',
        });
        return;
      }

      const response = await this.itSupportService.updateRequestStatus(request.id, {
        status: selectedAction.value,
        ...(comment ? { comment } : {}),
      });

      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: response.message || 'Request status updated successfully.',
          confirmButtonColor: '#3085d6',
        });
        this.loadRequests();
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: response.message || 'Unable to update request status.',
          confirmButtonColor: '#d33',
        });
      }
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred while updating status.',
        confirmButtonColor: '#d33',
      });
    } finally {
      this.isLoading = false;
      this.detectChanges();
    }
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
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

  getStars(count: number): number[] {
    return Array(count).fill(0);
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
