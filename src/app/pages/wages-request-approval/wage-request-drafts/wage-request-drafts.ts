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
  Validators,
  ValidatorFn,
  AbstractControl,
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
import { MessageModule } from 'primeng/message';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../services/api.service';
import {
  LookupService,
  StatusWageEnum,
  PaymentCycleEnum,
} from '../../../services/lookup.service';
import { Loader } from '../../../components/loader/loader';
import Swal from 'sweetalert2';
import { formatBytes, handleMultipleFileUpload } from '../../../validators/file-validator';

interface WageRequestDto {
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
  selector: 'app-wage-request-list',
  templateUrl: './wage-request-drafts.html',
  styleUrl: './wage-request-drafts.scss',
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
    FloatLabelModule,
    SelectModule,
    RouterModule,
    TooltipModule,
    DatePickerModule,
    InputTextModule,
    DialogModule,
    MessageModule,
    Loader,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WageRequestDrafts implements OnInit {
  isLoading = true;
  lookupsLoaded = false;
  searchForm!: FormGroup;

  // Lookup data
  subProjects: SubProjectLookup[] = [];
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
  wageRequests: WageRequestDto[] = [];
  totalRecords = 0;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  currentPage = 0;
  pageSize = 10;
  advanceSearchPanelVisible = false;
  roleId!: number | null;

  // Review dialog properties
  reviewDialogVisible = false;
  reviewForm!: FormGroup;
  reviewWageId: number | null = null;
  approvedOptions = [
    { label: 'Approve', value: true },
    { label: 'Reject', value: false },
  ];
  selectedFiles: File[] = [];
  isReviewSubmitting = false;
  reviewMessage: any[] = [];
  readonly MAX_ATTACHMENT_SIZE_MB = 25;
  totalAttachmentSize = 0;

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
    try {
      // Load sub-projects for dropdown
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

      // Generate years (current year - 5 to current year + 2)
      const currentYear = new Date().getFullYear();
      this.years = [];
      for (let i = currentYear - 5; i <= currentYear + 2; i++) {
        this.years.push({ label: i.toString(), value: i });
      }

      this.cdr.markForCheck();
    } catch (err) {
      console.error('Error loading lookups:', err);
      throw err;
    }
  }

  async ngOnInit() {
    this.roleId = this.api.getUserRole();
    this.statuses = StatusWageEnum.filter(
      (status) => Number(status.id) === 0 || Number(status.id) === 100
    ).map((status) => ({ id: Number(status.id), label: status.label }));
    this.paymentCycles = this.lookup.getPaymentCycleEnum();
    this.initBreadcrumb();
      await this.loadInitialLookups();
    this.initForm();
    this.initReviewForm();
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
    }, { validators: dateRangeValidator });
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Wage Request Drafts' }];
  }

  async toggleAdvanceSearch() {
    this.advanceSearchPanelVisible = !this.advanceSearchPanelVisible;
    if (this.advanceSearchPanelVisible && !this.lookupsLoaded) {
      this.isLoading = true;
      this.cdr.markForCheck();
      try {
      
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

  private buildSearchBody(page: number, size: number) {
    const f = this.searchForm.value;
    const body: any = {
      id: null,
      subprojectId: f.subprojectId || null,
      fromDate: f.fromDate ? this.formatDate(f.fromDate) : null,
      toDate: f.toDate ? this.formatDate(f.toDate) : null,
      requestYear: f.requestYear || null,
      requestMonthIndex: f.requestMonthIndex || null,
      paymentCycle: f.paymentCycle || null,
      requestNumber: f.requestNumber ? f.requestNumber.trim() : null,
      status: f.status || null,
      remarks: null,
    };

    // if (f.status !== null && f.status !== undefined) {
    //   body.status = f.status;
    // } else {
    //   body.status = 0; // Default search for Draft
    // }

    return body;
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  fetchPage(page: number, size: number) {
    this.isLoading = true;
    const body = this.buildSearchBody(page, size);

    this.api
      .POST(`api/wage-request/get?page=${page}&size=${size}`, body)
      .then((res: any) => {
        if (!res) throw new Error('Empty response');

        const data = res.data || res;
        const content = data.content || [];
        this.wageRequests = content;
        this.totalRecords = data.totalElements || 0;

        if (content.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Search',
            detail: 'No wage requests found',
          });
        }
      })
      .catch((err) => {
        console.error('Fetch wage requests error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch wage requests',
        });
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchPage(this.currentPage, this.pageSize);
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
    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize);
    this.cdr.markForCheck();
  }

viewWageRequest(wageId: number, subprojectId: number) {
  this.router.navigate([
    '/wage-request-approval/details',
    wageId,
    subprojectId
  ]);
}


  getStatusLabel(value: number): string {
    const found = StatusWageEnum.find((item) => Number(item.id) === value);
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

  getMonthLabel(value: number): string {
    const found = this.months.find((item) => item.value === value);
    return found ? found.label : value.toString();
  }

getSubProjectName(id: number): string {
  if (id === 999) {
    return 'Dis-Direct Income Support';
  }
  const found = this.subProjects.find(sp => sp.id === id);

  return found
    ? found.workCode
    : id
    ? id.toString()
    : '';
}


  // Review dialog methods
  initReviewForm(): void {
    this.reviewForm = this.fb.group({
      approved: [null, Validators.required],
      attachment: [null],
    });
  }

  openReviewDialog(wageId: number): void {
    this.reviewWageId = wageId;
    this.reviewDialogVisible = true;
    this.reviewForm.reset();
    this.selectedFiles = [];
    this.totalAttachmentSize = 0;
    this.reviewMessage = [];
  }

  closeReviewDialog(): void {
    this.reviewDialogVisible = false;
    this.reviewWageId = null;
    this.reviewForm.reset();
    this.selectedFiles = [];
    this.totalAttachmentSize = 0;
    this.reviewMessage = [];
  }

  onReviewFilesSelected(event: Event): void {
    const result = handleMultipleFileUpload(event, this.selectedFiles, this.MAX_ATTACHMENT_SIZE_MB);

    if (result.error) {
      Swal.fire({
        icon: 'error',
        title: 'File Upload Error',
        text: result.error,
      });
    }

    this.selectedFiles = result.validFiles;
    this.reviewForm.get('attachment')?.setValue(this.selectedFiles.length > 0 ? this.selectedFiles : null);
    this.updateTotalAttachmentSize();
    this.cdr.markForCheck();
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.reviewForm.get('attachment')?.setValue(this.selectedFiles.length > 0 ? this.selectedFiles : null);
    this.updateTotalAttachmentSize();
    this.cdr.markForCheck();
  }

  updateTotalAttachmentSize(): void {
    this.totalAttachmentSize = this.selectedFiles.reduce((total, file) => total + file.size, 0);
  }

  formatFileBytes(bytes: number, decimals = 2): string {
    return formatBytes(bytes, decimals);
  }

  async onSubmitReview(): Promise<void> {
    if (!this.reviewWageId) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Wage Request ID is missing.' });
      return;
    }

    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please select Approval Status.' });
      return;
    }

    this.isReviewSubmitting = true;
    this.reviewMessage = [];

    const formData = new FormData();
    formData.append('wageRequestId', this.reviewWageId.toString());

    const approvedValue = this.reviewForm.get('approved')?.value;
    formData.append('approved', approvedValue.toString());

    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach(file => {
        formData.append('attachments', file, file.name);
      });
    }

    try {
      const response: any = await this.api.POST_FORM_DATA(
        '/api/wage-request-review/first',
        formData,
      );

      const responseData = response.data;

      if (responseData?.code === 200 || responseData?.status === 'OK') {
        this.closeReviewDialog();
        Swal.fire({
          icon: 'success',
          title: 'Submitted',
          text: 'Wage request review submitted successfully.',
        }).then(() => {
          this.fetchPage(this.currentPage, this.pageSize);
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: responseData?.message || 'Failed to submit review.',
        });
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'An unexpected error occurred.',
      });
    } finally {
      this.isReviewSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  trackById = (_: number, row: WageRequestDto) => row.id;
}