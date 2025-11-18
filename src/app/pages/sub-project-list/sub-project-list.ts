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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
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
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubProjectList implements OnInit {
  isLoading = true;
  lookupsLoaded = false;
  searchForm!: FormGroup;

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
    this.workTypes = TypeOfMeetingEnum;
    this.statuses = StatusEnum;
    this.screeningStatuses = ScreeningStatusEnum;
    this.initBreadcrumb();
    this.initForm();
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

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Sub-Project List' }];
  }

  async toggleAdvanceSearch() {
    this.advanceSearchPanelVisible = !this.advanceSearchPanelVisible;
    if (this.advanceSearchPanelVisible && !this.lookupsLoaded) {
      this.isLoading = true;
      this.cdr.markForCheck();
      try {
        await this.loadInitialLookups();
        this.lookupsLoaded = true;
      } catch (err) {
        console.error('Lookups loading error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load lookup data.',
        });
      } finally {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    }
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
      status: f.status || null,
    };
  }

  // ---------- Data loading ----------
  fetchPage(page: number, size: number) {
    this.isLoading = true;
    const body = this.buildSearchBody(page, size);

    this.api
      .POST(`api/subproject/get?page=${page}&size=${size}`, body)
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
    this.fetchPage(this.currentPage, this.pageSize);
    this.cdr.markForCheck();
  }

  // ---------- Actions ----------
  editSubProject(id: number) {
    this.router.navigate(['/sub-project', id]);
  }
    newProject() {
    this.router.navigate(['/sub-project']);
  }

  deleteProject(id: number) {
    this.currentProjectIdToDelete = id;
    this.deleteComment = '';
    this.displayDeleteDialog = true;
    this.cdr.markForCheck();
  }

  async confirmDelete() {
    if (this.currentProjectIdToDelete === null) return;

    try {
      // 1. Fetch Sub-Project Details
      const getPayload = { id: this.currentProjectIdToDelete };
      const subProjectDetailsRes: any = await this.api.POST(`api/subproject/get?page=0&size=1`, getPayload);

      if (!subProjectDetailsRes.data || !subProjectDetailsRes.data.content || subProjectDetailsRes.data.content.length === 0) {
        throw new Error('Sub-project details not found.');
      }

      const subProjectToUpdate: SubProjectDto = subProjectDetailsRes.data.content[0];

      // 2. Modify Details
      subProjectToUpdate.status = 'Completed';
      // Assuming 'remarks' can be added to the payload for the save endpoint
      const finalPayload = {
        ...subProjectToUpdate,
        remarks: this.deleteComment
      };

      // 3. Send Updated Payload
      const res: any = await this.api.POST(`api/subproject/save`, finalPayload);

      if (res.data && res.data.entityId) {
        this.messageService.add({
          severity: 'success',
          summary: 'Project Closed',
          detail: `Sub-project with ID ${this.currentProjectIdToDelete} was successfully closed.`,
        });
        this.fetchPage(this.currentPage, this.pageSize);
      } else {
        throw new Error('API did not return entityId on successful save.');
      }
    } catch (err: any) {
      console.error('Error closing project:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to close sub-project: ${err.message || 'Unknown error'}.`,
      });
    } finally {
      this.cancelDelete(); // Close dialog and reset state
    }
  }

  cancelDelete() {
    this.displayDeleteDialog = false;
    this.currentProjectIdToDelete = null;
    this.deleteComment = '';
  }
    getScreeningStatusLabel(value: string): string {
    const numericValue = parseInt(value, 10);
    const found = ScreeningStatusEnum.find(item => item.value === numericValue);
    return found ? found.label : value;
  }

  trackById = (_: number, row: SubProjectDto) => row.id;

  getTypeOfMeetingLabel(value: string): string {
    const found = TypeOfMeetingEnum.find(item => item.value === value);
    return found ? found.label : value;
  }
}
