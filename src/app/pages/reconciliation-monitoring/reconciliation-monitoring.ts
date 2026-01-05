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

  states: LookupItem[] = [];
  countyList: any[] = [];
  payamList: any[] = [];
  bomaList: any[] = [];
  paymentCycleOptions = PaymentCycleEnum;
  selectedPaymentCycles: number[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public lookupService: LookupService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.home = {
      label: 'Dashboard',
      icon: 'fas fa-home me-2',
      routerLink: '/admin/dashboard',
    };
    this.items = [
      { label: 'Reconciliation Monitoring', icon: 'fas fa-chart-line' },
    ];

    this.reconciliationForm = this.fb.group({
      paymentCycleType: ['single'], // 'single' or 'multiple'
      paymentCycle: [null, Validators.required],
     
      
      state: [null],
      county: [{ value: null, disabled: true }],
      payam: [{ value: null, disabled: true }],
      boma: [{ value: null, disabled: true }],
    });

    this.states = this.lookupService.getStateList();
    this.loadReconciliationData(true);
  }

  async onStateChange(state: any) {
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
        state.id
      );
      this.reconciliationForm.get('county')?.enable();
    }
    this.cdr.markForCheck();
  }

  async onCountyChange(county: any) {
    this.reconciliationForm
      .get('payam')
      ?.reset({ value: null, disabled: true });
    this.reconciliationForm.get('boma')?.reset({ value: null, disabled: true });
    this.payamList = [];
    this.bomaList = [];

    if (county?.id) {
      this.payamList = await this.lookupService.getPayamListByCountyId(
        county.id
      );
      this.reconciliationForm.get('payam')?.enable();
    }
    this.cdr.markForCheck();
  }

  async onPayamChange(payam: any) {
    this.reconciliationForm.get('boma')?.reset({ value: null, disabled: true });
    this.bomaList = [];

    if (payam?.id) {
      this.bomaList = await this.lookupService.getBomaListByPayamId(payam.id);
      this.reconciliationForm.get('boma')?.enable();
    }
    this.cdr.markForCheck();
  }

  loadReconciliationData(isInitialLoad: boolean = false): void {
    if (!isInitialLoad && this.reconciliationForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill in all required fields.',
      });
      return;
    }

    this.isLoading = true;

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
      state: formValues.state ? formValues.state.id : 0,
      county: formValues.county ? formValues.county.id : 0,
      payam: formValues.payam ? formValues.payam.id : 0,
      boma: formValues.boma ? formValues.boma.id : 0,
      paymentCycles: paymentCycles,
     
    };

    this.apiService
      .POST('api/payroll/recon/monitoring/geo', payload)
      .then((res: any) => {
        if (res.statusCode === 0 && res.data) {
          this.records = res.data;
        } else {
          this.records = [];
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      })
      .catch((err) => {
        console.error(
          'Error loading reconciliation data:',
          err.response?.data || err.message
        );
        this.records = [];
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  viewDetails(record: any) {
    const payload = {
      state: this.states.find(s => s.name === record.state)?.id || 0,
      county: this.countyList.find(c => c.name === record.county)?.id || 0,
      payam: this.payamList.find(p => p.name === record.payam)?.id || 0,
      boma: this.bomaList.find(b => b.name === record.boma)?.id || 0,
      paymentCycles: [record.paymentCycle]
    };
    this.router.navigate(['/reconciliation-monitoring/details'], { state: payload });
  }

  onPaymentCycleTypeChange(type: string) {
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

  onMultiplePaymentCycleChange(cycle: number, event: any) {
    if (event.checked) {
      this.selectedPaymentCycles.push(cycle);
    } else {
      this.selectedPaymentCycles = this.selectedPaymentCycles.filter(
        (c) => c !== cycle
      );
    }
    this.cdr.markForCheck();
  }
}
