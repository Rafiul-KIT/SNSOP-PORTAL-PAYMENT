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

    // Load ALL lookup data upfront
    await this.loadInitialLookups();

    this.initBreadcrumb();
    this.initForm();

    // Check for navigation state and restore if available
    await this.checkAndRestoreState();

    // Load reconciliation data
    await this.loadReconciliationData(true);

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
      paymentCycle: [null, Validators.required],
      state: [null],
      county: [{ value: null, disabled: true }],
      payam: [{ value: null, disabled: true }],
      boma: [{ value: null, disabled: true }],
    });
  }

  // Load all lookup data upfront
  private async loadInitialLookups(): Promise<void> {
    try {
      await Promise.all([
        this.lookupService.getOrFetchStateList(),
        this.lookupService.fetchAllCountyList(),
        this.lookupService.fetchAllPayamList(),
        this.lookupService.fetchAllBomaList(),
      ]);

      this.states = this.lookupService.getStateList();
      this.allCounties = this.lookupService.getAllCountyList();
      this.allPayams = this.lookupService.getAllPayamList();
      this.allBomas = this.lookupService.getAllBomaList();

      // Build lookup maps for reverse lookup (ID to name)
      this.states.forEach((s) => this.stateMap.set(Number(s.id), s.name));
      this.allCounties.forEach((c) => this.countyMap.set(Number(c.id), c.name));
      this.allPayams.forEach((p) => this.payamMap.set(Number(p.id), p.name));
      this.allBomas.forEach((b) => this.bomaMap.set(Number(b.id), b.name));

      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading initial lookups:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load lookup data.',
      });
    }
  }

  // Check for navigation state and restore form
  private async checkAndRestoreState(): Promise<void> {
    const navigation = this.router.getCurrentNavigation();
    const navigationState = navigation?.extras?.state || history.state;

    // Check if we have valid state data
    if (
      navigationState &&
      Object.keys(navigationState).length > 0 &&
      navigationState.state !== undefined
    ) {
      await this.restoreFormFromState(navigationState);
    }
  }

  // Restore form from navigation state
  private async restoreFormFromState(state: any): Promise<void> {
    try {
      // Restore state
      if (state.state) {
        const stateObj = this.states.find((s) => Number(s.id) === state.state);
        if (stateObj) {
          this.reconciliationForm.patchValue({ state: stateObj });
          // Load counties for this state
          this.countyList = this.allCounties.filter(
            (c: any) => Number(c.stateId) === Number(stateObj.id)
          );
          this.reconciliationForm.get('county')?.enable();
        }
      }

      // Restore county
      if (state.county && this.countyList.length > 0) {
        const countyObj = this.countyList.find(
          (c) => Number(c.id) === state.county
        );
        if (countyObj) {
          this.reconciliationForm.patchValue({ county: countyObj });
          // Load payams for this county
          this.payamList = this.allPayams.filter(
            (p: any) => Number(p.countyId) === Number(countyObj.id)
          );
          this.reconciliationForm.get('payam')?.enable();
        }
      }

      // Restore payam
      if (state.payam && this.payamList.length > 0) {
        const payamObj = this.payamList.find((p) => Number(p.id) === state.payam);
        if (payamObj) {
          this.reconciliationForm.patchValue({ payam: payamObj });
          // Load bomas for this payam
          this.bomaList = this.allBomas.filter(
            (b: any) => Number(b.payamId) === Number(payamObj.id)
          );
          this.reconciliationForm.get('boma')?.enable();
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

      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error restoring form state:', error);
    }
  }

  // Simplified change handlers - filter from already loaded data
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
      // Filter from already loaded data
      this.countyList = this.allCounties.filter(
        (c: any) => Number(c.stateId) === Number(state.id)
      );
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
      // Filter from already loaded data
      this.payamList = this.allPayams.filter(
        (p: any) => Number(p.countyId) === Number(county.id)
      );
      this.reconciliationForm.get('payam')?.enable();
    }
    this.cdr.markForCheck();
  }

  async onPayamChange(payam: any): Promise<void> {
    this.reconciliationForm.get('boma')?.reset({ value: null, disabled: true });
    this.bomaList = [];

    if (payam?.id) {
      // Filter from already loaded data
      this.bomaList = this.allBomas.filter(
        (b: any) => Number(b.payamId) === Number(payam.id)
      );
      this.reconciliationForm.get('boma')?.enable();
    }
    this.cdr.markForCheck();
  }

  loadReconciliationData(isInitialLoad: boolean = false): Promise<void> {
    if (!isInitialLoad && this.reconciliationForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill in all required fields.',
      });
      return Promise.resolve();
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    const formValues = this.reconciliationForm.value;
    const paymentCycleType = formValues.paymentCycleType;
    let paymentCycles: number[] = [];

    if (paymentCycleType === 'single') {
      if (formValues.paymentCycle) {
        paymentCycles.push(formValues.paymentCycle.value);
      }
    } else {
      paymentCycles = this.selectedPaymentCycles;
    }

    const payload = {
      state: formValues.state ? Number(formValues.state.id) : 0,
      county: formValues.county ? Number(formValues.county.id) : 0,
      payam: formValues.payam ? Number(formValues.payam.id) : 0,
      boma: formValues.boma ? Number(formValues.boma.id) : 0,
      paymentCycles: paymentCycles,
    };

    return new Promise((resolve, reject) => {
      this.apiService
        .POST('api/payroll/recon/monitoring/geo', payload)
        .then((res: any) => {
          if (res.status === 200) {
            this.records = res.data.data;
          } else {
            this.records = [];
          }
          this.isLoading = false;
          this.cdr.markForCheck();
          resolve();
        })
        .catch((err) => {
          console.error(
            'Error loading reconciliation data:',
            err.response?.data || err.message
          );
          this.records = [];
          this.isLoading = false;
          this.cdr.markForCheck();
          reject(err);
        });
    });
  }

  // Simplified - now uses data already in memory
  private getGeoIds(record: any): {
    stateId: number;
    countyId: number;
    payamId: number;
    bomaId: number;
  } {
    const stateId =
      Number(this.states.find((s) => s.name === record.state)?.id) || 0;
    const countyId =
      Number(this.allCounties.find((c) => c.name === record.county)?.id) || 0;
    const payamId =
      Number(this.allPayams.find((p) => p.name === record.payam)?.id) || 0;
    const bomaId =
      Number(this.allBomas.find((b) => b.name === record.boma)?.id) || 0;

    return { stateId, countyId, payamId, bomaId };
  }

  async viewDetails(record: any): Promise<void> {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      const { stateId, countyId, payamId, bomaId } = this.getGeoIds(record);
      const payload = {
        state: stateId,
        county: countyId,
        payam: payamId,
        boma: bomaId,
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
    if (type === 'single') {
      this.reconciliationForm
        .get('paymentCycle')
        ?.setValidators(Validators.required);
    } else {
      this.reconciliationForm.get('paymentCycle')?.clearValidators();
    }
    this.reconciliationForm.get('paymentCycle')?.updateValueAndValidity();
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