import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { CheckboxModule } from 'primeng/checkbox';
import { InputGroupModule } from 'primeng/inputgroup';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../services/api.service';
import { SelectModule } from 'primeng/select';
import { Loader } from "../../../components/loader/loader";
import { BreadcrumbModule } from "primeng/breadcrumb";

interface SubProject {
  id: number;
  workCode: string;
  projectId: number;
  projectName: string;
  stateId: number;
  stateName: string;
  countyId: number;
  countyName: string;
  payamId: number;
  payamName: string;
  bomaId: number;
  bomaName: string;
  typeOfMeeting: string;
  meetingDate: string;
  screeningStatus: string;
  status: string;
}

interface BeneficiaryAttendanceRecord {
  beneficiaryId: number;
  householdNumber: string;
  beneficiaryName: string;
  gender: string;
  age: number;
  phoneNo: string;
  present: boolean | null;
  finlitAttended: boolean;
  ecdAttended: boolean;
  washAttended: boolean;
  gbvAttended: boolean;
}

@Component({
  selector: 'app-beneficiary-attendance-perform',
  templateUrl: './beneficiary-attendance-perform.html',
  styleUrl: './beneficiary-attendance-perform.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    DatePickerModule,
    ButtonModule,
    InputNumberModule,
    DividerModule,
    SelectModule,
    Loader,
    BreadcrumbModule,
    TableModule,
    PaginatorModule,
    CheckboxModule,
    ToastModule,
    InputGroupModule
],
  providers: [MessageService],
})
export class BeneficiaryAttendancePerform implements OnInit {
  loading = false;
  isLoading = true;
  subproject: SubProject | null = null;
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  beneficiaries: BeneficiaryAttendanceRecord[] = [];
  selectedBeneficiaries: BeneficiaryAttendanceRecord[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;
  today: Date = new Date();

  attendanceDate: Date | null = null;
  attendanceDateTouched: boolean = false;

  allFinlit: boolean = false;
  allEcd: boolean = false;
  allWash: boolean = false;
  allGbv: boolean = false;

  statusOptions = [
    { label: '--select--', value: null },
    { label: 'Present', value: true },
    { label: 'Absent', value: false }
  ];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.today.setHours(23, 59, 59, 999); // Set to end of today to include all of today
    this.initBreadcrumb();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchSubProject(Number(id));
    } else {
      console.error('No subproject ID found in route');
      this.isLoading = false;
    }
  }

  fetchSubProject(id: number) {
    this.isLoading = true;
    const body = { id: id };
    this.api.POST('api/subproject/get?page=0&size=1', body)
      .then((res: any) => {
        const data = res.data || res;
        if (data && data.content && data.content.length > 0) {
          this.subproject = data.content[0];
        } else {
          console.error('Subproject not found');
        }
      })
      .catch(err => {
        console.error('Error fetching subproject:', err);
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }


  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Beneficiary Attendance' }];
  }

  onAttendanceDateChange(event: Date) {
    this.attendanceDate = event;
    // When date changes, clear the current list and reset pagination, a new search is required.
    this.beneficiaries = [];
    this.totalRecords = 0;
    this.currentPage = 0;

  }

  onSearch() {
    this.attendanceDateTouched = true; // Ensure validation message shows if needed
    if (this.isAttendanceDateInvalid()) {
      return; // Don't search if date is invalid
    }

    this.currentPage = 0;
    this.fetchBeneficiaries(this.currentPage, this.pageSize);
  }

  fetchBeneficiaries(page: number, size: number) {
    if (!this.subproject || !this.attendanceDate) {
      return;
    }
    this.loading = true;
    // Format date to YYYY-MM-DD, avoiding timezone conversion issues from toISOString()
    const dt = this.attendanceDate;
    const year = dt.getFullYear();
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const day = dt.getDate().toString().padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    const subprojectId = this.subproject.id;

    this.api.GET(`api/attendance/get?subprojectId=${subprojectId}&attendanceDate=${date}&page=${page}&size=10000`)
      .then((res: any) => {
        const data = res.data || res;
        if (data && data.content && data.content.length > 0) {
          this.beneficiaries = data.content;
          this.selectedBeneficiaries = this.beneficiaries.filter(b => b.present);
          this.totalRecords = data.totalElements || 0;
          this.loading = false;
          this.cdr.markForCheck();
        } else {
          // If no records found, fetch available beneficiaries for attendance
          this.fetchAvailableBeneficiaries(page, size);
        }
      })
      .catch(err => {
        console.error('Error fetching beneficiaries:', err);
        this.beneficiaries = [];
        this.totalRecords = 0;
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  fetchAvailableBeneficiaries(page: number, size: number) {
    if (!this.subproject) {
      this.loading = false;
      return;
    }
    const subprojectId = this.subproject.id;

    this.api.GET(`api/subproject/assign/progress/beneficiary/existing?subprojectId=${subprojectId}&page=${page}&size=10000`)
      .then((res: any) => {
        const data = res.data || res;
        if (data && data.content) {
          this.beneficiaries = data.content.map((b: any) => ({
            beneficiaryId: b.id,
            householdNumber: b.householdNumber,
            beneficiaryName: b.beneficiaryName,
            gender: b.gender,
            age: b.age,
            phoneNo: b.phoneNo,
            present: null, // Default to unselected
            finlitAttended: false,
            ecdAttended: false,
            washAttended: false,
            gbvAttended: false,
          }));
          this.totalRecords = data.totalElements || 0;
        } else {
          this.beneficiaries = [];
          this.totalRecords = 0;
        }
      })
      .catch(err => {
        console.error('Error fetching available beneficiaries:', err);
        this.beneficiaries = [];
        this.totalRecords = 0;
      })
      .finally(() => {
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  onSelectAll(field: keyof BeneficiaryAttendanceRecord, event: any) {
    const isChecked = event.checked;
    this.selectedBeneficiaries.forEach(b => {
      (b as any)[field] = isChecked;
    });
  }

  onSelectAllStatus(event: any) {
    const status = event.value;
    this.selectedBeneficiaries.forEach(b => {
      b.present = status;
    });
  }



  isAttendanceDateInvalid(): boolean {
    return !this.attendanceDate;
  }


  formatDate(date: string | null): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('en-GB');
    } catch {
      return '—';
    }
  }

  saveAttendance() {
    this.attendanceDateTouched = true;

    // --- Start Validation ---
    if (!this.subproject || this.isAttendanceDateInvalid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please select a subproject and a valid attendance date.',
      });
      return;
    }

    if (!this.selectedBeneficiaries || this.selectedBeneficiaries.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please select at least one beneficiary.',
      });
      return;
    }

    const beneficiaryWithNoStatus = this.selectedBeneficiaries.find(b => b.present === null);
    if (beneficiaryWithNoStatus) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: `Please set a status for selected beneficiary: ${beneficiaryWithNoStatus.beneficiaryName}.`,
      });
      return;
    }
    // --- End Validation ---

    this.loading = true;

    // Add a guard clause to ensure attendanceDate is not null for the compiler
    if (!this.attendanceDate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Internal Error',
        detail: 'Date is missing after validation.',
      });
      this.loading = false;
      return;
    }

    const dt = this.attendanceDate;
    const year = dt.getFullYear();
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const day = dt.getDate().toString().padStart(2, '0');
    const attendanceDateStr = `${year}-${month}-${day}`;

    const payload = {
      subprojectId: this.subproject.id,
      status: true,
      list: this.selectedBeneficiaries.map(b => ({
        beneficiaryId: b.beneficiaryId,
        attendanceDate: attendanceDateStr,
        present: b.present ?? false, // Default null/undefined status to absent
        finlitAttended: b.finlitAttended,
        ecdAttended: b.ecdAttended,
        washAttended: b.washAttended,
        gbvAttended: b.gbvAttended,
      })),
    };

    this.api.POST('api/attendance/save', payload)
      .then((res: any) => {
        if (res && res.data.code === 200) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Attendance saved successfully!',
          });
          // After success, clear the fields and table
          this.attendanceDate = null;
          this.beneficiaries = [];
          this.selectedBeneficiaries = [];
          this.totalRecords = 0;
          this.attendanceDateTouched = false;
          this.cdr.markForCheck(); // Trigger change detection
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Save Failed',
            detail: res.message || 'An unknown error occurred while saving.',
          });
        }
      })
      .catch(err => {
        console.error('Error saving attendance:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'API Error',
          detail: 'Failed to save attendance. Please check the console for details.',
        });
      })
      .finally(() => {
        this.loading = false;
        this.cdr.markForCheck();
      });
  }
}