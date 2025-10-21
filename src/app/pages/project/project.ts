import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';  // Added BreadcrumbModule
import { Button } from 'primeng/button';
import {DatePickerModule} from 'primeng/datepicker';
import { ActivatedRoute } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,  // For reactive forms
    BreadcrumbModule,     // Added BreadcrumbModule
    DatePickerModule,     // PrimeNG DatePicker
    TooltipModule,
    Button,
    // TooltipModule for buttons
  ],
  templateUrl: './project.html',
  styleUrls: ['./project.scss']
})
export class Project implements OnInit {
  projectForm!: FormGroup;
  targetForm!: FormGroup;

  projectId: string | null = null;
 
  isEditMode = false;

  // Dropdown options for the form
  statusList = ['Active', 'Inactive', 'Completed'];
  states = ['Jonglei', 'Unity', 'Upper Nile'];
  counties = ['Bor', 'Twic East', 'Akobo'];

  // Breadcrumb for navigation
  breadCrumbItems = [
    { label: 'Settings' },
    { label: 'Project Registration' }
  ];
  breadcrumbHome = { icon: 'pi pi-home', routerLink: '/' };

  targets: { state: string; county: string }[] = [];
  statusMsg: string | null = null;

  constructor(private route: ActivatedRoute, private fb: FormBuilder) {}

  ngOnInit(): void {
    // Get the project ID from the route (for editing an existing project)
    this.projectId = this.route.snapshot.paramMap.get('id');

    if (this.projectId) {
      this.isEditMode = true;
      this.loadProjectData(this.projectId);
    } else {
      this.isEditMode = false;
    }

    // Initialize the project form
    this.projectForm = this.fb.group({
      projectName: ['', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      sanctionDate: [null],
      targetBeneficiaries: ['', Validators.required],
      cost: ['', Validators.required],
      inchargeName: ['', Validators.required],
      inchargeMobile: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
      inchargeEmail: ['', [Validators.required, Validators.email]],
      status: ['', Validators.required],
    });

    // Initialize the target form for adding state/county details
    this.targetForm = this.fb.group({
      state: ['', Validators.required],
      county: ['', Validators.required]
    });
  }

  loadProjectData(id: string): void {
    console.log(`Loading data for project with ID: ${id}`);
    // This is where you would fetch the project data via an API
    // For example:
    // this.projectService.getProjectById(id).subscribe(data => {
    //   this.projectForm.patchValue(data);
    // });
  }

  // Add a new target (state/county)
  addTarget(): void {
    if (this.targetForm.valid) {
      this.targets.push(this.targetForm.value);
      this.targetForm.reset();
    }
  }

  // Remove a target (state/county)
  removeTarget(index: number): void {
    this.targets.splice(index, 1);
  }

  // Save project details
  onSave(): void {
    if (this.projectForm.valid) {
      const payload = {
        ...this.projectForm.value,
        targets: this.targets
      };
      console.log('Project Data:', payload);
      this.statusMsg = 'Project saved successfully!';
    } else {
      this.projectForm.markAllAsTouched();
      this.statusMsg = 'Please fill all required fields.';
    }
  }

  // Clear all form fields
  onClear(): void {
    this.projectForm.reset();
    this.targetForm.reset();
    this.targets = [];
    this.statusMsg = 'Form cleared.';
  }

  // Cancel the operation and reset the form
  onCancel(): void {
    this.projectForm.reset();
    this.targetForm.reset();
    this.targets = [];
    this.statusMsg = 'Action cancelled.';
  }
}
