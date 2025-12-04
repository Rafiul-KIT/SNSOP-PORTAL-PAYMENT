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
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';

import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { LookupItem, LookupItemPayroll, LookupService, ProjectNameDescription, ScreeningStatusEnum, StatusEnum, TypeOfMeetingEnum } from '../../../services/lookup.service';
import { ApiService } from '../../../services/api.service';
import { Loader } from "../../../components/loader/loader";


interface PayrollItemDto {
  intWagePaymentReqid: number;
  reqFromDate: string;
  reqToDate: string;
  exchangerateattime: number;
  wageRateUSD: number;
  reqNo: string;
  intWagesReqBenTransid: number;
  intBenid: number;
  enrollmentNo: string;
  intWorkid: number;
  workCode: string;
  totAttendance: number;
  wageRateUSDTotal: number;
  dateofCreation: string;
  status: string;
  paymentCycle: string;
  wageRateSSPTotal: number;
  supportType: string;
  houseHoldDetail: {
    houseHoldNumber: string;
    firstName: string;
    middleName: string;
    lastName: string;
    nickName: string;
    age: number;
    gender: number;
    phoneNumber: string;
    biometric: {
      photo: string;
      leftSmall: string;
      leftRing: string;
      leftMiddle: string;
      leftIndex: string;
      leftThumb: string;
      rightSmall: string;
      rightRing: string;
      rightMiddle: string;
      rightIndex: string;
      rightThumb: string;
    };
  };
  alternates: {
    id: number;
    altIndex: number;
    firstName: string;
    middleName: string;
    lastName: string;
    nickName: string;
    age: number;
    gender: number;
    phoneNumber: string;
    nationalId: string;
    biometric: {
      photo: string;
      leftSmall: string;
      leftRing: string;
      leftMiddle: string;
      leftIndex: string;
      leftThumb: string;
      rightSmall: string;
      rightRing: string;
      rightMiddle: string;
      rightIndex: string;
      rightThumb: string;
    };
  }[];
}

@Component({
  selector: 'app-payroll-download',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    PaginatorModule,
    BreadcrumbModule,
    FloatLabelModule,
    InputTextModule,
    SelectModule,
    RouterModule,
    TooltipModule,
    Loader
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payroll-download.html',
  styleUrl: './payroll-download.scss'
})
export class PayrollDownload implements OnInit {
  isLoading = true;
  lookupsLoaded = false;
  searchForm!: FormGroup;

  // geo lookup lists
  states: LookupItem[] = [];
  counties: LookupItem[] = [];
  payams: LookupItem[] = [];
  bomas: LookupItem[] = [];

  payrollData: PayrollItemDto[] = [];
  private fullPayrollData: PayrollItemDto[] = [];
  totalRecords = 0;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  currentPage = 0; // 0-based
  pageSize = 10;
  supportTypeOptions: LookupItem[] = [];
  paymentCycleOptions: LookupItemPayroll[] = [];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef
  ) { }

  private async loadInitialLookups() {
    await Promise.all([
      this.lookup.getOrFetchStateList(),
    ]);

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
    this.fetchPage();
  }

  initForm() {
    this.searchForm = this.fb.group({
      payrollType: ['single'],
      state: [null],
      county: [{ value: null, disabled: true }],
      payam: [{ value: null, disabled: true }],
      boma: [{ value: null, disabled: true }],
      supportType: [''],
      paymentCycle: [''],
      paymentCycles: this.fb.array(this.paymentCycleOptions.map(c => this.fb.group({
        id: c.id,
        name: c.name,
        selected: false
      })))
    });

    this.searchForm.get('payrollType')?.valueChanges.subscribe(value => {
      if (value === 'single') {
        this.searchForm.get('paymentCycle')?.enable();
        this.searchForm.get('paymentCycles')?.disable();
        this.paymentCycles.controls.forEach(control => control.get('selected')?.setValue(false, { emitEvent: false }));
      } else { // combined
        this.searchForm.get('paymentCycle')?.disable();
        this.searchForm.get('paymentCycle')?.reset('');
        this.searchForm.get('paymentCycles')?.enable();
      }
      this.cdr.markForCheck();
    });

    this.searchForm.get('paymentCycles')?.disable();
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Payroll Download' }];
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



  async fetchPage() {
    this.isLoading = true;
    this.cdr.markForCheck();

    const formValues = this.searchForm.value;
    const payload = {
      state: formValues.state?.id ?? 0,
      county: formValues.county?.id ?? 0,
      payam: formValues.payam?.id ?? 0,
      boma: formValues.boma?.id ?? 0,
      supportType: formValues.supportType,
      paymentCycle: formValues.paymentCycle
    };

    try {
      const response = await this.api.POST('api/payroll/getPayroll', payload);
      if (response.data.operationResult) {
        this.fullPayrollData = response.data.data.payrollData;
        this.totalRecords = response.data.totalCount;
        this.updateDisplayedData();
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: response.data.errorMsg,
        });
        this.fullPayrollData = [];
        this.payrollData = [];
        this.totalRecords = 0;
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while fetching payroll data.',
      });
      this.fullPayrollData = [];
      this.payrollData = [];
      this.totalRecords = 0;
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  updateDisplayedData() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.payrollData = this.fullPayrollData.slice(startIndex, endIndex);
    this.cdr.markForCheck();
  }



  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.updateDisplayedData();
  }


  searchPayroll() {
    this.currentPage = 0;
    this.fetchPage();
  }

  resetForm() {
    this.searchForm.reset({
      payrollType: 'single',
      state: null,
      county: { value: null, disabled: true },
      payam: { value: null, disabled: true },
      boma: { value: null, disabled: true },
      supportType: '',
      paymentCycle: '',
    });

    this.paymentCycles.controls.forEach(control => control.get('selected')?.setValue(false));
    this.searchForm.get('paymentCycles')?.disable();


    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.currentPage = 0;
    this.fetchPage();
    this.cdr.markForCheck();
  }

  get paymentCycles() {
    return this.searchForm.get('paymentCycles') as FormArray;
  }


  onDownloadPDFClick() {
    throw new Error('Method not implemented.');
  }
  onDownloadClick() {
    throw new Error('Method not implemented.');
  }

}
