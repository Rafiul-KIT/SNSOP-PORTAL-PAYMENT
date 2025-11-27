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
import { LookupService, StatusWageEnum } from '../../../services/lookup.service';
import Swal from 'sweetalert2';

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
  attachment?: File;
}

interface SubProjectLookup {
  id: number;
  workCode: string;
  projectName: string;
}

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
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WageRequestApproval implements OnInit {
  isLoading = true;
  searchForm!: FormGroup;

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

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  currentPage = 0;
  pageSize = 10;

  roleId: number | null = null;

  approvalOptions = [
    { label: 'Approve', value: true },
    { label: 'Reject', value: false },
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.roleId = this.api.getUserRole();
    this.initForm();
    this.initBreadcrumb();
    await this.loadInitialLookups();
    this.fetchPage(this.currentPage, this.pageSize);
  }

  initForm() {
    this.searchForm = this.fb.group({
      subprojectId: [null],
      fromDate: [null],
      toDate: [null],
      requestYear: [null],
      requestMonthIndex: [null],
      paymentCycle: [null],
      status: [null],
      requestNumber: [''],
    });
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Wage Request Approval' }];
  }

  async toggleAdvanceSearch() {
    this.advanceSearchPanelVisible = !this.advanceSearchPanelVisible;
  }

  private async loadInitialLookups() {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      const subProjectRes: any = await this.api.POST(
        'api/subproject/get?page=0&size=1000',
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
        statusIds = [];
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
    console.log('DEBUG: Current Role ID is:', this.roleId);
    const f = this.searchForm.value;
    const body: any = {
      subprojectId: f.subprojectId || null,
      fromDate: f.fromDate ? this.formatDate(f.fromDate) : null,
      toDate: f.toDate ? this.formatDate(f.toDate) : null,
      requestYear: f.requestYear || null,
      requestMonthIndex: f.requestMonthIndex || null,
      paymentCycle: f.paymentCycle || null,
      requestNumber: f.requestNumber ? f.requestNumber.trim() : null,
    };

    if (f.status !== null && f.status !== undefined) {
      body.status = f.status;
    } else {
      switch (Number(this.roleId)) {
        case 2:
          body.status = 1;
          break;
        case 11:
          body.status = 2;
          break;
        case 6:
          body.status = 3;
          break;
        default:
          body.status = null;
          break;
      }
    }
    return body;
  }

  fetchPage(page: number, size: number, showLoader: boolean = true) {
    if (showLoader) {
      this.isLoading = true;
    }
    const body = this.buildSearchBody();

    this.api
      .POST(`api/wage-request/get?page=${page}&size=${size}`, body)
      .then((res: any) => {
        if (!res) throw new Error('Empty response');

        const data = res.data || res;
        this.wageRequests = (data.content || []).map((req: WageRequest) => ({
          ...req,
          selectedStatus: null,
          remarksText: '',
          isSubmitting: false,
          exchangeRate: undefined,
          attachment: undefined,
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

  onFileSelect(event: any, item: WageRequest) {
    const file = event.target.files[0];
    if (file) {
      item.attachment = file;
    }
  }

  async submitRowReview(wageRequest: WageRequest) {
    if (
      wageRequest.selectedStatus === null ||
      wageRequest.selectedStatus === undefined
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please select an approval status.',
      });
      return;
    }
    if (wageRequest.selectedStatus === false && !wageRequest.remarksText) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Remarks are required for rejection.',
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
        if (wageRequest.attachment) {
          formData.append('attachment', wageRequest.attachment);
        }
        break;
      case 6:
        endpoint = '/api/wage-request-review/fourth';
        break;
      default:
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid user role for submission.',
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
    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  resetForm() {
    this.searchForm.reset();
    this.searchWageRequests();
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  viewWageRequest(wageId: number, subprojectId: number) {
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
    const found = this.subProjects.find((sp) => sp.id === id);
    return found
      ? `${found.workCode} - ${found.projectName}`
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
}
