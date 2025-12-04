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
  txnId: string;
  recipientFullName: string;
  accountNumber: string;
  phoneNumber: string;
  amount: number;
}

@Component({
  selector: 'app-payroll-mobile-money',
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
  templateUrl: './payroll-mobile-money.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './payroll-mobile-money.scss'
})
export class PayrollMobileMoney implements OnInit {
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
  paymentCycleOptions: LookupItemPayroll[] = [];
  providerOptions: any[] = [];

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
    this.providerOptions = [
      { name: 'MOMO', id: 'MOMO' },
      { name: 'MGURUSH', id: 'MGURUSH' },
      { name: 'DIGICASH', id: 'DIGICASH' },
    ];
    this.initBreadcrumb();
    await this.loadInitialLookups();
    this.initForm();
    this.isLoading = false;
    this.cdr.markForCheck();
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
      provider: ['MOMO'],
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

    try {
      const formValue = this.searchForm.value;
      const payrollType = formValue.payrollType;
      
      let paymentCycleArray: number[] = [];
      
      if (payrollType === 'single') {
        // For single payroll, use the selected payment cycle
        if (formValue.paymentCycle) {
          paymentCycleArray = [formValue.paymentCycle];
        }
      } else {
        // For combined payroll, collect all selected cycles
        const cyclesFormArray = this.paymentCycles.value;
        paymentCycleArray = cyclesFormArray
          .filter((cycle: any) => cycle.selected)
          .map((cycle: any) => cycle.id);
      }

      const requestPayload = {
        state: formValue.state?.id || 0,
        county: formValue.county?.id || 0,
        payam: formValue.payam?.id || 0,
        boma: formValue.boma?.id || 0,
        paymentCycle: paymentCycleArray,
        provider: formValue.provider
      };

      const response = await this.api.POST('/api/payroll/getMobileMoneyPayrollData', requestPayload);
      
      if (response.data) {
        this.payrollData = response.data.payrollList || [];
        this.totalRecords = response.data.total || 0;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Loaded ${this.payrollData.length} records`
        });
      }
    } catch (error: any) {
      console.error('Error fetching payroll data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error?.response?.data?.message || 'Failed to fetch payroll data'
      });
      this.payrollData = [];
      this.totalRecords = 0;
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
    const formValue = this.searchForm.value;
    const payrollType = formValue.payrollType;
    
    // Validation
    if (payrollType === 'single' && !formValue.paymentCycle) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please select a payment cycle'
      });
      return;
    }
    
    if (payrollType === 'combined') {
      const selectedCycles = this.paymentCycles.value.filter((c: any) => c.selected);
      if (selectedCycles.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Validation Error',
          detail: 'Please select at least one payment cycle'
        });
        return;
      }
    }

    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize);
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
      provider: 'MOMO'
    });
    
    this.paymentCycles.controls.forEach(control => {
      control.get('selected')?.setValue(false);
    });
    
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.payrollData = [];
    this.totalRecords = 0;
    this.currentPage = 0;
    
    this.cdr.markForCheck();
  }

  get paymentCycles() {
    return this.searchForm.get('paymentCycles') as FormArray;
  }


  async onDownloadClick() {
    try {
      this.isLoading = true;
      this.cdr.markForCheck();

      const formValue = this.searchForm.value;
      const payrollType = formValue.payrollType;
      
      let paymentCycleArray: number[] = [];
      
      if (payrollType === 'single') {
        if (formValue.paymentCycle) {
          paymentCycleArray = [formValue.paymentCycle];
        }
      } else {
        const cyclesFormArray = this.paymentCycles.value;
        paymentCycleArray = cyclesFormArray
          .filter((cycle: any) => cycle.selected)
          .map((cycle: any) => cycle.id);
      }

      if (paymentCycleArray.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Validation Error',
          detail: 'Please select at least one payment cycle'
        });
        return;
      }

      const requestPayload = {
        state: formValue.state?.id || 0,
        county: formValue.county?.id || 0,
        payam: formValue.payam?.id || 0,
        boma: formValue.boma?.id || 0,
        paymentCycle: paymentCycleArray,
        provider: formValue.provider
      };

      const response = await this.api.axiosInstance.post('/api/payroll/export', requestPayload, {
        responseType: 'blob'
      });

      // Create blob and download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MoMo_Payroll_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'File downloaded successfully'
      });
    } catch (error: any) {
      console.error('Error downloading file:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error?.response?.data?.message || 'Failed to download file'
      });
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  onDownloadPDFClick() {
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: 'PDF download functionality coming soon'
    });
  }

  exportFile() {
    this.onDownloadClick();
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.importFile(input.files[0]);
    }
  }

  importFile(file: File) {
    this.messageService.add({ severity: 'info', summary: 'File Selected', detail: file.name });
    this.cdr.markForCheck();
    // Implement your file upload logic here
  }
}