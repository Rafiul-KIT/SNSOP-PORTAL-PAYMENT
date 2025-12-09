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
  FormArray,
} from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {
  LookupItem,
  LookupItemPayroll,
  LookupService,
} from '../../../services/lookup.service';
import { ApiService } from '../../../services/api.service';
import { Loader } from '../../../components/loader/loader';

interface PayrollGenerationRequest {
  state: number;

  county: number;

  payam: number;

  boma: number;

  supportType: string;

  paymentCycles: number[];

  requestId: string;

  id: number;

  status: 'FAILED' | 'SUCCESS' | 'PENDING' | 'PROCESSING';

  downloadPath: string;
}

interface ApiResponse {
  data: PayrollGenerationRequest[];

  operationResult: boolean;

  errorMsg?: string;
}

@Component({
  selector: 'app-payroll-download',

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

    TagModule,

    Loader,
  ],

  providers: [MessageService, ConfirmationService],

  changeDetection: ChangeDetectionStrategy.OnPush,

  templateUrl: './payroll-download.html',

  styleUrl: './payroll-download.scss',
})
export class PayrollDownload implements OnInit {
  isLoading = true;

  searchForm!: FormGroup;

  // geo lookup lists

  states: LookupItem[] = [];

  counties: LookupItem[] = [];

  payams: LookupItem[] = [];

  bomas: LookupItem[] = [];

  requestsData: PayrollGenerationRequest[] = [];

  private fullRequestsData: PayrollGenerationRequest[] = [];

  totalRecords = 0;

  breadcrumbItems: any[] = [];

  breadcrumbHome: any;

  currentPage = 0;

  pageSize = 10;

  supportTypeOptions: LookupItem[] = [];

  paymentCycleOptions: LookupItemPayroll[] = [];

  statusOptions = [
    { id: 'SUCCESS', name: 'Success' },

    { id: 'FAILED', name: 'Failed' },

    { id: 'PENDING', name: 'Pending' },

    { id: 'PROCESSING', name: 'Processing' },
  ];

  // Lookup maps for display names

  stateMap: Map<number, string> = new Map();

  countyMap: Map<number, string> = new Map();

  payamMap: Map<number, string> = new Map();

  bomaMap: Map<number, string> = new Map();

  paymentCycleMap: Map<number, string> = new Map();

  constructor(
    private fb: FormBuilder,

    private messageService: MessageService,

    private confirmationService: ConfirmationService,

    private router: Router,

    private route: ActivatedRoute,

    private api: ApiService,

    private lookup: LookupService,

    private cdr: ChangeDetectorRef
  ) {}

  private async loadInitialLookups() {
    await Promise.all([
      this.lookup.getOrFetchStateList(),
      this.lookup.fetchAllCountyList(),
      this.lookup.fetchAllPayamList(),
      this.lookup.fetchAllBomaList(),
    ]);

    this.states = this.lookup.getStateList();
    const allCounties = this.lookup.getAllCountyList();
    const allPayams = this.lookup.getAllPayamList();
    const allBomas = this.lookup.getAllBomaList();

    this.supportTypeOptions = this.lookup.getSupportTypeList();
    this.paymentCycleOptions = this.lookup.getPaymentCycleList();

    // Build lookup maps
    this.states.forEach((s) => this.stateMap.set(Number(s.id), s.name));
    allCounties.forEach((c) => this.countyMap.set(Number(c.id), c.name));
    allPayams.forEach((p) => this.payamMap.set(Number(p.id), p.name));
    allBomas.forEach((b) => this.bomaMap.set(Number(b.id), b.name));

    this.paymentCycleOptions.forEach((p) =>
      this.paymentCycleMap.set(Number(p.id), p.name)
    );

    this.cdr.markForCheck();
  }

  async ngOnInit() {
    this.isLoading = true;

    this.initBreadcrumb();

    await this.loadInitialLookups();

    this.initForm();

    this.isLoading = false;

    await this.fetchRequests();
  }

  initForm() {
    this.searchForm = this.fb.group({
      state: [null],

      county: [{ value: null, disabled: true }],

      payam: [{ value: null, disabled: true }],

      boma: [{ value: null, disabled: true }],

      supportType: [''],

      status: [''],
    });
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };

    this.breadcrumbItems = [{ label: 'Payroll Generation Requests' }];
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

      this.counties.forEach((c) => this.countyMap.set(Number(c.id), c.name));

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

      this.payams.forEach((p) => this.payamMap.set(Number(p.id), p.name));

      this.searchForm.get('payam')?.enable();
    }

    this.cdr.markForCheck();
  }

  async onPayamChange(payam: LookupItem | null) {
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });

    this.bomas = [];

    if (payam?.id) {
      this.bomas = await this.lookup.getBomaListByPayamId(payam.id);

      this.bomas.forEach((b) => this.bomaMap.set(Number(b.id), b.name));

      this.searchForm.get('boma')?.enable();
    }

    this.cdr.markForCheck();
  }

  async fetchRequests() {
    this.isLoading = true;

    this.cdr.markForCheck();

    try {
      const response = await this.api.GET(
        'api/payroll/getPayrollGenerationRequests'
      );

      if (Array.isArray(response.data)) {
        this.fullRequestsData = response.data;

        this.totalRecords = response.data.length;

        this.applyFilters();
      } else {
        this.messageService.add({
          severity: 'error',

          summary: 'Error',

          detail: 'Invalid response format.',
        });

        this.fullRequestsData = [];

        this.requestsData = [];

        this.totalRecords = 0;
      }
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',

        summary: 'Error',

        detail:
          error?.message || 'An error occurred while fetching requests data.',
      });

      this.fullRequestsData = [];

      this.requestsData = [];

      this.totalRecords = 0;
    } finally {
      this.isLoading = false;

      this.cdr.markForCheck();
    }
  }

  applyFilters() {
    const formValues = this.searchForm.value;

    let filtered = [...this.fullRequestsData];

    if (formValues.state?.id) {
      filtered = filtered.filter(
        (r) => r.state === Number(formValues.state.id)
      );
    }

    if (formValues.county?.id) {
      filtered = filtered.filter(
        (r) => r.county === Number(formValues.county.id)
      );
    }

    if (formValues.payam?.id) {
      filtered = filtered.filter(
        (r) => r.payam === Number(formValues.payam.id)
      );
    }

    if (formValues.boma?.id) {
      filtered = filtered.filter((r) => r.boma === Number(formValues.boma.id));
    }

    if (formValues.supportType) {
      filtered = filtered.filter(
        (r) => r.supportType === formValues.supportType
      );
    }

    if (formValues.status) {
      filtered = filtered.filter((r) => r.status === formValues.status);
    }

    this.totalRecords = filtered.length;

    this.currentPage = 0;

    this.fullRequestsData = filtered;

    this.updateDisplayedData();
  }

  updateDisplayedData() {
    const startIndex = this.currentPage * this.pageSize;

    const endIndex = startIndex + this.pageSize;

    this.requestsData = this.fullRequestsData.slice(startIndex, endIndex);

    this.cdr.markForCheck();
  }

  onPageChange(event: any) {
    this.currentPage = event.page;

    this.pageSize = event.rows;

    this.updateDisplayedData();
  }

  searchRequests() {
    this.applyFilters();
  }

  resetForm() {
    this.searchForm.reset({
      state: null,

      county: { value: null, disabled: true },

      payam: { value: null, disabled: true },

      boma: { value: null, disabled: true },

      supportType: '',

      status: '',
    });

    this.counties = [];

    this.payams = [];

    this.bomas = [];

    this.currentPage = 0;

    this.fetchRequests();

    this.cdr.markForCheck();
  }

  getStateName(stateId: number): string {
    return this.stateMap.get(stateId) || stateId.toString();
  }

  getCountyName(countyId: number): string {
    return this.countyMap.get(countyId) || countyId.toString();
  }

  getPayamName(payamId: number): string {
    return this.payamMap.get(payamId) || payamId.toString();
  }

  getBomaName(bomaId: number): string {
    return this.bomaMap.get(bomaId) || bomaId.toString();
  }

  getPaymentCycleNames(cycles: number[]): string {
    return cycles

      .map((c) => this.paymentCycleMap.get(c) || c.toString())

      .join(', ');
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warning' | 'info' {
    switch (status) {
      case 'SUCCESS':
        return 'success';

      case 'FAILED':
        return 'danger';

      case 'PENDING':
        return 'warning';

      case 'PROCESSING':
        return 'info';

      default:
        return 'info';
    }
  }



  onDownloadClick(request: PayrollGenerationRequest) {
    if (request.downloadPath && request.status === 'SUCCESS') {
      window.open(request.downloadPath, '_blank');
    } else {
      this.messageService.add({
        severity: 'warn',

        summary: 'Warning',

        detail: 'Download path not available or request not completed.',
      });
    }
  }

  onRefreshClick() {
    this.fetchRequests();
  }
}
