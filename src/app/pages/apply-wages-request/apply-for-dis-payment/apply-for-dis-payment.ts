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

import { ApiService } from '../../../services/api.service';
import { Loader } from "../../../components/loader/loader";

@Component({
  selector: 'app-apply-for-dis-payment',

  templateUrl: './apply-for-dis-payment.html',
  styleUrl: './apply-for-dis-payment.scss',
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
    Breadcrumb
  ],

})
export class ApplyForDisPayment implements OnInit {
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
    this.breadcrumbItems = [{ label: 'Create Wages Request For Dis' }];
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

  onSearch(): void {
    if (this.wagesForm.valid) {
      this.loading = true;
      console.log('Form Data:', this.wagesForm.getRawValue());
      // Simulate API call
      setTimeout(() => {
        this.loading = false;
        // Navigate to results or show success message
      }, 2000);
    } else {
      this.markFormGroupTouched(this.wagesForm);
    }
  }

  onCancel(): void {
    this.router.navigate(['/wages-payment-list']);
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
}