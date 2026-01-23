import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';

import { ApiService } from '../../../services/api.service';
import { Loader } from "../../../components/loader/loader";
import { LookupService, LookupItem, PaymentCycleEnum } from '../../../services/lookup.service';
import Swal from 'sweetalert2';
import { handleMultipleFileUpload } from '../../../validators/file-validator'; // Updated import

interface Beneficiary {
  beneficiaryId: number;
  householdNumber: string;
  beneficiaryName: string;
  gender: string;
  age: number;
  phoneNo: string;
  legalStatus: string;
  registrationPhase: 'AF' | 'PARENT';
}

@Component({
  selector: 'app-apply-for-dis-payment',
  templateUrl: './apply-for-dis-payment.html',
  styleUrls: ['./apply-for-dis-payment.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    Loader,
    BreadcrumbModule,
    TableModule,
    CheckboxModule,
    InputNumberModule,
    InputTextModule,
  ],
  providers: []
})
export class ApplyForDisPayment implements OnInit {
  wagesForm!: FormGroup;
  submissionForm!: FormGroup;
  
  originalBeneficiaries: Beneficiary[] = [];
  filteredBeneficiaries: any[] = [];
  selectedBeneficiaries: any[] = [];

  attachmentFiles: File[] = []; // Changed to handle multiple files

  showResults = false;
  readonly MAX_ATTACHMENT_SIZE_MB = 25; // Updated max attachment size

  // Dropdown options
  years: any[] = [];
  months: any[] = [];
  states: LookupItem[] = [];
  counties: LookupItem[] = [];
  payams: LookupItem[] = [];
  bomas: LookupItem[] = [];
  paymentCycles: any[] = [];

  loading = false;
  isLoading = true;

  // Client-side state
  sortField: string = '';
  sortOrder: number = 1;
  householdNumberFilter: string = '';
  beneficiaryNameFilter: string = '';
  registrationPhaseFilter: string = '';
  registrationPhases: { label: string; value: string }[] = [
    { label: 'AF', value: 'AF' },
    { label: 'PARENT', value: 'PARENT' },
  ];

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;



  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private lookupService: LookupService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.initializeSubmissionForm();
    this.initBreadcrumb();
    this.populateYearAndMonth();
    this.loadInitialData();
    this.showResults = false;
  }

  initBreadcrumb(): void {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Apply for DIS Payment' }];
  }

  initializeForm(): void {
    this.wagesForm = this.fb.group({
      requestYear: [new Date().getFullYear(), Validators.required],
      requestMonthIndex: [new Date().getMonth() + 1, Validators.required],
      stateId: [null, Validators.required],
      countyId: [{ value: null, disabled: true }, Validators.required],
      payamId: [{ value: null, disabled: true }, Validators.required],
      bomaId: [{ value: null, disabled: true }, Validators.required],
      paymentCycleId: [null, Validators.required]
    });

    this.wagesForm.get('stateId')?.valueChanges.subscribe(stateId => {
      this.wagesForm.get('countyId')?.reset();
      this.wagesForm.get('payamId')?.reset();
      this.wagesForm.get('bomaId')?.reset();
      this.counties = [];
      this.payams = [];
      this.bomas = [];
      if (stateId) {
        this.wagesForm.get('countyId')?.enable();
        this.loadCounties(stateId);
      } else {
        this.wagesForm.get('countyId')?.disable();
      }
    });

    this.wagesForm.get('countyId')?.valueChanges.subscribe(countyId => {
      this.wagesForm.get('payamId')?.reset();
      this.wagesForm.get('bomaId')?.reset();
      this.payams = [];
      this.bomas = [];
      if (countyId) {
        this.wagesForm.get('payamId')?.enable();
        this.loadPayams(countyId);
      } else {
        this.wagesForm.get('payamId')?.disable();
      }
    });

    this.wagesForm.get('payamId')?.valueChanges.subscribe(payamId => {
      this.wagesForm.get('bomaId')?.reset();
      this.bomas = [];
      if (payamId) {
        this.wagesForm.get('bomaId')?.enable();
        this.loadBomas(payamId);
      } else {
        this.wagesForm.get('bomaId')?.disable();
      }
    });
  }

  populateYearAndMonth(): void {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.years.push({ label: currentYear - i, value: currentYear - i });
    }
    this.months = [
      { label: 'January', value: 1 }, { label: 'February', value: 2 },
      { label: 'March', value: 3 }, { label: 'April', value: 4 },
      { label: 'May', value: 5 }, { label: 'June', value: 6 },
      { label: 'July', value: 7 }, { label: 'August', value: 8 },
      { label: 'September', value: 9 }, { label: 'October', value: 10 },
      { label: 'November', value: 11 }, { label: 'December', value: 12 }
    ];
  }

  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    try {
      await this.loadStates();
      this.loadPaymentCycles();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load initial data' });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async loadStates(): Promise<void> {
    try {
      this.states = await this.lookupService.getOrFetchStateList();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error loading states' });
    }
  }

  async loadCounties(stateId: string): Promise<void> {
    try {
      this.counties = await this.lookupService.getCountyListByStateId(stateId);
      this.cdr.detectChanges();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error loading counties' });
    }
  }

  async loadPayams(countyId: string): Promise<void> {
    try {
      this.payams = await this.lookupService.getPayamListByCountyId(countyId);
      this.cdr.detectChanges();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error loading payams' });
    }
  }

  async loadBomas(payamId: string): Promise<void> {
    try {
      this.bomas = await this.lookupService.getBomaListByPayamId(payamId);
      this.cdr.detectChanges();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error loading bomas' });
    }
  }

  loadPaymentCycles(): void {
    this.paymentCycles = PaymentCycleEnum;
  }

  initializeSubmissionForm(): void {
    this.submissionForm = this.fb.group({
      totalDays: [null, [Validators.required, Validators.min(1)]],
      // attachment control is no longer needed here, files are managed in attachmentFiles array
    });
  }

  onFileChange(event: Event): void {
    const result = handleMultipleFileUpload(event, this.attachmentFiles, this.MAX_ATTACHMENT_SIZE_MB);
    if (result.error) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Error',
        html: result.error,
      });
    } else {
      this.attachmentFiles = result.validFiles;
    }
  }

  removeAttachment(index: number): void {
    this.attachmentFiles.splice(index, 1);
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  async onSearch(): Promise<void> {
    if (this.wagesForm.invalid) {
      this.markFormGroupTouched(this.wagesForm);
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please fill all required fields' });
      return;
    }

    this.originalBeneficiaries = [];
    this.filteredBeneficiaries = [];
    this.selectedBeneficiaries = [];
    this.showResults = true;

    await this.fetchBeneficiaries();
  }

  private async fetchBeneficiaries(): Promise<void> {
    this.loading = true;

    const formValue = this.wagesForm.getRawValue();
    const requestBody = {
      requestYear: formValue.requestYear,
      requestMonthIndex: formValue.requestMonthIndex,
      bomaId: parseInt(formValue.bomaId, 10),
      paymentCycleId: formValue.paymentCycleId
    };

    const url = `api/wage-request/dis/beneficiary/can-be-included?page=0&size=10000`;

    try {
      const response: any = await this.apiService.POST(url, requestBody);
      if ((response.data.code === 200) && response.data && response.data.content) {
        this.originalBeneficiaries = response.data.content;
        this.onFilterChange();
        if (this.originalBeneficiaries.length === 0) {
          Swal.fire({ icon: 'info', title: 'Info', text: 'No beneficiaries found for the selected criteria.' });
        }
      } else {
        this.originalBeneficiaries = [];
        this.filteredBeneficiaries = [];
        Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'No beneficiaries found or API error' });
      }
    } catch (error: any) {
      this.originalBeneficiaries = [];
      this.filteredBeneficiaries = [];
      Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'API call failed' });
    } finally {
      this.loading = false;
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
  
  async onSubmitDisRequest(): Promise<void> {
    if (this.submissionForm.invalid) {
      this.markFormGroupTouched(this.submissionForm);
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please fill all required fields for submission.' });
      return;
    }
    if (this.selectedBeneficiaries.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please select at least one beneficiary.' });
      return;
    }

    this.loading = true;

    const searchFormValue = this.wagesForm.getRawValue();
    const submissionFormValue = this.submissionForm.getRawValue();
    const beneficiaryIds = this.selectedBeneficiaries.map(b => b.beneficiaryId);

    const formData = new FormData();
    formData.append('requestYear', searchFormValue.requestYear);
    formData.append('requestMonthIndex', searchFormValue.requestMonthIndex);
    formData.append('bomaId', searchFormValue.bomaId);
    formData.append('paymentCycleId', searchFormValue.paymentCycleId);
    formData.append('totalDays', submissionFormValue.totalDays);

    beneficiaryIds.forEach(id => {
      formData.append('beneficiaryIds', id);
    });

    if (this.attachmentFiles.length > 0) {
      this.attachmentFiles.forEach(file => {
        formData.append('attachment', file, file.name);
      });
    }

    const url = 'api/wage-request/dis/beneficiary/include';

    try {
      const response: any = await this.apiService.POST_FORM_DATA(url, formData);
      if (response.data && response.data.code === 200) {
        Swal.fire({ icon: 'success', title: 'Success', text:  'DIS wage request submitted successfully.' });
        this.originalBeneficiaries = [];
        this.filteredBeneficiaries = [];
        this.selectedBeneficiaries = [];
        this.submissionForm.reset({ totalDays: null });
        this.attachmentFiles = []; // Clear attachments after successful submission
        this.showResults = false;
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text:  'Failed to submit DIS wage request.' });
      }
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'API call failed' });
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.wagesForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  isSubmissionFieldInvalid(fieldName: string): boolean {
    const field = this.submissionForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}