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
import { PaginatorModule } from 'primeng/paginator';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { Router, RouterModule } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import Swal from 'sweetalert2';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
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
  reportFileName?: string;
  binFileName?: string;
}
interface PagedPayrollResponse {
  content: PayrollGenerationRequest[];
  totalElements: number;
}

interface ApiResponse {
  data: PagedPayrollResponse;
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
    PaginatorModule,
    BreadcrumbModule,
    FloatLabelModule,
    InputTextModule,
    SelectModule,
    RouterModule,
    TooltipModule,
    TagModule,
    Loader,
    ProgressBarModule,
    DialogModule,
  ],
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payroll-download.html',
  styleUrl: './payroll-download.scss',
})
export class PayrollDownload implements OnInit {
  isLoading = true;
  showDownloadProgressModal = false;
  downloadProgress = 0;
  searchForm!: FormGroup;

  // geo lookup lists
  states: LookupItem[] = [];
  counties: LookupItem[] = [];
  payams: LookupItem[] = [];
  bomas: LookupItem[] = [];

  requestsData: PayrollGenerationRequest[] = [];
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
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  public Math = Math;

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
    this.states.forEach(s => this.stateMap.set(Number(s.id), s.name));
    allCounties.forEach(c => this.countyMap.set(Number(c.id), c.name));
    allPayams.forEach(p => this.payamMap.set(Number(p.id), p.name));
    allBomas.forEach(b => this.bomaMap.set(Number(b.id), b.name));
    this.paymentCycleOptions.forEach(p =>
      this.paymentCycleMap.set(Number(p.id), p.name)
    );

    this.cdr.markForCheck();
  }

  async ngOnInit() {
    this.isLoading = true;
    this.initBreadcrumb();
    await this.loadInitialLookups();
    this.initForm();
    await this.fetchRequests();
    this.isLoading = false;
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
    this.breadcrumbItems = [{ label: 'Payroll Download' }];
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
      this.counties.forEach(c => this.countyMap.set(Number(c.id), c.name));
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
      this.payams.forEach(p => this.payamMap.set(Number(p.id), p.name));
      this.searchForm.get('payam')?.enable();
    }
    this.cdr.markForCheck();
  }

  async onPayamChange(payam: LookupItem | null) {
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.bomas = [];
    if (payam?.id) {
      this.bomas = await this.lookup.getBomaListByPayamId(payam.id);
      this.bomas.forEach(b => this.bomaMap.set(Number(b.id), b.name));
      this.searchForm.get('boma')?.enable();
    }
    this.cdr.markForCheck();
  }

  async fetchRequests() {
    this.isLoading = true;
    this.cdr.markForCheck();

    const formValues = this.searchForm.value;
    const params = new URLSearchParams();
    params.set('page', this.currentPage.toString());
    params.set('size', this.pageSize.toString());

    if (formValues.state?.id) {
      params.set('state', formValues.state.id);
    }
    if (formValues.county?.id) {
      params.set('county', formValues.county.id);
    }
    if (formValues.payam?.id) {
      params.set('payam', formValues.payam.id);
    }
    if (formValues.boma?.id) {
      params.set('boma', formValues.boma.id);
    }
    if (formValues.supportType) {
      params.set('supportType', formValues.supportType);
    }
    if (formValues.status) {
      params.set('status', formValues.status);
    }

    params.set('payrollType', 'CASH_PAYMENT');

    try {
      const response = await this.api.GET(
        `api/payroll/getPayrollGenerationRequests?${params.toString()}`
      );

      if (response && response.data && response.data.content) {
        this.requestsData = response.data.content;
        this.totalRecords = response.data.totalElements;
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Invalid response format.',
        });
        this.requestsData = [];
        this.totalRecords = 0;
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error?.message || 'An error occurred while fetching requests data.',
      });
      this.requestsData = [];
      this.totalRecords = 0;
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchRequests();
  }

  searchRequests() {
    this.currentPage = 0;
    this.fetchRequests();
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
    if (!Array.isArray(cycles)) return '';
    return cycles
      .map(c => this.paymentCycleMap.get(c) || c.toString())
      .join(', ');
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
    switch (status) {
      case 'SUCCESS':
        return 'success';
      case 'FAILED':
        return 'danger';
      case 'PENDING':
        return 'warn';
      case 'PROCESSING':
        return 'info';
      default:
        return 'info';
    }
  }

  onDownloadClick(request: PayrollGenerationRequest) {
    if (request && request.reportFileName && request.status === 'SUCCESS') {
      this.downloadFile(request.reportFileName);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Download file name not available or request not completed.',
      });
    }
  }

  onDownloadBinClick(request: PayrollGenerationRequest) {
    if (request && request.binFileName && request.status === 'SUCCESS') {
      this.downloadFile(request.binFileName);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'BIN file name not available or request not completed.',
      });
    }
  }

  private async downloadFile(fileName: string | undefined | null) {
    if (!fileName) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'File name not provided.',
      });
      return;
    }

    this.showDownloadProgressModal = true;
    this.downloadProgress = 0;
    this.cdr.markForCheck();

    try {
      const response = await this.api.axiosInstance.get(
        `api/payroll/download/${fileName}`,
        {
          responseType: 'blob',
          onDownloadProgress: (progressEvent: any) => {
            if (progressEvent.total) {
              this.downloadProgress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              this.cdr.markForCheck();
            }
          },
        }
      );

      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      a.remove();

      if (fileName.toLowerCase().endsWith('.pdf')) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Payroll PDF downloaded successfully.',
        });
      } else if (fileName.toLowerCase().endsWith('.bin')) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'BIN file downloaded successfully.',
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'File downloaded successfully.',
        });
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'File not found on server.',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Download Failed',
          text: error?.message || 'An error occurred while downloading the file.',
        });
      }
    } finally {
      this.showDownloadProgressModal = false;
      this.downloadProgress = 0;
      this.cdr.markForCheck();
    }
  }

  onRefreshClick() {
    this.fetchRequests();
  }
}