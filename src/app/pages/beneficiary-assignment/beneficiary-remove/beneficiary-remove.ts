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
  activeTabIndex: number = 0;

  // Can be assigned beneficiaries
  canBeAssignedBeneficiaries: Beneficiary[] = [];
  canBeAssignedTotalRecords = 0;
  canBeAssignedRows = 10;
  canBeAssignedFirst = 0;
  isLoadingCanBeAssigned = false;
  beneficiaryError = '';
  // Existing assigned beneficiaries
  existingBeneficiaries: Beneficiary[] = [];
  existingTotalRecords = 0;
  existingRows = 10;
  existingFirst = 0;
  isLoadingExisting = false;
  existingBeneficiariesLoaded = false;
selectAll = false;
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
      this.loadCanBeAssignedBeneficiaries(0, this.canBeAssignedRows);
    }
  }

  onFileSelect(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      console.log(
        'File selected:',
        this.selectedFile.name,
        this.selectedFile.type,
        this.selectedFile.size
      );
    } else {
      this.selectedFile = null;
    }
    this.cdr.detectChanges();
  }
toggleSelectAll(event: any): void {
  this.selectAll = event.checked;
  this.canBeAssignedBeneficiaries.forEach(b => (b.isSelected = this.selectAll));
  this.cdr.detectChanges();
}

onRowSelectionChange(): void {
  // Keep header checkbox synced
  const allSelected = this.canBeAssignedBeneficiaries.every(b => b.isSelected);
  const noneSelected = this.canBeAssignedBeneficiaries.every(b => !b.isSelected);
  this.selectAll = allSelected && !noneSelected;
  this.cdr.detectChanges();
}
  initializeForm(): void {
    this.projectForm = this.fb.group({
      workStartAt: ['', Validators.required],
      inchargeName: [''],
      comments: [''],
    });
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Beneficiary Assignment' }];
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

  async loadCanBeAssignedBeneficiaries(
    page: number,
    size: number
  ): Promise<void> {
    if (!this.subprojectId) return;

    this.isLoadingCanBeAssigned = true;

    try {
      const response: any = await this.apiService.GET(
        `api/subproject/assign/progress/beneficiary/can-be-assigned?subprojectId=${this.subprojectId}&page=${page}&size=${size}`
      );

      if (response?.data?.code === 200) {
        const beneficiaries = response.data.content || [];

        this.canBeAssignedBeneficiaries = beneficiaries.map((b: any) => ({
          id: b.id,
          householdNumber: b.householdNumber,
          beneficiaryName: b.beneficiaryName,
          gender: b.gender,
          age: b.age,
          phoneNo: b.phoneNo,
          householdMonthlyAvgIncome: b.householdMonthlyAvgIncome,
          assigned: b.assigned || false,
          isSelected: false,
        }));

        this.canBeAssignedTotalRecords = response.data.totalElements || 0;
      } else {
        this.canBeAssignedBeneficiaries = [];
        this.canBeAssignedTotalRecords = 0;
      }
    } catch (error) {
      console.error('Failed to load can be assigned beneficiaries:', error);
      this.canBeAssignedBeneficiaries = [];
      this.canBeAssignedTotalRecords = 0;
    } finally {
      this.isLoadingCanBeAssigned = false;
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
          isSelected: false,
        }));

        this.existingTotalRecords = response.data.totalElements || 0;
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

  onCanBeAssignedPageChange(event: any): void {
    const page = event.first / event.rows;
    this.canBeAssignedFirst = event.first;
    this.canBeAssignedRows = event.rows;
    this.loadCanBeAssignedBeneficiaries(page, this.canBeAssignedRows);
  }

  onExistingPageChange(event: any): void {
    const page = event.first / event.rows;
    this.existingFirst = event.first;
    this.existingRows = event.rows;
    this.loadExistingBeneficiaries(page, this.existingRows);
  }

  onBeneficiarySelect(beneficiary: Beneficiary): void {
    this.cdr.detectChanges();
  }

  getSelectedCanBeAssignedIds(): number[] {
    return this.canBeAssignedBeneficiaries
      .filter((b) => b.isSelected === true)
      .map((b) => b.id);
  }

  getSelectedExistingIds(): number[] {
    return this.existingBeneficiaries
      .filter((b) => b.isSelected === true)
      .map((b) => b.id);
  }


async assignBeneficiaries(): Promise<void> {
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

  const selectedIds = this.getSelectedCanBeAssignedIds();
  if (selectedIds.length === 0) {
    this.beneficiaryError = 'Please select at least one beneficiary to assign';
    await Swal.fire('No Beneficiary Selected', this.beneficiaryError, 'warning');
    return;
  }

  this.loading = true;

  try {
    const formData = new FormData();
    formData.append('subprojectId', this.subprojectId || '');
    formData.append('workStartAt', this.formatDate(this.projectForm.value.workStartAt));
    formData.append('inchargeName', this.projectForm.value.inchargeName || '');
    formData.append('comments', this.projectForm.value.comments || '');
    formData.append('attachment', this.selectedFile, this.selectedFile.name);
    selectedIds.forEach(id => formData.append('beneficiaryIds', id.toString()));
for (const pair of formData.entries()) {
  console.log(pair[0] + ':', pair[1]);
}

    const response: any = await this.apiService.axiosInstance.post(
      'api/subproject/assign/progress/beneficiary/save',
      formData
    );

    if (response?.data?.code === 200) {
      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Successfully assigned ${selectedIds.length} beneficiary(ies)!`,
        timer: 2500,
        showConfirmButton: false
      });

      await Promise.all([
        this.loadCanBeAssignedBeneficiaries(this.canBeAssignedFirst / this.canBeAssignedRows, this.canBeAssignedRows),
        // this.loadExistingBeneficiaries(this.existingFirst / this.existingRows, this.existingRows),
      ]);

      this.projectForm.reset();
      this.selectedFile = null;
      this.isSubmitted = false;

      const fileInput = document.getElementById('attachment') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } else {
      const message = response?.data?.message || 'Failed to assign beneficiaries';
      await Swal.fire('Error', message, 'error');
    }
  } catch (error: any) {
    console.error('=== Error Details ===', error);
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Error assigning beneficiaries. Please try again.';
    await Swal.fire('Error', message, 'error');
  } finally {
    this.loading = false;
    this.cdr.detectChanges();
  }
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
    this.beneficiaryError = 'Please select at least one beneficiary to remove';
    await Swal.fire('No Beneficiary Selected', this.beneficiaryError, 'warning');
    return;
  }

  const confirmResult = await Swal.fire({
    title: 'Are you sure?',
    text: `You are about to remove ${selectedIds.length} beneficiary(ies).`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, remove them'
  });

  if (!confirmResult.isConfirmed) return;

  this.loading = true;

  try {
  
    const formData = new FormData();
    formData.append('subprojectId', this.subprojectId || '');
    formData.append('workStartAt', this.formatDate(this.projectForm.value.workStartAt));
    formData.append('inchargeName', this.projectForm.value.inchargeName || '');
    formData.append('comments', this.projectForm.value.comments || '');
    formData.append('attachment', this.selectedFile, this.selectedFile.name);

    selectedIds.forEach(id => formData.append('beneficiaryIds', id.toString()));

    const response: any = await this.apiService.axiosInstance.patch(
      'api/subproject/assign/progress/beneficiary/remove',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );

    if (response?.data?.code === 200) {
      await Swal.fire({
        icon: 'success',
        title: 'Removed Successfully',
        text: `Successfully removed ${selectedIds.length} beneficiary(ies)!`,
        timer: 2500,
        showConfirmButton: false
      });

      await Promise.all([
        this.loadCanBeAssignedBeneficiaries(
          this.canBeAssignedFirst / this.canBeAssignedRows,
          this.canBeAssignedRows
        ),
        this.loadExistingBeneficiaries(
          this.existingFirst / this.existingRows,
          this.existingRows
        ),
      ]);

      this.projectForm.reset();
      this.selectedFile = null;
      this.isSubmitted = false;

      const fileInput = document.getElementById('attachment') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } else {
      const message = response?.data?.message || 'Failed to remove beneficiaries';
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

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    if (index === 1 && !this.existingBeneficiariesLoaded) {
      this.loadExistingBeneficiaries(0, this.existingRows);
      this.existingBeneficiariesLoaded = true;
    }
    this.cdr.detectChanges();
  }
}
