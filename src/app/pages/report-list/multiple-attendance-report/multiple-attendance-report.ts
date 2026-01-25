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
  ReactiveFormsModule,
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

import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../services/api.service';
import { LookupService, LookupItem } from '../../../services/lookup.service';
import { saveAs } from 'file-saver';

interface AttendanceRecord {
  stateName: string;
  countyName: string;
  payamName: string;
  bomaName: string;
  subprojectCode: string;
  householdNumber: string;
  beneficiaryName: string;
  beneficiaryAge: number;
  gender: string;
  supportType: string;
  mobileNumber: string;
  attendanceDate: string;
  status: string;
}

@Component({
  selector: 'app-multiple-attendance-report',
  templateUrl: './multiple-attendance-report.html',
  styleUrl: './multiple-attendance-report.scss',
  standalone: true,
  imports: [
    CommonModule,
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
    Loader,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultipleAttendanceReport implements OnInit {
  isLoading = true;
  searchForm!: FormGroup;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  // Location lookups
  states: LookupItem[] = [];
  countyList: LookupItem[] = [];
  payamList: LookupItem[] = [];
  bomaList: LookupItem[] = [];

  // Report size options
  reportSizeOptions = [
    { label: '100', value: 100 },
    { label: '500', value: 500 },
    { label: '1000', value: 1000 },
    { label: '5000', value: 5000 },
    { label: '10000', value: 10000 },
    { label: '50000', value: 50000 },
    { label: '100000', value: 100000 },
    { label: 'All', value: -1 },
  ];

  // Table data
  attendanceRecords: AttendanceRecord[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;


  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private api: ApiService,
    private lookupService: LookupService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.initBreadcrumb();
    this.initForm();
    await this.loadStates();
    this.fetchPage(this.currentPage, this.pageSize);
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Multiple Attendance Report' }];
  }

  initForm() {
    this.searchForm = this.fb.group({
      state: [null],
      county: [{ value: null, disabled: true }],
      payam: [{ value: null, disabled: true }],
      boma: [{ value: null, disabled: true }],
      subprojectCode: [''],
      fromDate: [null],
      toDate: [null],
      reportSize: [null],
    });
  }

  // onReportSizeChange(size: number | null) {
  //   if (!size) return;
  //   this.currentPage = 0;
  //   if (size === -1) {
  //     this.pageSize = this.totalRecords || 10;
  //   } else {
  //     this.pageSize = size;
  //   }
  //   this.fetchPage(this.currentPage, this.pageSize);
  // }

  private async loadStates(): Promise<void> {
    try {
      await this.lookupService.getOrFetchStateList();
      this.states = this.lookupService.getStateList();
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading states:', error);
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
        this.countyList = await this.lookupService.getCountyListByStateId(state.id);
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
        this.payamList = await this.lookupService.getPayamListByCountyId(county.id);
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
        this.bomaList = await this.lookupService.getBomaListByPayamId(payam.id);
        this.searchForm.get('boma')?.enable();
      } catch (error) {
        console.error('Error loading bomas:', error);
      }
    }
    this.cdr.markForCheck();
  }

  private formatDate(date: Date | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private buildSearchBody(page: number, size: number) {
    const f = this.searchForm.value;
    return {
      stateId: f.state?.id || null,
      countyId: f.county?.id || null,
      payamId: f.payam?.id || null,
      bomaId: f.boma?.id || null,
      subprojectCode: f.subprojectCode?.trim() || null,
      fromDate: this.formatDate(f.fromDate),
      toDate: this.formatDate(f.toDate),
      page,
      size,
    };
  }

  showReport() {
    const selectedSize = this.searchForm.get('reportSize')?.value;
    this.currentPage = 0;
    if (selectedSize === -1) {
      this.pageSize = this.totalRecords || 10;
    } else if (selectedSize) {
      this.pageSize = selectedSize;
    }
    this.fetchPage(this.currentPage, this.pageSize);
  }

  fetchPage(page: number, size: number) {
    this.isLoading = true;
    this.cdr.markForCheck();
    const body = this.buildSearchBody(page, size);

    this.api
      .POST('api/report/attendance/multiple', body)
      .then((res: any) => {
        if (!res) throw new Error('Empty response');
        const data = res.data || res;
        this.attendanceRecords = data.content || [];
        this.totalRecords = data.totalElements || 0;

        if (this.attendanceRecords.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Report',
            detail: 'No attendance records found.',
          });
        }
      })
      .catch((err) => {
        console.error('Fetch attendance report error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch attendance report.',
        });
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  resetForm() {
    this.searchForm.reset();
    this.searchForm.get('county')?.disable();
    this.searchForm.get('payam')?.disable();
    this.searchForm.get('boma')?.disable();
    this.countyList = [];
    this.payamList = [];
    this.bomaList = [];
    this.attendanceRecords = [];
    this.totalRecords = 0;
    this.currentPage = 0;
    this.pageSize = 10;
    this.cdr.markForCheck();
  }

  async exportCsv() {
    if (this.totalRecords === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Export',
        detail: 'No data to export.',
      });
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      // Fetch all records for export
      const body = this.buildSearchBody(0, this.totalRecords);
      const res: any = await this.api.POST('api/report/attendance/multiple', body);
      const data = res?.data || res;
      const allRecords: AttendanceRecord[] = data?.content || [];

      if (allRecords.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Export',
          detail: 'No data to export.',
        });
        return;
      }

      // CSV headers
      const headers = ['S.No', 'IP', 'State', 'County', 'Payam', 'Boma',
        'Work Code', 'Beneficiary Name', 'Age', 'Gender', 'Component',
        'Mobile Number', 'Date', 'Status'];

      // CSV rows
      const csvRows = allRecords.map((r, idx) => [
        idx + 1,
        this.escapeCsvField('UNOPS Field Office'),
        this.escapeCsvField(r.stateName),
        this.escapeCsvField(r.countyName),
        this.escapeCsvField(r.payamName),
        this.escapeCsvField(r.bomaName),
        this.escapeCsvField(r.subprojectCode),
        this.escapeCsvField(r.beneficiaryName),
        r.beneficiaryAge,
        this.escapeCsvField(r.gender),
        this.escapeCsvField(r.supportType),
        this.escapeCsvField(r.mobileNumber),
        this.escapeCsvField(r.attendanceDate),
        this.escapeCsvField(r.status),
      ].join(','));

      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `multiple_attendance_report_${Date.now()}.csv`);
    } catch (error) {
      console.error('Export error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Export',
        detail: 'Failed to export data.',
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private escapeCsvField(field: any): string {
    if (field == null) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  async exportPdf() {
    if (this.totalRecords === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Export',
        detail: 'No data to export.',
      });
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      // Fetch all records for export
      const body = this.buildSearchBody(0, this.totalRecords);
      const res: any = await this.api.POST('api/report/attendance/multiple', body);
      const data = res?.data || res;
      const allRecords: AttendanceRecord[] = data?.content || [];

      if (allRecords.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Export',
          detail: 'No data to export.',
        });
        return;
      }

      const jsPDF = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF.default('l', 'px', 'a4');

      const head = [['S.No', 'State', 'County', 'Payam', 'Boma', 'Sub-Project Code',
        'HH Number', 'Beneficiary', 'Age', 'Gender', 'Support Type', 'Mobile', 'Attendance Date', 'Status']];

      const pdfBody = allRecords.map((r, idx) => [
        idx + 1,
        r.stateName,
        r.countyName,
        r.payamName,
        r.bomaName,
        r.subprojectCode,
        r.householdNumber,
        r.beneficiaryName,
        r.beneficiaryAge,
        r.gender,
        r.supportType,
        r.mobileNumber,
        r.attendanceDate,
        r.status,
      ]);

      autoTable(doc, { head, body: pdfBody, styles: { fontSize: 6 } });
      doc.save(`multiple_attendance_report_${Date.now()}.pdf`);
    } catch (error) {
      console.error('Export error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Export',
        detail: 'Failed to export data.',
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
