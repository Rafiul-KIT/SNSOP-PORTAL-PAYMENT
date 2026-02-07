import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import Swal from 'sweetalert2';

import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../services/api.service';
import {
  LookupItem,
  LookupService,
  PaymentCycleEnum,
} from '../../../services/lookup.service';

// Custom validator to check if fromDate is not after toDate
function dateRangeValidator(formGroup: FormGroup) {
  const fromDate = formGroup.get('fromDate')?.value;
  const toDate = formGroup.get('toDate')?.value;

  if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
    return { dateRangeInvalid: true };
  }
  return null;
}


@Component({
  selector: 'app-paid-date-wise-payment-invoice',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Loader,
    BreadcrumbModule,
    TableModule,
    SelectModule,
    FloatLabelModule,
    TooltipModule,
    PaginatorModule,
    ToastModule,
    DatePickerModule,
    InputTextModule,

  ],
  templateUrl: './paid-date-wise-payment-invoice.html',
  styleUrl: './paid-date-wise-payment-invoice.scss',
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaidDateWisePaymentInvoice implements OnInit {
  isLoading = false;
  isShow = false;

  items: MenuItem[] | undefined;
  home: MenuItem | undefined;

  searchForm!: FormGroup;
  records: any[] = [];

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalRecords = 0;

  // Lookup data
  states: LookupItem[] = [];

  // Filtered lists for dropdowns
  countyList: LookupItem[] = [];
  payamList: LookupItem[] = [];
  bomaList: LookupItem[] = [];



  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public lookupService: LookupService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): Promise<void> {
    this.initBreadcrumb();
    this.initForm();
    this.loadStates();
    return Promise.resolve();
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
      },
    ];
  }

  private initForm(): void {
    const today = new Date();
    const formattedToday = today.toISOString().slice(0, 10); // YYYY-MM-DD

    this.searchForm = this.fb.group(
      {
        fromDate: [formattedToday, Validators.required],
        toDate: [formattedToday, Validators.required],

        state: [null],
        county: [{ value: null, disabled: true }],
        payam: [{ value: null, disabled: true }],
        boma: [{ value: null, disabled: true }],
        workCode: [''],
        reqNo: [''],
      },
      { validators: dateRangeValidator }
    );
  }

  // Load only states initially
  private async loadStates(): Promise<void> {
    try {
      await this.lookupService.getOrFetchStateList();
      this.states = this.lookupService.getStateList();
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading states:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load states.',
      });
    }
  }

  async onStateChange(state: any): Promise<void> {
    this.searchForm.get('county')?.reset({ value: null, disabled: true });
    this.searchForm.get('payam')?.reset({ value: null, disabled: true });
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.countyList = [];
    this.payamList = [];
    this.bomaList = [];

    if (state?.id) {
      try {
        this.countyList = await this.lookupService.getCountyListByStateId(
          String(state.id)
        );
        this.searchForm.get('county')?.enable();
      } catch (error) {
        console.error('Error loading counties:', error);
      }
    }
    this.cdr.markForCheck();
  }

  // Load payams when county is selected
  async onCountyChange(county: any): Promise<void> {
    this.searchForm.get('payam')?.reset({ value: null, disabled: true });
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.payamList = [];
    this.bomaList = [];

    if (county?.id) {
      try {
        this.payamList = await this.lookupService.getPayamListByCountyId(
          String(county.id)
        );
        this.searchForm.get('payam')?.enable();
      } catch (error) {
        console.error('Error loading payams:', error);
      }
    }
    this.cdr.markForCheck();
  }

  // Load bomas when payam is selected
  async onPayamChange(payam: any): Promise<void> {
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.bomaList = [];

    if (payam?.id) {
      try {
        this.bomaList = await this.lookupService.getBomaListByPayamId(
          String(payam.id)
        );
        this.searchForm.get('boma')?.enable();
      } catch (error) {
        console.error('Error loading bomas:', error);
      }
    }
    this.cdr.markForCheck();
  }

  // Search button handler
  search(): void {
    if (this.searchForm.invalid) {
      if (this.searchForm.errors?.['dateRangeInvalid']) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'From Date cannot be after To Date.',
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'Please fill all required fields (From Date, To Date).',
        });
      }
      return;
    }
    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  // Reset button handler
  reset(): void {
    const today = new Date();
    const formattedToday = today.toISOString().slice(0, 10); // YYYY-MM-DD

    this.searchForm.reset({
      fromDate: formattedToday,
      toDate: formattedToday,

      state: null,
      county: null,
      payam: null,
      boma: null,
      workCode: null,
      reqNo: null,
    });
    this.searchForm.get('county')?.disable();
    this.searchForm.get('payam')?.disable();
    this.searchForm.get('boma')?.disable();

    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize, true);
  }

  async fetchPage(
    page: number,
    size: number,
    isInitialLoad: boolean = false
  ): Promise<void> {
    this.isLoading = true;
    this.isShow = false; // Initially hide the table area
    this.cdr.markForCheck();

    const formValues = this.searchForm.value;
    const payload = {
      fromDate: formValues.fromDate,
      toDate: formValues.toDate,
      workCode: formValues.workCode || null,
      stateId: formValues.state?.id ? parseInt(formValues.state.id, 10) : null,
      countyId: formValues.county?.id ? parseInt(formValues.county.id, 10) : null,
      payamId: formValues.payam?.id ? parseInt(formValues.payam.id, 10) : null,
      bomaId: formValues.boma?.id ? parseInt(formValues.boma.id, 10) : null,
      projectId: formValues.projectId || null,
      reqNo: formValues.reqNo || null,
    };

    const endpoint = `/api/wage-invoice/paid/date-range/list?page=${page}&size=${size}`;
    try {
      const axiosResponse: any = await this.apiService.POST(
        endpoint,
        payload
      );
      // Access the actual API response data from axiosResponse.data
      const apiResponse = axiosResponse.data;

      if (apiResponse.success && apiResponse.data && apiResponse.data.length > 0) {
        this.records = apiResponse.data; // Correctly access the data array
        this.totalRecords = apiResponse.pagination.totalElements;
        this.isShow = true; // Show table only if data is successfully fetched
      } else {
        this.records = [];
        this.totalRecords = 0;
        this.messageService.add({
          severity: 'info',
          summary: 'Info',
          detail: apiResponse.message || 'No data found.',
        });
        this.isShow = false; // Keep table hidden if no data or unsuccessful response
      }
    } catch (error: any) { // Catch as 'any' to access error.response
      console.error('Error fetching data:', error);
      this.records = [];
      this.totalRecords = 0;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'An error occurred while fetching data.',
      });
      this.isShow = false; // Keep table hidden on error
    } finally {
      this.isLoading = false; // Always stop loader
      this.cdr.markForCheck();
    }
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  viewDetails(record: any): void {
    // Implement view details logic
  }
}
