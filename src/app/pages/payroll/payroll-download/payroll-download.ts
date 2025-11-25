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
import { LookupItem, LookupService, ProjectNameDescription, ScreeningStatusEnum, StatusEnum, TypeOfMeetingEnum } from '../../../services/lookup.service';
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

  projects: ProjectNameDescription[] = [];
  workTypes: any[] = [];
  workActivities: LookupItem[] = [];

  statuses: any[] = [];
  screeningStatuses: any[] = [];

  payrollData: PayrollItemDto[] = [];
  totalRecords = 0;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  currentPage = 0; // 0-based
  pageSize = 10;
  supportTypeOptions: LookupItem[] = [];
  paymentCycleOptions: LookupItem[] = [];

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
    this.projects = this.lookup.projectNameDescriptionList;
    this.supportTypeOptions = this.lookup.getSupportTypeList();
    this.paymentCycleOptions = this.lookup.getPaymentCycleList();
    this.cdr.markForCheck();
  }

  async ngOnInit() {
    this.isLoading = true;
    this.workTypes = TypeOfMeetingEnum;
    this.statuses = StatusEnum;
    this.screeningStatuses = ScreeningStatusEnum;
    this.initBreadcrumb();
    await this.loadInitialLookups();
    this.initForm();
    this.isLoading = false;
    // this.fetchPage(this.currentPage, this.pageSize);
  }


  initForm() {
    this.searchForm = this.fb.group({
      payrollType: ['single'],
      projectId: [null],
      state: [null],
      county: [{ value: null, disabled: true }],
      projectName: [null],
      typeOfMeeting: [null],
      payam: [{ value: null, disabled: true }],
      boma: [{ value: null, disabled: true }],
      status: [''],
      workCode: [''],
      workActivity: [null],
      screeningStatus: [null],
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

  async fetchPage(currentPage: number, pageSize: number) {
    this.isLoading = true;
    this.cdr.markForCheck();

    const formValues = this.searchForm.value;

    let paymentCycleValue: string = '';
    const payrollType = formValues.payrollType;

    if (payrollType === 'single') {
      paymentCycleValue = formValues.paymentCycle || '';
    } else if (payrollType === 'combined') {
      const selectedCycles = this.paymentCycles.controls
        .filter(control => control.get('selected')?.value)
        .map(control => control.get('id')?.value);
      paymentCycleValue = selectedCycles.join(',');
    }

    const requestBody = {
      state: formValues.state?.id || 0,
      county: formValues.county?.id || 0,
      payam: formValues.payam?.id || 0,
      boma: formValues.boma?.id || 0,
      supportType: formValues.supportType || '',
      paymentCycle: paymentCycleValue,
      page: currentPage + 1, // API is 1-based, currentPage is 0-based
      pageSize: pageSize
    };

    try {
      const response: any = await this.api.POST('/api/payroll/getPayroll', requestBody);
      const responseData = response.data;

      if (responseData.operationResult) {
        this.payrollData = responseData.data.flatMap((item: any) => item.payrollData);
        this.totalRecords = responseData.totalCount;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Payroll data fetched successfully.' });
      } else {
        this.payrollData = [];
        this.totalRecords = 0;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: responseData.errorMsg || 'Failed to fetch payroll data.' });
      }
    } catch (error: any) {
      console.error('Error fetching payroll data:', error);
      this.payrollData = [];
      this.totalRecords = 0;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error.message || 'An unexpected error occurred.' });
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }


  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchPage(this.currentPage, this.pageSize);
  }


  searchPayroll() {
    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  resetForm() {
    // this.searchForm.reset();
    // this.searchForm.get('payrollType')?.setValue('single');
    // this.searchForm.get('county')?.disable();
    // this.searchForm.get('payam')?.disable();
    // this.searchForm.get('boma')?.disable();
    // this.counties = [];
    // this.payams = [];
    // this.bomas = [];
    // this.currentPage = 0;
    // this.fetchPage(this.currentPage, this.pageSize);
    this.ngOnInit();
    // this.cdr.markForCheck();
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
