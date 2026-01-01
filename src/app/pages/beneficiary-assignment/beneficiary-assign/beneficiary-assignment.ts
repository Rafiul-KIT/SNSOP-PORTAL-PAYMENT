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
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { Loader } from '../../../components/loader/loader';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import Swal from 'sweetalert2';
import { handleFileUpload } from '../../../validators/file-validator';

interface Beneficiary {
  id: number;
  householdNumber: string;
  beneficiaryName: string;
  gender: 'MALE' | 'FEMALE';
  registrationPhase: 'AF' | 'PARENT';
  age: number;
  phoneNo: string;
  householdMonthlyAvgIncome: number;
  assigned?: boolean;
  isSelected?: boolean;
}

@Component({
  selector: 'app-beneficiary-assignment',
  templateUrl: './beneficiary-assignment.html',
  styleUrl: './beneficiary-assignment.scss',
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
    BreadcrumbModule,
    Loader,
    TableModule,
    CheckboxModule,
  ],
})
export class BeneficiaryAssignment implements OnInit {
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

  // Data arrays
  originalBeneficiaries: Beneficiary[] = []; // Holds data from API response for the current page
  filteredBeneficiaries: Beneficiary[] = []; // Data displayed in the table after filters/sort

  // Paginator state
  canBeAssignedTotalRecords = 0;
  canBeAssignedRows = 10;
  canBeAssignedFirst = 0;
  isLoadingCanBeAssigned = false;
  beneficiaryError = '';

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
  ];


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
      // Initial load is handled by p-table's onLazyLoad event
    }
  }

  onFileSelect(event: any): void {
    handleFileUpload(event, this.projectForm, 'attachment');
  }

  toggleSelectAll(event: any): void {
    this.selectAll = event.checked;
    this.filteredBeneficiaries.forEach((b) => {
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
      this.filteredBeneficiaries.length > 0 &&
      this.filteredBeneficiaries.every((b) => b.isSelected);
    this.cdr.detectChanges();
  }

  initializeForm(): void {
    this.projectForm = this.fb.group({
      workStartAt: ['', Validators.required],
      inchargeName: ['', [Validators.pattern(/^[a-zA-Z\s]*$/)]],
      comments: [''],
      attachment: [null, Validators.required],
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
        this.originalBeneficiaries = beneficiaries.map((b: any) => ({
          ...b,
          isSelected: this.selectedBeneficiaryIds.has(b.id),
        }));
        this.canBeAssignedTotalRecords = response.data.totalElements || 0;
        this.onFilterChange(); // Apply filters to the newly loaded data
      } else {
        this.originalBeneficiaries = [];
        this.filteredBeneficiaries = [];
        this.canBeAssignedTotalRecords = 0;
      }
    } catch (error) {
      console.error('Failed to load can be assigned beneficiaries:', error);
      this.originalBeneficiaries = [];
      this.filteredBeneficiaries = [];
      this.canBeAssignedTotalRecords = 0;
    } finally {
      this.isLoadingCanBeAssigned = false;
      this.cdr.detectChanges();
    }
  }

  onFilterChange(): void {
    let tempBeneficiaries = [...this.originalBeneficiaries];

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

    this.filteredBeneficiaries = tempBeneficiaries;
    this.sortOnClient(this.sortField, false); // Re-apply sort without flipping order
  }

  onCanBeAssignedPageChange(event: any): void {
    if (this.canBeAssignedRows !== event.rows) {
      this.selectedBeneficiaryIds.clear();
    }

    // When paginating, reset client-side state
    this.householdNumberFilter = '';
    this.beneficiaryNameFilter = '';
    this.registrationPhaseFilter = '';
    this.sortField = '';
    this.sortOrder = 1;

    this.canBeAssignedFirst = event.first;
    this.canBeAssignedRows = event.rows;

    const size =
      event.rows === this.canBeAssignedTotalRecords
        ? this.canBeAssignedTotalRecords
        : event.rows;
    this.loadCanBeAssignedBeneficiaries(event.first / event.rows, size);
  }

  getSortIcon(field: string): string {
    if (field === this.sortField) {
      return this.sortOrder === 1 ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down';
    }
    return 'pi-sort-alt';
  }

  sortOnClient(field: string, flipOrder: boolean = true): void {
    if (!field) return; // Do not sort if field is empty

    if (flipOrder) {
      if (this.sortField === field) {
        this.sortOrder = -this.sortOrder;
      } else {
        this.sortField = field;
        this.sortOrder = 1;
      }
    }

    this.filteredBeneficiaries.sort((a: any, b: any) => {
      const valueA = a[field];
      const valueB = b[field];
      let result = 0;
      if (valueA < valueB) result = -1;
      else if (valueA > valueB) result = 1;
      return result * this.sortOrder;
    });

    this.filteredBeneficiaries = [...this.filteredBeneficiaries];
    this.cdr.detectChanges();
  }

  clearFilters(): void {
    this.householdNumberFilter = '';
    this.beneficiaryNameFilter = '';
    this.registrationPhaseFilter = '';
    this.onFilterChange(); // Re-apply filters
  }

  getSelectedCanBeAssignedIds(): number[] {
    return Array.from(this.selectedBeneficiaryIds);
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

    const selectedIds = this.getSelectedCanBeAssignedIds();
    if (selectedIds.length === 0) {
      this.beneficiaryError =
        'Please select at least one beneficiary to assign';
      await Swal.fire(
        'No Beneficiary Selected',
        this.beneficiaryError,
        'warning'
      );
      return;
    }

    this.loading = true;

    try {
      const formValue = this.projectForm.value;
      const formData = new FormData();
      formData.append('subprojectId', this.subprojectId || '');
      formData.append('workStartAt',this.formatDate(formValue.workStartAt));
      formData.append('inchargeName', formValue.inchargeName || '');
      formData.append('comments', formValue.comments || '');
      formData.append('attachment', formValue.attachment, formValue.attachment.name);
      selectedIds.forEach((id) =>
        formData.append('beneficiaryIds', id.toString())
      );

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
          showConfirmButton: false,
        });

        this.selectedBeneficiaryIds.clear();
        this.selectAll = false;

        await this.loadCanBeAssignedBeneficiaries(
          this.canBeAssignedFirst / this.canBeAssignedRows,
          this.canBeAssignedRows
        );

        this.projectForm.reset();
        this.isSubmitted = false;
        const fileInput = document.getElementById('attachment') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        this.router.navigate(['beneficiaries/assignment-asign-list']);
      } else {
        const message =
          response?.data?.message || 'Failed to assign beneficiaries';
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

  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
