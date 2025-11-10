import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

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
    Breadcrumb
  ],
})
export class BeneficiaryAttendancePerform implements OnInit {
  wagesForm!: FormGroup;
  attendanceDate: Date | null = null;
  paymentCycles: any[] = [];
  minDate: Date = new Date();
  loading = false;
  isLoading = false;
  statusMsg = '';
  projectInfo: any = null;
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;
  projectId: string = '';

  constructor(
    private fb: FormBuilder, 
    private apiService: ApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.initializePaymentCycles();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.initBreadcrumb();
    
    // Get project ID from route params
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.loadProjectData(this.projectId);
      }
    });
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Beneficiary Attendance' }];
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

  initializePaymentCycles(): void {
    this.paymentCycles = [
      { label: 'Payment Cycle 1', value: 'cycle1' },
      { label: 'Payment Cycle 2', value: 'cycle2' },
      { label: 'Payment Cycle 3', value: 'cycle3' },
      { label: 'Payment Cycle 4', value: 'cycle4' }
    ];
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
    // Validate attendance date
    if (!this.attendanceDate) {
      return;
    }

    if (this.wagesForm.valid) {
      this.loading = true;
      console.log('Form Data:', {
        ...this.wagesForm.value,
        attendanceDate: this.attendanceDate
      });
      // Simulate API call
      setTimeout(() => {
        this.loading = false;
        // Add search results to a table or display a message
      }, 2000);
    } else {
      this.markFormGroupTouched(this.wagesForm);
    }
  }

  onCancel(): void {
    this.wagesForm.reset({
      wageRate: 2.70
    });
    this.attendanceDate = null;
  }

  onLookUp(): void {
    this.loading = true;
    console.log('Look Up clicked');
    // Simulate API call
    setTimeout(() => {
      this.loading = false;
      // a lookup table or display a message
    }, 2000);
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

  isAttendanceDateInvalid(): boolean {
    return !this.attendanceDate;
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('en-GB');
    } catch {
      return '—';
    }
  }
}