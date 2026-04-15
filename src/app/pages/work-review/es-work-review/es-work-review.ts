import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../services/api.service';
import { ChangeDetectorRef } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import Swal from 'sweetalert2';
import { handleFileUpload } from '../../../validators/file-validator';

export const TypeOfMeetingEnum = [
  { id: '0', value: 'CC', label: 'Community Committee' },
  { id: '1', value: 'AM', label: 'Assessment Meeting' },
  { id: '2', value: 'OT', label: 'On-site Training' },
];
interface WorkActivity {
  id?: number;
  workName: string;
  workCode: string;
  areaOfWorkId: number;
  areaOfWork: string;
  workActivityId: number;
  workActivity: string;
  estManPower: number;
  estDay: number;
  estSkilledLabourDay: number;
  estStartAt: string;
  estEndAt: string;
  estCost: number;
  equipmentCost: number;
  materialCost: number;
  equipmentPhotoUrl?: string;
  workPhotoUrl?: string;
  materialPhotoUrl?: string;
  startCoordinate?: string;
  endCoordinate?: string;
  paperScreeningStatus?: string;
  status?: boolean | string;
}

interface ReviewHistory {
  status: string;
  attachmentUrl: string;
  fileName: string;
  filePath: string;
  comments: string;
  reviewedAt: string;
}

@Component({
  selector: 'app-es-work-review',
  templateUrl: './es-work-review.html',
  styleUrls: ['./es-work-review.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbModule,
    Loader,
    ToastModule,
    DatePickerModule,
  ],
  providers: [MessageService],
})
export class EsWorkReview implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private msg = inject(MessageService);

  isLoading = signal<boolean>(false);
  subprojectId = signal<number | null>(null);
  reviewHistory = signal<ReviewHistory[]>([]);
  readonly MAX_ATTACHMENT_SIZE_MB = 25;
  readonly SHOW_PDC_APPROVE_DATE = false;
  readonly LIST_ROUTE = '/sub-project/approval/es';
  readonly REVIEW_ENDPOINT = 'api/subproject/review/second';

  proposalForm!: FormGroup;
  approvalForm!: FormGroup;
  breadcrumbItems: MenuItem[] = [
    { label: 'Dashboard', routerLink: '/dashboard' },
    { label: 'Work Proposals', routerLink: this.LIST_ROUTE },
    { label: 'View Proposal' },
  ];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeForm();
    this.initApprovalForm();
    this.loadData();
  }

  private initApprovalForm(): void {
    this.approvalForm = this.fb.group({
      pdcApproveDate: [''],
      attachment: [''],
      comments: ['', [Validators.required, Validators.maxLength(255)]],
    });
  }

  onApprovalFileSelect(evt: Event) {
    handleFileUpload(evt, this.approvalForm, 'attachment', this.MAX_ATTACHMENT_SIZE_MB);
  }

  removeAttachment(): void {
    this.approvalForm.get('attachment')?.setValue(null);
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  async submitApproval(isApproved: boolean): Promise<void> {
    if (!this.subprojectId()) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Missing subproject ID.' });
      return;
    }

    this.approvalForm.markAllAsTouched();

    if (this.approvalForm.get('comments')?.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Comments are required to submit.',
      });
      return;
    }

    if (this.approvalForm.get('attachment')?.hasError('invalidSize')) {
      Swal.fire({
        icon: 'error',
        title: 'File Error',
        text: 'File size exceeds the limit. Please select a smaller file.',
      });
      return;
    }

    const fd = new FormData();
    fd.append('subprojectId', String(this.subprojectId()));
    fd.append('comments', this.approvalForm.get('comments')?.value);
    fd.append('approved', String(isApproved));

    const attachmentFile = this.approvalForm.get('attachment')?.value;
    if (attachmentFile) {
      fd.append('attachment', attachmentFile);
    }

    try {
      await this.api.axiosInstance.post(`/${this.REVIEW_ENDPOINT}`, fd, {});
      const statusMessage = isApproved ? 'Approved' : 'Rejected';
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Status ${statusMessage} Submitted successfully!`,
      }).then(() => {
        this.router.navigateByUrl(this.LIST_ROUTE);
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to submit approval.',
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(async (params) => {
      const id = params['id'];
      if (id) {
        this.subprojectId.set(+id);
        await this.loadSubprojectData(+id);
      } else {
        this.router.navigateByUrl(this.LIST_ROUTE);
      }
    });
  }

  private async loadSubprojectData(id: number): Promise<void> {
    this.isLoading.set(true);
    try {
      const [subprojectData, workDetails] = await Promise.all([
        this.fetchSubprojectInfo(id),
        this.fetchWorkDetails(id),
        this.fetchReviewHistory(id),
      ]);
      this.populateForm(subprojectData, workDetails);
      this.cdr.detectChanges();
      this.proposalForm.disable();
    } catch (e) {
      console.error('Error loading data:', e);
      alert('Failed to load work proposal data.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async fetchReviewHistory(subprojectId: number): Promise<void> {
    try {
      const response: any = await this.api.GET(
        `api/subproject/review/history?subprojectId=${subprojectId}`
      );
      if (response.data?.content) {
        this.reviewHistory.set(response.data.content);
      }
    } catch (error) {
      console.error('Error fetching review history:', error);
    }
  }

  private async fetchSubprojectInfo(id: number): Promise<any> {
    const response: any = await this.api.POST(`api/subproject/get?page=0&size=1`, {
      id,
    });
    const responseData = response.data;
    if (responseData?.content && Array.isArray(responseData.content)) {
      return responseData.content[0];
    }
    return responseData?.content ?? responseData;
  }

  private async fetchWorkDetails(subprojectId: number): Promise<WorkActivity[]> {
    const response: any = await this.api.GET(
      `api/subproject/work-details/get?subprojectId=${subprojectId}`
    );
    const responseData = response.data;
    return responseData?.content && Array.isArray(responseData.content)
      ? responseData.content
      : [];
  }

  async viewAttachment(path: string | null | undefined): Promise<void> {
    if (!path) {
      this.msg.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No attachment path found.',
      });
      return;
    }

    this.isLoading.set(true);
    try {
      const response = await this.api.axiosInstance.get(
        `api/subproject/work-details/attachment/get`,
        {
          params: { filePath: path },
          responseType: 'blob',
        }
      );

      const blob = response.data;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      const filename = path.split('/').pop()?.split('?')[0] || 'download';
      link.setAttribute('download', decodeURIComponent(filename));
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
    } catch (err) {
      console.error('Failed to fetch attachment:', err);
      this.msg.add({
        severity: 'error',
        summary: 'Load Failed',
        detail:
          'Failed to fetch attachment. It may no longer exist or you do not have permission.',
      });
    } finally {
      this.isLoading.set(false);
      this.cdr.detectChanges();
    }
  }

  private initializeForm(): void {
    this.proposalForm = this.fb.group({
      projectName: [''],
      workActivityCode: [''],
      targetbeneficiaries: [null],
      projectCost: [null],
      typeOfMeeting: [''],
      meetingDate: [''],
      screeningStatus: [''],
      stateName: [''],
      countyName: [''],
      payamName: [''],
      bomaName: [''],
      workActivities: this.fb.array([]),
    });
  }

  private populateForm(subprojectData: any, workDetails: WorkActivity[]): void {
    const basicInfo = {
      projectName: subprojectData.projectName || '',
      workActivityCode: subprojectData.workCode || '',
      targetbeneficiaries:
        subprojectData.targetBeneficiaries ||
        subprojectData.targetBeneficiary ||
        0,
      projectCost: subprojectData.projectCost || 0,
      typeOfMeeting: this.getTypeOfMeetingLabel(subprojectData.typeOfMeeting) || '',
      meetingDate: subprojectData.meetingDate
        ? new Date(subprojectData.meetingDate)
        : '',
      screeningStatus: this.formatScreeningStatus(subprojectData.screeningStatus),
      stateName: subprojectData.stateName || '',
      countyName: subprojectData.countyName || '',
      payamName: subprojectData.payamName || '',
      bomaName: subprojectData.bomaName || '',
    };

    this.proposalForm.patchValue(basicInfo, { emitEvent: false });
    this.workActivities.clear();

    workDetails.forEach((activity) => {
      const activityGroup = this.fb.group({
        name: [activity.workName || ''],
        code: [activity.workCode || ''],
        typeOfWork: [activity.areaOfWork || ''],
        secondaryActivity: [activity.workActivity || ''],
        estimatedManpower: [activity.estManPower || 0],
        estimatedManDays: [activity.estDay || 0],
        estimatedSkillLabour: [activity.estSkilledLabourDay || 0],
        estimatedCostOfEquipment: [activity.equipmentCost || 0],
        estimatedCost: [activity.materialCost || 0],
        totalEstimatedCost: [activity.estCost || 0],
        workStartDate: [activity.estStartAt ? new Date(activity.estStartAt) : ''],
        workEndDate: [activity.estEndAt ? new Date(activity.estEndAt) : ''],
        startCoordinate: [activity.startCoordinate || ''],
        endCoordinate: [activity.endCoordinate || ''],
        paperScreeningStatus: [activity.paperScreeningStatus || ''],
        status: [this.formatStatus(activity.status)],
        equipmentPhotoUrl: [activity.equipmentPhotoUrl || ''],
        workPhotoUrl: [activity.workPhotoUrl || ''],
        materialPhotoUrl: [activity.materialPhotoUrl || ''],
      });

      this.workActivities.push(activityGroup);
    });
  }

  private formatScreeningStatus(status: number | string | undefined): string {
    if (status === undefined || status === null) return '';
    if (typeof status === 'number') {
      const statusMap: { [key: number]: string } = {
        0: 'Pending',
        1: 'Approved',
        2: 'Rejected',
      };
      return statusMap[status] || String(status);
    }
    return String(status);
  }

  private formatStatus(status: boolean | string | undefined): string {
    if (status === undefined || status === null) return '';
    if (typeof status === 'boolean') return status ? 'Active' : 'Inactive';
    return String(status);
  }

  getTypeOfMeetingLabel(value: string): string {
    const found = TypeOfMeetingEnum.find((item) => item.value === value);
    return found ? found.label : value;
  }

  get workActivities(): FormArray {
    return this.proposalForm.get('workActivities') as FormArray;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
