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
import { Breadcrumb } from "primeng/breadcrumb";
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import Swal from 'sweetalert2';

import { ApiService } from '../../../services/api.service';
import { Loader } from "../../../components/loader/loader";

interface Beneficiary {
  beneficiaryId: number;
  householdNumber: string;
  beneficiaryName: string;
  gender: string;
  age: number;
  phoneNo: string;
  legalStatus: string;
  totalDays: number;
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
    Breadcrumb,
    TableModule
  ],
  providers: [],
  templateUrl: './apply-for-wages-payment.component.html'
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
  beneficiaries: Beneficiary[] = [];
  selectedBeneficiaries: Beneficiary[] = [];
  showTable = false;
  tableLoading = false;
  submitting = false;

  // Pagination
  totalRecords = 0;
  pageNumber = 0;
  pageSize = 10;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.initializePaymentCycles();
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

  initializeForm(): void {
    this.wagesForm = this.fb.group(
      {
        wageRate: [{ value: 2.7, disabled: true }, [Validators.required, Validators.min(0.01)]],
        fromDate: [null, Validators.required],
        toDate: [null, Validators.required],
        paymentCycle: [null, Validators.required]
      },
      { validators: this.dateRangeValidator }
    );
  }

  initializePaymentCycles(): void {
    this.paymentCycles = [
      { label: 'Payment Cycle 1', value: 1 },
      { label: 'Payment Cycle 2', value: 2 },
      { label: 'Payment Cycle 3', value: 3 },
      { label: 'Payment Cycle 4', value: 4 },
      { label: 'Payment Cycle 5', value: 5 },
      { label: 'Payment Cycle 6', value: 6 },
      { label: 'Payment Cycle 7', value: 7 },
      { label: 'Payment Cycle 8', value: 8 },
      { label: 'Payment Cycle 9', value: 9 },
      { label: 'Payment Cycle 10', value: 10 },
      { label: 'Payment Cycle 11', value: 11 },
    ];
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
  // Remove payment cycle from validation check
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

  await this.loadBeneficiaries(0);
}

  async loadBeneficiaries(page: number): Promise<void> {
    this.tableLoading = true;
    this.pageNumber = page;

    try {
      const formValue = this.wagesForm.getRawValue();
      const requestBody = {
        subprojectId: Number(this.subprojectId),
        fromDate: this.formatDate(formValue.fromDate),
        toDate: this.formatDate(formValue.toDate)
      };

      const response: any = await this.apiService.POST(
        `api/wage-request/lipw/beneficiary/can-be-included?page=${page}&size=${this.pageSize}`,
        requestBody
      );

      if (response?.data?.code === 200) {
        this.beneficiaries = response.data.content || [];
        this.totalRecords = response.data.totalElements || 0;
        this.showTable = true;
        this.selectedBeneficiaries = [];

        if (this.beneficiaries.length === 0) {
                  Swal.fire({
                    icon: 'info',
                    title: 'No Data',
                    text: 'No beneficiaries found for the selected criteria'
                  });        }
      } else {
        this.beneficiaries = [];
        this.showTable = false;
        Swal.fire({
          icon: 'warning',
          title: 'No Data',
          text: response?.data?.message || 'No beneficiaries found'
        });
      }
    } catch (error) {
      console.error('Failed to load beneficiaries:', error);
      this.beneficiaries = [];
      this.showTable = false;
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load beneficiaries. Please try again.'
              });    } finally {
      this.tableLoading = false;
      this.cdr.detectChanges();
    }
  }

onPageChange(event: any): void {
  if (event && event.page !== undefined) {
    this.loadBeneficiaries(event.page);
  }
}

  async onSubmitWageRequest(): Promise<void> {
    if (this.selectedBeneficiaries.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Selection',
        text: 'Please select at least one beneficiary'
      });
      return;
    }

    if (this.wagesForm.invalid) {
      this.markFormGroupTouched(this.wagesForm);
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all required payment details.'
      });
      return;
    }


    this.submitting = true;

    try {
      const formValue = this.wagesForm.getRawValue();
      const beneficiaryIds = this.selectedBeneficiaries.map(b => b.beneficiaryId);

      const requestBody = {
        subprojectId: Number(this.subprojectId),
        fromDate: this.formatDate(formValue.fromDate),
        toDate: this.formatDate(formValue.toDate),
        paymentCycle: Number(formValue.paymentCycle),
        beneficiaryIds: beneficiaryIds
      };

      const response: any = await this.apiService.POST(
        'api/wage-request/lipw/beneficiary/include',
        requestBody
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
    this.wagesForm.reset({
      wageRate: 2.7
    });
    this.beneficiaries = [];
    this.selectedBeneficiaries = [];
    this.showTable = false;
    this.minDate = new Date();
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