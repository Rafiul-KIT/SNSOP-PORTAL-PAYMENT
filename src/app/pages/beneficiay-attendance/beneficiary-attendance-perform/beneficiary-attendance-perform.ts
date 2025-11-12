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
    CheckboxModule
  ],
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
    private cdr: ChangeDetectorRef
  ) { }

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
    const date = this.attendanceDate.toISOString().split('T')[0]; // format to yyyy-mm-dd
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
}