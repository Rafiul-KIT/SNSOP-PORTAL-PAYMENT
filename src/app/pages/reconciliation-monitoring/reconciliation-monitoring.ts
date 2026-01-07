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
  Validators,
} from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { MessageService } from 'primeng/api';

import {
  LookupService,
  PaymentCycleEnum,
  LookupItem,
} from '../../services/lookup.service';
import { Loader } from '../../components/loader/loader';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Tooltip } from "primeng/tooltip";
import { Paginator } from "primeng/paginator";

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
    Paginator
],
  templateUrl: './reconciliation-monitoring.html',
  styleUrl: './reconciliation-monitoring.scss',
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReconciliationMonitoring implements OnInit {
  isLoading = false;
  isDataLoading = false;

  items: MenuItem[] | undefined;
  home: MenuItem | undefined;

  reconciliationForm!: FormGroup;
  records: any[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  // All lookup data loaded upfront
  states: LookupItem[] = [];
  allCounties: LookupItem[] = [];
  allPayams: LookupItem[] = [];
  allBomas: LookupItem[] = [];

  // Filtered lists for dropdowns
  countyList: LookupItem[] = [];
  payamList: LookupItem[] = [];
  bomaList: LookupItem[] = [];

  paymentCycleOptions = PaymentCycleEnum;
  selectedPaymentCycles: number[] = [];

  // Lookup maps for reverse lookup (name to ID and ID to name)
  stateMap: Map<number, string> = new Map();
  countyMap: Map<number, string> = new Map();
  payamMap: Map<number, string> = new Map();
  bomaMap: Map<number, string> = new Map();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public lookupService: LookupService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    // Load states first
    await this.loadStates();

    this.initBreadcrumb();
    this.initForm();

    // Check for navigation state and restore if available
    const hasNavigationState = await this.checkAndRestoreState();

    // If no navigation state, load data with empty payload
    if (!hasNavigationState) {
      await this.loadReconciliationData(0, true);
    }

    this.isLoading = false;
    this.cdr.markForCheck();
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
      paymentCycleType: ['single'], // 'single' or 'multiple'
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
      this.states.forEach((s) => this.stateMap.set(Number(s.id), s.name));
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

  // Check for navigation state and restore form
  private async checkAndRestoreState(): Promise<boolean> {
    const navigation = this.router.getCurrentNavigation();
    const navigationState = navigation?.extras?.state || history.state;

    // Check if we have valid state data
    if (
      navigationState &&
      Object.keys(navigationState).length > 0 &&
      navigationState.state !== undefined
    ) {
      await this.restoreFormFromState(navigationState);
      return true;
    }
    return false;
  }

  // Restore form from navigation state
  private async restoreFormFromState(state: any): Promise<void> {
    try {
      // Restore state
      if (state.state) {
        const stateObj = this.states.find((s) => Number(s.id) === state.state);
        if (stateObj) {
          this.reconciliationForm.patchValue({ state: stateObj });
          await this.onStateChange(stateObj);
        }
      }

      // Restore county
      if (state.county && this.countyList.length > 0) {
        const countyObj = this.countyList.find(
          (c) => Number(c.id) === state.county
        );
        if (countyObj) {
          this.reconciliationForm.patchValue({ county: countyObj });
          await this.onCountyChange(countyObj);
        }
      }

      // Restore payam
      if (state.payam && this.payamList.length > 0) {
        const payamObj = this.payamList.find((p) => Number(p.id) === state.payam);
        if (payamObj) {
          this.reconciliationForm.patchValue({ payam: payamObj });
          await this.onPayamChange(payamObj);
        }
      }

      // Restore boma
      if (state.boma && this.bomaList.length > 0) {
        const bomaObj = this.bomaList.find((b) => Number(b.id) === state.boma);
        if (bomaObj) {
          this.reconciliationForm.patchValue({ boma: bomaObj });
        }
      }

      // Restore payment cycles
      if (state.paymentCycles && state.paymentCycles.length > 0) {
        if (state.paymentCycles.length === 1) {
          const cycleOption = this.paymentCycleOptions.find(
            (opt: any) => opt.value === state.paymentCycles[0]
          );
          if (cycleOption) {
            this.reconciliationForm.patchValue({
              paymentCycleType: 'single',
              paymentCycle: cycleOption,
            });
          }
        } else {
          this.reconciliationForm.patchValue({ paymentCycleType: 'multiple' });
          this.selectedPaymentCycles = state.paymentCycles;
        }
      }

      // Load data after restoring form
      await this.loadReconciliationData();

      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error restoring form state:', error);
    }
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
      this.countyList = await this.lookupService.getCountyListByStateId(
        String(state.id)
      );
      this.countyList.forEach((c) => this.countyMap.set(Number(c.id), c.name));
      this.reconciliationForm.get('county')?.enable();
    }
    this.cdr.markForCheck();
  }

  async onCountyChange(county: any): Promise<void> {
    this.reconciliationForm
      .get('payam')
      ?.reset({ value: null, disabled: true });
    this.reconciliationForm.get('boma')?.reset({ value: null, disabled: true });
    this.payamList = [];
    this.bomaList = [];

    if (county?.id) {
      this.payamList = await this.lookupService.getPayamListByCountyId(
        String(county.id)
      );
      this.payamList.forEach((p) => this.payamMap.set(Number(p.id), p.name));
      this.reconciliationForm.get('payam')?.enable();
    }
    this.cdr.markForCheck();
  }

  async onPayamChange(payam: any): Promise<void> {
    this.reconciliationForm.get('boma')?.reset({ value: null, disabled: true });
    this.bomaList = [];

    if (payam?.id) {
      this.bomaList = await this.lookupService.getBomaListByPayamId(
        String(payam.id)
      );
      this.bomaList.forEach((b) => this.bomaMap.set(Number(b.id), b.name));
      this.reconciliationForm.get('boma')?.enable();
    }
    this.cdr.markForCheck();
  }

      loadReconciliationData(page: number = 0, isInitialLoad: boolean = false): Promise<void> {
        const formValues = this.reconciliationForm.value;
    
        // Check if at least state is selected (skip validation for initial load)
        if (!isInitialLoad && !formValues.state) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Validation',
            detail: 'Please select at least a state.',
          });
          return Promise.resolve();
        }
    
        this.isDataLoading = true;
        this.currentPage = page;
        this.cdr.markForCheck();
    
        const paymentCycleType = formValues.paymentCycleType;
        let paymentCycles: number[] = [];
    
        if (paymentCycleType === 'single' && formValues.paymentCycle) {
          paymentCycles.push(formValues.paymentCycle.value);
        } else if (paymentCycleType === 'multiple') {
          paymentCycles = this.selectedPaymentCycles;
        }
    
        // Build payload with only selected values
        const payload: any = {};
    
        // Only add filters if not initial load
        if (!isInitialLoad) {
          if (formValues.state) {
            payload.state = Number(formValues.state.id);
          }
          if (formValues.county) {
            payload.county = Number(formValues.county.id);
          }
          if (formValues.payam) {
            payload.payam = Number(formValues.payam.id);
          }
          if (formValues.boma) {
            payload.boma = Number(formValues.boma.id);
          }
          if (paymentCycles.length > 0) {
            payload.paymentCycles = paymentCycles;
          }
        }
    
        return new Promise((resolve, reject) => {
          this.apiService
            .POST(
              `api/payroll/recon/monitoring/geo?page=${page}&size=${this.pageSize}`,
              payload
            )
            .then((res: any) => {
              if (res.data.statusCode === 200) {
                this.records = res.data.data || [];
                this.totalRecords = res.data.metadata.totalElements || this.records.length;
              } else {
                this.records = [];
                this.totalRecords = 0;
              }
              this.isDataLoading = false;
              this.cdr.markForCheck();
              resolve();
            })
            .catch((err) => {
              console.error(
                'Error loading reconciliation data:',
                err.response?.data || err.message
              );
              this.records = [];
              this.totalRecords = 0;
              this.isDataLoading = false;
              this.cdr.markForCheck();
              reject(err);
            });
        });
      }  onPageChange(event: any): void {
      this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadReconciliationData(event.page);
  }

  async viewDetails(record: any): Promise<void> {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      // Use IDs directly from the response
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

  onPaymentCycleTypeChange(type: string): void {
    this.selectedPaymentCycles = [];
    this.reconciliationForm.get('paymentCycle')?.reset(null);
    this.cdr.markForCheck();
  }

  onMultiplePaymentCycleChange(cycle: number, event: any): void {
    if (event.checked) {
      this.selectedPaymentCycles.push(cycle);
    } else {
      this.selectedPaymentCycles = this.selectedPaymentCycles.filter(
        (c) => c !== cycle
      );
    }
    this.cdr.markForCheck();
  }

  // Helper methods for display names (if needed in template)
  getStateName(stateId: number): string {
    return this.stateMap.get(stateId) || stateId.toString();
  }

  getCountyName(countyId: number): string {
    return this.countyMap.get(countyId) || countyId.toString();
  }

  getPayamName(payamId: number): string {
    return this.payamMap.get(payamId) || payamId.toString();
  }

  getBomaName(bomaId: number): string {
    return this.bomaMap.get(bomaId) || bomaId.toString();
  }
}