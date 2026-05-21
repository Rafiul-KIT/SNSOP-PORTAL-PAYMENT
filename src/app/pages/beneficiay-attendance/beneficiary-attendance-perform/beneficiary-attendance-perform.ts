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
import Swal from 'sweetalert2';
import { ApiService } from '../../../services/api.service';
import { SelectModule } from 'primeng/select';
import { Loader } from "../../../components/loader/loader";
import { BreadcrumbModule } from "primeng/breadcrumb";
import { DialogModule } from 'primeng/dialog';

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

interface BeneficiaryAttendanceRecord {
  beneficiaryId: number | null;
  householdNumber: string;
  beneficiaryName: string;
  gender: string;
  age: number | null;
  phoneNo: string;
  present: boolean | null;
  finlitAttended: boolean | null;
  ecdAttended: boolean | null;
  washAttended: boolean | null;
  gbvAttended: boolean | null;
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
    InputGroupModule,
    DialogModule
],
  providers: [],

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
  minAttendanceDate: Date | undefined;
  maxAttendanceDate: Date = new Date();

  attendanceDate: Date | null = null;
  attendanceDateTouched: boolean = false;

  beneficiaryIdFilter: string = '';
  householdNumberFilter: string = '';
  beneficiaryNameFilter: string = '';
  genderFilter: string = '';
  ageFilter: number | null = null;
  phoneNoFilter: string = '';

  sortField: string = '';
  sortOrder: number = 1; // 1 for ascending, -1 for descending

  filteredBeneficiaries: BeneficiaryAttendanceRecord[] = [];

  statusOptions = [
    { label: '--select--', value: null },
    { label: 'Present', value: true },
    { label: 'Absent', value: false }
  ];

  showUploadModal = false;
  selectedFile: File | null = null;
  uploadInProgress = false;

    constructor(
      private fb: FormBuilder,
      private api: ApiService,
      private route: ActivatedRoute,
      private router: Router,
      private cdr: ChangeDetectorRef
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
            if (this.subproject && this.subproject.tstApprovedAt) {
              this.minAttendanceDate = new Date(this.subproject.tstApprovedAt);
            }
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
      this.beneficiaries = [];
      this.selectedBeneficiaries = [];
      this.totalRecords = 0;
      this.currentPage = 0;
      this.applyFiltersAndSorting(); // Clear filters when date changes
    }
  
    onSearch() {
      this.attendanceDateTouched = true; // Ensure validation message shows if needed
      if (this.isAttendanceDateInvalid()) {
        return; // Don't search if date is invalid
      }
      this.selectedBeneficiaries = [];
      this.currentPage = 0;
      this.fetchBeneficiaries(this.currentPage, this.pageSize);
    }
  
    fetchBeneficiaries(page: number, size: number) {
      if (!this.subproject || !this.attendanceDate) {
        return;
      }
      this.isLoading = true;
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
            this.beneficiaries = data.content.map((b: any) => this.mapBeneficiaryAttendanceRecord(b));
            this.selectedBeneficiaries = this.beneficiaries.filter(b => b.present);
            this.totalRecords = data.totalElements || 0;
            this.applyFiltersAndSorting(); // Apply filters and sorting after fetching
            this.isLoading = false;
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
          this.applyFiltersAndSorting(); // Clear filters if no beneficiaries
          this.isLoading = false;
          this.cdr.markForCheck();
        });
    }
  
    fetchAvailableBeneficiaries(page: number, size: number) {
      if (!this.subproject) {
        this.isLoading = false;
        return;
      }
      const subprojectId = this.subproject.id;
  
      this.api.GET(`api/subproject/assign/progress/beneficiary/existing?subprojectId=${subprojectId}&page=${page}&size=10000`)
        .then((res: any) => {
          const data = res.data || res;
          if (data && data.content) {
            this.beneficiaries = data.content.map((b: any) => ({
              beneficiaryId: this.getBeneficiaryId(b, true),
              householdNumber: b.householdNumber ?? '',
              beneficiaryName: b.beneficiaryName ?? '',
              gender: b.gender ?? '',
              age: b.age ?? null,
              phoneNo: b.phoneNo ?? '',
              present: null, // Default to unselected
              finlitAttended: null,
              ecdAttended: null,
              washAttended: null,
              gbvAttended: null,
            }));
            this.totalRecords = data.totalElements || 0;
          } else {
            this.beneficiaries = [];
            this.totalRecords = 0;
          }
  
          if (this.totalRecords === 0) { // Show message if no beneficiaries found
            Swal.fire({
              icon: 'info',
              title: 'No Beneficiaries Found',
              text: 'No beneficiaries match the selected criteria or are available for attendance.'
            });
          }
          this.applyFiltersAndSorting(); // Apply filters and sorting after fetching
        })
        .catch(err => {
          console.error('Error fetching available beneficiaries:', err);
          this.beneficiaries = [];
          this.totalRecords = 0;
          Swal.fire({ // Show error message
            icon: 'error',
            title: 'Error',
            text: 'Failed to fetch available beneficiaries. Please try again.'
          });
          this.applyFiltersAndSorting(); // Clear filters on error
        })
        .finally(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        });
    }

    private mapBeneficiaryAttendanceRecord(record: any): BeneficiaryAttendanceRecord {
      return {
        beneficiaryId: this.getBeneficiaryId(record),
        householdNumber: record.householdNumber ?? '',
        beneficiaryName: record.beneficiaryName ?? '',
        gender: record.gender ?? '',
        age: record.age ?? null,
        phoneNo: record.phoneNo ?? '',
        present: record.present ?? null,
        finlitAttended: record.finlitAttended ?? null,
        ecdAttended: record.ecdAttended ?? null,
        washAttended: record.washAttended ?? null,
        gbvAttended: record.gbvAttended ?? null,
      };
    }

    private matchesFilter(value: unknown, filter: string): boolean {
      return String(value ?? '').toLowerCase().includes(filter.trim().toLowerCase());
    }

    private getBeneficiaryId(record: any, useIdFallback = false): number | null {
      return record.beneficiaryId
        ?? record.beneficiary?.beneficiaryId
        ?? record.beneficiary?.id
        ?? record.beneficiary_id
        ?? (useIdFallback ? record.id : null);
    }
  
    onFilterChange() {
      this.applyFiltersAndSorting();
    }
  
    sortOnClient(field: string) {
      if (this.sortField === field) {
        this.sortOrder = this.sortOrder * -1;
      } else {
        this.sortField = field;
        this.sortOrder = 1;
      }
      this.applyFiltersAndSorting();
    }
  
    getSortIcon(field: string): string {
      if (this.sortField === field) {
        return this.sortOrder === 1 ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down';
      }
      return 'pi-sort-alt';
    }
  
    clearFilters() {
      this.beneficiaryIdFilter = '';
      this.householdNumberFilter = '';
      this.beneficiaryNameFilter = '';
      this.genderFilter = '';
      this.ageFilter = null;
      this.phoneNoFilter = '';
      this.sortField = '';
      this.sortOrder = 1;
      this.applyFiltersAndSorting();
    }
  
    applyFiltersAndSorting() {
      let tempBeneficiaries = [...this.beneficiaries];
  
      // Apply filters
      if (this.beneficiaryIdFilter) {
        tempBeneficiaries = tempBeneficiaries.filter(b => this.matchesFilter(b.beneficiaryId, this.beneficiaryIdFilter));
      }
      if (this.householdNumberFilter) {
        tempBeneficiaries = tempBeneficiaries.filter(b => this.matchesFilter(b.householdNumber, this.householdNumberFilter));
      }
      if (this.beneficiaryNameFilter) {
        tempBeneficiaries = tempBeneficiaries.filter(b => this.matchesFilter(b.beneficiaryName, this.beneficiaryNameFilter));
      }
      if (this.genderFilter) {
        tempBeneficiaries = tempBeneficiaries.filter(b => this.matchesFilter(b.gender, this.genderFilter));
      }
      if (this.ageFilter !== null) {
        tempBeneficiaries = tempBeneficiaries.filter(b => b.age === this.ageFilter);
      }
      if (this.phoneNoFilter) {
        tempBeneficiaries = tempBeneficiaries.filter(b => this.matchesFilter(b.phoneNo, this.phoneNoFilter));
      }
  
      // Apply sorting
      if (this.sortField) {
        tempBeneficiaries.sort((a, b) => {
          const valueA = (a as any)[this.sortField];
          const valueB = (b as any)[this.sortField];
  
          let result = 0;
          if (valueA == null && valueB != null) result = -1;
          else if (valueA != null && valueB == null) result = 1;
          else if (valueA == null && valueB == null) result = 0;
          else if (typeof valueA === 'string' && typeof valueB === 'string') {
            result = valueA.localeCompare(valueB);
          } else {
            result = (valueA < valueB ? -1 : valueA > valueB ? 1 : 0);
          }
  
          return result * this.sortOrder;
        });
      }
  
      this.filteredBeneficiaries = tempBeneficiaries;
      this.cdr.markForCheck();
    }
  
    onSelectAllStatus(event: any) {
      const status = event.value;
      this.selectedBeneficiaries.forEach(b => {
        b.present = status;
      });
    }
  
    isAttendanceDateInvalid(): boolean {
      if (!this.attendanceDate) {
        return true; // Date is required
      }
      if (this.minAttendanceDate && this.attendanceDate < this.minAttendanceDate) {
        return true; // Date cannot be earlier than minAttendanceDate
      }
      return false;
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
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'Please select a subproject and a valid attendance date.',
        });
        return;
      }
  
      if (!this.selectedBeneficiaries || this.selectedBeneficiaries.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'Please select at least one beneficiary.',
        });
        return;
      }
  
      const beneficiaryWithNoStatus = this.selectedBeneficiaries.find(b => b.present === null);
      if (beneficiaryWithNoStatus) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: `Please set a status for selected beneficiary: ${beneficiaryWithNoStatus.beneficiaryName}.`,
        });
        return;
      }
      // --- End Validation ---
  
      this.loading = true;
  
      // Add a guard clause to ensure attendanceDate is not null for the compiler
      if (!this.attendanceDate) {
        Swal.fire({
          icon: 'error',
          title: 'Internal Error',
          text: 'Date is missing after validation.',
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
        source: 'WEB_PORTAL',
        subprojectId: this.subproject.id,
        status: true,
        list: this.beneficiaries.map(b => ({
          beneficiaryId: b.beneficiaryId,
          attendanceDate: attendanceDateStr,
          present: this.selectedBeneficiaries.includes(b) ? (b.present ?? false) : false,
          finlitAttended: null,
          ecdAttended: null,
          washAttended: null,
          gbvAttended: null,
        })),
      };
  
      this.api.POST('api/attendance/save', payload)
        .then((res: any) => {
          if (res && res.data && res.data.code === 200) {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Attendance saved successfully!',
            });
            // After success, clear the fields and table
            this.attendanceDate = null;
            this.beneficiaries = [];
            this.selectedBeneficiaries = [];
            this.totalRecords = 0;
            this.attendanceDateTouched = false;
            this.cdr.markForCheck(); // Trigger change detection
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Save Failed',
              text: res.data.message || 'An unknown error occurred while saving.', // Corrected to res.data.message
            });
          }
        })
        .catch(err => {
          console.error('Error saving attendance:', err);
          let errorMessage = 'Failed to save attendance. Please check the console for details.';
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
          this.loading = false;
          this.cdr.markForCheck();
        });
    }
  
    onFileSelect(event: any): void {
      const file = event.target.files[0];
      if (file) {
        if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel') {
          this.selectedFile = file;
        } else {
          Swal.fire('Invalid File Type', 'Please upload a valid Excel file (.xlsx or .xls).', 'warning');
          this.selectedFile = null;
        }
      }
      this.cdr.markForCheck();
    }
  
    downloadTemplate(): void {
      if (!this.subproject) {
        Swal.fire({
          title: 'Error',
          text: 'Subproject details not loaded.',
          icon: 'error',
          customClass: { container: 'high-z-index-swal' }
        });
        return;
      }
  
      Swal.fire({
        title: 'Downloading Template...',
        html: `
          <div class="text-center">
            <p>Please wait...</p>
            <div class="progress" style="height: 20px;">
              <div id="download-progress-bar" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
                style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <p id="download-progress-text">0%</p>
          </div>
        `,
        allowOutsideClick: false,
        customClass: { container: 'high-z-index-swal' },
        didOpen: () => {
          Swal.showLoading();
        }
      });
  
      const subprojectId = this.subproject.id;
      this.api.axiosInstance.get(`api/attendance/download/template/${subprojectId}`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          const progressBar = document.getElementById('download-progress-bar');
          const progressText = document.getElementById('download-progress-text');
          if (progressBar && progressText) {
            progressBar.style.width = `${percentCompleted}%`;
            progressBar.setAttribute('aria-valuenow', percentCompleted.toString());
            progressText.innerText = `${percentCompleted}%`;
          }
        }
      })
        .then((response: any) => {
          Swal.close();
          const blob = new Blob([response.data], { type: response.headers['content-type'] });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `attendance_template_subproject_${subprojectId}.xls`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          Swal.fire({
            title: 'Success',
            text: 'Template downloaded successfully!',
            icon: 'success',
            customClass: { container: 'high-z-index-swal' }
          });
        }).catch(err => {
          Swal.close();
          const defaultErrorMessage = 'Could not download the template file. Please try again later.';
          let errorMessage = defaultErrorMessage;
  
          if (err.response && err.response.status === 400) {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const errorData = JSON.parse(reader.result as string);
                errorMessage = errorData.message || defaultErrorMessage;
              } catch (e) {
                errorMessage = defaultErrorMessage;
              }
              Swal.fire({
                title: 'Download Failed',
                text: errorMessage,
                icon: 'error',
                customClass: { container: 'high-z-index-swal' }
              });
            };
            reader.onerror = () => {
              Swal.fire({
                title: 'Download Failed',
                text: defaultErrorMessage,
                icon: 'error',
                customClass: { container: 'high-z-index-swal' }
              });
            };
            reader.readAsText(err.response.data);
          } else {
            Swal.fire({
              title: 'Download Failed',
              text: errorMessage,
              icon: 'error',
              customClass: { container: 'high-z-index-swal' }
            });
          }
          console.error('Template download error:', err);
        });
    }
  
    uploadAttendanceFile(): void {
      if (!this.selectedFile) {
        Swal.fire({
          title: 'No File Selected',
          text: 'Please choose a file to upload.',
          icon: 'warning',
          customClass: { container: 'high-z-index-swal' }
        });
        return;
      }
  
      if (!this.subproject) {
        Swal.fire({
          title: 'Error',
          text: 'Subproject not loaded. Cannot upload file.',
          icon: 'error',
          customClass: { container: 'high-z-index-swal' }
        });
        return;
      }
  
      this.uploadInProgress = true;
      Swal.fire({
        title: 'Uploading Attendance File...',
        html: `
          <div class="text-center">
            <p>Please wait while the file is being uploaded...</p>
            <div class="progress" style="height: 20px;">
              <div id="upload-progress-bar" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
                style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <p id="upload-progress-text">0%</p>
          </div>
        `,
        allowOutsideClick: false,
        customClass: { container: 'high-z-index-swal' },
        didOpen: () => {
          Swal.showLoading();
        }
      });
  
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('subprojectId', this.subproject.id.toString());
  
      this.api.axiosInstance.post('api/attendance/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-type' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          const progressBar = document.getElementById('upload-progress-bar');
          const progressText = document.getElementById('upload-progress-text');
          if (progressBar && progressText) {
            progressBar.style.width = `${percentCompleted}%`;
            progressBar.setAttribute('aria-valuenow', percentCompleted.toString());
            progressText.innerText = `${percentCompleted}%`;
          }
        }
      })
        .then((res: any) => {
          Swal.close();
          if (res.data && res.data.code === 200 || res.data.code === 202) {
            Swal.fire({
              title: 'Success',
              text: 'Attendance file uploaded successfully!',
              icon: 'success',
              customClass: { container: 'high-z-index-swal' }
            });
            this.showUploadModal = false;
            this.selectedFile = null;
            if (this.attendanceDate) {
              this.onSearch();
            }
          } else {
            Swal.fire({
              title: 'Upload Failed',
              text: res.data.message || 'An unknown error occurred.',
              icon: 'error',
              customClass: { container: 'high-z-index-swal' }
            });
          }
        })
        .catch(err => {
          Swal.close();
          console.error(err);
          const defaultErrorMessage = 'An error occurred while uploading the file.';
          let errorMessage = defaultErrorMessage;
  
          if (err.response && err.response.status === 400 && err.response.data) {
            // If the error response is a blob, it needs to be read
            if (err.response.data instanceof Blob) {
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const errorData = JSON.parse(reader.result as string);
                  errorMessage = errorData.message || defaultErrorMessage;
                } catch (e) {
                  errorMessage = defaultErrorMessage;
                }
                Swal.fire({
                  title: 'Upload Failed',
                  text: errorMessage,
                  icon: 'error',
                  customClass: { container: 'high-z-index-swal' }
                });
              };
              reader.onerror = () => {
                Swal.fire({
                  title: 'Upload Failed',
                  text: defaultErrorMessage,
                  icon: 'error',
                  customClass: { container: 'high-z-index-swal' }
                });
              };
              reader.readAsText(err.response.data);
            } else if (err.response.data.message) {
              errorMessage = err.response.data.message;
              Swal.fire({
                title: 'Upload Failed',
                text: errorMessage,
                icon: 'error',
                customClass: { container: 'high-z-index-swal' }
              });
            }
          } else {
            Swal.fire({
              title: 'API Error',
              text: errorMessage,
              icon: 'error',
              customClass: { container: 'high-z-index-swal' }
            });
          }
        })
        .finally(() => {
          this.uploadInProgress = false;
          this.cdr.markForCheck();
        });
    }}
