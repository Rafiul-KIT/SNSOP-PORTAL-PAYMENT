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

import { ApiService } from '../../../services/api.service';
import { Loader } from "../../../components/loader/loader";
import { LookupService, LookupItem } from '../../../services/lookup.service';
import Swal from 'sweetalert2';

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
  ],
  providers: []
})
export class ApplyForDisPayment implements OnInit {
  wagesForm!: FormGroup;
  submissionForm!: FormGroup; // New form for submission
  beneficiaries: any[] = [];
  selectedBeneficiaries: any[] = [];
  attachmentFile: File | null = null; // To store the selected file
  showResults = false;
  totalRecords: number = 0;
  rows: number = 10;

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
  selectAll = false;

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
    this.initializeSubmissionForm(); // Init new form
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
      countyId: [null, Validators.required],
      payamId: [null, Validators.required],
      bomaId: [null, Validators.required],
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
        this.loadCounties(stateId);
      }
    });

    this.wagesForm.get('countyId')?.valueChanges.subscribe(countyId => {
      this.wagesForm.get('payamId')?.reset();
      this.wagesForm.get('bomaId')?.reset();
      this.payams = [];
      this.bomas = [];
      if (countyId) {
        this.loadPayams(countyId);
      }
    });

    this.wagesForm.get('payamId')?.valueChanges.subscribe(payamId => {
      this.wagesForm.get('bomaId')?.reset();
      this.bomas = [];
      if (payamId) {
        this.loadBomas(payamId);
      }
    });
  }

  initializeSubmissionForm(): void {
    this.submissionForm = this.fb.group({
      totalDays: [null, [Validators.required, Validators.min(1)]],
      attachment: [null]
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
    this.paymentCycles = Array.from({ length: 11 }, (_, i) => ({
      label: `Payment Cycle ${i + 1}`,
      value: i + 1
    }));
  }

  onFileChange(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.attachmentFile = fileList[0];
      this.submissionForm.patchValue({ attachment: this.attachmentFile?.name });
    } else {
      this.attachmentFile = null;
      this.submissionForm.patchValue({ attachment: null });
    }
  }

  async onSearch(): Promise<void> {
    if (this.wagesForm.invalid) {
      this.markFormGroupTouched(this.wagesForm);
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please fill all required fields' });
      return;
    }

    this.beneficiaries = [];
    this.selectedBeneficiaries = [];
    this.totalRecords = 0;
    this.showResults = true; // Show table container immediately

    await this.fetchBeneficiaries(0, this.rows);
  }

  onPageChange(event: any): void {
    this.loading = true;
    this.rows = event.rows;
    const page = event.first / event.rows;
    this.fetchBeneficiaries(page, this.rows);
  }

  private async fetchBeneficiaries(page: number, size: number): Promise<void> {
    this.loading = true;

    const formValue = this.wagesForm.getRawValue();
    const requestBody = {
      requestYear: formValue.requestYear,
      requestMonthIndex: formValue.requestMonthIndex,
      bomaId: parseInt(formValue.bomaId, 10),
      paymentCycleId: formValue.paymentCycleId
    };

    const url = `api/wage-request/dis/beneficiary/can-be-included?page=${page}&size=${size}`;

    try {
      const response: any = await this.apiService.POST(url, requestBody);
      if ((response.data.code === 200) && response.data && response.data.content) {
        this.beneficiaries = response.data.content;
        this.totalRecords = response.data.totalElements; // Assuming this property exists
        if (this.beneficiaries.length === 0) {
          Swal.fire({ icon: 'info', title: 'Info', text: 'No beneficiaries found for the selected criteria.' });
        }
      } else {
        this.beneficiaries = [];
        this.totalRecords = 0;
        Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'No beneficiaries found or API error' });
      }
    } catch (error: any) {
      this.beneficiaries = [];
      this.totalRecords = 0;
      Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'API call failed' });
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
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

    if (this.attachmentFile) {
      formData.append('attachment', this.attachmentFile, this.attachmentFile.name);
    }

    const url = 'api/wage-request/dis/beneficiary/include';

    try {
      const response: any = await this.apiService.POST_FORM_DATA(url, formData);
      if (response.data && response.data.code === 200) {
        Swal.fire({ icon: 'success', title: 'Success', text: response.data.message || 'DIS wage request submitted successfully.' });
        this.beneficiaries = [];
        this.selectedBeneficiaries = [];
        this.submissionForm.reset({ totalDays: null });
        this.attachmentFile = null;
        this.showResults = false;
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: (response.data && response.data.message) || 'Failed to submit DIS wage request.' });
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
