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
  ValidatorFn,
  AbstractControl,
} from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TooltipModule } from 'primeng/tooltip';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../services/api.service';
import { Loader } from '../../../components/loader/loader';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { LookupService, LookupItem, StatusWageEnum } from '../../../services/lookup.service';
import Swal from 'sweetalert2';
import { handleMultipleFileUpload } from '../../../validators/file-validator';
import { DialogModule } from 'primeng/dialog';

interface WageRequest {
  id: number;
  subprojectId: number;
  fromDate: string;
  toDate: string;
  requestYear: number;
  requestMonthIndex: number;
  paymentCycle: number;
  status: number;
  requestNumber: string;
  remarks: string;
  // For inline form
  selectedStatus?: boolean | null;
  remarksText?: string;
  isSubmitting?: boolean;
  exchangeRate?: number;
  attachments?: File[];
}

interface SubProjectLookup {
  id: number;
  workCode: string;
  projectName: string;
}

const dateRangeValidator: ValidatorFn = (
  control: AbstractControl
): { [key: string]: boolean } | null => {
  const fromDate = control.get('fromDate')?.value;
  const toDate = control.get('toDate')?.value;

  if (fromDate && toDate && fromDate > toDate) {
    return { dateRangeInvalid: true };
  }
  return null;
};

@Component({
  selector: 'app-wage-request-approval',
  templateUrl: './wage-request-approval.html',
  styleUrl: './wage-request-approval.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    PaginatorModule,
    BreadcrumbModule,
    RouterModule,
    TooltipModule,
    Loader,
    CardModule,
    DividerModule,
    FloatLabelModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    DialogModule,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WageRequestApproval implements OnInit {
  isLoading = true;
  searchForm!: FormGroup;

  // Geo lookup lists
  states: LookupItem[] = [];
  counties: LookupItem[] = [];
  payams: LookupItem[] = [];
  bomas: LookupItem[] = [];

  years: any[] = [];
  months: any[] = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 },
  ];
  paymentCycles: any[] = [];
  statuses: any[] = [];
  lookupsLoaded = false;
  advanceSearchPanelVisible = false;

  subProjects: SubProjectLookup[] = [];
  wageRequests: WageRequest[] = [];
  totalRecords = 0;

  private readonly FILTER_STORAGE_KEY = 'wage_request_approval_filters';

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  currentPage = 0;
  pageSize = 10;

  roleId: number | null = null;

  approvalOptions = [
    { label: 'Approve', value: true },
    { label: 'Reject', value: false },
  ];

  displayAttachmentModal = false;
  currentWageRequestForAttachment: WageRequest | null = null;
  selectedFiles: File[] = [];
  readonly MAX_ATTACHMENT_SIZE_MB = 25;
  totalAttachmentSize = 0;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef
  ) {}

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  updateTotalAttachmentSize(): void {
    this.totalAttachmentSize = this.selectedFiles.reduce((total, file) => total + file.size, 0);
  }

  async ngOnInit() {
    this.roleId = this.api.getUserRole();
    this.initForm();
    this.initBreadcrumb();
    await this.loadInitialLookups();
    await this.restoreFiltersFromStorage();
    this.fetchPage(this.currentPage, this.pageSize);
  }

  initForm() {
    this.searchForm = this.fb.group({
      state: [null],
      county: [{ value: null, disabled: true }],
      payam: [{ value: null, disabled: true }],
      boma: [{ value: null, disabled: true }],
      subprojectId: [null],
      fromDate: [null],
      toDate: [null],
      requestYear: [null],
      requestMonthIndex: [null],
      paymentCycle: [null],
      status: [null],
      requestNumber: [''],
    }, { validators: dateRangeValidator });
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Wage Request Approval' }];
  }

  async toggleAdvanceSearch() {
    this.advanceSearchPanelVisible = !this.advanceSearchPanelVisible;
  }

  // ---------- Dependent dropdowns ----------
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

  // ---------- Filter persistence ----------
  private saveFiltersToStorage() {
    const f = this.searchForm.getRawValue();
    const filterData = {
      state: f.state,
      county: f.county,
      payam: f.payam,
      boma: f.boma,
      subprojectId: f.subprojectId,
      fromDate: f.fromDate,
      toDate: f.toDate,
      requestYear: f.requestYear,
      requestMonthIndex: f.requestMonthIndex,
      paymentCycle: f.paymentCycle,
      status: f.status,
      requestNumber: f.requestNumber,
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      advanceSearchPanelVisible: this.advanceSearchPanelVisible,
      counties: this.counties,
      payams: this.payams,
      bomas: this.bomas,
    };
    sessionStorage.setItem(this.FILTER_STORAGE_KEY, JSON.stringify(filterData));
  }


  private async restoreFiltersFromStorage() {
    const stored = sessionStorage.getItem(this.FILTER_STORAGE_KEY);
    if (!stored) return;

    // Remove immediately after reading - this ensures refresh resets filters
    sessionStorage.removeItem(this.FILTER_STORAGE_KEY);

    try {
      const filterData = JSON.parse(stored);

      // Restore geo dropdown lists
      if (filterData.counties) this.counties = filterData.counties;
      if (filterData.payams) this.payams = filterData.payams;
      if (filterData.bomas) this.bomas = filterData.bomas;

      // Restore form values
      if (filterData.state) {
        this.searchForm.patchValue({ state: filterData.state });
        this.searchForm.get('county')?.enable();
      }
      if (filterData.county) {
        this.searchForm.patchValue({ county: filterData.county });
        this.searchForm.get('payam')?.enable();
      }
      if (filterData.payam) {
        this.searchForm.patchValue({ payam: filterData.payam });
        this.searchForm.get('boma')?.enable();
      }
      if (filterData.boma) {
        this.searchForm.patchValue({ boma: filterData.boma });
      }

      
      this.searchForm.patchValue({
        subprojectId: filterData.subprojectId,
        fromDate: filterData.fromDate ? new Date(filterData.fromDate) : null,
        toDate: filterData.toDate ? new Date(filterData.toDate) : null,
        requestYear: filterData.requestYear,
        requestMonthIndex: filterData.requestMonthIndex,
        paymentCycle: filterData.paymentCycle,
        status: filterData.status,
        requestNumber: filterData.requestNumber || '',
      });

      this.currentPage = filterData.currentPage || 0;
      this.pageSize = filterData.pageSize || 10;
      this.advanceSearchPanelVisible = filterData.advanceSearchPanelVisible || false;

      this.cdr.markForCheck();
    } catch (e) {
      console.error('Error restoring filters:', e);
      sessionStorage.removeItem(this.FILTER_STORAGE_KEY);
    }
  }

  private async loadInitialLookups() {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      // Load states
      await this.lookup.getOrFetchStateList();
      this.states = this.lookup.getStateList();

      const subProjectRes: any = await this.api.POST(
        'api/subproject/get?page=0&size=10000',
        {}
      );
      if (subProjectRes.data && subProjectRes.data.content) {
        this.subProjects = subProjectRes.data.content.map((sp: any) => ({
          id: sp.id,
          workCode: sp.workCode,
          projectName: sp.projectName,
        }));
      }

      const currentYear = new Date().getFullYear();
      this.years = [];
      for (let i = currentYear - 5; i <= currentYear + 2; i++) {
        this.years.push({ label: i.toString(), value: i });
      }

      this.paymentCycles = this.lookup.getPaymentCycleEnum();

      this.statuses = this.getRoleSpecificStatuses();

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

  private getRoleSpecificStatuses(): { id: number; label: string }[] {
    let statusIds: number[] = [];
    switch (Number(this.roleId)) {
      case 2:
        statusIds = [1, 101];
        break;
      case 11:
        statusIds = [2, 102];
        break;
      case 6:
        statusIds = [3];
        break;
      default:
        statusIds = StatusWageEnum.map(s => Number(s.id));
        break;
    }
    return StatusWageEnum
      .filter(status => statusIds.includes(Number(status.id)))
      .map(({ id, label }) => ({ id: Number(id), label }));
  }
  getStatusLabel(value: number): string {
    const found = StatusWageEnum.find(item => Number(item.id) === value);
    return found ? found.label : value.toString();
  }
  getStatusClass(status: number): string {
    switch (status) {
      case 0:
        return 'bg-secondary'; // Draft
      case 1:
        return 'bg-info'; // Submitted
      case 2:
        return 'bg-success'; // Approved
      case 3:
        return 'bg-danger'; // Rejected
      case 4:
        return 'bg-primary'; // Paid
      default:
        return 'bg-secondary';
    }
  }
  private buildSearchBody() {
    const f = this.searchForm.getRawValue();
    const body: any = {
      state: f.state?.id ? String(f.state.id) : null,
      county: f.county?.id ? String(f.county.id) : null,
      payam: f.payam?.id ? String(f.payam.id) : null,
      boma: f.boma?.id ? String(f.boma.id) : null,
      subprojectId: f.subprojectId || null,
      fromDate: f.fromDate ? this.formatDate(f.fromDate) : null,
      toDate: f.toDate ? this.formatDate(f.toDate) : null,
      requestYear: f.requestYear || null,
      requestMonthIndex: f.requestMonthIndex || null,
      paymentCycle: f.paymentCycle || null,
      requestNumber: f.requestNumber ? f.requestNumber.trim() : null,
      status: f.status || null,
    };

    return body;
  }

  fetchPage(page: number, size: number, showLoader: boolean = true) {
    if (showLoader) {
      this.isLoading = true;
    }
    const body = this.buildSearchBody();

    let apiUrl = `api/wage-request/get`; // Default URL

    switch (Number(this.roleId)) {
      case 1: // Explicitly use default URL for role 1
        apiUrl = `api/wage-request/get`;
        break;
      case 2: // Initial Reviewer
        apiUrl = `api/wage-request/get/for-init-reviewer`;
        break;
      case 11: // Financial Approver
        apiUrl = `api/wage-request/get/for-fin-approver`;
        break;
      case 6: // Final Payment Authorizer
        apiUrl = `api/wage-request/get/for-fin-pay-auth`;
        break;
      default:
        // Keep the default `api/wage-request/get` if roleId doesn't match
        console.warn(`Unknown roleId: ${this.roleId}. Using default API endpoint.`);
        break;
    }

    this.api
      .POST(`${apiUrl}?page=${page}&size=${size}`, body)
      .then((res: any) => {
        if (!res) throw new Error('Empty response');

        const data = res.data || res;
        this.wageRequests = (data.content || []).map((req: WageRequest) => ({
          ...req,
          selectedStatus: null,
          remarksText: '',
          isSubmitting: false,
          exchangeRate: undefined,
          attachments: [],
        }));
        this.totalRecords = data.totalElements || 0;

        if (this.wageRequests.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Info',
            detail: 'No wage requests found for the selected criteria.',
          });
        }
      })
      .catch((err) => {
        console.error('Fetch wage requests error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch wage requests for approval.',
        });
        this.wageRequests.forEach(req => req.isSubmitting = false);
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  openAttachmentModal(wageRequest: WageRequest) {
    this.currentWageRequestForAttachment = wageRequest;
    this.selectedFiles = [...(wageRequest.attachments || [])];
    this.updateTotalAttachmentSize();
    this.displayAttachmentModal = true;
  }

  onFilesInModalSelect(event: any) {
    const result = handleMultipleFileUpload(event, this.selectedFiles, this.MAX_ATTACHMENT_SIZE_MB); 

    this.selectedFiles = result.validFiles;
    this.updateTotalAttachmentSize();

    if (result.error) {
      Swal.fire({
        icon: 'error',
        title: 'File Upload Error',
        text: result.error,
        customClass: {
          container: 'on-top-modal'
        }
      });
    }
  }

  removeSelectedFile(fileToRemove: File) {
    this.selectedFiles = this.selectedFiles.filter(file => file !== fileToRemove);
    this.updateTotalAttachmentSize();
  }

  saveAttachments() {
    if (this.currentWageRequestForAttachment) {
      this.currentWageRequestForAttachment.attachments = [...this.selectedFiles];
      this.cdr.markForCheck();
    }
    this.cancelAttachments();
  }

  cancelAttachments() {
    this.displayAttachmentModal = false;
    this.currentWageRequestForAttachment = null;
    this.selectedFiles = [];
    this.totalAttachmentSize = 0;
  }

  async submitRowReview(wageRequest: WageRequest) {
    const missingFields: string[] = [];

    if (wageRequest.selectedStatus === null || wageRequest.selectedStatus === undefined) {
      missingFields.push('Approval');
    }

    if (!wageRequest.remarksText) {
      missingFields.push('Remarks');
    }

    if (Number(this.roleId) === 11) {
      if (!wageRequest.exchangeRate) {
        missingFields.push('Exchange Rate');
      } else if (!this.isExchangeRateValid(wageRequest.exchangeRate)) {
        missingFields.push('Exchange Rate (must be integer between 4000 and 6000)');
      }
      if (!wageRequest.attachments || wageRequest.attachments.length === 0) {
        missingFields.push('Attachment');
      }
    }

    if (missingFields.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Fields Missing',
        html: `Please fill in the following required fields:<ul style="text-align: left; margin-top: 10px;">${missingFields.map(f => `<li>${f}</li>`).join('')}</ul>`,
      });
      return;
    }

    wageRequest.isSubmitting = true;
    this.cdr.markForCheck();

    const formData = new FormData();
    formData.append('wageRequestId', wageRequest.id.toString());
    formData.append('approved', String(wageRequest.selectedStatus));
    if (wageRequest.remarksText) {
      formData.append('comments', wageRequest.remarksText);
    }

    let endpoint = '';
    switch (Number(this.roleId)) {
      case 2:
        endpoint = '/api/wage-request-review/second';
        break;
      case 11:
        endpoint = '/api/wage-request-review/third';
        if (wageRequest.exchangeRate) {
          formData.append('exchangeRate', wageRequest.exchangeRate.toString());
        }
        if (wageRequest.attachments && wageRequest.attachments.length > 0) {
          wageRequest.attachments.forEach(file => {
            formData.append('attachments', file, file.name);
          });
        }
        break;
      case 6:
        endpoint = '/api/wage-request-review/fourth';
        break;
      default:
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Invalid user role for submission.',
        });
        wageRequest.isSubmitting = false;
        this.cdr.markForCheck();
        return;
    }

    try {
      const response: any = await this.api.POST_FORM_DATA(endpoint, formData);
      const responseData = response.data;

      if (responseData?.code === 200 || responseData?.status === 'OK') {
        Swal.fire({
          icon: 'success',
          title: 'Submitted',
          text: 'Wage request review submitted successfully.',
        });
        this.fetchPage(this.currentPage, this.pageSize, false); // Pass false to not show full-page loader
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: responseData?.message || 'Failed to submit review.',
        });
        wageRequest.isSubmitting = false;
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'An unexpected error occurred.',
      });
      wageRequest.isSubmitting = false;
    } finally {
      this.cdr.markForCheck();
    }
  }

  searchWageRequests() {
    if (this.searchForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'From Date cannot be after To Date.',
      });
      return;
    }
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
    sessionStorage.removeItem(this.FILTER_STORAGE_KEY);
    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize);
    this.cdr.markForCheck();
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  viewWageRequest(wageId: number, subprojectId: number) {
    this.saveFiltersToStorage();
    this.router.navigate([
      '/wage-request-approval/details',
      wageId,
      subprojectId,
    ]);
  }

  getMonthLabel(value: number): string {
    const found = this.months.find((item) => item.value === value);
    return found ? found.label : value ? value.toString() : '';
  }

getSubProjectName(id: number): string {
  if (id === 999) {
    return 'Dis - Direct Income Support';
  }
  const found = this.subProjects.find(sp => sp.id === id);

  return found
    ? found.workCode
    : id
    ? id.toString()
    : '';
}


  formatDate(date: Date | string): string {
    if (!date) return '';
    if (typeof date === 'string') {
      return new Date(date).toISOString().split('T')[0];
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  trackById = (_: number, row: WageRequest) => row.id;

  isExchangeRateValid(rate: number | undefined): boolean {
    if (rate === undefined || rate === null) return false;
    return Number.isInteger(rate) && rate >= 4000 && rate <= 6000;
  }

  preventDecimalInput(event: KeyboardEvent): void {
    if (event.key === '.' || event.key === ',' || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  }
}