import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TooltipModule } from 'primeng/tooltip';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import {
  LookupItem,
  LookupService,
  TypeOfMeetingEnum,
  StatusEnum,
  ScreeningStatusEnum,
  ProjectNameDescription,
} from '../../services/lookup.service';
import { ApiService } from '../../services/api.service';
import { Loader } from '../../components/loader/loader';
import Swal from 'sweetalert2';

interface SubProjectDto {
  id: number;
  workCode: string;
  projectId: number;
  projectName: string;
  stateId: number;
  stateName: string;
  countyId: number;
  countyName: string;
  payamId: number;
  payamName: string;
  bomaId: number;
  bomaName: string;
  typeOfMeeting: string;
  meetingDate: string;
  screeningStatus: string;
  status: string;
}


@Component({
  selector: 'app-sub-project-list',

  templateUrl: './sub-project-list.html',
  styleUrl: './sub-project-list.scss',
   standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    DialogModule,
    PaginatorModule,
    BreadcrumbModule,
    FloatLabelModule,
    SelectModule,
    RouterModule,
    TooltipModule,
    Loader,
    InputTextModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubProjectList implements OnInit {
  private readonly FILTER_STORAGE_KEY = 'subProjectList_filters';
  isLoading = true;
  lookupsLoaded = false;
  searchForm!: FormGroup;
  roleId: number | null = null;
  // geo lookup lists
  states: LookupItem[] = [];
  counties: LookupItem[] = [];
  payams: LookupItem[] = [];
  bomas: LookupItem[] = [];

  projects: ProjectNameDescription[] = [];
  workTypes: any[] = [];
  workActivities: LookupItem[] = [];

  statuses: any[] = [];
  screeningStatuses: any[] = [];

  subProjects: SubProjectDto[] = [];
  totalRecords = 0;
  userRole: number | null = null;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  currentPage = 0; // 0-based
  pageSize = 10;
  advanceSearchPanelVisible = false;

  displayDeleteDialog = false;
  deleteComment = '';
  currentProjectIdToDelete: number | null = null;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef
  ) {}

  private async loadInitialLookups() {
    await Promise.all([
      this.lookup.getOrFetchStateList(),
      this.lookup.getProjectNameDescription(),
    ]);

    this.states = this.lookup.getStateList();
    this.projects = this.lookup.projectNameDescriptionList;

    this.cdr.markForCheck();
  }


  async ngOnInit() {
      this.roleId = this.api.getUserRole();
    this.isLoading = true;
    this.cdr.markForCheck();
    this.workTypes = TypeOfMeetingEnum;

    this.userRole = this.api.getUserRole();
    if (this.userRole === 5) { // IP User
      this.statuses = StatusEnum.filter(
        (status) =>
          status.value === 'QE_Rejected' || status.value === 'TST_Approved' || status.value === 'InProgress' || status.value === 'Completed' || status.value === 'Draft'
      );
    } else {
      this.statuses = StatusEnum;
    }

    this.screeningStatuses = ScreeningStatusEnum;
    this.initBreadcrumb();
    this.initForm();

    try {
      await this.loadInitialLookups();
      this.lookupsLoaded = true;
      await this.restoreFiltersFromStorage();
    } catch (err) {
      console.error('Lookups loading error:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load lookup data.',
      });
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.fetchPage(this.currentPage, this.pageSize);
  }


  initForm() {
    this.searchForm = this.fb.group({
      projectId: [null],
      state: [null],
      county: [{ value: null, disabled: true }],
      projectName: [null],
      typeOfMeeting: [null],
      payam: [{ value: null, disabled: true }],
      boma: [{ value: null, disabled: true }],
      status: [null],
      workCode: [''],
      workActivity: [null],
      screeningStatus: [null],
    });
  }

  private saveFiltersToStorage(): void {
    const state = {
      filters: this.searchForm.getRawValue(),
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      advanceSearchPanelVisible: this.advanceSearchPanelVisible,
    };
    sessionStorage.setItem(this.FILTER_STORAGE_KEY, JSON.stringify(state));
  }

  private async restoreFiltersFromStorage(): Promise<boolean> {
    const stored = sessionStorage.getItem(this.FILTER_STORAGE_KEY);
    if (!stored) return false;

    sessionStorage.removeItem(this.FILTER_STORAGE_KEY);

    try {
      const savedState = JSON.parse(stored);
      const filters = savedState.filters;

      this.currentPage = savedState.currentPage ?? 0;
      this.pageSize = savedState.pageSize ?? 10;
      this.advanceSearchPanelVisible = savedState.advanceSearchPanelVisible ?? false;

      // Restore non-geo fields first
      this.searchForm.patchValue({
        projectId: filters.projectId,
        projectName: filters.projectName,
        typeOfMeeting: filters.typeOfMeeting,
        status: filters.status,
        workCode: filters.workCode,
        workActivity: filters.workActivity,
        screeningStatus: filters.screeningStatus,
      });

      // Restore geo fields with cascading
      if (filters.state) {
        const stateObj = this.states.find((s: any) => s.id === filters.state.id);
        if (stateObj) {
          this.searchForm.patchValue({ state: stateObj });
          await this.onStateChange(stateObj);
        }
      }
      if (filters.county && this.counties.length > 0) {
        const countyObj = this.counties.find((c: any) => c.id === filters.county.id);
        if (countyObj) {
          this.searchForm.patchValue({ county: countyObj });
          await this.onCountyChange(countyObj);
        }
      }
      if (filters.payam && this.payams.length > 0) {
        const payamObj = this.payams.find((p: any) => p.id === filters.payam.id);
        if (payamObj) {
          this.searchForm.patchValue({ payam: payamObj });
          await this.onPayamChange(payamObj);
        }
      }
      if (filters.boma && this.bomas.length > 0) {
        const bomaObj = this.bomas.find((b: any) => b.id === filters.boma.id);
        if (bomaObj) {
          this.searchForm.patchValue({ boma: bomaObj });
        }
      }

      this.cdr.markForCheck();
      return true;
    } catch (err) {
      console.error('Error restoring filters:', err);
      return false;
    }
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Sub-Project List' }];
  }

  toggleAdvanceSearch() {
    this.advanceSearchPanelVisible = !this.advanceSearchPanelVisible;
  }

  // ---------- dependent dropdowns ----------
  async onStateChange(state: LookupItem | null) {
    this.searchForm.get('county')?.reset({ value: null, disabled: true });
    this.searchForm.get('payam')?.reset({ value: null, disabled: true });
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.counties = [];
    this.payams = [];
    this.bomas = [];

    if (state?.id) {
      this.counties = await this.lookup.getCountyListByStateId(state.id);
      this.searchForm.get('county')?.enable();
    }
    this.cdr.markForCheck();
  }

  async onCountyChange(county: LookupItem | null) {
    this.searchForm.get('payam')?.reset({ value: null, disabled: true });
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.payams = [];
    this.bomas = [];

    if (county?.id) {
      this.payams = await this.lookup.getPayamListByCountyId(county.id);
      this.searchForm.get('payam')?.enable();
    }
    this.cdr.markForCheck();
  }

  async onPayamChange(payam: LookupItem | null) {
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.bomas = [];

    if (payam?.id) {
      this.bomas = await this.lookup.getBomaListByPayamId(payam.id);
      this.searchForm.get('boma')?.enable();
    }
    this.cdr.markForCheck();
  }

  // ---------- Request building ----------
  private buildSearchBody(page: number, size: number) {
    const f = this.searchForm.value;
    let statusValue = f.status || null;

    // if (this.userRole === 5 && statusValue === null) {
    //   statusValue = 'IP_Submitted'; // Default to 'IP_Submitted' value for IP users if no status is selected
    // }

    return {
      id: null,
       workCode: f.workCode ? f.workCode.trim() : null,
      projectId: f.projectId ? Number(f.projectId) : null,

      projectName: f.projectName || null,
      stateId: f.state?.id || null,
      stateName: null,
      countyId: f.county?.id || null,
      countyName: null,
      payamId: f.payam?.id || null,
      payamName: null,
      bomaId: f.boma?.id || null,
      bomaName: null,
      typeOfMeeting: f.typeOfMeeting || null,
      meetingDate: null,
      screeningStatus: f.screeningStatus || null,
      status: statusValue,
    };
  }

  // ---------- Data loading ----------
  fetchPage(page: number, size: number) {
    this.isLoading = true;
    const body = this.buildSearchBody(page, size);

    let apiUrl = `api/subproject/get`; // Default URL

    switch (Number(this.roleId)) {
      case 5:
        apiUrl = `api/subproject/get/for-ip`;
        break;
      case 1: // Explicitly use default URL for role 1
      default:
        // Use default apiUrl for other roles not explicitly handled
        console.warn(`roleId: ${this.roleId}. Using default API endpoint.`);
        break;
    }

    this.api
      .POST(`${apiUrl}?page=${page}&size=${size}`, body)
      .then((res: any) => {
      

        if (!res) throw new Error('Empty response');

        // Access data from nested structure: res.data.content
        const data = res.data || res;
        const content = data.content || [];
        this.subProjects = content;
        this.totalRecords = data.totalElements || 0;

        if (content.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Search',
            detail: 'No sub-projects found',
          });
        }
      })
      .catch((err) => {
        console.error('Fetch sub-projects error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch sub-projects',
        });
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  searchBeneficiaries() {
    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  resetForm() {
    this.searchForm.reset();
    this.searchForm.get('county')?.disable();
    this.searchForm.get('payam')?.disable();
    this.searchForm.get('boma')?.disable();
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.currentPage = 0;
    sessionStorage.removeItem(this.FILTER_STORAGE_KEY);
    this.fetchPage(this.currentPage, this.pageSize);
    this.cdr.markForCheck();
  }

  // ---------- Actions ----------
  editSubProject(id: number) {
    this.saveFiltersToStorage();
    this.router.navigate(['/sub-project/details/', id]);
  }
    newProject() {
    this.saveFiltersToStorage();
    this.router.navigate(['/sub-project/add-new']);
  }

// Add this property with other class properties
isDeleting = false;

// Update deleteProject method
deleteProject(id: number) {
  this.currentProjectIdToDelete = id;
  this.deleteComment = '';
  this.displayDeleteDialog = true;
  this.cdr.markForCheck();
}

// Update confirmDelete method
async confirmDelete() {
  if (this.currentProjectIdToDelete === null || this.isDeleting) return;

  this.isDeleting = true;
  this.cdr.markForCheck();

  try {
    // 1. Fetch details
    const getPayload = { id: this.currentProjectIdToDelete };
    const subProjectDetailsRes: any = await this.api.POST(
      `api/subproject/get?page=0&size=1`,
      getPayload
    );

    if (!subProjectDetailsRes.data?.content?.length) {
      throw new Error('Sub-project details not found.');
    }

    const subProjectToUpdate = subProjectDetailsRes.data.content[0];
    const workCode = subProjectToUpdate.workCode || 'N/A';

    // 2. Update status to Completed
    subProjectToUpdate.status = 'Completed';

    const finalPayload = {
      ...subProjectToUpdate,
      remarks: this.deleteComment,
    };

    const res: any = await this.api.POST(`api/subproject/save`, finalPayload);

    // Close PrimeNG dialog FIRST
    this.displayDeleteDialog = false;
    this.cdr.detectChanges();

    // Small delay to ensure dialog closes
    await new Promise(resolve => setTimeout(resolve, 100));

    if (res.data?.entityId) {
      await Swal.fire({
        title: 'Closed',
        html: `Work Code <b>${workCode}</b> closed successfully.`,
        icon: 'success',
      });

      this.fetchPage(this.currentPage, this.pageSize);
    } else {
      throw new Error(
        'Failed to close sub-project. Server did not confirm the action.'
      );
    }
  } catch (err: any) {
    console.error('Error closing project:', err);
    
    // Close PrimeNG dialog before showing error
    this.displayDeleteDialog = false;
    this.cdr.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await Swal.fire({
      title: 'Error',
      text: err.message || 'Unknown error occurred',
      icon: 'error',
    });
  } finally {
    this.isDeleting = false;
    this.currentProjectIdToDelete = null;
    this.deleteComment = '';
    this.displayDeleteDialog = false;
    this.cdr.markForCheck();
  }
}

// Update cancelDelete method
cancelDelete() {
  this.displayDeleteDialog = false;
  this.currentProjectIdToDelete = null;
  this.deleteComment = '';
  this.isDeleting = false;
  this.cdr.markForCheck();
}
  async completeSubProject(id: number) {
    const subProject = this.subProjects.find((sp) => sp.id === id);
    if (!subProject) {
      await Swal.fire('Error', 'Sub-project not found!', 'error');
      return;
    }

    if (subProject.status !== 'InProgress') {
      await Swal.fire({
        title: 'Action Not Allowed',
        text: `Sub-projects can only be completed if their status is "In Progress". Current status: "${subProject.status}"`,
        icon: 'warning',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm',
      text: 'Are you sure you want to mark this sub-project as Completed?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Complete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'Submitting',
      text: 'Please wait...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const res: any = await this.api.POST(
        `api/subproject/submit?subprojectId=${id}&status=Completed`,
        {}
      );

      const responseData = res.data;

      if (responseData && responseData.code === 200) {
        await Swal.fire({
          title: 'Success',
          text: responseData.message || 'Sub-project marked as Completed.',
          icon: 'success',
        });
        this.fetchPage(this.currentPage, this.pageSize);
      } else {
        await Swal.fire({
          title: 'Could Not Complete',
          text:
            (responseData && responseData.message) ||
            'The server responded, but the operation could not be completed.',
          icon: 'error',
        });
      }
    } catch (err: any) {
      console.error('Error completing sub-project:', err);

      let errorMessage = 'Failed to complete sub-project.';
      if (err.error && err.error.code === 406 && err.error.message) {
        errorMessage = err.error.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      await Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
      });
    }
  }

    getScreeningStatusLabel(value: string): string {
    const numericValue = parseInt(value, 10);
    const found = ScreeningStatusEnum.find(item => item.value === numericValue);
    return found ? found.label : value;
  }



  getTypeOfMeetingLabel(value: string): string {
    const found = TypeOfMeetingEnum.find(item => item.value === value);
    return found ? found.label : value;
  }
    trackById = (_: number, row: SubProjectDto) => row.id;
}
