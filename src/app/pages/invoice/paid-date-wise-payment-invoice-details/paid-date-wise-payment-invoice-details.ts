import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import Swal from 'sweetalert2';

import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../services/api.service';

interface PaymentDetails {
  subprojectId: number;
  workCode: string;
  bomaName: string;
  payamName: string;
  countyName: string;
  stateName: string;
  projectName: string;
  paidBeneficiaryCount: number;
  paidAmountUSD: number;
  paidAmountSSP: number;
  paidActualHouseholds: number;
  paidAlternateHouseholds: number;
}

interface PaymentDetailByCycle {
  beneficiaryId: number;
  contactNo: string;
  householdName: string;
  totalDays: number;
  wageUsdTotal: number;
  wageSspTotal: number;
  subprojectId: number;
  paidToName: string;
  payStatus: string;
  paidTo: string;
  paidToType: string;
  householdNumber: string;
  requestNumber: string;
  payDate: string;
  requestFromDate: string;
  requestToDate: string;
  wageRateUsd: number;
  exchangeRate: number;
}

@Component({
  selector: 'app-paid-date-wise-payment-invoice-details',
  standalone: true,
  imports: [
    CommonModule,
    Loader,
    BreadcrumbModule,
    TableModule,
    ToastModule,
    ProgressBarModule,
  ],
  templateUrl: './paid-date-wise-payment-invoice-details.html',
  styleUrl: './paid-date-wise-payment-invoice-details.scss',
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaidDateWisePaymentInvoiceDetails implements OnInit {
  isLoading = false;
  isPrinting = false;

  items: MenuItem[] | undefined;
  home: MenuItem | undefined;

  // Query parameters
  subprojectId: number = 0;
  fromDate: string = '';
  toDate: string = '';

  // API Response data
  paymentDetails: PaymentDetails | null = null;
  paymentDetailsByCycle: PaymentDetailByCycle[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initBreadcrumb();
    this.loadQueryParams();
  }

  private initBreadcrumb(): void {
    this.home = {
      label: 'Dashboard',
      icon: 'fas fa-home me-2',
      routerLink: '/dashboard',
    };
    this.items = [
      {
        label: 'Paid Date Wise Payment Invoice',
        icon: 'fas fa-file-invoice',
        routerLink: '/invoice/paid-date-wise-payment-invoice',
      },
      {
        label: 'Invoice Details',
        icon: 'fas fa-info-circle',
      },
    ];
  }

  private loadQueryParams(): void {
    this.route.queryParams.subscribe((params) => {
      this.subprojectId = params['subprojectId'] ? +params['subprojectId'] : 0;
      this.fromDate = params['fromDate'] || '';
      this.toDate = params['toDate'] || '';

      if (this.subprojectId && this.fromDate && this.toDate) {
        this.fetchPaymentSummary();
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Missing required parameters.',
        });
        this.router.navigate(['/invoice/paid-date-wise-payment-invoice']);
      }
    });
  }

  async fetchPaymentSummary(): Promise<void> {
    this.isLoading = true;
    this.cdr.markForCheck();

    const endpoint = `/api/wage-invoice/paid/date-range/payment-summary?subprojectId=${this.subprojectId}&fromDate=${this.fromDate}&toDate=${this.toDate}`;

    try {
      const axiosResponse: any = await this.apiService.GET(endpoint);
      const apiResponse = axiosResponse.data;

      if (apiResponse.success && apiResponse.data) {
        this.paymentDetails = apiResponse.data.paymentDetails;
        this.paymentDetailsByCycle = apiResponse.data.paymentDetailsByCycle || [];
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: apiResponse.message || 'Failed to load payment summary.',
        });
      }
    } catch (error: any) {
      console.error('Error fetching payment summary:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'An error occurred while fetching data.',
      });
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async printInvoice(): Promise<void> {
    Swal.fire({
      title: 'Generating PDF...',
      text: 'Please wait while we prepare your invoice.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.isPrinting = true;
    this.cdr.markForCheck();

    const endpoint = `/api/wage-invoice/paid/date-range/payment-summary/pdf?subprojectId=${this.subprojectId}&fromDate=${this.fromDate}&toDate=${this.toDate}`;

    try {
      const response: any = await this.apiService.GET_CONFIG(endpoint, {
        responseType: 'blob',
      });

      // Create a blob from the PDF response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payment_Invoice_${this.subprojectId}_${this.fromDate}_${this.toDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Invoice PDF downloaded successfully.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to download PDF.',
      });
    } finally {
      this.isPrinting = false;
      this.cdr.markForCheck();
    }
  }

  goBack(): void {
    this.router.navigate(['/invoice/paid-date-wise-payment-invoice']);
  }
}
