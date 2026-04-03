import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-help-desk-submit-request',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, BreadcrumbModule, ButtonModule,
    SelectModule, InputTextModule, TextareaModule, FloatLabelModule
  ],
  templateUrl: './help-desk-submit-request.html',
  styleUrls: ['./help-desk-submit-request.scss']
})
export class HelpDeskSubmitRequest {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Help Desk' }, { label: 'Submit Support Request' }];

  requestForm: FormGroup;
  selectedFile: File | null = null;
  demoResult: string | null = null;

  categories = [
    { label: 'Report Related', value: 'Report Related' },
    { label: 'User Management', value: 'User Management' },
    { label: 'Clarification', value: 'Clarification' },
    { label: 'Technical Issue', value: 'Technical Issue' },
    { label: 'Change Request', value: 'Change Request' }
  ];

  priorities = [
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' }
  ];

  issueTypes = [
    { label: 'Small - 72 Hours', value: 'Small - 72 Hours' },
    { label: 'Large - 144 Hours', value: 'Large - 144 Hours' }
  ];

  modules = [
    { label: 'Payroll', value: 'Payroll' },
    { label: 'Attendance', value: 'Attendance' },
    { label: 'Beneficiary', value: 'Beneficiary' },
    { label: 'Project Management', value: 'Project Management' },
    { label: 'Reports', value: 'Reports' },
    { label: 'User Management', value: 'User Management' }
  ];

  notificationPrefs = [
    { label: 'Email', value: 'Email' },
    { label: 'SMS', value: 'SMS' },
    { label: 'Both', value: 'Both' }
  ];

  constructor(private fb: FormBuilder) {
    this.requestForm = this.fb.group({
      issueTitle: ['', Validators.required],
      category: [null, Validators.required],
      priority: [null, Validators.required],
      issueType: [null, Validators.required],
      description: ['', Validators.required],
      module: [null, Validators.required],
      notification: [null]
    });
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  submitDemo() {
    const trackingNo = 'SNSOP-SUP-2026-' + String(Math.floor(Math.random() * 900000 + 100000)).substring(0, 6);
    this.demoResult = trackingNo;
  }

  onSubmit() {
    if (this.requestForm.valid) {
      Swal.fire({
        icon: 'success',
        title: 'Request Submitted',
        text: 'Your support request has been submitted successfully.',
        confirmButtonColor: '#3085d6'
      });
      this.requestForm.reset();
      this.selectedFile = null;
      this.demoResult = null;
    }
  }

  saveDraft() {
    Swal.fire({
      icon: 'info',
      title: 'Draft Saved',
      text: 'Your request has been saved as a draft.',
      confirmButtonColor: '#3085d6'
    });
  }
}
