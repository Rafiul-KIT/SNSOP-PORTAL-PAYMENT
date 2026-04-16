import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import Swal from 'sweetalert2';
import { Loader } from '../../../components/loader/loader';
import { ITAttachment, ITCategory, ITHistory, ITModule, ITRequest, ItSupportService } from '../../../services/it-support.service';
import { ApiService } from '../../../services/api.service';


type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-help-desk-request-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BreadcrumbModule, ButtonModule, SelectModule, TagModule, Loader],
  templateUrl: './help-desk-request-detail.html',
  styleUrls: ['./help-desk-request-detail.scss'],
})
export class HelpDeskRequestDetail implements OnInit {
  private readonly MIS_FIRM_ROLE_IDS = [51];

  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/dashboard' };
  breadcrumbItems = [{ label: 'Help Desk', routerLink: '/help-desk/my-requests' }, { label: 'Request Detail' }];

  isLoading = true;
  isSavingDetail = false;
  isUploadingAttachments = false;

  detailRequest: ITRequest | null = null;
  detailHistory: ITHistory[] = [];
  detailAttachments: ITAttachment[] = [];
  selectedDetailFiles: File[] = [];

  categories: ITCategory[] = [];
  modules: ITModule[] = [];

  editPriorityOptions = [
    { label: 'Critical', value: 'CRITICAL' },
    { label: 'High', value: 'HIGH' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'Low', value: 'LOW' },
  ];

  editDescription = '';
  editCategoryId: number | null = null;
  editModuleId: number | null = null;
  editPriority = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private itSupportService: ItSupportService,
    private apiService: ApiService
  ) {}

  private getBackRoute(): string {
    const currentPath = String(this.route.routeConfig?.path || '');
    return currentPath.startsWith('support-management') ? '/help-desk/support-management' : '/help-desk/my-requests';
  }

  async ngOnInit(): Promise<void> {
    this.breadcrumbItems = [{ label: 'Help Desk', routerLink: this.getBackRoute() }, { label: 'Request Detail' }];
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.router.navigate([this.getBackRoute()]);
      return;
    }

    await this.loadLookups();
    await this.loadDetail(id);
  }

  private async loadLookups(): Promise<void> {
    try {
      const [categories, modules] = await Promise.all([
        this.itSupportService.getCategories(),
        this.itSupportService.getModules(),
      ]);
      this.categories = categories;
      this.modules = modules;
    } catch (error) {
      console.error('Failed to load lookups:', error);
    }
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
        this.router.navigate([this.getBackRoute()]);
        return;
      }

      this.editDescription = detail.description || '';
      this.editCategoryId = detail.categoryId ?? null;
      this.editModuleId = detail.moduleId ?? null;
      this.editPriority = detail.priority || '';
    } catch (error) {
      console.error('Failed to load detail:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Load Failed',
        text: 'Unable to load support request details.',
        confirmButtonColor: '#d33',
      });
      this.router.navigate([this.getBackRoute()]);
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

  private isMisFirmUser(): boolean {
    const user = this.getCurrentUser();
    const roleId = Number(user?.roleId);
    const roleName = String(user?.roleName || user?.role || '').toUpperCase();
    return (
      this.MIS_FIRM_ROLE_IDS.includes(roleId) ||
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

  canEditRequest(request?: ITRequest | null): boolean {
    if (!request) return false;
    return this.isRequestCreator(request) && String(request.status || '').toUpperCase() === 'NEW';
  }

  canAddAttachments(request?: ITRequest | null): boolean {
    if (!request) return false;
    return this.isMisFirmUser() || this.isRequestCreator(request);
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

  async saveDetailUpdate(): Promise<void> {
    if (!this.detailRequest || !this.canEditRequest(this.detailRequest)) return;

    this.isSavingDetail = true;
    this.cdr.detectChanges();
    try {
      const response = await this.itSupportService.updateRequest(this.detailRequest.id, {
        description: this.editDescription,
        categoryId: Number(this.editCategoryId),
        moduleId: Number(this.editModuleId),
        priority: this.editPriority,
      });

      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Updated',
          text: response.message || 'Request updated successfully.',
          confirmButtonColor: '#3085d6',
        });
        await this.loadDetail(this.detailRequest.id);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: response.message || 'Unable to update request.',
          confirmButtonColor: '#d33',
        });
      }
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred while updating request.',
        confirmButtonColor: '#d33',
      });
    } finally {
      this.isSavingDetail = false;
      this.cdr.detectChanges();
    }
  }

  onDetailFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDetailFiles = input.files ? Array.from(input.files) : [];
  }

  async uploadDetailAttachments(): Promise<void> {
    if (!this.detailRequest || !this.canAddAttachments(this.detailRequest) || !this.selectedDetailFiles.length) return;

    this.isUploadingAttachments = true;
    this.cdr.detectChanges();
    try {
      const response = await this.itSupportService.addAttachments(this.detailRequest.id, this.selectedDetailFiles);
      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Uploaded',
          text: response.message || 'Attachment(s) added successfully.',
          confirmButtonColor: '#3085d6',
        });
        this.selectedDetailFiles = [];
        await this.loadDetail(this.detailRequest.id);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: response.message || 'Unable to upload attachments.',
          confirmButtonColor: '#d33',
        });
      }
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred while uploading attachments.',
        confirmButtonColor: '#d33',
      });
    } finally {
      this.isUploadingAttachments = false;
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
