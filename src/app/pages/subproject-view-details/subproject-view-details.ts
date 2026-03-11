import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
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
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';

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
  selector: 'app-subproject-view-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbModule,
    Loader,
    ToastModule,
    DatePickerModule,
  ],
  templateUrl: './subproject-view-details.html',
  styleUrls: ['./subproject-view-details.scss'],
  providers: [MessageService],
})
export class SubprojectViewDetails implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private msg = inject(MessageService);

  isLoading = signal<boolean>(false);
  subprojectId = signal<number | null>(null);

  proposalForm!: FormGroup;

  breadcrumbItems: MenuItem[] = [
    { label: 'Sub-Project View List', routerLink: '/sub-project/view' },
    { label: 'View Sub-Project Details' },
  ];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
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
          this.router.navigate(['/sub-project/view']);
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
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load sub-project data.',
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  private async fetchSubprojectInfo(id: number): Promise<any> {
    const response: any = await this.api.POST(
      `api/subproject/get?page=0&size=1`,
      { id }
    );
    const responseData = response.data;
    if (responseData?.content && Array.isArray(responseData.content)) {
      return responseData.content[0];
    }
    return responseData;
  }

  private async fetchWorkDetails(subprojectId: number): Promise<WorkActivity[]> {
    const response: any = await this.api.GET(
      `api/subproject/work-details/get?subprojectId=${subprojectId}`
    );
    const responseData = response.data;
    if (responseData?.content && Array.isArray(responseData.content)) {
      return responseData.content;
    }
    return [];
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
      const token = this.api.getToken();
      if (!token) return;

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
      let filename = path.split('/').pop()?.split('?')[0] || 'download';
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
        detail: 'Failed to fetch attachment.',
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
    if (!subprojectData) return;

    const basicInfo = {
      projectName: subprojectData.projectName || '',
      workActivityCode: subprojectData.workCode || '',
      targetbeneficiaries:
        subprojectData.targetBeneficiaries ||
        subprojectData.targetBeneficiary ||
        0,
      projectCost: subprojectData.projectCost || 0,
      typeOfMeeting: this.getTypeOfMeetingLabel(subprojectData.typeOfMeeting) || '',
      meetingDate: subprojectData.meetingDate ? new Date(subprojectData.meetingDate) : '',
      screeningStatus: this.formatScreeningStatus(subprojectData.screeningStatus),
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
          workStartDate: [activity.estStartAt ? new Date(activity.estStartAt) : ''],
          workEndDate: [activity.estEndAt ? new Date(activity.estEndAt) : ''],
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
    const statusMap: { [key: number]: string } = { 0: 'Pending', 1: 'Approved', 2: 'Rejected' };
    return typeof status === 'number' ? statusMap[status] || String(status) : String(status);
  }

  private formatStatus(status: boolean | string | undefined): string {
    if (status === undefined || status === null) return '';
    return typeof status === 'boolean' ? (status ? 'Active' : 'Inactive') : String(status);
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

  onBack(): void {
    this.router.navigate(['/sub-project/view']);
  }
}
