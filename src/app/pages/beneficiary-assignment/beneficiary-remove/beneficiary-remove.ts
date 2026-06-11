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
import { SelectModule } from 'primeng/select'; // Using SelectModule as per project convention
import { BreadcrumbModule } from 'primeng/breadcrumb'; // Corrected module import
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { Loader } from '../../../components/loader/loader';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import Swal from 'sweetalert2';
import { handleMultipleFileUpload } from '../../../validators/file-validator';

interface Beneficiary {
  id: number;
  householdNumber: string;
  beneficiaryName: string;
  gender: 'MALE' | 'FEMALE';
  registrationPhase: 'AF' | 'PARENT' | 'RP'; 
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
    SelectModule, // Use SelectModule
    BreadcrumbModule, // Use BreadcrumbModule
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
  apiError = '';
  beneficiaryError = '';

  // Existing assigned beneficiaries
  originalExistingBeneficiaries: Beneficiary[] = []; // Holds data from API response for the current page
  filteredExistingBeneficiaries: Beneficiary[] = []; // Data displayed in the table after filters/sort
  existingTotalRecords = 0;
  existingRows = 10;
  existingFirst = 0;
  isLoadingExisting = false;

  // Selection state
  selectAll = false;
  selectedBeneficiaryIds = new Set<number>();

  // Client-side sort state
  sortField: string = '';
  sortOrder: number = 1;

  // Filter properties
  householdNumberFilter: string = '';
  beneficiaryNameFilter: string = '';
  registrationPhaseFilter: string = '';
  registrationPhases: { label: string; value: string }[] = [
    { label: 'AF', value: 'AF' },
    { label: 'PARENT', value: 'PARENT' },
    { label: 'RP', value: 'RP' },
  ];

  // Multiple attachments
  attachments: File[] = [];

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
    const result = handleMultipleFileUpload(event, this.attachments);
    this.attachments = result.validFiles;

    if (result.error) {
      Swal.fire({
        icon: 'error',
        title: 'File Upload Error',
        text: result.error,
      });
    }

    // Update form control validity
    if (this.attachments.length > 0) {
      this.projectForm.get('attachments')?.setValue(this.attachments);
      this.projectForm.get('attachments')?.setErrors(null);
    } else {
      this.projectForm.get('attachments')?.setValue(null);
      this.projectForm.get('attachments')?.setErrors({ required: true });
    }
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
    if (this.attachments.length === 0) {
      this.projectForm.get('attachments')?.setValue(null);
      this.projectForm.get('attachments')?.setErrors({ required: true });
    } else {
      this.projectForm.get('attachments')?.setValue(this.attachments);
    }
  }

  toggleSelectAll(event: any): void {
    this.selectAll = event.checked;
    this.filteredExistingBeneficiaries.forEach((b) => {
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
      this.filteredExistingBeneficiaries.length > 0 &&
      this.filteredExistingBeneficiaries.every((b) => b.isSelected);
    this.cdr.detectChanges();
  }

  initializeForm(): void {
    this.projectForm = this.fb.group({
      workStartAt: ['', Validators.required],
      inchargeName: ['', [Validators.pattern(/^[a-zA-Z\s]*$/)]],
      comments: [''],
      attachments: [null, Validators.required],
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

        this.originalExistingBeneficiaries = beneficiaries.map((b: any) => ({
          ...b,
          assigned: b.assigned !== undefined ? b.assigned : true,
          isSelected: this.selectedBeneficiaryIds.has(b.id), // Restore selection
          registrationPhase: b.registrationPhase || '', // Ensure registrationPhase is mapped
        }));

        this.existingTotalRecords = response.data.totalElements || 0;
        this.onFilterChange(); // Apply filters and sort to newly loaded data
      } else {
        this.originalExistingBeneficiaries = [];
        this.filteredExistingBeneficiaries = [];
        this.existingTotalRecords = 0;
      }
    } catch (error) {
      console.error('Failed to load existing beneficiaries:', error);
      this.originalExistingBeneficiaries = [];
      this.filteredExistingBeneficiaries = [];
      this.existingTotalRecords = 0;
    } finally {
      this.isLoadingExisting = false;
      this.cdr.detectChanges();
    }
  }

  onFilterChange(): void {
    let tempBeneficiaries = [...this.originalExistingBeneficiaries];

    if (this.householdNumberFilter) {
      tempBeneficiaries = tempBeneficiaries.filter((b) =>
        b.householdNumber
          ?.toLowerCase()
          .includes(this.householdNumberFilter.toLowerCase())
      );
    }
    if (this.beneficiaryNameFilter) {
      tempBeneficiaries = tempBeneficiaries.filter((b) =>
        b.beneficiaryName
          ?.toLowerCase()
          .includes(this.beneficiaryNameFilter.toLowerCase())
      );
    }
    if (this.registrationPhaseFilter) {
      tempBeneficiaries = tempBeneficiaries.filter(
        (b) => b.registrationPhase === this.registrationPhaseFilter
      );
    }

    this.filteredExistingBeneficiaries = tempBeneficiaries;
    this.sortOnClient(this.sortField, false); // Re-apply sort without flipping order
  }

  onExistingPageChange(event: any): void {
    if (this.existingRows !== event.rows) {
      this.selectedBeneficiaryIds.clear();
      this.selectAll = false;
    }

    // When paginating, reset client-side state
    this.householdNumberFilter = '';
    this.beneficiaryNameFilter = '';
    this.registrationPhaseFilter = '';
    this.sortField = '';
    this.sortOrder = 1;

    this.existingFirst = event.first;
    this.existingRows = event.rows;

    const size =
      event.rows === this.existingTotalRecords
        ? this.existingTotalRecords
        : event.rows;
    this.loadExistingBeneficiaries(event.first / event.rows, size);
  }

  getSortIcon(field: string): string {
    if (field === this.sortField) {
      return this.sortOrder === 1 ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down';
    }
    return 'pi-sort-alt';
  }

  sortOnClient(field: string, flipOrder: boolean = true): void {
    if (!field) return;

    if (flipOrder) {
      if (this.sortField === field) {
        this.sortOrder = -this.sortOrder;
      } else {
        this.sortField = field;
        this.sortOrder = 1;
      }
    }

    this.filteredExistingBeneficiaries.sort((a: any, b: any) => {
      const valueA = a[field];
      const valueB = b[field];
      let result = 0;
      if (valueA < valueB) result = -1;
      else if (valueA > valueB) result = 1;
      return result * this.sortOrder;
    });

    this.filteredExistingBeneficiaries = [...this.filteredExistingBeneficiaries];
    this.cdr.detectChanges();
  }

  clearFilters(): void {
    this.householdNumberFilter = '';
    this.beneficiaryNameFilter = '';
    this.registrationPhaseFilter = '';
    this.onFilterChange(); // Re-apply filters
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
    this.cdr.detectChanges();

    try {
      const formValue = this.projectForm.value;
      const formData = new FormData();
      formData.append('subprojectId', this.subprojectId || '');
      formData.append('workStartAt', this.formatDate(formValue.workStartAt));
      formData.append('inchargeName', formValue.inchargeName || '');
      formData.append('comments', formValue.comments || '');
      this.attachments.forEach((file) =>
        formData.append('attachments', file, file.name)
      );
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
        await this.loadExistingBeneficiaries(
          this.existingFirst / this.existingRows,
          this.existingRows
        );

        this.projectForm.reset();
        this.isSubmitted = false;
        this.attachments = [];
        const fileInput = document.getElementById('attachments') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        this.router.navigate(['beneficiaries/assignment-remove-list']); // Assuming this is the list route
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