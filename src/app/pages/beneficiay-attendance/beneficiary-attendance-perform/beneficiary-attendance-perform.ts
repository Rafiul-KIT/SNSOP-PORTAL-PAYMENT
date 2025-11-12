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
  present: boolean;
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
    ToastModule
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
  attendanceDate: Date | null = null;

  statusOptions = [
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

    this.api.GET(`api/attendance/get?subprojectId=${subprojectId}&attendanceDate=${date}&page=${page}&size=${size}`)
      .then((res: any) => {
        const data = res.data || res;
        if (data && data.content) {
          this.beneficiaries = data.content.map((b: BeneficiaryAttendanceRecord) => ({ ...b, present: true })); // Default to present
          this.totalRecords = data.totalElements || 0;
        } else {
          this.beneficiaries = [];
          this.totalRecords = 0;
        }
      })
      .catch(err => {
        console.error('Error fetching beneficiaries:', err);
        this.beneficiaries = [];
        this.totalRecords = 0;
      })
      .finally(() => {
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchBeneficiaries(this.currentPage, this.pageSize);
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
    if (!this.subproject || !this.attendanceDate || this.beneficiaries.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot Save',
        detail: 'No attendance data to save. Please select a date and ensure beneficiaries are loaded.',
      });
      return;
    }

    this.loading = true;

    // Format date to YYYY-MM-DD
    const dt = this.attendanceDate;
    const year = dt.getFullYear();
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const day = dt.getDate().toString().padStart(2, '0');
    const attendanceDateStr = `${year}-${month}-${day}`;

    const payload = {
      subprojectId: this.subproject.id,
      status: true, // Assuming true for a completed attendance session
      list: this.beneficiaries.map(b => ({
        beneficiaryId: b.beneficiaryId,
        attendanceDate: attendanceDateStr,
        present: b.present,
        finlitAttended: b.finlitAttended,
        ecdAttended: b.ecdAttended,
        washAttended: b.washAttended,
        gbvAttended: b.gbvAttended,
      })),
    };

    this.api.POST('api/attendance/save', payload)
      .then((res: any) => {
        if (res && res.code === 0) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Attendance saved successfully!',
          });
          // After success, navigate back to the list page
          this.router.navigate(['/beneficiary-attendance']);
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