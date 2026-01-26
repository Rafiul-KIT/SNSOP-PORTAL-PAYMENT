import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../services/api.service';
import { LookupService, LookupItem, PaymentCycleEnum, StatusWageEnum } from '../../../services/lookup.service';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';



// Custom validator for the date range (fromDate cannot be after toDate)
export function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const fromDate = group.get('fromDate')?.value;
  const toDate = group.get('toDate')?.value;

  if (fromDate && toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    if (from > to) {
      return { fromDateAfterToDate: true };
    }
  }
  return null;
}

interface WageAbstractRecord {
  state: string;
  county: string;
  payam: string;
  boma: string;
  subprojectCode: string;
  requestNumber: string;
  fromDate: string;
  toDate: string;
  paymentCycle: number;
  status: number;
  criteria: string;
  paymentStatus: string;
  totalMembers: number;
  totalPaidMembers: number;
  totalWorkDays: number;
  exchangeRate: number;
  totalAmountInUsd: number;
  totalAmountInSsp: number;
}

@Component({
  selector: 'app-wage-request-abstract',
  templateUrl: './wage-request-abstract.html',
  styleUrl: './wage-request-abstract.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    PaginatorModule,
    BreadcrumbModule,
    FloatLabelModule,
    SelectModule,
    InputTextModule,
    DatePickerModule,
    TooltipModule,
    Loader,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WageRequestAbstract implements OnInit {
  searchForm!: FormGroup;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  // Location lookups
  states: LookupItem[] = [];
  countyList: LookupItem[] = [];
  payamList: LookupItem[] = [];
  bomaList: LookupItem[] = [];

  // Dropdown options
  paymentCycles: any[] = [];
  statuses: any[] = [];
  criteriaOptions: any[] = [];
  paymentStatusOptions: any[] = [];
  reportSizeOptions = [
    { label: '100', value: 100 },
    { label: '500', value: 500 },
    { label: '1000', value: 1000 },
    { label: '5000', value: 5000 },
    { label: '10000', value: 10000 },
    { label: '50000', value: 50000 },
    { label: '100000', value: 100000 },
    { label: 'All', value: -1 },
  ];

  // Table data
  abstractRecords: WageAbstractRecord[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  advanceSearchPanelVisible = false;
  hasSearched: boolean = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private api: ApiService,
    private lookupService: LookupService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.initBreadcrumb();
    this.initDropdowns();
    this.initForm();
    await this.loadStates();
    // this.fetchPage(this.currentPage, this.pageSize);
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Wages Request Abstract' }];
  }

  initDropdowns() {
    this.paymentCycles = PaymentCycleEnum;
    this.statuses = StatusWageEnum;
    this.criteriaOptions = [
       { label: 'ALL', value: 'ALL' },
      { label: 'LIPW', value: 'LIPW' },
      { label: 'Direct Income Support', value: 'DIS' },
    ];
    this.paymentStatusOptions = [
      { label: 'All', value: 'ALL' },
      { label: 'Paid', value: 'PAID' },
      { label: 'Unpaid', value: 'UNPAID' },
    ];
  }

  initForm() {
    this.searchForm = this.fb.group({
      state: [null],
      county: [{ value: null, disabled: true }],
      payam: [{ value: null, disabled: true }],
      boma: [{ value: null, disabled: true }],
      subprojectId: [null],
      requestNumber: [''],
      fromDate: [null],
      toDate: [null],
      status: [null],
      paymentCycle: [null],
      criteria: [null],
      paymentStatus: [null],
      reportSize: [null],
    }, { validators: dateRangeValidator });
  }

  private async loadStates(): Promise<void> {
    try {
      await this.lookupService.getOrFetchStateList();
      this.states = this.lookupService.getStateList();
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading states:', error);
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
        this.countyList = await this.lookupService.getCountyListByStateId(String(state.id));
        this.searchForm.get('county')?.enable();
      } catch (error) {
        console.error('Error loading counties:', error);
      }
    }
    this.cdr.markForCheck();
  }

  async onCountyChange(county: any): Promise<void> {
    this.searchForm.get('payam')?.reset({ value: null, disabled: true });
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.payamList = [];
    this.bomaList = [];

    if (county?.id) {
      try {
        this.payamList = await this.lookupService.getPayamListByCountyId(String(county.id));
        this.searchForm.get('payam')?.enable();
      } catch (error) {
        console.error('Error loading payams:', error);
      }
    }
    this.cdr.markForCheck();
  }

  async onPayamChange(payam: any): Promise<void> {
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.bomaList = [];

    if (payam?.id) {
      try {
        this.bomaList = await this.lookupService.getBomaListByPayamId(String(payam.id));
        this.searchForm.get('boma')?.enable();
      } catch (error) {
        console.error('Error loading bomas:', error);
      }
    }
    this.cdr.markForCheck();
  }

  private formatDate(date: Date | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private buildSearchBody() {
    const f = this.searchForm.value;
    return {
      state: f.state?.id || null,
      county: f.county?.id || null,
      payam: f.payam?.id || null,
      boma: f.boma?.id || null,
      subprojectId: f.subprojectId ? Number(f.subprojectId) : null,
      requestNumber: f.requestNumber?.trim() || null,
      fromDate: this.formatDate(f.fromDate),
      toDate: this.formatDate(f.toDate),
      status: f.status != null ? Number(f.status) : null,
      paymentCycle: f.paymentCycle || null,
      criteria: f.criteria || null,
      paymentStatus: f.paymentStatus || null,
    };
  }

  fetchPage(page: number, size: number) {
    this.loading = true;
    this.cdr.markForCheck();
    const body = this.buildSearchBody();

    this.api
      .POST(`api/wage-request/abstract/get?page=${page}&size=${size}`, body)
      .then((res: any) => {
        if (!res) throw new Error('Empty response');
        const data = res.data || res;
        this.abstractRecords = data.content || [];
        this.totalRecords = data.totalElements || 0;

        if (this.abstractRecords.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Report',
            detail: 'No records found.',
          });
        }
      })
      .catch((err) => {
        console.error('Fetch wage request abstract error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch wage request abstract.',
        });
      })
      .finally(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
  }

  toggleAdvanceSearch() {
    this.advanceSearchPanelVisible = !this.advanceSearchPanelVisible;
    this.cdr.markForCheck();
  }

  searchAbstract() {
    if (this.searchForm.invalid) {
        let errorMessages = '';
        if (this.searchForm.hasError('fromDateAfterToDate')) {
            errorMessages += '<p>From Date cannot be after To Date.</p>';
        }
        
        if(errorMessages) {
          Swal.fire({
              icon: 'error',
              title: 'Date Validation Errors',
              html: errorMessages,
          });
          return;
        }
    }

    const selectedSize = this.searchForm.get('reportSize')?.value;
    this.currentPage = 0;
    if (selectedSize === -1) {
      this.pageSize = this.totalRecords || 10;
    } else if (selectedSize) {
      this.pageSize = selectedSize;
    }
    this.fetchPage(this.currentPage, this.pageSize);
    this.hasSearched = true;
  }

  resetForm() {
    this.searchForm.reset();
    this.searchForm.get('county')?.disable();
    this.searchForm.get('payam')?.disable();
    this.searchForm.get('boma')?.disable();
    this.countyList = [];
    this.payamList = [];
    this.bomaList = [];
    this.abstractRecords = [];
    this.totalRecords = 0;
    this.currentPage = 0;
    this.hasSearched = false;
    this.loading = false;
    this.cdr.markForCheck();
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  getPaymentCycleLabel(value: number): string {
    const found = this.paymentCycles.find((item: any) => item.value === value);
    if (found) {
      return found.label.replace('Cycle ', 'Payment Cycle ');
    }
    return value?.toString() || '';
  }

  getStatusLabel(value: number): string {
    const found = this.statuses.find((item: any) => Number(item.id) === value);
    return found ? found.label : value?.toString() || '';
  }

  getCriteriaLabel(value: string): string {
    const found = this.criteriaOptions.find((item: any) => item.value === value);
    return found ? found.label : value || '';
  }

  async exportCsv() {
    if (this.totalRecords === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Export',
        detail: 'No data to export.',
      });
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    try {
      // Fetch all records for export
      const body = this.buildSearchBody();
      const res: any = await this.api.POST(`api/wage-request/abstract/get?page=0&size=${this.totalRecords}`, body);
      const data = res?.data || res;
      const allRecords: WageAbstractRecord[] = data?.content || [];

      if (allRecords.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Export',
          detail: 'No data to export.',
        });
        return;
      }

      // CSV headers
      const headers = ['IP Name', 'State', 'County', 'Payam', 'Boma', 'Work Code',
        'Request Number', 'From Date', 'To Date', 'Total Members', 'Work Days', 'Exchange Rate',
        'Amount Paid in USD', 'Amount Paid in SSP', 'Wage Status',  'Payment Cycle'];

      // CSV rows
      const csvRows = allRecords.map((r, idx) => [
        this.escapeCsvField('UNOPS Field Office'),
        this.escapeCsvField(r.state),
        this.escapeCsvField(r.county),
        this.escapeCsvField(r.payam),
        this.escapeCsvField(r.boma),
        this.escapeCsvField(r.subprojectCode),
        this.escapeCsvField(r.requestNumber),
        this.escapeCsvField(r.fromDate),
        this.escapeCsvField(r.toDate),
         r.totalMembers,
         r.totalWorkDays,
         r.exchangeRate,
         r.totalAmountInUsd,
        r.totalAmountInSsp,
        this.escapeCsvField(this.getStatusLabel(r.status)),
        this.escapeCsvField(this.getPaymentCycleLabel(r.paymentCycle)),

        // this.escapeCsvField(this.getCriteriaLabel(r.criteria)),
        // this.escapeCsvField(r.paymentStatus),

        // r.totalPaidMembers,


      ].join(','));

      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `wage_request_abstract_${Date.now()}.csv`);
    } catch (error) {
      console.error('Export error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Export',
        detail: 'Failed to export data.',
      });
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private escapeCsvField(field: any): string {
    if (field == null) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  async exportPdf() {
    if (this.totalRecords === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Export',
        detail: 'No data to export.',
      });
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    try {
      // Fetch all records for export
      const body = this.buildSearchBody();
      const res: any = await this.api.POST(`api/wage-request/abstract/get?page=0&size=${this.totalRecords}`, body);
      const data = res?.data || res;
      const allRecords: WageAbstractRecord[] = data?.content || [];

      if (allRecords.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Export',
          detail: 'No data to export.',
        });
        return;
      }

      const jsPDF = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF.default('l', 'px', 'a4');

      const head = [['S.No', 'IP Name', 'State', 'County', 'Payam', 'Boma', 'Sub-Project Code',
        'Request No', 'From', 'To', 'Cycle', 'Status', 'Criteria', 'Pay Status',
        'Members', 'Paid', 'Days', 'USD', 'SSP']];

      const pdfBody = allRecords.map((r, idx) => [
        idx + 1,
        'UNOPS Field Office',
        r.state,
        r.county,
        r.payam,
        r.boma,
        r.subprojectCode,
        r.requestNumber,
        r.fromDate,
        r.toDate,
        this.getPaymentCycleLabel(r.paymentCycle),
        this.getStatusLabel(r.status),
        this.getCriteriaLabel(r.criteria),
        r.paymentStatus,
        r.totalMembers,
        r.totalPaidMembers,
        r.totalWorkDays,
        r.totalAmountInUsd?.toFixed(2),
        r.totalAmountInSsp?.toFixed(2),
      ]);

      autoTable(doc, { head, body: pdfBody, styles: { fontSize: 5 } });
      doc.save(`wage_request_abstract_${Date.now()}.pdf`);
    } catch (error) {
      console.error('Export error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Export',
        detail: 'Failed to export data.',
      });
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  viewBeneficiaries(item: WageAbstractRecord) {
    this.messageService.add({
      severity: 'info',
      summary: 'View',
      detail: `Viewing beneficiaries for ${item.requestNumber}`,
    });
  }
}
