import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';

import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ApiService } from '../../../services/api.service';
import { SelectModule } from 'primeng/select';
import { Loader } from "../../../components/loader/loader";
import { Breadcrumb } from "primeng/breadcrumb";



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
    Breadcrumb
],
  templateUrl: './apply-for-wages-payment.component.html'
})
export class ApplyForWagesPaymentComponent implements OnInit {
  wagesForm!: FormGroup;
  paymentCycles: any[] = [];
  minDate: Date = new Date();
  loading = false;
  projectInfo: any;
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;
  constructor(private fb: FormBuilder, private projectService: ApiService) {
    this.initializePaymentCycles();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.initBreadcrumb();
    // this.projectService.getProjectInfo().subscribe(data => {
    //   this.projectInfo = data;
    // });
  }
  initBreadcrumb() {
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
    if (this.wagesForm.valid) {
      this.loading = true;
      console.log('Form Data:', this.wagesForm.value);
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
}