import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../services/api.service';

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
}

interface Subproject {
  workCode: string;
  projectId: number;
  projectName: string;
  stateName: string;
  countyName: string;
  payamName: string;
  bomaName: string;
}

interface Beneficiary {
  householdNumber: string;
  beneficiaryName: string;
  gender: string;
  age: number;
  phoneNo: string;
  totalDays: number;
  paymentStatus: number;
  paymentDoneAt: string;
  wageRateUSD: number;
  exchangeRate: number;
  wageRateSSP: number;
  wageUsdTotal: number;
  wageSspTotal: number;
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
    CardModule,
    DividerModule,
    BreadcrumbModule,
    TableModule,
    PaginatorModule,
    Loader
  ],
  templateUrl: './wage-request-details.html',
  styleUrl: './wage-request-details.scss'
})
export class WageRequestDetails implements OnInit {
  wageRequest: WageRequest | null = null;
  subproject: Subproject | null = null;
  beneficiaries: Beneficiary[] = [];
  totalBeneficiaries = 0;
  beneficiaryCurrentPage = 0;
  beneficiaryPageSize = 10;
  isBeneficiaryLoading = false;
  isLoading = false;
  apiError = '';
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  private readonly statusMap = new Map<number, StatusInfo>([
    [0, { value: 'Draft', label: 'Draft', class: 'bg-secondary' }],
    [1, { value: 'InitialReviewer', label: 'To be Reviewed at Initial Reviewer', class: 'bg-warning' }],
    [2, { value: 'FinancialApprover', label: 'To be Reviewed at Financial Approver', class: 'bg-info' }],
    [3, { value: 'FinalPaymentAuthorizer', label: 'To be Reviewed at Final Payment Authorizer', class: 'bg-primary' }],
    [4, { value: 'FinalApproved', label: 'Approved at Final Payment Authorizer', class: 'bg-success' }],
    [5, { value: 'PaidAPI', label: 'Paid from API', class: 'bg-success' }],
    [6, { value: 'PaidAPI', label: 'Paid from API', class: 'bg-success' }],
    [100, { value: 'RejectedInitial', label: 'Rejected by Initial Reviewer', class: 'bg-danger' }],
    [101, { value: 'RejectedFinancial', label: 'Rejected by Financial Approver', class: 'bg-danger' }],
    [102, { value: 'RejectedFinal', label: 'Rejected by Final Payment Authorizer', class: 'bg-danger' }],
    [103, { value: 'ClearedWB', label: 'Cleared by WB', class: 'bg-success' }],
    [105, { value: 'DraftRejected', label: 'Draft Rejected', class: 'bg-danger' }],
    [1000, { value: 'RejectedAfterPay', label: 'Rejected after Pay', class: 'bg-danger' }],
    [1001, { value: 'RejectedAfterPay', label: 'Rejected after Pay', class: 'bg-danger' }],
    [1002, { value: 'RejectedAfterPay', label: 'Rejected after Pay', class: 'bg-danger' }],
    [1003, { value: 'RejectedAfterPay', label: 'Rejected after Pay', class: 'bg-danger' }],
  ]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initBreadcrumb();
    const subprojectId = this.route.snapshot.paramMap.get('subprojectId');
    const wageId = this.route.snapshot.paramMap.get('wageId');
   
    
    if (subprojectId) {
      this.loadWageRequestDetails(+subprojectId);
    } else {
      this.apiError = 'Invalid wage request ID';
    }
  }

  initBreadcrumb(): void {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [
      { label: 'Wage Requests', routerLink: '/wage-requests' },
      { label: 'Details' }
    ];
  }

  async loadWageRequestDetails(id: number): Promise<void> {
    this.isLoading = true;
    this.apiError = '';

    try {
        const wageResponse: any = await this.apiService.POST('api/wage-request/get?page=0&size=10', { subprojectId: id });

        if (wageResponse?.data?.content?.length > 0) {
            this.wageRequest = wageResponse.data.content[0];
            
            const subprojectId = this.wageRequest!.subprojectId;
            if (subprojectId) {
                try {
                    const subprojectResponse: any = await this.apiService.POST('/api/subproject/get?page=0&size=10', { id: subprojectId });
                    if (subprojectResponse?.data?.content?.length > 0) {
                        this.subproject = subprojectResponse.data.content[0];
                    } else {
                        console.warn(`Subproject details not found for id: ${subprojectId}`);
                    }
                } catch (subError) {
                    console.error('Failed to load subproject details:', subError);
                }
            }
            this.loadBeneficiaries(this.beneficiaryCurrentPage, this.beneficiaryPageSize);
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
    return this.statusMap.get(statusCode) || { 
      value: 'Unknown', 
      label: 'Unknown Status', 
      class: 'bg-secondary' 
    };
  }

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getMonthName(monthIndex: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex - 1] || 'Unknown';
  }

  async loadBeneficiaries(page: number, size: number): Promise<void> {
    if (!this.wageRequest?.id) return;

    this.isBeneficiaryLoading = true;
    try {
        const response: any = await this.apiService.GET(
            `/api/wage-request/beneficiary-list/get?page=${page}&size=${size}&wageRequestId=${this.wageRequest.id}`
        );

        if (response?.data?.content) {
            this.beneficiaries = response.data.content;
            this.totalBeneficiaries = response.data.totalElements;
        }
    } catch (error) {
        console.error('Failed to load beneficiaries:', error);
    } finally {
        this.isBeneficiaryLoading = false;
        this.cdr.detectChanges();
    }
  }

  onBeneficiaryPageChange(event: any): void {
      this.beneficiaryCurrentPage = event.page;
      this.beneficiaryPageSize = event.rows;
      this.loadBeneficiaries(this.beneficiaryCurrentPage, this.beneficiaryPageSize);
  }
}