import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { Loader } from '../../components/loader/loader';
import { ApiService } from '../../services/api.service';
import { ChangeDetectorRef } from '@angular/core';
import { Validators } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import Swal from 'sweetalert2';

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

@Component({
  selector: 'app-work-review',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbModule,
    Loader,
    ToastModule,
  ],
  templateUrl: './work-review.html',
  styleUrls: ['./work-review.scss'],
  providers: [MessageService],
})
export class WorkReview implements OnInit, OnDestroy {
  // Dependency Injection
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private msg = inject(MessageService);

  isLoading = signal<boolean>(false);
  subprojectId = signal<number | null>(null);

  proposalForm!: FormGroup;
  roleId!: number | null;
  approvalForm!: FormGroup;
  private attachedFile: File | null = null;

  breadcrumbItems: MenuItem[] = [
    { label: 'Dashboard', routerLink: '/dashboard' },
    { label: 'Work Proposals', routerLink: '/work-proposals' },
    { label: 'View Proposal' },
  ];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.roleId = this.api.getUserRole();

    this.initializeForm();
    this.initApprovalForm();
    this.loadData();
  }
  private initApprovalForm(): void {
    this.approvalForm = this.fb.group({
      pdcApproveDate: [{ value: '', disabled: this.roleId !== 12 }],
      attachment: [''],
      comments: ['', Validators.required],
      approved: ['', Validators.required],
    });
  }
  onApprovalFileSelect(evt: Event) {
    const input = evt.target as HTMLInputElement;
    this.attachedFile =
      input?.files && input.files.length ? input.files[0] : null;
  }

async submitApproval(): Promise<void> {
  if (!this.subprojectId()) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Missing subproject ID.',
    });
    return;
  }

  if (!this.roleId) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Missing user or role. Please login again.',
    });
    return;
  }

  if (this.approvalForm.invalid) {
    this.approvalForm.markAllAsTouched();
    Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Please fill all required fields, including comments.',
    });
    return;
  }

  const endpointMap: Record<number, string> = {
    9: 'api/subproject/review/first',
    3: 'api/subproject/review/second',
    12: 'api/subproject/review/third',
  };
  const endpoint = endpointMap[this.roleId];

  if (!endpoint) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Your role is not allowed to approve here.',
    });
    return;
  }

  const fd = new FormData();
  fd.append('subprojectId', String(this.subprojectId()));

  if (this.roleId === 12) {
    const d = this.approvalForm.get('pdcApproveDate')?.value;
    if (d) fd.append('pdcApproveDate', d);
  }

  fd.append('comments', this.approvalForm.get('comments')?.value);

  const approvedStr = this.approvalForm.get('approved')?.value;
  fd.append('approved', approvedStr === 'true' ? 'true' : 'false');

  if (this.attachedFile) {
    fd.append('attachment', this.attachedFile);
  }


  try {
    await this.api.axiosInstance.post(`/${endpoint}`, fd, {});
    
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Status submitted successfully!',
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
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (params) => {
        const id = params['id'];
        if (id) {
          this.subprojectId.set(+id);
          await this.loadSubprojectData(+id);
        } else {
          this.router.navigate(['/work-proposals']);
        }
      });
  }

  private async loadSubprojectData(id: number): Promise<void> {
    this.isLoading.set(true);
    try {
      const [subprojectData, workDetails] = await Promise.all([
        this.fetchSubprojectInfo(id),
        this.fetchWorkDetails(id),
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

  private async fetchSubprojectInfo(id: number): Promise<any> {
    try {
      const requestBody = { id };
      const queryParams = `page=0&size=1`;

      const response: any = await this.api.POST(
        `api/subproject/get?${queryParams}`,
        requestBody
      );

      const responseData = response.data;

      if (responseData?.content && Array.isArray(responseData.content)) {
        return responseData.content[0];
      } else if (responseData?.content) {
        return responseData.content;
      }

      return responseData;
    } catch (error) {
      console.error('Error fetching subproject info:', error);
      throw error;
    }
  }

  private async fetchWorkDetails(
    subprojectId: number
  ): Promise<WorkActivity[]> {
    try {
      const response: any = await this.api.GET(
        `api/subproject/work-details/get?subprojectId=${subprojectId}`
      );

      const responseData = response.data;

      if (responseData?.content && Array.isArray(responseData.content)) {
        return responseData.content;
      }

      return [];
    } catch (error) {
      console.error('Error fetching work details:', error);
      throw error;
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
    if (!subprojectData) {
      console.error('No subproject data to populate');
      return;
    }

    const basicInfo = {
      projectName: subprojectData.projectName || '',
      workActivityCode: subprojectData.workCode || '',
      targetbeneficiaries:
        subprojectData.targetBeneficiaries ||
        subprojectData.targetBeneficiary ||
        0,
      projectCost: subprojectData.projectCost || 0,
      typeOfMeeting: this.getTypeOfMeetingLabel(subprojectData.typeOfMeeting) || '',
      meetingDate: subprojectData.meetingDate || '',
      screeningStatus: this.formatScreeningStatus(
        subprojectData.screeningStatus
      ),
      stateName: subprojectData.stateName || '',
      countyName: subprojectData.countyName || '',
      payamName: subprojectData.payamName || '',
      bomaName: subprojectData.bomaName || '',
    };

    this.proposalForm.patchValue(basicInfo, { emitEvent: false });

    this.workActivities.clear();

    if (workDetails && workDetails.length > 0) {
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
          workStartDate: [activity.estStartAt || ''],
          workEndDate: [activity.estEndAt || ''],
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
    const found = TypeOfMeetingEnum.find(item => item.value === value);
    return found ? found.label : value;
  }

  get workActivities(): FormArray {
    return this.proposalForm.get('workActivities') as FormArray;
  }

  trackByIndex(index: number): number {
    return index;
  }

  onCancel(): void {
    this.router.navigate(['/work-proposals']);
  }
}
