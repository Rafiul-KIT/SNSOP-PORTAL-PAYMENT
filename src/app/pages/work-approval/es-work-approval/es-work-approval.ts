import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
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
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {
  LookupItem,
  LookupService,
  ProjectNameDescription,
  StatusEnum,
  TypeOfMeetingEnum,
} from '../../../services/lookup.service';
import { ApiService } from '../../../services/api.service';
import { Loader } from '../../../components/loader/loader';

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
  selector: 'app-es-work-approval',
  templateUrl: './es-work-approval.html',
  styleUrl: './es-work-approval.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    PaginatorModule,
    BreadcrumbModule,
    FloatLabelModule,
    InputTextModule,
    SelectModule,
    RouterModule,
    TooltipModule,
    Loader,
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EsWorkApproval implements OnInit {
  private readonly FILTER_STORAGE_KEY = 'workApproval_filters_es';
  private readonly DETAILS_ROUTE = '/sub-project/approval-details/es';
  private readonly LIST_ENDPOINT = 'api/subproject/get/for-es';

  isLoading = true;
  lookupsLoaded = false;
  searchForm!: FormGroup;
  states: LookupItem[] = [];
  counties: LookupItem[] = [];
  payams: LookupItem[] = [];
  bomas: LookupItem[] = [];
  projects: ProjectNameDescription[] = [];
  workTypes: any[] = [];
  workActivities: LookupItem[] = [];
  statuses = StatusEnum.filter(
    (status) =>
      status.value === 'QE_Approved' || status.value === 'TST_Rejected'
  );
  subProjects: SubProjectDto[] = [];
  totalRecords = 0;
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;
  currentPage = 0;
  pageSize = 10;
  advanceSearchPanelVisible = false;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.workTypes = TypeOfMeetingEnum;

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

  private async loadInitialLookups() {
    await Promise.all([
      this.lookup.getOrFetchStateList(),
      this.lookup.getProjectNameDescription(),
    ]);
    this.states = this.lookup.getStateList();
    this.projects = this.lookup.projectNameDescriptionList;
    this.cdr.markForCheck();
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
    });
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Work Approval' }];
  }

  toggleAdvanceSearch() {
    this.advanceSearchPanelVisible = !this.advanceSearchPanelVisible;
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
      this.advanceSearchPanelVisible =
        savedState.advanceSearchPanelVisible ?? false;

      this.searchForm.patchValue({
        projectId: filters.projectId,
        projectName: filters.projectName,
        typeOfMeeting: filters.typeOfMeeting,
        status: filters.status,
        workCode: filters.workCode,
        workActivity: filters.workActivity,
      });

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

  private buildSearchBody() {
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
      screeningStatus: '1',
      status: f.status || null,
    };
  }

  fetchPage(page: number, size: number) {
    this.isLoading = true;
    const body = this.buildSearchBody();

    this.api
      .POST(`${this.LIST_ENDPOINT}?page=${page}&size=${size}`, body)
      .then((res: any) => {
        if (!res) throw new Error('Empty response');

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

  editBeneficiary(item: SubProjectDto) {
    if (!item?.id) return;
    this.saveFiltersToStorage();
    this.router.navigate([this.DETAILS_ROUTE], {
      queryParams: { id: item.id },
    });
  }

  trackById = (_: number, row: SubProjectDto) => row.id;
}
