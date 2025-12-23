import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {
  LookupItem,
  LookupItemPayroll,
  LookupService,
} from '../../../services/lookup.service';
import { ApiService } from '../../../services/api.service';
import { Loader } from '../../../components/loader/loader';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';

interface PayrollGenerationResponse {
  id: number;
  applicationId: string;
  requestId: string;
  requestDate: string;
  updatedBy: number;
  requestData: string;
  errorReason: string;
  status: 'FAILED' | 'SUCCESS' | 'PENDING' | 'PROCESSING';
  operationType: 'RECONCILIATION' | 'GENERATION';
}

@Component({
  selector: 'app-payroll-generation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    BreadcrumbModule,
    FloatLabelModule,
    InputTextModule,
    SelectModule,
    RouterModule,
    CardModule,
    Loader,
    RadioButtonModule,
    CheckboxModule,
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './generate-payroll.html',
  styleUrl: './generate-payroll.scss',
})
export class GeneratePayroll implements OnInit {
  isLoading = true;
  isGenerating = false;
  searchForm!: FormGroup;

  // geo lookup lists
  states: LookupItem[] = [];
  counties: LookupItem[] = [];
  payams: LookupItem[] = [];
  bomas: LookupItem[] = [];

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  supportTypeOptions: LookupItem[] = [];
  paymentCycleOptions: LookupItemPayroll[] = [];
  paymentTypeOptions: LookupItem[] = [
     { id: 'cash', name: 'Cash' },
    { id: 'mobileMoney', name: 'Mobile Money' }
   
  ];

  // Generation status
  generationStatus: string = '';
  lastGenerationResult: PayrollGenerationResponse | null = null;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef
  ) {}

  private async loadInitialLookups() {
    await Promise.all([this.lookup.getOrFetchStateList()]);

    this.states = this.lookup.getStateList();
    this.supportTypeOptions = this.lookup.getSupportTypeList();
    this.paymentCycleOptions = this.lookup.getPaymentCycleList();
    this.cdr.markForCheck();
  }

  async ngOnInit() {
    this.isLoading = true;
    this.initBreadcrumb();
    await this.loadInitialLookups();
    this.initForm();
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  initForm() {
    this.searchForm = this.fb.group({
      state: [null],
      county: [{ value: null, disabled: true }],
      payam: [{ value: null, disabled: true }],
      boma: [{ value: null, disabled: true }],
      supportType: [''],
      payrollType: ['single'],
      paymentCycle: [null],
      paymentType: ['cash'],
      paymentCycles: this.fb.array(
        this.paymentCycleOptions.map((c) =>
          this.fb.group({
            id: c.id,
            name: c.name,
            selected: false,
          })
        )
      ),
    });
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Payroll Generation' }];
  }

  // ---------- dependent dropdowns ----------
  async onStateChange(state: LookupItem | null) {
    this.searchForm.get('county')?.reset({ value: null, disabled: true });
    this.searchForm.get('payam')?.reset({ value: null, disabled: true });
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.counties = [];
    this.payams = [];
    this.bomas = [];

    if (state?.id) {
      this.counties = await this.lookup.getCountyListByStateId(state.id);
      this.searchForm.get('county')?.enable();
    }
    this.cdr.markForCheck();
  }

  async onCountyChange(county: LookupItem | null) {
    this.searchForm.get('payam')?.reset({ value: null, disabled: true });
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.payams = [];
    this.bomas = [];

    if (county?.id) {
      this.payams = await this.lookup.getPayamListByCountyId(county.id);
      this.searchForm.get('payam')?.enable();
    }
    this.cdr.markForCheck();
  }

  async onPayamChange(payam: LookupItem | null) {
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.bomas = [];

    if (payam?.id) {
      this.bomas = await this.lookup.getBomaListByPayamId(payam.id);
      this.searchForm.get('boma')?.enable();
    }
    this.cdr.markForCheck();
  }

  get paymentCycles() {
    return this.searchForm.get('paymentCycles') as FormArray;
  }

  getSelectedPaymentCycles(): number[] {
    return this.paymentCycles.controls
      .filter((control) => control.get('selected')?.value)
      .map((control) => control.get('id')?.value);
  }

  get isGenerateDisabled(): boolean {
    if (this.isGenerating) {
      return true;
    }
    if (!this.searchForm) {
      return true;
    }

    const values = this.searchForm.getRawValue();
    if (!values.state || !values.county || !values.payam || !values.boma || !values.supportType) {
      return true;
    }
    // if(!values.paymentType) {
    //   return true;
    // }

    if (values.payrollType === 'single') {
      if (!values.paymentCycle) {
        return true;
      }
    } else { // combined
      if (this.getSelectedPaymentCycles().length === 0) {
        return true;
      }
    }

    return false;
  }

  async generatePayroll() {
    const formValues = this.searchForm.value;
    let selectedCycles: number[] = [];

    if (formValues.payrollType === 'single') {
      if (formValues.paymentCycle) {
        selectedCycles = [formValues.paymentCycle];
      }
    } else {
      selectedCycles = this.getSelectedPaymentCycles();
    }

    if (selectedCycles.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select at least one payment cycle.',
      });
      return;
    }

    this.confirmationService.confirm({
      message:
        'Are you sure you want to generate payroll with the selected criteria?',
      header: 'Confirm Payroll Generation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        await this.executePayrollGeneration(selectedCycles);
      },
    });
  }

  private async executePayrollGeneration(selectedCycles: number[]) {
    this.isGenerating = true;
    this.generationStatus = 'Generating payroll...';
    this.cdr.markForCheck();

    const formValues = this.searchForm.value;
    const requestId = `PAYROLL_GEN_${Date.now()}`;

    const payload = {
      state: formValues.state?.id ?? 0,
      county: formValues.county?.id ?? 0,
      payam: formValues.payam?.id ?? 0,
      boma: formValues.boma?.id ?? 0,
      supportType: formValues.supportType || 'LIPW',
      paymentCycles: selectedCycles,
      isCombined: formValues.payrollType === 'combined',
      requestId: requestId,
    };

    try {
      const response = await this.api.POST('api/payroll/getPayroll', payload);

      this.lastGenerationResult = response.data;

      if (
        response.data.status === 'SUCCESS' ||
        response.data.status === 'PENDING'
      ) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Payroll generation initiated successfully. Request ID: ${response.data.requestId}`,
          life: 5000,
        });
        this.generationStatus = `Payroll generation successful. Status: ${response.data.status}`;
      } else if (response.data.status === 'FAILED') {
        this.messageService.add({
          severity: 'error',
          summary: 'Generation Failed',
          detail: response.data.errorReason || 'Payroll generation failed.',
          life: 5000,
        });
        this.generationStatus = `Generation failed: ${
          response.data.errorReason || 'Unknown error'
        }`;
      } else {
        this.generationStatus = `Status: ${response.data.status}`;
      }
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error?.message || 'An error occurred while generating payroll.',
        life: 5000,
      });
      this.generationStatus = 'Error occurred during generation.';
    } finally {
      this.isGenerating = false;
      this.cdr.markForCheck();
    }
  }

  resetForm() {
    this.searchForm.reset({
      state: null,
      county: { value: null, disabled: true },
      payam: { value: null, disabled: true },
      boma: { value: null, disabled: true },
      supportType: '',
      payrollType: 'single',
      paymentCycle: null,
      paymentType: 'mobileMoney',
    });

    this.paymentCycles.controls.forEach((control) =>
      control.get('selected')?.setValue(false)
    );

    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.generationStatus = '';
    this.lastGenerationResult = null;
    this.cdr.markForCheck();
  }
}