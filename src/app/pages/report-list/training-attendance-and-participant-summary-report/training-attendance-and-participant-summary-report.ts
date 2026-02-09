import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import Swal from 'sweetalert2';

import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../services/api.service';
import {
  LookupItem,
  LookupService,
} from '../../../services/lookup.service';

// Custom validator to check if fromDate is not after toDate and toDate is not in future
function dateRangeValidator(formGroup: FormGroup) {
  const fromDate = formGroup.get('fromDate')?.value;
  const toDate = formGroup.get('toDate')?.value;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
    return { dateRangeInvalid: true };
  }

  if (toDate) {
    const toDateObj = new Date(toDate);
    toDateObj.setHours(0, 0, 0, 0);
    if (toDateObj > today) {
      return { futureDateInvalid: true };
    }
  }

  return null;
}

interface TrainingAttendanceRecord {
  serialNo: number;
  boma: string;
  payam: string;
  county: string;
  state: string;
  fromDate: string;
  toDate: string;
  finlitMale: number;
  finlitFemale: number;
  finlitTotal: number;
  washMale: number;
  washFemale: number;
  washTotal: number;
  ecdMale: number;
  ecdFemale: number;
  ecdTotal: number;
  gbvMale: number;
  gbvFemale: number;
  gbvTotal: number;
}

@Component({
  selector: 'app-training-attendance-and-participant-summary-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Loader,
    BreadcrumbModule,
    TableModule,
    SelectModule,
    FloatLabelModule,
    TooltipModule,
    PaginatorModule,
    ToastModule,
    DatePickerModule,
  ],
  templateUrl: './training-attendance-and-participant-summary-report.html',
  styleUrl: './training-attendance-and-participant-summary-report.scss',
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingAttendanceAndParticipantSummaryReport implements OnInit {
  isLoading = false;
  isShow = false;

  items: MenuItem[] | undefined;
  home: MenuItem | undefined;

  searchForm!: FormGroup;
  records: TrainingAttendanceRecord[] = [];

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalRecords = 0;

  // Lookup data
  states: LookupItem[] = [];
  countyList: LookupItem[] = [];
  payamList: LookupItem[] = [];
  bomaList: LookupItem[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public lookupService: LookupService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): Promise<void> {
    this.initBreadcrumb();
    this.initForm();
    this.loadStates();
    return Promise.resolve();
  }

  private initBreadcrumb(): void {
    this.home = {
      label: 'Dashboard',
      icon: 'fas fa-home me-2',
      routerLink: '/dashboard',
    };
    this.items = [
      {
        label: 'Training Attendance & Participant Summary Report',
        icon: 'fas fa-file-alt',
      },
    ];
  }

  private initForm(): void {
    this.searchForm = this.fb.group(
      {
        state: [null, Validators.required],
        county: [{ value: null, disabled: true }, Validators.required],
        payam: [{ value: null, disabled: true }],
        boma: [{ value: null, disabled: true }],
        fromDate: [null, Validators.required],
        toDate: [null, Validators.required],
      },
      { validators: dateRangeValidator }
    );
  }

  private async loadStates(): Promise<void> {
    try {
      await this.lookupService.getOrFetchStateList();
      this.states = this.lookupService.getStateList();
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading states:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load states.',
      });
    }
  }

  async onStateChange(state: any): Promise<void> {
    this.searchForm.get('county')?.reset({ value: null, disabled: true });
    this.searchForm.get('payam')?.reset({ value: null, disabled: true });
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.countyList = [];
    this.payamList = [];
    this.bomaList = [];

    if (state?.id) {
      try {
        this.countyList = await this.lookupService.getCountyListByStateId(
          String(state.id)
        );
        this.searchForm.get('county')?.enable();
      } catch (error) {
        console.error('Error loading counties:', error);
      }
    }
    this.cdr.markForCheck();
  }

  async onCountyChange(county: any): Promise<void> {
    this.searchForm.get('payam')?.reset({ value: null, disabled: true });
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.payamList = [];
    this.bomaList = [];

    if (county?.id) {
      try {
        this.payamList = await this.lookupService.getPayamListByCountyId(
          String(county.id)
        );
        this.searchForm.get('payam')?.enable();
      } catch (error) {
        console.error('Error loading payams:', error);
      }
    }
    this.cdr.markForCheck();
  }

  async onPayamChange(payam: any): Promise<void> {
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.bomaList = [];

    if (payam?.id) {
      try {
        this.bomaList = await this.lookupService.getBomaListByPayamId(
          String(payam.id)
        );
        this.searchForm.get('boma')?.enable();
      } catch (error) {
        console.error('Error loading bomas:', error);
      }
    }
    this.cdr.markForCheck();
  }

  search(): void {
    this.searchForm.markAllAsTouched();

    if (this.searchForm.invalid) {
      if (this.searchForm.errors?.['dateRangeInvalid']) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'From Date cannot be after To Date.',
        });
      } else if (this.searchForm.errors?.['futureDateInvalid']) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'To Date cannot be a future date.',
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'Please fill all required fields (State, County, From Date, To Date).',
        });
      }
      return;
    }
    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  reset(): void {
    this.searchForm.reset({
      state: null,
      county: null,
      payam: null,
      boma: null,
      fromDate: null,
      toDate: null,
    });
    this.searchForm.get('county')?.disable();
    this.searchForm.get('payam')?.disable();
    this.searchForm.get('boma')?.disable();

    this.countyList = [];
    this.payamList = [];
    this.bomaList = [];

    this.records = [];
    this.totalRecords = 0;
    this.currentPage = 0;
    this.isShow = false;
    this.cdr.markForCheck();
  }

  async fetchPage(page: number, size: number): Promise<void> {
    this.isLoading = true;
    this.isShow = false;
    this.cdr.markForCheck();

    const formValues = this.searchForm.value;

    const formatDate = (date: any): string => {
      if (!date) return '';
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      return date;
    };

    const stateId = formValues.state?.id ? parseInt(formValues.state.id, 10) : null;
    const countyId = formValues.county?.id ? parseInt(formValues.county.id, 10) : null;
    const fromDate = formatDate(formValues.fromDate);
    const toDate = formatDate(formValues.toDate);

    const endpoint = `/api/training-attendance-report/get?stateId=${stateId}&countyId=${countyId}&fromDate=${fromDate}&toDate=${toDate}&page=${page}&size=${size}`;

    try {
      const axiosResponse: any = await this.apiService.GET(endpoint);
      const apiResponse = axiosResponse.data;

      if (apiResponse && apiResponse.content && apiResponse.content.length > 0) {
        this.records = apiResponse.content;
        this.totalRecords = apiResponse.totalElements || 0;
        this.isShow = true;
      } else {
        this.records = [];
        this.totalRecords = 0;
        this.messageService.add({
          severity: 'info',
          summary: 'Info',
          detail: apiResponse?.message || 'No data found.',
        });
        this.isShow = false;
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      this.records = [];
      this.totalRecords = 0;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'An error occurred while fetching data.',
      });
      this.isShow = false;
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;

    const size = this.pageSize === -1 ? -1 : this.pageSize;
    const page = this.pageSize === -1 ? 0 : this.currentPage;

    this.fetchPage(page, size);
  }
}
