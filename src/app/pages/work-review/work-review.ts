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
// Interfaces
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
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbModule, Loader],
  templateUrl: './work-review.html',
  styleUrls: ['./work-review.scss'],
})
export class WorkReview implements OnInit, OnDestroy {
  // Dependency Injection
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  // Signals
  isLoading = signal<boolean>(false);
  subprojectId = signal<number | null>(null);

  // Form (for display purposes only)
  proposalForm!: FormGroup;
  roleId!: number | null;
  approvalForm!: FormGroup;
  private attachedFile: File | null = null;
  // Breadcrumb
  breadcrumbItems: MenuItem[] = [
    { label: 'Dashboard', routerLink: '/dashboard' },
    { label: 'Work Proposals', routerLink: '/work-proposals' },
    { label: 'View Proposal' },
  ];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  // Cleanup
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

  // submit
  async submitApproval(): Promise<void> {
    if (!this.subprojectId()) {
      alert('Missing subproject id.');
      return;
    }
    if ( !this.roleId) {
      alert('Missing user or role. Please login again.');
      return;
    }
    if (this.approvalForm.invalid) {
      this.approvalForm.markAllAsTouched();
      return;
    }

    // decide endpoint by roleId
    const endpointMap: Record<number, string> = {
      9: 'api/subproject/review/first',
      3: 'api/subproject/review/second',
      12: 'api/subproject/review/third',
    };
    const endpoint = endpointMap[this.roleId];
    if (!endpoint) {
      alert('Your role is not allowed to approve here.');
      return;
    }

    // build form-data
    const fd = new FormData();
    fd.append('subprojectId', String(this.subprojectId())); // required
    // only append date for role 12 and if provided
    if (this.roleId === 12) {
      const d = this.approvalForm.get('pdcApproveDate')?.value;
      if (d) fd.append('pdcApproveDate', d); // yyyy-mm-dd
    }
    fd.append('comments', this.approvalForm.get('comments')?.value);
    // approved comes as string from select → convert to boolean-like
    const approvedStr = this.approvalForm.get('approved')?.value;
    fd.append('approved', approvedStr === 'true' ? 'true' : 'false');

    if (this.attachedFile) {
      fd.append('attachment', this.attachedFile);
    }

    this.isLoading.set(true);
    try {
      // send with headers X-User-Id and X-Role-Id
      await this.api.axiosInstance.post(`/${endpoint}`, fd, {
       
      });
      alert('Approval submitted successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to submit approval.');
    } finally {
      this.isLoading.set(false);
    }
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load data based on route parameter
   */
  private loadData(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (params) => {
        const id = params['id'];
        if (id) {
          this.subprojectId.set(+id);
          await this.loadSubprojectData(+id);
        } else {
          // No ID provided, redirect back
          this.router.navigate(['/work-proposals']);
        }
      });
  }

  /**
   * Load subproject data from API
   */
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

  /**
   * Fetch subproject basic information
   */
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

  /**
   * Fetch work details for subproject
   */
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

  /**
   * Initialize the form (for display only)
   */
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

  /**
   * Populate form with fetched data
   */
  private populateForm(subprojectData: any, workDetails: WorkActivity[]): void {
    if (!subprojectData) {
      console.error('No subproject data to populate');
      return;
    }

    // Populate basic information
    const basicInfo = {
      projectName: subprojectData.projectName || '',
      workActivityCode: subprojectData.workCode || '',
      targetbeneficiaries:
        subprojectData.targetBeneficiaries ||
        subprojectData.targetBeneficiary ||
        0,
      projectCost: subprojectData.projectCost || 0,
      typeOfMeeting: subprojectData.typeOfMeeting || '',
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

    // Clear and populate work activities
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

  /**
   * Format screening status
   */
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

  /**
   * Format status value
   */
  private formatStatus(status: boolean | string | undefined): string {
    if (status === undefined || status === null) return '';
    if (typeof status === 'boolean') return status ? 'Active' : 'Inactive';
    return String(status);
  }

  /**
   * Get work activities form array
   */
  get workActivities(): FormArray {
    return this.proposalForm.get('workActivities') as FormArray;
  }

  /**
   * Track by function for ngFor performance
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Navigate back to list
   */
  onCancel(): void {
    this.router.navigate(['/work-proposals']);
  }
}
