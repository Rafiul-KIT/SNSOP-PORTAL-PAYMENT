import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import Swal from 'sweetalert2';
import { Loader } from '../../../components/loader/loader';
import { ITAttachment, ITHistory, ITRequest, ItSupportService } from '../../../services/it-support.service';
import { ApiService } from '../../../services/api.service';


type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

type WorkflowAction = {
  label: string;
  value: string;
  needsComment: boolean;
  actionType: 'status' | 'submit_info';
};

@Component({
  selector: 'app-help-desk-request-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BreadcrumbModule, ButtonModule, TagModule, Loader],
  templateUrl: './help-desk-request-details.html',
  styleUrls: ['./help-desk-request-details.scss'],
})
export class HelpDeskRequestDetails implements OnInit {
  private readonly MANAGER_GRM_ROLE_IDS = [51];

  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/dashboard' };
  breadcrumbItems = [{ label: 'Help Desk', routerLink: '/help-desk/support-management' }, { label: 'Request Detail' }];

  isLoading = true;

  detailRequest: ITRequest | null = null;
  detailHistory: ITHistory[] = [];
  detailAttachments: ITAttachment[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private itSupportService: ItSupportService,
    private apiService: ApiService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.router.navigate(['/help-desk/support-management']);
      return;
    }

    await this.loadDetail(id);
  }

  async loadDetail(requestId: number): Promise<void> {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const [detail, history] = await Promise.all([
        this.itSupportService.getRequestById(requestId),
        this.itSupportService.getRequestHistory(requestId),
      ]);

      this.detailRequest = detail;
      this.detailHistory = history || detail?.history || [];
      this.detailAttachments = detail?.attachments || [];

      if (!detail) {
        await Swal.fire({
          icon: 'warning',
          title: 'Not Found',
          text: 'Request detail not found.',
          confirmButtonColor: '#3085d6',
        });
        this.router.navigate(['/help-desk/support-management']);
        return;
      }
    } catch (error) {
      console.error('Failed to load detail:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Load Failed',
        text: 'Unable to load support request details.',
        confirmButtonColor: '#d33',
      });
      this.router.navigate(['/help-desk/support-management']);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
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

  private isManagerGrmUser(): boolean {
    const user = this.getCurrentUser();
    const roleId = Number(user?.roleId);
    const roleName = String(user?.roleName || user?.role || '').toUpperCase();

    return (
      this.MANAGER_GRM_ROLE_IDS.includes(roleId) ||
      roleName.includes('MANAGERGRM') ||
      roleName.includes('MANAGER GRM') ||
      roleName.includes('MIS_FIRM') ||
      roleName.includes('MIS FIRM')
    );
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
    const isManagerGrm = this.isManagerGrmUser();

    if (!from || !to) return false;

    if (isManagerGrm) {
      return (
        (from === 'NEW' && to === 'PROCESSING') ||
        (from === 'PROCESSING' && ['REQUIRED_MORE_INFO', 'ADDRESSED', 'CLOSED'].includes(to)) ||
        (from === 'REOPENED' && to === 'PROCESSING')
      );
    }

    return (
      (from === 'ADDRESSED' && to === 'RESOLVED') ||
      (from === 'RESOLVED' && to === 'CLOSED') ||
      (from === 'CLOSED' && to === 'REOPENED')
    );
  }

  getAvailableActions(request: ITRequest): WorkflowAction[] {
    const isManagerGrm = this.isManagerGrmUser();
    const status = request.status?.toUpperCase() || '';

    if (isManagerGrm) {
      switch (status) {
        case 'NEW':
          return [{ label: 'Move to Processing', value: 'PROCESSING', needsComment: false, actionType: 'status' }];
        case 'PROCESSING':
          return [
            { label: 'Ask For More Info', value: 'REQUIRED_MORE_INFO', needsComment: true, actionType: 'status' },
            { label: 'Mark Addressed', value: 'ADDRESSED', needsComment: false, actionType: 'status' },
            { label: 'Close', value: 'CLOSED', needsComment: true, actionType: 'status' },
          ];
        case 'REOPENED':
          return [{ label: 'Move to Processing', value: 'PROCESSING', needsComment: false, actionType: 'status' }];
        default:
          return [];
      }
    }

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

  getStatusActionLabel(request: ITRequest): string {
    const actions = this.getAvailableActions(request);
    if (!actions.length) return 'No Action';
    if (actions.length === 1) return actions[0].label;
    return 'Take Action';
  }

  getStatusSeverity(status: string | undefined): Severity {
    switch (status?.toUpperCase()) {
      case 'NEW':
        return 'info';
      case 'PROCESSING':
        return 'warn';
      case 'REQUIRED_MORE_INFO':
        return 'danger';
      case 'ADDRESSED':
        return 'secondary';
      case 'RESOLVED':
      case 'CLOSED':
        return 'success';
      case 'REOPENED':
        return 'contrast';
      default:
        return 'secondary';
    }
  }

  formatStatus(status?: string): string {
    if (!status) return '--';
    return status.replace(/_/g, ' ');
  }

  formatDate(value?: string): string {
    if (!value) return '--';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-GB');
  }

  parseHistoryChanges(changes?: string): Array<{ field: string; oldValue: string; newValue: string }> {
    if (!changes) return [];
    try {
      const parsed = JSON.parse(changes);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item: any) => ({
        field: String(item?.field || '-').replace(/_/g, ' '),
        oldValue: String(item?.oldValue ?? '-'),
        newValue: String(item?.newValue ?? '-'),
      }));
    } catch {
      return [];
    }
  }

  getTimelineTitle(action?: string): string {
    switch (String(action || '').toUpperCase()) {
      case 'CREATED':
        return 'Request Created';
      case 'ATTACHMENT_ADDED':
        return 'Attachment Added';
      case 'STATUS_CHANGED':
        return 'Status Changed';
      default:
        return this.formatStatus(action);
    }
  }

  getTimelineIcon(action?: string): string {
    switch (String(action || '').toUpperCase()) {
      case 'CREATED':
        return 'fas fa-plus';
      case 'ATTACHMENT_ADDED':
        return 'fas fa-paperclip';
      case 'STATUS_CHANGED':
        return 'fas fa-arrows-rotate';
      default:
        return 'fas fa-circle';
    }
  }

  getTimelineTone(action?: string): string {
    switch (String(action || '').toUpperCase()) {
      case 'CREATED':
        return 'created';
      case 'ATTACHMENT_ADDED':
        return 'attachment';
      case 'STATUS_CHANGED':
        return 'status';
      default:
        return 'default';
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
      this.cdr.detectChanges();
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
          await this.loadDetail(request.id);
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
        this.cdr.detectChanges();
      }
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
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
        await this.loadDetail(request.id);
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
      this.cdr.detectChanges();
    }
  }

  async downloadAttachment(attachment: ITAttachment): Promise<void> {
    if (!this.detailRequest) return;

    const blob = await this.itSupportService.downloadAttachment(this.detailRequest.id, attachment.id);
    if (!blob) {
      await Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Unable to download attachment.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.originalFileName || `attachment-${attachment.id}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
