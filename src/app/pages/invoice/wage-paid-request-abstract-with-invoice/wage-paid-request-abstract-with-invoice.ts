import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { Badge } from 'primeng/badge';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
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
    PaginatorModule,
    ToastModule,
    MultiSelectModule,
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
  pageSize = 10;
  totalRecords = 0;

  // Lookup data
  states: LookupItem[] = [];

  // Filtered lists for dropdowns
  countyList: LookupItem[] = [];
  payamList: LookupItem[] = [];
  bomaList: LookupItem[] = [];

  paymentCycleOptions = PaymentCycleEnum;

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
    this.search();
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
      paymentCycle: [null],
      state: [null],
      county: [{ value: null, disabled: true }],
      payam: [{ value: null, disabled: true }],
      boma: [{ value: null, disabled: true }],
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
    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  // Reset button handler
  reset(): void {
    this.searchForm.reset({
      paymentCycle: null,
      state: null,
      county: null,
      payam: null,
      boma: null,
    });
    this.searchForm.get('county')?.disable();
    this.searchForm.get('payam')?.disable();
    this.searchForm.get('boma')?.disable();

    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize, true);
  }

  fetchPage(
    page: number,
    size: number,
    isInitialLoad: boolean = false
  ): Promise<void> {
    this.isShow = false;
    this.cdr.markForCheck();

    // Mock data for now
    this.records = [
      {
        state: 'State 1',
        county: 'County 1',
        payam: 'Payam 1',
        boma: 'Boma 1',
        paymentCycle: 1,
      },
      {
        state: 'State 2',
        county: 'County 2',
        payam: 'Payam 2',
        boma: 'Boma 2',
        paymentCycle: 2,
      },
    ];
    this.totalRecords = this.records.length;
    this.isShow = true;
    this.cdr.markForCheck();

    return Promise.resolve();
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