import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { RadioButtonModule } from 'primeng/radiobutton';

import { ApiService } from '../../../services/api.service';
import { LookupService, LookupItem, StatusEnum } from '../../../services/lookup.service';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';

// Custom validator to ensure the date is not in the future
export function noFutureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(control.value);
  return selectedDate > today ? { futureDate: true } : null;
}

// Custom validator for the date range (max 75 days)
export function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const fromDate = group.get('fromDate')?.value;
  const toDate = group.get('toDate')?.value;

  if (fromDate && toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    if (from > to) {
      return { fromDateAfterToDate: true };
    }

    const diffTime = to.getTime() - from.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 75) {
      return { maxDaysExceeded: true };
    }
  }
  return null;
}

@Component({
  selector: 'app-beneficiary-atendance-report',
  templateUrl: './beneficiary-atendance-report.html',
  styleUrl: './beneficiary-atendance-report.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    PaginatorModule,
    BreadcrumbModule,
    FloatLabelModule,
    SelectModule,
    InputTextModule,
    DatePickerModule,
    TooltipModule,
    CardModule,
    DividerModule,
    RadioButtonModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BeneficiaryAtendanceReport implements OnInit {
  // Step 1: Sub-project Search
  subprojectForm!: FormGroup;
  subprojectList: any[] = [];
  selectedSubproject: any = null;
  loadingSubprojects = false;
  subprojectPage = 0;
  subprojectSize = 10;
  totalSubprojects = 0;

  // Step 2: Attendance Report
  attendanceForm!: FormGroup;
  records: any[] = [];
  dateColumns: string[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;
  loadingAttendance = false;
  exportingCsv = false;
  hasSearchedAttendance = false;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  // Location lookups
  states: LookupItem[] = [];
  countyList: LookupItem[] = [];
  payamList: LookupItem[] = [];
  bomaList: LookupItem[] = [];
  statuses = StatusEnum;
  maxDate: Date;

  roleId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private api: ApiService,
    private lookupService: LookupService,
    private cdr: ChangeDetectorRef
  ) {
    this.maxDate = new Date();
  }

  async ngOnInit() {
    this.roleId = this.api.getUserRole();
    this.initBreadcrumb();
    this.initForms();
    await this.loadStates();
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Beneficiary Attendance Report' }];
  }

  initForms() {
    this.subprojectForm = this.fb.group({
      state: [null],
      county: [{ value: null, disabled: true }],
      payam: [{ value: null, disabled: true }],
      boma: [{ value: null, disabled: true }],
      workCode: [''],
      status: [null],
    });

    this.attendanceForm = this.fb.group({
      fromDate: [null, [Validators.required, noFutureDateValidator]],
      toDate: [null, [Validators.required, noFutureDateValidator]],
    }, { validators: dateRangeValidator });
  }

  async loadStates(): Promise<void> {
    try {
      await this.lookupService.getOrFetchStateList();
      this.states = this.lookupService.getStateList();
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading states:', error);
    }
  }

  async onStateChange(state: any): Promise<void> {
    this.subprojectForm.get('county')?.reset({ value: null, disabled: true });
    this.subprojectForm.get('payam')?.reset({ value: null, disabled: true });
    this.subprojectForm.get('boma')?.reset({ value: null, disabled: true });
    this.countyList = [];
    this.payamList = [];
    this.bomaList = [];

    if (state?.id) {
      try {
        this.countyList = await this.lookupService.getCountyListByStateId(state.id);
        this.subprojectForm.get('county')?.enable();
      } catch (error) {
        console.error('Error loading counties:', error);
      }
    }
    this.cdr.markForCheck();
  }

  async onCountyChange(county: any): Promise<void> {
    this.subprojectForm.get('payam')?.reset({ value: null, disabled: true });
    this.subprojectForm.get('boma')?.reset({ value: null, disabled: true });
    this.payamList = [];
    this.bomaList = [];

    if (county?.id) {
      try {
        this.payamList = await this.lookupService.getPayamListByCountyId(county.id);
        this.subprojectForm.get('payam')?.enable();
      } catch (error) {
        console.error('Error loading payams:', error);
      }
    }
    this.cdr.markForCheck();
  }

  async onPayamChange(payam: any): Promise<void> {
    this.subprojectForm.get('boma')?.reset({ value: null, disabled: true });
    this.bomaList = [];

    if (payam?.id) {
      try {
        this.bomaList = await this.lookupService.getBomaListByPayamId(payam.id);
        this.subprojectForm.get('boma')?.enable();
      } catch (error) {
        console.error('Error loading bomas:', error);
      }
    }
    this.cdr.markForCheck();
  }

  searchSubprojects(page = 0, size = 10) {
    this.loadingSubprojects = true;
    this.selectedSubproject = null; 
    this.hasSearchedAttendance = false;
    this.records = [];
    this.subprojectPage = page;
    this.subprojectSize = size;
    
    const f = this.subprojectForm.value;
    const body = {
      id: null,
      workCode: f.workCode ? f.workCode.trim() : null,
      projectId: null,
      projectName: null,
      stateId: f.state?.id || null,
      stateName: null,
      countyId: f.county?.id || null,
      countyName: null,
      payamId: f.payam?.id || null,
      payamName: null,
      bomaId: f.boma?.id || null,
      bomaName: null,
      typeOfMeeting: null,
      meetingDate: null,
      screeningStatus: null,
      status: f.status?.value || null
    };

    let apiUrl = 'api/subproject/get';
    // if (Number(this.roleId) === 5) {
    //   apiUrl = 'api/subproject/get/for-ip';
    // }

    const url = `${apiUrl}?page=${this.subprojectPage}&size=${this.subprojectSize}`;

    this.api.POST(url, body)
      .then((res: any) => {
        const data = res.data || res;
        this.subprojectList = data.content || [];
        this.totalSubprojects = data.totalElements || 0;
        
        if (this.subprojectList.length === 0) {
          this.messageService.add({ severity: 'info', summary: 'Sub-projects', detail: 'No sub-projects found.' });
        }
      })
      .catch(err => {
        console.error('Search sub-projects error:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch sub-projects.' });
      })
      .finally(() => {
        this.loadingSubprojects = false;
        this.cdr.detectChanges();
      });
  }

  onSubprojectPageChange(event: any) {
    this.searchSubprojects(event.page, event.rows);
  }

  onSubprojectSelect(sp: any) {
    this.selectedSubproject = sp;
    this.hasSearchedAttendance = false;
    this.records = [];
    this.attendanceForm.patchValue({ fromDate: null, toDate: null });
    this.cdr.markForCheck();
  }

  private formatDateForAttendance(date: Date | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  private validateAttendanceForm(): boolean {
    if (this.attendanceForm.invalid) {
      let errorMessages = '';
      if (this.attendanceForm.hasError('fromDateAfterToDate')) {
        errorMessages += '<p>From Date cannot be after To Date.</p>';
      }
      if (this.attendanceForm.hasError('maxDaysExceeded')) {
        errorMessages += '<p>Date range cannot exceed 75 days.</p>';
      }
      const fromDateControl = this.attendanceForm.get('fromDate');
      if (fromDateControl?.errors?.['required']) errorMessages += '<p>From Date is required.</p>';
      if (fromDateControl?.errors?.['futureDate']) errorMessages += '<p>From Date cannot be a future date.</p>';

      const toDateControl = this.attendanceForm.get('toDate');
      if (toDateControl?.errors?.['required']) errorMessages += '<p>To Date is required.</p>';
      if (toDateControl?.errors?.['futureDate']) errorMessages += '<p>To Date cannot be a future date.</p>';

      Swal.fire({ icon: 'error', title: 'Validation Errors', html: errorMessages });
      return false;
    }
    return true;
  }

  showAttendanceReport() {
    if (!this.validateAttendanceForm()) return;

    this.currentPage = 0;
    this.hasSearchedAttendance = true;
    this.fetchAttendancePage(this.currentPage, this.pageSize);
  }

  fetchAttendancePage(page: number, size: number) {
    this.loadingAttendance = true;
    this.cdr.markForCheck();
    
    const f = this.attendanceForm.value;
    const body = {
      subprojectId: this.selectedSubproject?.id || null,
      fromDate: this.formatDateForAttendance(f.fromDate),
      toDate: this.formatDateForAttendance(f.toDate),
    };

    const url = `api/report/attendance/beneficiary?page=${page}&size=${size}`;

    this.api.POST(url, body)
      .then((res: any) => {
        if (!res) throw new Error('Empty response');
        
        let rawData = res.data?.data || res.data || [];
        
        if (Array.isArray(rawData)) {
          this.totalRecords = res.metadata?.total || rawData.length;
          
          if (rawData.length > size && !res.metadata?.total) {
            this.records = rawData.slice(page * size, (page + 1) * size);
          } else {
            this.records = rawData;
          }
        } else {
          this.records = [];
          this.totalRecords = 0;
        }
        
        if (this.records.length > 0) {
          const standardKeys = ['IdentificationNo', 'fullName', 'Age', 'Gender', 'Component', 'tot', 'present', 'absent'];
          this.dateColumns = Object.keys(this.records[0]).filter(key => !standardKeys.includes(key));
        } else {
          this.dateColumns = [];
          this.messageService.add({ severity: 'info', summary: 'Report', detail: 'No attendance records found.' });
        }
      })
      .catch((err) => {
        console.error('Fetch attendance error:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch report.' });
        this.records = [];
        this.totalRecords = 0;
        this.dateColumns = [];
      })
      .finally(() => {
        this.loadingAttendance = false;
        this.cdr.detectChanges();
      });
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchAttendancePage(this.currentPage, this.pageSize);
  }

  resetAll() {
    this.subprojectForm.reset();
    this.attendanceForm.reset();
    this.subprojectForm.get('county')?.disable();
    this.subprojectForm.get('payam')?.disable();
    this.subprojectForm.get('boma')?.disable();
    this.countyList = [];
    this.payamList = [];
    this.bomaList = [];
    this.subprojectList = [];
    this.selectedSubproject = null;
    this.subprojectPage = 0;
    this.subprojectSize = 10;
    this.totalSubprojects = 0;
    this.records = [];
    this.dateColumns = [];
    this.totalRecords = 0;
    this.currentPage = 0;
    this.hasSearchedAttendance = false;
    this.cdr.markForCheck();
  }

  async exportCsv() {
    if (!this.validateAttendanceForm()) return;

    this.exportingCsv = true;
    this.cdr.markForCheck();

    const f = this.attendanceForm.value;
    const body = {
      subprojectId: this.selectedSubproject?.id || null,
      fromDate: this.formatDateForAttendance(f.fromDate),
      toDate: this.formatDateForAttendance(f.toDate),
    };

    try {
      // Using axios directly from ApiService to handle blob
      const response = await this.api.axiosInstance.post('api/report/attendance/beneficiary/csv', body, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `beneficiary_attendance_${this.selectedSubproject?.workCode || 'all'}_${Date.now()}.csv`);
    } catch (error) {
      console.error('CSV Export error:', error);
      this.messageService.add({ severity: 'error', summary: 'Export Error', detail: 'Failed to download CSV.' });
    } finally {
      this.exportingCsv = false;
      this.cdr.detectChanges();
    }
  }
}
