import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { ApiService } from '../../../services/api.service';
import { Loader } from '../../../components/loader/loader';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { PaymentCycleEnum } from '../../../services/lookup.service';
import Swal from 'sweetalert2';

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
  tstApprovedAt: string;
  status: string;
}

interface PaymentCycle {
  label: string;
  value: number;
}

interface TrainingAttendanceRecord {
  beneficiaryId: number;
  householdNumber: string;
  beneficiaryName: string;
  gender: string;
  age: number;
  phoneNo: string;
  finlitAttended: boolean;
  ecdAttended: boolean;
  washAttended: boolean;
  gbvAttended: boolean;
  selected?: boolean;
}

@Component({
  selector: 'app-training-attendance-perform',
  templateUrl: './training-attendance-perform.html',
  styleUrl: './training-attendance-perform.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    DatePickerModule,
    ButtonModule,
    DividerModule,
    SelectModule,
    TableModule,
    CheckboxModule,
    Loader,
    BreadcrumbModule,
  ],
  providers: [],
})
export class TrainingAttendancePerform implements OnInit {
  isLoading = true;
  loading = false;
  saving = false;
  subproject: SubProject | null = null;
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  // Attendance fields
  attendanceDate: Date | null = null;
  attendanceDateTouched: boolean = false;
  minAttendanceDate: Date | undefined;
  maxAttendanceDate: Date = new Date();

  // Payment cycle fields
  paymentCycles: PaymentCycle[] = [];
  selectedPaymentCycle: PaymentCycle | null = null;
  paymentCycleTouched: boolean = false;

  // Training attendance data
  beneficiaries: TrainingAttendanceRecord[] = [];
  totalRecords = 0;
  selectAll = false;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initBreadcrumb();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchSubProject(Number(id));
      this.fetchPaymentCycles();
    } else {
      console.error('No subproject ID found in route');
      this.isLoading = false;
    }
  }

  fetchSubProject(id: number) {
    this.isLoading = true;
    const body = { id: id };
    this.api
      .POST('api/subproject/get?page=0&size=1', body)
      .then((res: any) => {
        const data = res.data || res;
        if (data && data.content && data.content.length > 0) {
          this.subproject = data.content[0];
          if (this.subproject && this.subproject.tstApprovedAt) {
            this.minAttendanceDate = new Date(this.subproject.tstApprovedAt);
          }
        } else {
          console.error('Subproject not found');
        }
      })
      .catch((err) => {
        console.error('Error fetching subproject:', err);
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  fetchPaymentCycles() {
    this.paymentCycles = PaymentCycleEnum;
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Training Attendance' }];
  }

  onAttendanceDateChange(event: Date) {
    this.attendanceDate = event;
    this.attendanceDateTouched = true;
    // Reset table when date changes
    this.beneficiaries = [];
    this.totalRecords = 0;
  }

  onPaymentCycleChange(event: any) {
    this.selectedPaymentCycle = event.value;
    this.paymentCycleTouched = true;
    // Reset table when payment cycle changes
    this.beneficiaries = [];
    this.totalRecords = 0;
  }

  isAttendanceDateInvalid(): boolean {
    if (!this.attendanceDate) {
      return true;
    }
    if (
      this.minAttendanceDate &&
      this.attendanceDate < this.minAttendanceDate
    ) {
      return true;
    }
    return false;
  }

  isPaymentCycleInvalid(): boolean {
    return !this.selectedPaymentCycle;
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('en-GB');
    } catch {
      return '—';
    }
  }

  onSearch() {
    this.attendanceDateTouched = true;
    this.paymentCycleTouched = true;

    if (this.isAttendanceDateInvalid() || this.isPaymentCycleInvalid()) {
      return;
    }

    this.fetchTrainingAttendance();
  }

  fetchTrainingAttendance() {
    if (
      !this.subproject ||
      !this.attendanceDate ||
      !this.selectedPaymentCycle
    ) {
      return;
    }

    this.loading = true;

    // Format date to YYYY-MM-DD
    const dt = this.attendanceDate;
    const year = dt.getFullYear();
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const day = dt.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const subprojectId = this.subproject.id;
    const paymentCycle = this.selectedPaymentCycle.value;

    this.api
      .GET(
        `api/training-attendance/get?subprojectId=${subprojectId}&paymentCycle=${paymentCycle}&attendanceDate=${dateStr}&page=0&size=-1`,
      )
      .then((res: any) => {
        const data = res.data || res;
        if (data && data.code === 200) {
          this.beneficiaries = (data.content || []).map((b: TrainingAttendanceRecord) => ({
            ...b,
            selected: b.finlitAttended || b.ecdAttended || b.washAttended || b.gbvAttended || false,
          }));
          this.totalRecords = data.totalElements || 0;
          this.selectAll = this.beneficiaries.length > 0 && this.beneficiaries.every((b) => b.selected);

          if (this.beneficiaries.length === 0) {
            Swal.fire({
              icon: 'info',
              title: 'No Records Found',
              text: 'No training attendance records found for the selected criteria.',
            });
          }
        } else {
          this.beneficiaries = [];
          this.totalRecords = 0;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data?.message || 'Failed to fetch training attendance data.',
          });
        }
      })
      .catch((err) => {
        console.error('Error fetching training attendance:', err);
        this.beneficiaries = [];
        this.totalRecords = 0;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch training attendance data. Please try again.',
        });
      })
      .finally(() => {
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  onSelectAllChange(event: any) {
    this.selectAll = event.checked;
    this.beneficiaries.forEach((b) => (b.selected = this.selectAll));
  }

  onRowSelectChange() {
    this.selectAll = this.beneficiaries.every((b) => b.selected);
  }

  getSelectedBeneficiaries(): TrainingAttendanceRecord[] {
    return this.beneficiaries.filter((b) => b.selected);
  }

  hasSelectedBeneficiaries(): boolean {
    return this.beneficiaries.some((b) => b.selected);
  }

  saveTrainingAttendance() {
    if (!this.subproject || !this.attendanceDate || !this.selectedPaymentCycle) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please select attendance date and payment cycle.',
      });
      return;
    }

    const selectedBeneficiaries = this.getSelectedBeneficiaries();

    if (selectedBeneficiaries.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Selection',
        text: 'Please select at least one beneficiary to save attendance for.',
      });
      return;
    }

    this.saving = true;

    // Format date to YYYY-MM-DD
    const dt = this.attendanceDate;
    const year = dt.getFullYear();
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const day = dt.getDate().toString().padStart(2, '0');
    const attendanceDateStr = `${year}-${month}-${day}`;

    const payload = {
      subprojectId: this.subproject.id,
      paymentCycle: this.selectedPaymentCycle.value,
      attendanceDate: attendanceDateStr,
      list: selectedBeneficiaries.map((b) => ({
        beneficiaryId: b.beneficiaryId,
        finlitAttended: b.finlitAttended || false,
        ecdAttended: b.ecdAttended || false,
        washAttended: b.washAttended || false,
        gbvAttended: b.gbvAttended || false,
      })),
    };

    this.api
    .POST('api/training-attendance/save', payload)
    .then((res: any) => {
      const data = res.data || res;
      if (data && (data.code === 200 || data.code === 202)) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: data.message || 'Training attendance saved successfully!',
        }).then(() => {
          // Reset fields instead of reloading page
          this.attendanceDate = null;
          this.selectedPaymentCycle = null;
          this.beneficiaries = [];
          this.totalRecords = 0;
          this.selectAll = false;
          this.attendanceDateTouched = false;
          this.paymentCycleTouched = false;
          this.cdr.markForCheck();
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Save Failed',
          text: data?.message || 'An unknown error occurred while saving.',
        });
      }
    })
    .catch((err) => {
      console.error('Error saving training attendance:', err);
      let errorMessage = 'Failed to save training attendance. Please try again.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }
      Swal.fire({
        icon: 'error',
        title: 'API Error',
        text: errorMessage,
      });
    })
    .finally(() => {
      this.saving = false;
      this.cdr.markForCheck();
    });
}
}
