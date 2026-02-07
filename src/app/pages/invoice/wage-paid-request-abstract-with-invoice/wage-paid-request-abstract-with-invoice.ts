import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { Badge } from 'primeng/badge';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MultiSelectModule } from 'primeng/multiselect';

import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../services/api.service';
import {
  LookupItem,
  LookupService,
  PaymentCycleEnum,
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
    MultiSelectModule,
    InputText
],
  templateUrl: './wage-paid-request-abstract-with-invoice.html',
  styleUrl: './wage-paid-request-abstract-with-invoice.scss',
  providers: [MessageService],
})
export class WagePaidRequestAbstractWithInvoice implements OnInit {
  isLoading = false;
  isShow = false;

  items: MenuItem[] | undefined;
  home: MenuItem | undefined;

  searchForm!: FormGroup;
  records: any[] = [];

  // Pagination
  currentPage = 0;
  pageSizeControl!: FormControl<number>;
  totalRecords = 0;
  totalPages = 0; // Added for custom pagination
  rowsPerPageOptions = [ // Added for custom pagination
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: 'All', value: -1 } // Using -1 to represent 'All'
  ];

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
    this.pageSizeControl = this.fb.control(10, { nonNullable: true });
    this.pageSizeControl.valueChanges.subscribe((newValue) => {
      if (newValue !== null) {
        this.onPageSizeChange({ value: newValue });
      }
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
    this.goToPage(0); // Reset to first page on search
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

    this.goToPage(0); // Reset to first page on reset
  }

  async fetchPage(
    page: number,
    size: number
  ): Promise <void>{
    this.isLoading = true;
    this.isShow = false; // Initially hide the table area
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

    let actualSize = size;
    if (size === -1) {
      page = 0; // When 'All' is selected, reset to first page
      actualSize = this.totalRecords; // Use totalRecords directly
    }
    this.currentPage = page; // Update currentPage before API call

    const endpoint = `/api/wage-invoice/paid/abstract-list?page=${page}&size=${actualSize}`;
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
        this.totalPages = Math.ceil(this.totalRecords / this.pageSizeControl.value); // Calculate totalPages
        this.isShow = true; // Show table only if data is successfully fetched
      } else {
        this.records = [];
        this.totalRecords = 0;
        this.totalPages = 0; // Reset totalPages if no data
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
      this.totalPages = 0; // Reset totalPages on error
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

  // New method to handle page changes from custom controls
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.fetchPage(this.currentPage, this.pageSizeControl.value);
    } else if (page === 0 && this.totalPages === 0) {
      // Allow fetching first page when there's no data yet, or if totalPages is 0
      this.currentPage = 0;
      this.fetchPage(this.currentPage, this.pageSizeControl.value);
    }
  }

  // New method to handle page size changes from dropdown
  onPageSizeChange(event: { value: number }): void {
    const newSize = event.value;
    this.pageSizeControl.setValue(newSize === -1 ? this.totalRecords : newSize, { emitEvent: false }); // Update FormControl value
    this.currentPage = 0; // Reset to first page when page size changes
    this.fetchPage(this.currentPage, this.pageSizeControl.value);
  }

  viewDetails(record: any): void {
    // Implement view details logic
  }
}