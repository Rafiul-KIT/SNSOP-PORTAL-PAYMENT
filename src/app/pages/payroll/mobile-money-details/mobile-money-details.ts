import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TooltipModule } from 'primeng/tooltip';
import Swal from 'sweetalert2';
import { ApiService } from '../../../services/api.service';
import { Loader } from '../../../components/loader/loader';

interface MobileMoneyBeneficiary {
  transactionId: number;
  recipientFullName: string;
  walletNumber: string;
  amount: number;
  paymentCycle: number;
  status: string;
}

@Component({
  selector: 'app-mobile-money-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    CheckboxModule,
    ToastModule,
    ConfirmDialogModule,
    BreadcrumbModule,
    TooltipModule,
    RouterModule,
    Loader,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './mobile-money-details.html',
  styleUrls: ['./mobile-money-details.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileMoneyDetails implements OnInit {
  isLoading = true;
  requestId: string | null = null;
  beneficiaries: MobileMoneyBeneficiary[] = [];
  selectedBeneficiaries: MobileMoneyBeneficiary[] = [];

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    this.initBreadcrumb();
    this.requestId = this.route.snapshot.paramMap.get('requestId');
    if (this.requestId) {
      await this.fetchBeneficiaryData(this.requestId);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Request ID not found in URL.',
      });
      this.isLoading = false;
    }
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [
      { label: 'Payroll Download', routerLink: '/payroll/mobile-money-download' }, // Assuming this is the path
      { label: 'Mobile Money Details' },
    ];
  }

  async fetchBeneficiaryData(requestId: string) {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      const response = await this.api.POST(
        `/api/momo/status?requestId=${requestId}`,
        {}
      );
      if (response.data.success) {
        this.beneficiaries = response.data.data;
      } else {
        this.beneficiaries = [];
        Swal.fire({
          icon: 'error',
          title: 'Failed to fetch data',
          text: response.data.message || 'Could not retrieve beneficiary details.',
        });
      }
    } catch (error: any) {
      this.beneficiaries = [];
      Swal.fire({
        icon: 'error',
        title: 'API Error',
        text:
          error?.response?.data?.message ||
          'An error occurred while fetching beneficiary data.',
      });
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  initiatePayment() {
    if (this.selectedBeneficiaries.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Selection',
        detail: 'Please select at least one beneficiary to proceed.',
      });
      return;
    }

    this.confirmationService.confirm({
      key: 'confirm',
      message: `Are you sure you want to initiate payment for ${this.selectedBeneficiaries.length} selected beneficiaries?`,
      header: 'Confirm Payment Initiation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        this.isLoading = true;
        this.cdr.markForCheck();

        const transactionIds = this.selectedBeneficiaries.map(
          (b) => b.transactionId
        );
        const payload = { transactionIds };

        try {
          const response = await this.api.POST(
            '/api/momo/initiatePaymentByTxnId',
            payload
          );
          if (response.data && response.data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: response.data.message || 'Payment initiated successfully!',
            });
            // Refresh data or update status
            await this.fetchBeneficiaryData(this.requestId!);
            this.selectedBeneficiaries = [];
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Payment Failed',
              text:
                response.data.message ||
                'An error occurred while initiating the payment.',
            });
          }
        } catch (error: any) {
          Swal.fire({
            icon: 'error',
            title: 'API Error',
            text:
              error?.response?.data?.message ||
              'An unknown error occurred during payment initiation.',
          });
        } finally {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      },
    });
  }

  onRowSelect(event: any) {
    this.messageService.add({
      severity: 'info',
      summary: 'Beneficiary Selected',
      detail: `Name: ${event.data.recipientFullName}`,
    });
  }

  onRowUnselect(event: any) {
    this.messageService.add({
      severity: 'info',
      summary: 'Beneficiary Unselected',
      detail: `Name: ${event.data.recipientFullName}`,
    });
  }
}
