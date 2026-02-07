import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ApiService } from '../../../services/api.service';
import { Loader } from '../../../components/loader/loader';

@Component({
  selector: 'app-wage-paid-reqiest-abstract-with-invoice-details',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbModule,
    TableModule,
    ToastModule,
    Loader
  ],
  templateUrl: './wage-paid-reqiest-abstract-with-invoice-details.html',
  styleUrl: './wage-paid-reqiest-abstract-with-invoice-details.scss',
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush, // Explicitly set OnPush
})
export class WagePaidReqiestAbstractWithInvoiceDetails implements OnInit {
  isLoading = false;
  wagePaymentRequestId!: number;
  subprojectId!: number;
  wagePaymentRequestDetails: any; // To store the fetched data

  items: MenuItem[] | undefined;
  home: MenuItem | undefined;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initBreadcrumb();
    this.route.queryParams.subscribe((params) => {
      this.wagePaymentRequestId = +params['wagePaymentRequestId']!;
      this.subprojectId = +params['subprojectId']!;
      this.fetchDetails(this.wagePaymentRequestId, this.subprojectId);
      this.cdr.markForCheck(); // Mark for check after params are updated
    });
  }

  private initBreadcrumb(): void {
    this.home = {
      label: 'Dashboard',
      icon: 'fas fa-home me-2',
      routerLink: '/dashboard',
    };
    this.items = [
      {
        label: 'Wage Paid Request Abstract With Invoice',
        icon: 'fas fa-file-invoice',
        routerLink: '/invoice/wage-paid-request-abstract-with-invoice',
      },
      {
        label: 'Details',
        icon: 'fas fa-file-invoice',
      },
    ];
  }

  private async fetchDetails(wagePaymentRequestId: number, subprojectId: number): Promise<void> {
    this.isLoading = true;
    this.cdr.markForCheck(); // Mark for check when loading starts
    try {
      const endpoint = `/api/wage-invoice/paid/abstract-summary?wagePaymentRequestId=${wagePaymentRequestId}&subprojectId=${subprojectId}`;
      const axiosResponse: any = await this.apiService.GET(endpoint);
      const apiResponse = axiosResponse.data;
      console.log('API Response:', apiResponse); // Debugging line
      console.log('API Response Data:', apiResponse.data); // Debugging line

      if (apiResponse.success && apiResponse.data) {
        this.wagePaymentRequestDetails = apiResponse.data;
        this.cdr.markForCheck(); // Mark for check after data is updated
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: apiResponse.message || 'Failed to fetch details.',
        });
        this.cdr.markForCheck(); // Mark for check on error message
      }
    } catch (error: any) {
      console.error('Error fetching details:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'An error occurred while fetching details.',
      });
      this.cdr.markForCheck(); // Mark for check on error
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck(); // Mark for check when loading finishes
    }
  }
}
