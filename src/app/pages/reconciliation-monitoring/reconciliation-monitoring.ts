import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { MessageService } from 'primeng/api';

import {
  LookupService,
  PaymentCycleEnum,
  LookupItem,
} from '../../services/lookup.service';
import { ReconciliationMonitoringStateService } from './reconciliation-monitoring-state.service';
import { Loader } from '../../components/loader/loader';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Tooltip } from "primeng/tooltip";
import { PaginatorModule } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { Tag } from "primeng/tag";
import { Badge } from "primeng/badge";
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-reconciliation-monitoring',
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
    Tag,
    MultiSelectModule
],
  templateUrl: './reconciliation-monitoring.html',
  styleUrl: './reconciliation-monitoring.scss',
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReconciliationMonitoring implements OnInit {
  isLoading = false;
  isShow = false;

  items: MenuItem[] | undefined;
  home: MenuItem | undefined;

  reconciliationForm!: FormGroup;
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
    private router: Router,
    private stateService: ReconciliationMonitoringStateService
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    await this.loadStates();
    this.initBreadcrumb();
    this.initForm();
    this.restoreState();

    if (!this.stateService.getState()) { // Only fetch if no state was restored
      await this.fetchPage(this.currentPage, this.pageSize, true);
    }

    this.isLoading = false;
    this.cdr.markForCheck();
  }

  // Restore form from our state service
  private async restoreState(): Promise<void> {
    const savedState = this.stateService.getState();
    if (savedState) {
      this.records = savedState.records;
      this.totalRecords = savedState.totalRecords;
      this.currentPage = savedState.currentPage;
      this.pageSize = savedState.pageSize;
      this.isShow = savedState.isShow;
      this.isLoading = savedState.isLoading;
      this.countyList = savedState.countyList;
      this.payamList = savedState.payamList;
      this.bomaList = savedState.bomaList;

      // Enable dependent fields if they have data
      if (this.countyList.length > 0) this.reconciliationForm.get('county')?.enable();
      if (this.payamList.length > 0) this.reconciliationForm.get('payam')?.enable();
      if (this.bomaList.length > 0) this.reconciliationForm.get('boma')?.enable();

      this.reconciliationForm.patchValue(savedState.reconciliationFormValue);
      this.cdr.markForCheck();
    }
  }

  // Save current state to our state service
  private saveCurrentState(): void {
    this.stateService.saveState({
      reconciliationFormValue: this.reconciliationForm.value,
      records: this.records,
      totalRecords: this.totalRecords,
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      countyList: this.countyList,
      payamList: this.payamList,
      bomaList: this.bomaList,
      isShow: this.isShow,
      isLoading: this.isLoading,
    });
  }

  private initBreadcrumb(): void {
    this.home = {
      label: 'Dashboard',
      icon: 'fas fa-home me-2',
      routerLink: '/dashboard',
    };
    this.items = [
      { label: 'Reconciliation Monitoring', icon: 'fas fa-chart-line' },
    ];
  }

  private initForm(): void {
    this.reconciliationForm = this.fb.group({
      paymentCycleType: ['single'],
      paymentCycle: [null],
      multiplePaymentCycles: [[]],
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

  // Check for navigation state and restore form (DISABLED, USING STATE SERVICE INSTEAD)
  private async checkAndRestoreState(): Promise<boolean> {
    return false; // Always return false as we are now using the state service
  }

  // Load counties when state is selected
  async onStateChange(state: any): Promise<void> {
    this.reconciliationForm
      .get('county')
      ?.reset({ value: null, disabled: true });
    this.reconciliationForm
      .get('payam')
      ?.reset({ value: null, disabled: true });
    this.reconciliationForm.get('boma')?.reset({ value: null, disabled: true });
    this.countyList = [];
    this.payamList = [];
    this.bomaList = [];

    if (state?.id) {
      try {
        this.countyList = await this.lookupService.getCountyListByStateId(
          String(state.id)
        );
        this.reconciliationForm.get('county')?.enable();
      } catch (error) {
        console.error('Error loading counties:', error);
      }
    }
    this.cdr.markForCheck();
  }

  // Load payams when county is selected
  async onCountyChange(county: any): Promise<void> {
    this.reconciliationForm
      .get('payam')
      ?.reset({ value: null, disabled: true });
    this.reconciliationForm.get('boma')?.reset({ value: null, disabled: true });
    this.payamList = [];
    this.bomaList = [];

    if (county?.id) {
      try {
        this.payamList = await this.lookupService.getPayamListByCountyId(
          String(county.id)
        );
        this.reconciliationForm.get('payam')?.enable();
      } catch (error) {
        console.error('Error loading payams:', error);
      }
    }
    this.cdr.markForCheck();
  }

  // Load bomas when payam is selected
  async onPayamChange(payam: any): Promise<void> {
    this.reconciliationForm.get('boma')?.reset({ value: null, disabled: true });
    this.bomaList = [];

    if (payam?.id) {
      try {
        this.bomaList = await this.lookupService.getBomaListByPayamId(
          String(payam.id)
        );
        this.reconciliationForm.get('boma')?.enable();
      } catch (error) {
        console.error('Error loading bomas:', error);
      }
    }
    this.cdr.markForCheck();
  }

  // Build request body
  private buildRequestBody(): any {
    const formValues = this.reconciliationForm.value;
    const paymentCycleType = formValues.paymentCycleType;
    let paymentCycles: number[] = [];

    if (paymentCycleType === 'single') {
      if (formValues.paymentCycle) {
        paymentCycles.push(formValues.paymentCycle.value);
      }
    } else {
      paymentCycles = formValues.multiplePaymentCycles || [];
    }

    return {
      state: formValues.state ? Number(formValues.state.id) : null,
      county: formValues.county ? Number(formValues.county.id) : null,
      payam: formValues.payam ? Number(formValues.payam.id) : null,
      boma: formValues.boma ? Number(formValues.boma.id) : null,
      paymentCycles: paymentCycles.length > 0 ? paymentCycles : [],
    };
  }

  // Fetch data from API
  fetchPage(page: number, size: number, isInitialLoad: boolean = false): Promise<void> {
    this.isShow = false;
    this.cdr.markForCheck();

    const body = isInitialLoad
      ? {
          state: null,
          county: null,
          payam: null,
          boma: null,
          paymentCycles: [],
        }
      : this.buildRequestBody();

    return new Promise((resolve, reject) => {
      this.apiService
        .POST(`api/payroll/recon/monitoring/geo?page=${page}&size=${size}`, body)
        .then((res: any) => {
          console.log('API Response:', res);
          if (!res) throw new Error('Empty response');

          const data = res.data;
          console.log('Data code:', data.code, 'Records length:', data.data?.length);

          if (data.code === 200) {
            this.records = data.data || [];
            this.totalRecords = data.metadata?.totalElements || 0;
            console.log('Records set to:', this.records.length);

            if (this.records.length === 0 && !isInitialLoad) {
              this.messageService.add({
                severity: 'info',
                summary: 'Search',
                detail: 'No records found',
              });
            }
          } else {
            console.warn('Unexpected status code:', data.code);
            this.records = [];
            this.totalRecords = 0;
          }

          resolve();
        })
        .catch((err) => {
          console.error('Error loading reconciliation data:', err);
          this.records = [];
          this.totalRecords = 0;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch reconciliation data',
          });
          reject(err);
        })
        .finally(() => {
          this.isShow = true;
          this.isLoading = false; // Ensure loading is false even on error
          this.saveCurrentState(); // Save state after fetch completes
          this.cdr.detectChanges();
        });
    });
  }

  // Pagination handler
  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  // Search button handler
  searchReconciliation(): void {
    this.currentPage = 0;
    this.saveCurrentState(); // Save current form state before search
    this.fetchPage(this.currentPage, this.pageSize);
  }

  // Reset button handler
  resetReconciliation(): void {
    this.reconciliationForm.reset({
      paymentCycleType: 'single',
      paymentCycle: null,
      multiplePaymentCycles: [],
      state: null,
      county: null,
      payam: null,
      boma: null
    });
    this.stateService.clearState(); // Clear state when resetting form
    this.reconciliationForm.get('county')?.disable();
    this.reconciliationForm.get('payam')?.disable();
    this.reconciliationForm.get('boma')?.disable();

    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize, true);
  }

  // View details - now uses IDs from response
  async viewDetails(record: any): Promise<void> {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      this.saveCurrentState(); // Save current state before navigating away
      const payload = {
        state: record.stateId || 0,
        county: record.countyId || 0,
        payam: record.payamId || 0,
        boma: record.bomaId || 0,
        paymentCycles: [record.paymentCycle],
      };
      const navResult = await this.router.navigate(
        ['/reconciliation-monitoring/details'],
        { state: payload }
      );
      if (!navResult) {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    } catch (err) {
      console.error('Error preparing view details:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Could not load details for the selected record.',
      });
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }
 formatDateTime(dateString: string | null): string {

  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);


  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  return new Intl.DateTimeFormat(undefined, options).format(date);
}
  onPaymentCycleTypeChange(type: string): void {
    this.reconciliationForm.get('paymentCycle')?.reset(null);
    this.reconciliationForm.get('multiplePaymentCycles')?.reset([]);
    this.cdr.markForCheck();
  }

  get selectedPaymentCycleNames(): string[] {
    const selectedIds: number[] = this.reconciliationForm.get('multiplePaymentCycles')?.value ?? [];
    if (selectedIds.length === 0) {
      return [];
    }
    return this.paymentCycleOptions
      .filter((cycle) => selectedIds.includes(cycle.value))
      .map((cycle) => cycle.label);
  }

  // Helper method for tracking rows
  trackById = (_: number, record: any) =>
    `${record.stateId}_${record.countyId}_${record.payamId}_${record.bomaId}_${record.paymentCycle}`;

}
