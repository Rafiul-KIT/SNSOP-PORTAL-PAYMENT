import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { Breadcrumb } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { Loader } from '../../../components/loader/loader';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import Swal from 'sweetalert2';

interface Beneficiary {
  id: number;
  householdNumber: string;
  beneficiaryName: string;
  gender: 'MALE' | 'FEMALE';
  age: number;
  phoneNo: string;
  householdMonthlyAvgIncome: number;
  assigned?: boolean;
  isSelected?: boolean;
}
@Component({
  selector: 'app-beneficiary-remove',
  templateUrl: './beneficiary-remove.html',
  styleUrl: './beneficiary-remove.scss',
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
    Breadcrumb,
    Loader,
    TableModule,
    CheckboxModule,
  ],
})
export class BeneficiaryRemove implements OnInit {
  loading = false;
  projectInfo: any;
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;
  subprojectId: string | null = null;
  projectForm!: FormGroup;
  statusMsg = '';
  isLoading = false;
  isSubmitted = false;
  selectedFile: File | null = null;
  apiError = '';
  beneficiaryError = '';

  // Existing assigned beneficiaries
  existingBeneficiaries: Beneficiary[] = [];
  existingTotalRecords = 0;
  existingRows = 10;
  existingFirst = 0;
  isLoadingExisting = false;
  selectAll = false;

  // Store for selected IDs across all pages
  selectedBeneficiaryIds = new Set<number>();

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.initBreadcrumb();
    this.initializeForm();
    this.subprojectId = this.route.snapshot.paramMap.get('id');

    if (this.subprojectId) {
      this.loadProjectData(this.subprojectId);
      this.loadExistingBeneficiaries(0, this.existingRows);
    }
  }

  onFileSelect(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
    this.cdr.detectChanges();
  }

  toggleSelectAll(event: any): void {
    this.selectAll = event.checked;
    this.existingBeneficiaries.forEach((b) => {
      b.isSelected = this.selectAll;
      if (this.selectAll) {
        this.selectedBeneficiaryIds.add(b.id);
      } else {
        this.selectedBeneficiaryIds.delete(b.id);
      }
    });
    this.cdr.detectChanges();
  }

  onRowSelectionChange(beneficiary: Beneficiary): void {
    if (beneficiary.isSelected) {
      this.selectedBeneficiaryIds.add(beneficiary.id);
    } else {
      this.selectedBeneficiaryIds.delete(beneficiary.id);
    }
    this.selectAll =
      this.existingBeneficiaries.length > 0 &&
      this.existingBeneficiaries.every((b) => b.isSelected);
    this.cdr.detectChanges();
  }

  initializeForm(): void {
    this.projectForm = this.fb.group({
      workStartAt: ['', Validators.required],
      inchargeName: ['', [Validators.pattern(/^[a-zA-Z\s]*$/)]],
      comments: [''],
    });
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Beneficiary Removal' }];
  }

  async loadProjectData(id: string): Promise<void> {
    this.isLoading = true;
    this.statusMsg = 'Loading project data...';

    try {
      const requestBody = { id: Number(id) };
      const queryParams = `page=0&size=1`;

      const response: any = await this.apiService.POST(
        `api/subproject/get?${queryParams}`,
        requestBody
      );

      const data = response.data;

      if (
        data?.code === 200 &&
        Array.isArray(data.content) &&
        data.content.length > 0
      ) {
        this.projectInfo = data.content[0];
        this.statusMsg = `Loaded project successfully.`;
      } else {
        this.projectInfo = null;
        this.statusMsg = 'No data found.';
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
      this.statusMsg = 'Error loading project data.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async loadExistingBeneficiaries(page: number, size: number): Promise<void> {
    if (!this.subprojectId || this.isLoadingExisting) return;

    this.isLoadingExisting = true;

    try {
      const response: any = await this.apiService.GET(
        `api/subproject/assign/progress/beneficiary/existing?subprojectId=${this.subprojectId}&page=${page}&size=${size}`
      );

      if (response?.data?.code === 200) {
        const beneficiaries = response.data.content || [];

        this.existingBeneficiaries = beneficiaries.map((b: any) => ({
          id: b.id,
          householdNumber: b.householdNumber,
          beneficiaryName: b.beneficiaryName,
          gender: b.gender,
          age: b.age,
          phoneNo: b.phoneNo,
          householdMonthlyAvgIncome: b.householdMonthlyAvgIncome,
          assigned: b.assigned !== undefined ? b.assigned : true,
          isSelected: this.selectedBeneficiaryIds.has(b.id), // Restore selection
        }));

        this.existingTotalRecords = response.data.totalElements || 0;

        // Update selectAll checkbox state for the current page
        this.selectAll =
          this.existingBeneficiaries.length > 0 &&
          this.existingBeneficiaries.every((b) => b.isSelected);
      } else {
        this.existingBeneficiaries = [];
        this.existingTotalRecords = 0;
      }
    } catch (error) {
      console.error('Failed to load existing beneficiaries:', error);
      this.existingBeneficiaries = [];
      this.existingTotalRecords = 0;
    } finally {
      this.isLoadingExisting = false;
      this.cdr.detectChanges();
    }
  }

onExistingPageChange(event: any): void {
  // If rows per page changes, clear selection
  if (this.existingRows !== event.rows) {
    this.selectedBeneficiaryIds.clear();
    this.selectAll = false;
  }
  const page = event.first / event.rows;

  this.existingFirst = event.first;
  this.existingRows = event.rows;

  // Handle "Show All"
  const size =
    event.rows === this.existingTotalRecords
      ? this.existingTotalRecords
      : event.rows;

  this.loadExistingBeneficiaries(page, size);
}


  getSelectedExistingIds(): number[] {
    return Array.from(this.selectedBeneficiaryIds);
  }

  async removeBeneficiaries(): Promise<void> {
    this.isSubmitted = true;
    this.beneficiaryError = '';
    this.apiError = '';

    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      this.apiError = 'Please fill in all required fields';
      return;
    }

    if (!this.selectedFile) {
      this.apiError = 'Please select an attachment file';
      return;
    }

    const selectedIds = this.getSelectedExistingIds();
    if (selectedIds.length === 0) {
      this.beneficiaryError =
        'Please select at least one beneficiary to remove';
      await Swal.fire(
        'No Beneficiary Selected',
        this.beneficiaryError,
        'warning'
      );
      return;
    }

    const confirmResult = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to remove ${selectedIds.length} beneficiary(ies).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove them',
    });

    if (!confirmResult.isConfirmed) return;

    this.loading = true;

    try {
      const formData = new FormData();
      formData.append('subprojectId', this.subprojectId || '');
      formData.append(
        'workStartAt',
        this.formatDate(this.projectForm.value.workStartAt)
      );
      formData.append('inchargeName', this.projectForm.value.inchargeName || '');
      formData.append('comments', this.projectForm.value.comments || '');
      formData.append('attachment', this.selectedFile, this.selectedFile.name);

      selectedIds.forEach((id) =>
        formData.append('beneficiaryIds', id.toString())
      );

      const response: any = await this.apiService.axiosInstance.patch(
        'api/subproject/assign/progress/beneficiary/remove',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response?.data?.code === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Removed Successfully',
          text: `Successfully removed ${selectedIds.length} beneficiary(ies)!`,
          timer: 2500,
          showConfirmButton: false,
        });

        this.selectedBeneficiaryIds.clear(); // Clear selection
        this.selectAll = false;

        // Reload the list of existing beneficiaries
        this.loadExistingBeneficiaries(
          this.existingFirst / this.existingRows,
          this.existingRows
        );

        this.projectForm.reset();
        this.selectedFile = null;
        this.isSubmitted = false;

        const fileInput = document.getElementById(
          'attachment'
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const message =
          response?.data?.message || 'Failed to remove beneficiaries';
        await Swal.fire('Error', message, 'error');
      }
    } catch (error: any) {
      console.error('=== Error Details ===', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Error removing beneficiaries. Please try again.';
      await Swal.fire('Error', message, 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
