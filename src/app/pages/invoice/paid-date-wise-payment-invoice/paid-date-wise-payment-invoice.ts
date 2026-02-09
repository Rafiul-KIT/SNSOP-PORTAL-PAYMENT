import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';

import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../services/api.service';
import {
  LookupItem,
  LookupService,
  PaymentCycleEnum,
} from '../../../services/lookup.service';

// Custom validator to check if fromDate is not after toDate and toDate is not in future
function dateRangeValidator(formGroup: FormGroup) {
  const fromDate = formGroup.get('fromDate')?.value;
  const toDate = formGroup.get('toDate')?.value;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to compare only dates

  // Check if fromDate is after toDate
  if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
    return { dateRangeInvalid: true };
  }

  // Check if toDate is in the future
  if (toDate) {
    const toDateObj = new Date(toDate);
    toDateObj.setHours(0, 0, 0, 0);
    if (toDateObj > today) {
      return { futureDateInvalid: true };
    }
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
    ToastModule,
    DatePickerModule,
    InputTextModule,
    ProgressBarModule,
    DialogModule,
  ],
  templateUrl: './paid-date-wise-payment-invoice.html',
  styleUrl: './paid-date-wise-payment-invoice.scss',
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaidDateWisePaymentInvoice implements OnInit {
  isLoading = false;
  isShow = false;
  isExporting = false;

  items: MenuItem[] | undefined;
  home: MenuItem | undefined;

  searchForm!: FormGroup;
  records: any[] = [];
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
    this.searchForm = this.fb.group(
      {
        fromDate: [null, Validators.required],
        toDate: [null, Validators.required],
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
      } else if (this.searchForm.errors?.['futureDateInvalid']) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'To Date cannot be a future date.',
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
    this.fetchAllRecords();
  }

  // Reset button handler
  reset(): void {
    this.searchForm.reset({
      fromDate: null,
      toDate: null,
      state: null,
      county: null,
      payam: null,
      boma: null,
      workCode: '',
      reqNo: '',
    });
    this.searchForm.get('county')?.disable();
    this.searchForm.get('payam')?.disable();
    this.searchForm.get('boma')?.disable();

    this.records = [];
    this.totalRecords = 0;
    this.isShow = false;
    this.cdr.markForCheck();
  }

  async fetchAllRecords(): Promise<void> {
    this.isLoading = true;
    this.isShow = false;
    this.cdr.markForCheck();

    const formValues = this.searchForm.value;

    // Format dates to YYYY-MM-DD format
    const formatDate = (date: any): string | null => {
      if (!date) return null;
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      return date;
    };

    const payload = {
      fromDate: formatDate(formValues.fromDate),
      toDate: formatDate(formValues.toDate),
      workCode: formValues.workCode || null,
      stateId: formValues.state?.id ? parseInt(formValues.state.id, 10) : null,
      countyId: formValues.county?.id ? parseInt(formValues.county.id, 10) : null,
      payamId: formValues.payam?.id ? parseInt(formValues.payam.id, 10) : null,
      bomaId: formValues.boma?.id ? parseInt(formValues.boma.id, 10) : null,
      projectId: null,
      reqNo: formValues.reqNo || null,
    };

    const endpoint = `/api/wage-invoice/paid/date-range/list?page=0&size=-1`;
    try {
      const axiosResponse: any = await this.apiService.POST(
        endpoint,
        payload
      );
      const apiResponse = axiosResponse.data;

      if (apiResponse.success && apiResponse.data && apiResponse.data.length > 0) {
        this.records = apiResponse.data;
        this.totalRecords = apiResponse.data.length;
        this.isShow = true;
      } else {
        this.records = [];
        this.totalRecords = 0;
        this.messageService.add({
          severity: 'info',
          summary: 'Info',
          detail: apiResponse.message || 'No data found.',
        });
        this.isShow = false;
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      this.records = [];
      this.totalRecords = 0;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'An error occurred while fetching data.',
      });
      this.isShow = false;
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  // Export to CSV
  async exportToCSV(): Promise<void> {
    if (!this.records || this.records.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No data to export.',
      });
      return;
    }

    this.isExporting = true;
    this.cdr.markForCheck();

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const headers = ['Serial', 'State', 'County', 'Payam', 'Boma', 'Work Code'];
      const csvRows = [headers.join(',')];

      this.records.forEach((record, index) => {
        const row = [
          index + 1,
          `"${record.stateName || '-'}"`,
          `"${record.countieName || '-'}"`,
          `"${record.payamName || '-'}"`,
          `"${record.bomaName || '-'}"`,
          `"${record.workCode || '-'}"`,
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `paid_date_wise_payment_invoice_${Date.now()}.csv`);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'CSV exported successfully.',
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export CSV.',
      });
    } finally {
      this.isExporting = false;
      this.cdr.markForCheck();
    }
  }

  // Export to PDF (Print)
  async exportToPDF(): Promise<void> {
    if (!this.records || this.records.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No data to print.',
      });
      return;
    }

    this.isExporting = true;
    this.cdr.markForCheck();

    try {
      const jsPDF = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF.default('l', 'pt', 'a4');
      doc.setFontSize(16);
      doc.text('Paid Date Wise Payment Invoice', 40, 40);

      const head = [['Serial', 'State', 'County', 'Payam', 'Boma', 'Work Code']];
      const body: any[] = [];

      this.records.forEach((record, index) => {
        body.push([
          index + 1,
          record.stateName || '-',
          record.countieName || '-',
          record.payamName || '-',
          record.bomaName || '-',
          record.workCode || '-',
        ]);
      });

      autoTable(doc, {
        head: head,
        body: body,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.save(`paid_date_wise_payment_invoice_${Date.now()}.pdf`);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'PDF exported successfully.',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export PDF.',
      });
    } finally {
      this.isExporting = false;
      this.cdr.markForCheck();
    }
  }

  viewDetails(record: any): void {
    const fromDate = this.formatDateForNavigation(this.searchForm.value.fromDate);
    const toDate = this.formatDateForNavigation(this.searchForm.value.toDate);

    this.router.navigate(['/invoice/paid-date-wise-payment-invoice-details'], {
      queryParams: {
        subprojectId: record.subprojectId,
        fromDate: fromDate,
        toDate: toDate
      }
    });
  }

  private formatDateForNavigation(date: any): string {
    if (!date) return '';
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  }
}
