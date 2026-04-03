import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { saveAs } from 'file-saver';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../services/api.service';
import {
  LookupItem,
  LookupService,
} from '../../../services/lookup.service';
import { InputText } from "primeng/inputtext";

@Component({
  selector: 'app-wage-paid-request-abstract-with-invoice',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Loader,
    BreadcrumbModule,
    TableModule,
    SelectModule,
    FloatLabelModule,
    Tooltip,
    ToastModule,
    InputText,
    ProgressBarModule,
    DialogModule,
  ],
  templateUrl: './wage-paid-request-abstract-with-invoice.html',
  styleUrl: './wage-paid-request-abstract-with-invoice.scss',
  providers: [MessageService],
})
export class WagePaidRequestAbstractWithInvoice implements OnInit {
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

  async ngOnInit(): Promise<void> {
    this.isLoading = true; // Overall loading starts here
    this.initBreadcrumb();
    this.initForm();
    
    try {
      await this.loadStates(); // Ensure states are loaded first

      // Restore filter state from session storage
      const storedFilters = sessionStorage.getItem('wagePaidAbstractFilters');
      if (storedFilters) {
        const filters = JSON.parse(storedFilters);

        // Load county, payam, boma lists based on stored filters
        if (filters.state?.id) {
          try {
            this.countyList = await this.lookupService.getCountyListByStateId(String(filters.state.id));
            this.searchForm.get('county')?.enable();
          } catch (error) {
            console.error('Error loading counties during state restoration:', error);
          }

          if (filters.county?.id) {
            try {
              this.payamList = await this.lookupService.getPayamListByCountyId(String(filters.county.id));
              this.searchForm.get('payam')?.enable();
            } catch (error) {
              console.error('Error loading payams during state restoration:', error);
            }

            if (filters.payam?.id) {
              try {
                this.bomaList = await this.lookupService.getBomaListByPayamId(String(filters.payam.id));
                this.searchForm.get('boma')?.enable();
              } catch (error) {
                console.error('Error loading bomas during state restoration:', error);
              }
            }
          }
        }

        // After all lists are potentially populated, patch the form
        this.searchForm.patchValue(filters);
        // Removed this.cdr.markForCheck(); to prevent intermediate render

        await this.fetchAllRecords(false); // Call fetchAllRecords without setting its own isLoading
        sessionStorage.removeItem('wagePaidAbstractFilters'); // Clear after use
      } else {
        // If no filters are stored, fetch all records with default loading (if page should show data initially)
        await this.fetchAllRecords();
      }
    } catch (error) {
      console.error("Error in ngOnInit during filter restoration:", error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to restore filter state or load data.',
      });
    } finally {
      this.isLoading = false; // Overall loading ends here
      this.cdr.markForCheck(); // Final UI update
    }
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
      },
    ];
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      state: [null],
      county: [{ value: null, disabled: true }],
      payam: [{ value: null, disabled: true }],
      boma: [{ value: null, disabled: true }],
      workCode: [''],
      reqNo: [''],
    });
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
    this.fetchAllRecords();
  }

  // Reset button handler
  reset(): void {
    this.searchForm.reset({
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

    this.records = [];
    this.totalRecords = 0;
    this.isShow = false;
    this.cdr.markForCheck();
  }

  async fetchAllRecords(setLoading: boolean = true): Promise<void> {
    if (setLoading) {
      this.isLoading = true;
    }
    this.isShow = false;
    this.cdr.markForCheck();

    const formValues = this.searchForm.value;
    const payload = {
      fromDate: null,
      toDate: null,
      workCode: formValues.workCode || null,
      stateId: formValues.state?.id ? parseInt(formValues.state.id, 10) : null,
      countyId: formValues.county?.id ? parseInt(formValues.county.id, 10) : null,
      payamId: formValues.payam?.id ? parseInt(formValues.payam.id, 10) : null,
      bomaId: formValues.boma?.id ? parseInt(formValues.boma.id, 10) : null,
      projectId: formValues.project || null,
      reqNo: formValues.reqNo || null,
    };

    const endpoint = `/api/wage-invoice/paid/abstract-list?page=0&size=-1`;
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
      if (setLoading) {
        this.isLoading = false;
      }
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

      const headers = ['Serial', 'State', 'County', 'Payam', 'Boma', 'Project Name', 'Work Code', 'Request No', 'From Date', 'To Date', 'Payment Cycle'];
      const csvRows = [headers.join(',')];

      this.records.forEach((record, index) => {
        const row = [
          index + 1,
          `"${record.stateName || '-'}"`,
          `"${record.countieName || '-'}"`,
          `"${record.payamName || '-'}"`,
          `"${record.bomaName || '-'}"`,
          `"${record.projectName || '-'}"`,
          `"${record.workCode || '-'}"`,
          `"${record.reqNo || '-'}"`,
          `"${record.fromDate || '-'}"`,
          `"${record.toDate || '-'}"`,
          `"${record.wagePaymentCycle || '-'}"`,
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `wage_paid_request_abstract_${Date.now()}.csv`);

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
      doc.setFontSize(14);
      doc.text('Wage Paid Request Abstract With Invoice', 40, 40);

      const head = [['Serial', 'State', 'County', 'Payam', 'Boma', 'Project', 'Work Code', 'Req No', 'From', 'To', 'Cycle']];
      const body: any[] = [];

      this.records.forEach((record, index) => {
        body.push([
          index + 1,
          record.stateName || '-',
          record.countieName || '-',
          record.payamName || '-',
          record.bomaName || '-',
          record.projectName || '-',
          record.workCode || '-',
          record.reqNo || '-',
          record.fromDate || '-',
          record.toDate || '-',
          record.wagePaymentCycle || '-',
        ]);
      });

      autoTable(doc, {
        head: head,
        body: body,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
      });

      doc.save(`wage_paid_request_abstract_${Date.now()}.pdf`);

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
    const wagePaymentRequestId = record.wagePaymentRequestId;
    const subprojectId = record.subprojectId;

    if (wagePaymentRequestId !== undefined && subprojectId !== undefined) {
      sessionStorage.setItem('wagePaidAbstractFilters', JSON.stringify(this.searchForm.value));
      this.router.navigate(
        ['/invoice/wage-paid-reqiest-abstract-with-invoice-details'],
        { queryParams: { wagePaymentRequestId: wagePaymentRequestId, subprojectId: subprojectId } }
      );
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Missing wagePaymentRequestId or subprojectId for details.',
      });
    }
  }
}