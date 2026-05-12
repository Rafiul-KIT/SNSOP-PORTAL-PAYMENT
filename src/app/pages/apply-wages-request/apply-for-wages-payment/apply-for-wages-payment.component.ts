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
import { SelectModule } from 'primeng/select';
import { BreadcrumbModule } from "primeng/breadcrumb";
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import Swal from 'sweetalert2';

import { ApiService } from '../../../services/api.service';
import { PaymentCycleEnum } from '../../../services/lookup.service';
import { Loader } from "../../../components/loader/loader";
import { handleMultipleFileUpload } from '../../../validators/file-validator';

interface Beneficiary {
  beneficiaryId: number;
  householdNumber: string;
  beneficiaryName: string;
  gender: string;
  age: number;
  phoneNo: string;
  legalStatus: string;
  totalDays: number;
  registrationPhase: 'AF' | 'PARENT' | 'RP';
}

@Component({
  selector: 'app-apply-for-wages-payment',
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
    TableModule
  ],
  providers: [],
  templateUrl: './apply-for-wages-payment.component.html',
  styleUrls: ['./apply-for-wages-payment.component.scss']
})
export class ApplyForWagesPaymentComponent implements OnInit {
  wagesForm!: FormGroup;
  projectData: any = null;
  paymentCycles: any[] = [];
  minDate: Date = new Date();
  loading = false;
  isLoading = false;
  statusMsg = '';
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;
  subprojectId: string | null = null;

  // Table related properties
  originalBeneficiaries: Beneficiary[] = [];
  filteredBeneficiaries: Beneficiary[] = [];
  selectedBeneficiaries: Beneficiary[] = [];
  showTable = false;
  tableLoading = false;
  submitting = false;
  attachments: File[] = [];
  readonly MAX_ATTACHMENT_SIZE_MB = 25;
  totalAttachmentSize = 0;

  // Client-side state
  sortField: string = '';
  sortOrder: number = 1;
  householdNumberFilter: string = '';
  beneficiaryNameFilter: string = '';
  registrationPhaseFilter: string = '';
  registrationPhases: { label: string; value: string }[] = [
    { label: 'AF', value: 'AF' },
    { label: 'PARENT', value: 'PARENT' },
    { label: 'RP', value: 'RP' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.paymentCycles = PaymentCycleEnum;
  }

  ngOnInit(): void {
    this.subprojectId = this.route.snapshot.paramMap.get('id');
    this.initializeForm();
    this.initBreadcrumb();
    if (this.subprojectId) {
      this.loadProjectData(this.subprojectId);
    }
  }

  initBreadcrumb(): void {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Create Wages Request' }];
  }

  attachmentRequiredValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return { required: true };
    }
    return null;
  }

  initializeForm(): void {
    this.wagesForm = this.fb.group(
      {
        wageRate: [{ value: 2.7, disabled: true }, [Validators.required, Validators.min(0.01)]],
        fromDate: [null, Validators.required],
        toDate: [null, Validators.required],
        paymentCycle: [null, Validators.required],
        attachment: [[], [this.attachmentRequiredValidator]]
      },
      { validators: this.dateRangeValidator }
    );
  }

  onFileChange(event: Event): void {
    const { validFiles, error } = handleMultipleFileUpload(event, this.attachments, this.MAX_ATTACHMENT_SIZE_MB);
    this.attachments = validFiles;
    this.wagesForm.get('attachment')?.setValue(this.attachments);
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'File Upload Error',
        text: error
      });
    }
    this.updateTotalAttachmentSize();
  }

  removeAttachment(fileToRemove: File): void {
    this.attachments = this.attachments.filter(file => file !== fileToRemove);
    this.wagesForm.get('attachment')?.setValue(this.attachments);
    this.updateTotalAttachmentSize();
  }

  updateTotalAttachmentSize(): void {
    this.totalAttachmentSize = this.attachments.reduce((total, file) => total + file.size, 0);
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }


  async loadProjectData(id: string): Promise<void> {
    this.isLoading = true;
    this.statusMsg = 'Loading project data...';

    try {
      const requestBody = { id: Number(id) };
      const response: any = await this.apiService.POST(
        'api/subproject/get?page=0&size=1',
        requestBody
      );

      const data = response.data;

      if (data?.code === 200 && Array.isArray(data.content) && data.content.length > 0) {
        this.projectData = data.content[0];
        this.statusMsg = 'Loaded project successfully.';
      } else {
        this.projectData = null;
        this.statusMsg = 'No data found.';
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
      this.projectData = null;
      this.statusMsg = 'Error loading project data.';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load project data'
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const fromDate = group.get('fromDate')?.value;
    const toDate = group.get('toDate')?.value;
    if (fromDate && toDate && fromDate > toDate) {
      return { dateRange: true };
    }
    return null;
  }

  onFromDateSelected(): void {
    const fromDate = this.wagesForm.get('fromDate')?.value;
    if (fromDate) {
      this.minDate = new Date(fromDate);
    }
  }

  async onSearch(): Promise<void> {
    const fromDate = this.wagesForm.get('fromDate');
    const toDate = this.wagesForm.get('toDate');

    if (!fromDate?.value || !toDate?.value || this.wagesForm.errors?.['dateRange']) {
      fromDate?.markAsTouched();
      toDate?.markAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please select valid From Date and To Date'
      });
      return;
    }

    await this.loadBeneficiaries();
  }

  async loadBeneficiaries(): Promise<void> {
    this.tableLoading = true;

    try {
      const formValue = this.wagesForm.getRawValue();
      const requestBody = {
        subprojectId: Number(this.subprojectId),
        fromDate: this.formatDate(formValue.fromDate),
        toDate: this.formatDate(formValue.toDate)
      };

      const response: any = await this.apiService.POST(
        `api/wage-request/lipw/beneficiary/can-be-included?page=0&size=10000`,
        requestBody
      );

      if (response?.data?.code === 200) {
        this.originalBeneficiaries = response.data.content || [];
        this.onFilterChange();
        this.showTable = true;
        this.selectedBeneficiaries = [];

        if (this.originalBeneficiaries.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'No Data',
            text: 'No beneficiaries found for the selected criteria'
          });
        }
      } else {
        this.originalBeneficiaries = [];
        this.filteredBeneficiaries = [];
        this.showTable = false;
        Swal.fire({
          icon: 'warning',
          title: 'No Data',
          text: response?.data?.message || 'No beneficiaries found'
        });
      }
    } catch (error) {
      console.error('Failed to load beneficiaries:', error);
      this.originalBeneficiaries = [];
      this.filteredBeneficiaries = [];
      this.showTable = false;
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load beneficiaries. Please try again.'
      });
    } finally {
      this.tableLoading = false;
      this.cdr.detectChanges();
    }
  }

  onFilterChange(): void {
    let tempBeneficiaries = [...this.originalBeneficiaries];

    if (this.householdNumberFilter) {
      tempBeneficiaries = tempBeneficiaries.filter((b) =>
        b.householdNumber?.toLowerCase().includes(this.householdNumberFilter.toLowerCase())
      );
    }
    if (this.beneficiaryNameFilter) {
      tempBeneficiaries = tempBeneficiaries.filter((b) =>
        b.beneficiaryName?.toLowerCase().includes(this.beneficiaryNameFilter.toLowerCase())
      );
    }
    if (this.registrationPhaseFilter) {
      tempBeneficiaries = tempBeneficiaries.filter(
        (b) => b.registrationPhase === this.registrationPhaseFilter
      );
    }
    
    this.filteredBeneficiaries = tempBeneficiaries;
    this.sortOnClient(this.sortField, false);
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

    this.filteredBeneficiaries.sort((a: any, b: any) => {
      const valueA = a[field];
      const valueB = b[field];
      let result = 0;
      if (valueA < valueB) result = -1;
      else if (valueA > valueB) result = 1;
      return result * this.sortOrder;
    });

    this.filteredBeneficiaries = [...this.filteredBeneficiaries];
  }

  clearFilters(): void {
    this.householdNumberFilter = '';
    this.beneficiaryNameFilter = '';
    this.registrationPhaseFilter = '';
    this.onFilterChange();
  }

  async onSubmitWageRequest(): Promise<void> {
    if (this.selectedBeneficiaries.length === 0) {
      Swal.fire({ icon: 'warning', title: 'No Selection', text: 'Please select at least one beneficiary' });
      return;
    }
    if (this.wagesForm.invalid) {
      this.markFormGroupTouched(this.wagesForm);
      Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'Please fill in all required payment details.' });
      return;
    }

    this.submitting = true;
    Swal.fire({
      title: 'Submitting...',
      text: 'Please wait while your wage request is being processed.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const formValue = this.wagesForm.getRawValue();
      const beneficiaryIds = this.selectedBeneficiaries.map(b => b.beneficiaryId);

      const formData = new FormData();
      formData.append('subprojectId', this.subprojectId as string);
      formData.append('fromDate', this.formatDate(formValue.fromDate));
      formData.append('toDate', this.formatDate(formValue.toDate));
      formData.append('paymentCycle', formValue.paymentCycle);
      
      beneficiaryIds.forEach(id => formData.append('beneficiaryIds', id.toString()));

      if (this.attachments.length > 0) {
        this.attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }
      
      const response: any = await this.apiService.POST_FORM_DATA(
        'api/wage-request/lipw/beneficiary/include',
        formData
      );

      if (response?.data?.code === 200) {
        await Swal.fire({
          title: 'Success!',
          text: `Wage request submitted successfully for ${beneficiaryIds.length} beneficiaries.`,
          icon: 'success'
        }).then(() => {
          this.router.navigate(['/wage-request/apply-lipw']);
        });
      } else {
        await Swal.fire({
          title: 'Error!',
          text: response?.data?.message || 'Failed to submit wage request',
          icon: 'error'
        });
      }
    } catch (error: any) {
      console.error('Failed to submit wage request:', error);
      await Swal.fire({
        title: 'Error!',
        text: error?.error?.message || 'Failed to submit wage request. Please try again.',
        icon: 'error'
      });
    } finally {
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }

  resetForm(): void {
    this.wagesForm.reset({ wageRate: 2.7 });
    this.originalBeneficiaries = [];
    this.filteredBeneficiaries = [];
    this.selectedBeneficiaries = [];
    this.showTable = false;
    this.minDate = new Date();
    this.clearFilters();
    this.sortField = '';
    this.sortOrder = 1;
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.wagesForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getGenderLabel(gender: string): string {
    return gender === 'MALE' ? 'Male' : gender === 'FEMALE' ? 'Female' : gender;
  }

  getLegalStatusLabel(status: string): string {
    const statusMap: any = {
      'HOST': 'Host',
      'IDP': 'IDP',
      'REFUGEE': 'Refugee',
      'RETURNEE': 'Returnee'
    };
    return statusMap[status] || status;
  }
}
