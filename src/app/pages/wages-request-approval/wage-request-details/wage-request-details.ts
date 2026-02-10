import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../services/api.service';
import { LookupService } from '../../../services/lookup.service';
import Swal from 'sweetalert2';
import { formatBytes, handleMultipleFileUpload } from '../../../validators/file-validator';

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
  // New fields from updated API
  state?: string;
  county?: string;
  payam?: string;
  boma?: string;
  projectName?: string;
  subprojectName?: string;
}



interface Beneficiary {
  householdNumber: string;
  beneficiaryName: string;
  gender: number | string;
  age: number;
  phoneNo: string;
  totalDays: number;
  presentDays?: number;
  absentDays?: number;
  paymentStatus: number;
  paymentDoneAt: string;
  wageRateUSD: number;
  exchangeRate: number;
  wageRateSSP: number;
  wageUsdTotal: number;
  wageSspTotal: number;
}

interface AttachmentHistory {
  status: string;
  attachmentUrl: string;
  fileName: string;
  filePath: string;
  comments: string;
  reviewedAt: string;
}

interface ApiResponse {
  code: number;
  message: string;
  content: WageRequest[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
}

interface StatusInfo {
  value: string;
  label: string;
  class: string;
}

@Component({
  selector: 'app-wage-request-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    DividerModule,
    BreadcrumbModule,
    TableModule,
    PaginatorModule,
    SelectModule,
    MessageModule,
    ButtonModule,
    FileUploadModule,
    ProgressBarModule,
    Loader,
  ],
  templateUrl: './wage-request-details.html',
  styleUrl: './wage-request-details.scss',
})
export class WageRequestDetails implements OnInit {
  wageRequest: WageRequest | null = null;

  beneficiaries: Beneficiary[] = [];
  totalBeneficiaries = 0;
  beneficiaryCurrentPage = 0;
  beneficiaryPageSize = 20;
  isBeneficiaryLoading = false;
  isLoading = false;
  apiError = '';
  roleId!: number | null;
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;
  wageId: number | null = null;
  subprojectId: number | null = null;
  reviewForm!: FormGroup;
  approvedOptions = [
    { label: 'Approve', value: true },
    { label: 'Reject', value: false },
  ];
  selectedFiles: File[] = [];
  isReviewSubmitting = false;
  reviewMessage: any[] = [];
  attachmentHistory: AttachmentHistory[] = [];
  isHistoryLoading = false;
  readonly MAX_ATTACHMENT_SIZE_MB = 25;
  totalAttachmentSize = 0;
  downloadProgress: Map<string, number> = new Map();

  rowsPerPageOptions: number[] = [20, 50, 100]; // Will be updated dynamically
  paginationOptions: { label: string; value: number }[] = [];
  private readonly statusMap = new Map<number, StatusInfo>([
    [0, { value: 'Draft', label: 'Draft', class: 'bg-secondary' }],
    [
      1,
      {
        value: 'InitialReviewer',
        label: 'To be Reviewed at Initial Reviewer',
        class: 'bg-warning',
      },
    ],
    [
      2,
      {
        value: 'FinancialApprover',
        label: 'To be Reviewed at Financial Approver',
        class: 'bg-info',
      },
    ],
    [
      3,
      {
        value: 'FinalPaymentAuthorizer',
        label: 'To be Reviewed at Final Payment Authorizer',
        class: 'bg-primary',
      },
    ],
    [
      4,
      {
        value: 'FinalApproved',
        label: 'Approved at Final Payment Authorizer',
        class: 'bg-success',
      },
    ],
    [5, { value: 'PaidAPI', label: 'Paid from API', class: 'bg-success' }],
    [6, { value: 'PaidAPI', label: 'Paid from API', class: 'bg-success' }],
    [
      100,
      {
        value: 'RejectedInitial',
        label: 'Rejected by Initial Reviewer',
        class: 'bg-danger',
      },
    ],
    [
      101,
      {
        value: 'RejectedFinancial',
        label: 'Rejected by Financial Approver',
        class: 'bg-danger',
      },
    ],
    [
      102,
      {
        value: 'RejectedFinal',
        label: 'Rejected by Final Payment Authorizer',
        class: 'bg-danger',
      },
    ],
    [103, { value: 'ClearedWB', label: 'Cleared by WB', class: 'bg-success' }],
    [
      105,
      { value: 'DraftRejected', label: 'Draft Rejected', class: 'bg-danger' },
    ],
    [
      1000,
      {
        value: 'RejectedAfterPay',
        label: 'Rejected after Pay',
        class: 'bg-danger',
      },
    ],
    [
      1001,
      {
        value: 'RejectedAfterPay',
        label: 'Rejected after Pay',
        class: 'bg-danger',
      },
    ],
    [
      1002,
      {
        value: 'RejectedAfterPay',
        label: 'Rejected after Pay',
        class: 'bg-danger',
      },
    ],
    [
      1003,
      {
        value: 'RejectedAfterPay',
        label: 'Rejected after Pay',
        class: 'bg-danger',
      },
    ],
  ]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private lookupService: LookupService, // Inject LookupService
    private location: Location,
  ) {

  }
  ngOnInit(): void {
    this.initBreadcrumb();
    this.initReviewForm();
    this.roleId = this.apiService.getUserRole();
    const subprojectIdParam = this.route.snapshot.paramMap.get('subprojectId');
    const wageIdParam = this.route.snapshot.paramMap.get('wageId');

    if (wageIdParam && subprojectIdParam) {
      this.wageId = +wageIdParam;
      this.subprojectId = +subprojectIdParam;
      this.loadInitialData();
    } else {
      this.apiError = 'Invalid wage request ID or subproject ID';
      // this.showErrorAlert('Invalid Parameters', this.apiError);
    }
  }
  private async loadInitialData(): Promise<void> {
    if (!this.wageId) return;

    this.isLoading = true;

    try {
      await Promise.all([
        this.loadWageRequestDetails(this.wageId),
        this.loadAttachmentHistory(),
      ]);

      // Load beneficiaries and update rowsPerPageOptions
      await this.loadBeneficiaries(
        this.beneficiaryCurrentPage,
        this.beneficiaryPageSize,
      );
      this.updateRowsPerPageOptions(); // Add this line
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.apiError = 'Failed to load page data. Please refresh the page.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
  initBreadcrumb(): void {
    this.breadcrumbHome = { icon: 'fas fa-home' };
    this.breadcrumbItems = [
      {
        label: 'Wage Requests',
        command: () => this.location.back(),
      },
      { label: 'Details' },
    ];
  }
  getGenderName(genderId: string | number): string {
    const gender = this.lookupService
      .getGenderListbyId()
      .find((g) => g.id == genderId);
    return gender ? gender.name : 'Unknown';
  }

  showSspColumns(): boolean {
    if (this.roleId === null) {
      return true; // Default to showing columns if roleId is not yet available
    }
    const rolesToHide = [2, 11, 14];
    return !rolesToHide.includes(this.roleId);
  }

  onFilesSelected(event: Event): void {
    const result = handleMultipleFileUpload(event, this.selectedFiles, this.MAX_ATTACHMENT_SIZE_MB);
    
    if (result.error) {
      Swal.fire({
        icon: 'error',
        title: 'File Upload Error',
        text: result.error,
      });
    }
    
    this.selectedFiles = result.validFiles;
    
    // Update form control if needed, e.g., for validation state
    this.reviewForm.get('attachment')?.setValue(this.selectedFiles.length > 0 ? this.selectedFiles : null);
    this.updateTotalAttachmentSize();
    this.cdr.detectChanges();
  }
  
  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    // Update form control if needed
    this.reviewForm.get('attachment')?.setValue(this.selectedFiles.length > 0 ? this.selectedFiles : null);
    this.updateTotalAttachmentSize();
    this.cdr.detectChanges();
  }

  updateTotalAttachmentSize(): void {
    this.totalAttachmentSize = this.selectedFiles.reduce((total, file) => total + file.size, 0);
  }

  formatBytes(bytes: number, decimals = 2): string {
    return formatBytes(bytes, decimals);
  }

  initReviewForm(): void {
    this.reviewForm = this.fb.group({
      approved: [null, Validators.required],
      comments: ['', Validators.required],
      attachment: [null ],
    });
  }

  async onSubmitReview(): Promise<void> {
    if (!this.wageId) {
      this.reviewMessage = [
        {
          severity: 'error',
          summary: 'Error',
          detail: 'Wage Request ID is missing.',
        },
      ];

      // Show SweetAlert for missing wage ID
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Wage Request ID is missing.',
      });
      return;
    }

    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();

      const missingFields: string[] = [];
      if (this.reviewForm.get('attachment')?.invalid) missingFields.push('Attachment');
      if (this.reviewForm.get('approved')?.invalid) missingFields.push('Approval');
      if (this.reviewForm.get('comments')?.invalid) missingFields.push('Remarks');

      Swal.fire({
        icon: 'warning',
        title: 'Required Fields Missing',
        html: `Please fill in the following required fields:<ul style="text-align: left; margin-top: 10px;">${missingFields.map(f => `<li>${f}</li>`).join('')}</ul>`,
      });
      return;
    }

    this.isReviewSubmitting = true;
    this.reviewMessage = [];

    const formData = new FormData();
    formData.append('wageRequestId', this.wageId.toString());

    const approvedValue = this.reviewForm.get('approved')?.value;
    formData.append('approved', approvedValue.toString());



    const comments = this.reviewForm.get('comments')?.value;
    formData.append('comments', comments);

    // Append all selected files
    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach(file => {
        formData.append('attachments', file, file.name);
      });
    }

    try {
      const response: any = await this.apiService.POST_FORM_DATA(
        '/api/wage-request-review/first',
        formData,
      );

      const responseData = response.data;

      if (responseData?.code === 200 || responseData?.status === 'OK') {
        this.reviewMessage = [
          {
            severity: 'success',
            summary: 'Success',
            detail: 'Wage request review submitted successfully.',
          },
        ];

        Swal.fire({
          icon: 'success',
          title: 'Submitted',
          text: 'Wage request review submitted successfully.',
        }).then(() => {
          this.router.navigate(['/wage-request-approval/drafts']);
        });

        this.reviewForm.reset();
        this.selectedFiles = [];
        this.updateTotalAttachmentSize();

        // Clear the file input
        const fileInput = document.getElementById(
          'attachment',
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = '';

      } else {
        this.reviewMessage = [
          {
            severity: 'error',
            summary: 'Error',
            detail: responseData?.message || 'Failed to submit review.',
          },
        ];

        // Show SweetAlert for failure
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: responseData?.message || 'Failed to submit review.',
        });
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      console.error('Error response:', error.response?.data);
      this.reviewMessage = [
        {
          severity: 'error',
          summary: 'Error',
          detail:
            error.response?.data?.message || 'An unexpected error occurred.',
        },
      ];

      // Show SweetAlert for unexpected error
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'An unexpected error occurred.',
      });
    } finally {
      this.isReviewSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async loadAttachmentHistory(): Promise<void> {
    if (!this.wageId) {
      return;
    }
    this.isHistoryLoading = true;
    try {
      const response: any = await this.apiService.GET(
        `/api/wage-request-review/history?wageRequestId=${this.wageId}&getFiles=true`,
      );
      if (response?.data?.content) {
        this.attachmentHistory = response.data.content;
      }
    } catch (error) {
      console.error('Failed to load attachment history:', error);
    } finally {
      this.isHistoryLoading = false;
      this.cdr.detectChanges();
    }
  }

  async loadWageRequestDetails(id: number): Promise<void> {
    this.isLoading = true;
    this.apiError = '';

    try {
      const wageResponse: any = await this.apiService.POST(
        'api/wage-request/get?page=0&size=10',
        { id: id },
      );

      if (wageResponse?.data?.content?.length > 0) {
        this.wageRequest = wageResponse.data.content[0];


      } else {
        this.apiError = 'No wage request found with the provided ID.';
      }
    } catch (error) {
      console.error('Failed to load wage request details:', error);
      this.apiError = 'Failed to load wage request details. Please try again.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  getStatusInfo(statusCode: number): StatusInfo {
    return (
      this.statusMap.get(statusCode) || {
        value: 'Unknown',
        label: 'Unknown Status',
        class: 'bg-secondary',
      }
    );
  }

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getMonthName(monthIndex: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[monthIndex - 1] || 'Unknown';
  }

  async handleAttachmentClick(history: AttachmentHistory): Promise<void> {
    if (history.attachmentUrl && history.attachmentUrl.startsWith('https://')) {
      window.open(history.attachmentUrl, '_blank');
    } else if (history.filePath) {
      const key = history.filePath;
      this.downloadProgress.set(key, 0);
      this.cdr.detectChanges();

      try {
        const response: any = await this.apiService.GET_CONFIG(
          `/api/wage-request-review/wageRequest/attachment/get?filePath=${history.filePath}`,
          {
            responseType: 'blob',
            onDownloadProgress: (progressEvent: any) => {
              if (progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                this.downloadProgress.set(key, percent);
              } else {
                // If total is unknown, show indeterminate-style progress
                this.downloadProgress.set(key, -1);
              }
              this.cdr.detectChanges();
            },
          }
        );

        this.downloadProgress.set(key, 100);
        this.cdr.detectChanges();

        const blob = new Blob([response.data], { type: response.headers.get('Content-Type') });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = history.fileName || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download attachment:', error);
        Swal.fire({
          icon: 'error',
          title: 'Download Failed',
          text: 'Could not download the attachment. Please try again.',
        });
      } finally {
        this.downloadProgress.delete(key);
        this.cdr.detectChanges();
      }
    } else {
      console.warn('No attachment URL or file path available for download.');
      Swal.fire({
        icon: 'warning',
        title: 'No Attachment',
        text: 'No valid attachment found for this entry.',
      });
    }
  }

  async loadBeneficiaries(page: number, size: number): Promise<void> {
    if (!this.wageId) {
      console.error('wageId is not defined');
      return;
    }

    this.isBeneficiaryLoading = true;
    this.cdr.detectChanges();
    try {
      const response: any = await this.apiService.GET(
        `/api/wage-request/beneficiary-list/get?page=${page}&size=${size}&wageRequestId=${this.wageId}`,
      );

      if (response?.data?.content && Array.isArray(response.data.content)) {
        // Pre-compute absentDays for sorting
        this.beneficiaries = response.data.content.map((bene: Beneficiary) => ({
          ...bene,
          absentDays: this.wageRequest?.subprojectId === 999
            ? (bene.absentDays ?? 0)
            : (18 - bene.totalDays)
        }));
        this.totalBeneficiaries = response.data.totalElements || 0;

        if (this.totalBeneficiaries > 0) {
          this.updateRowsPerPageOptions();
        }
      } else {
        this.beneficiaries = [];
        this.totalBeneficiaries = 0;
      }
    } catch (error) {
      console.error('Failed to load beneficiaries:', error);
      this.beneficiaries = [];
      this.totalBeneficiaries = 0;
      // this.showErrorAlert('Loading Error', 'Failed to load beneficiaries. Please try refreshing the page.');
    } finally {
      this.isBeneficiaryLoading = false;
      this.cdr.detectChanges();
    }
  }

  private updateRowsPerPageOptions(): void {
    const baseOptions = [20, 50, 100];
    this.paginationOptions = [];

    // Add standard options
    baseOptions.forEach((option) => {
      if (option <= this.totalBeneficiaries) {
        this.paginationOptions.push({
          label: option.toString(),
          value: option,
        });
      }
    });

    // Always add "All" option if there are beneficiaries
    if (this.totalBeneficiaries > 0) {
      this.paginationOptions.push({
        label: `All `,
        value: this.totalBeneficiaries,
      });
    }

    // Set default if needed
    if (
      !this.paginationOptions.find(
        (opt) => opt.value === this.beneficiaryPageSize,
      )
    ) {
      this.beneficiaryPageSize = this.paginationOptions[0]?.value || 10;
    }
  }
  onPageSizeChange(newSize: number): void {
    this.beneficiaryPageSize = newSize;
    this.beneficiaryCurrentPage = 0; // Reset to first page
    this.loadBeneficiaries(
      this.beneficiaryCurrentPage,
      this.beneficiaryPageSize,
    );
  }

  // 4. Add method to handle page change:
  onPageChange(page: number): void {
    this.beneficiaryCurrentPage = page;
    this.loadBeneficiaries(
      this.beneficiaryCurrentPage,
      this.beneficiaryPageSize,
    );
  }

  // 5. Add computed properties for pagination display:
  get totalPages(): number {
    return Math.ceil(this.totalBeneficiaries / this.beneficiaryPageSize);
  }

  get currentPageDisplay(): number {
    return this.beneficiaryCurrentPage + 1;
  }

  get startRecord(): number {
    return this.totalBeneficiaries === 0
      ? 0
      : this.beneficiaryCurrentPage * this.beneficiaryPageSize + 1;
  }

  get endRecord(): number {
    const end = (this.beneficiaryCurrentPage + 1) * this.beneficiaryPageSize;
    return Math.min(end, this.totalBeneficiaries);
  }
  onBeneficiaryLazyLoad(event: any): void {
    const requestedRows = event.rows;

    // Check if user selected "All" (totalBeneficiaries)
    if (requestedRows === this.totalBeneficiaries) {
      this.beneficiaryCurrentPage = 0;
      this.beneficiaryPageSize = this.totalBeneficiaries;
    } else {
      this.beneficiaryCurrentPage = event.first / event.rows;
      this.beneficiaryPageSize = event.rows;
    }

    this.loadBeneficiaries(
      this.beneficiaryCurrentPage,
      this.beneficiaryPageSize,
    );
  }

  // Helper methods for days calculation based on subprojectId
  getTotalDays(bene: Beneficiary): number {
    if (this.wageRequest?.subprojectId === 999) {
      return bene.totalDays;
    }
    return 18; // Static value for non-999 subprojects
  }

  getPresentDays(bene: Beneficiary): number {
    // totalDays from API represents present days
    return bene.totalDays;
  }

  getAbsentDays(bene: Beneficiary): number {
    if (this.wageRequest?.subprojectId === 999) {
      return bene.absentDays ?? 0; // Use API value for subprojectId 999
    }
    return 18 - this.getPresentDays(bene); // 18 - present days for non-999 subprojects
  }
}
