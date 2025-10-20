import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sub-project.html',
  styleUrl: './sub-project.scss'
})
export class SubProject {
  // 🔎 modern reactive control for search
  searchCtrl = new FormControl<string>('');

  materialsPhotoName = '';
  proposalForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.proposalForm = this.fb.group({
      ip: [''],
      projectName: [''],
      typeOfMeeting: [''],
      meetingDate: [''],
      targetBeneficiaries: [''],
      projectCost: [0],
      stateName: [''],
      countyName: [''],
      payamName: [''],
      bomaName: [''],
      workActivities: this.fb.array([this.createWorkActivity()]),
      workStartDate: [''],
      workEndDate: [''],
      startCoordinate: [''],
      endCoordinate: [''],
      estimatedCost: [0],
      estimatedSkillLabour: [0],
      paperScreeningStatus: ['']
    });
  }

  get workActivities(): FormArray<FormGroup> {
    return this.proposalForm.get('workActivities') as FormArray<FormGroup>;
  }

  private createWorkActivity(): FormGroup {
    return this.fb.group({
      name: [''],
      code: [''],
      typeOfWork: [''],
      secondaryActivity: [''],
      estimatedManpower: [0],
      estimatedManDays: [0],
      typeOfEquipment: [''],
      estimatedCostOfEquipment: [0],
      workPhoto: [null],
      workPhotoName: ['']
    });
  }

  addWorkActivity(): void {
    this.workActivities.push(this.createWorkActivity());
  }

  removeWorkActivity(index: number): void {
    if (this.workActivities.length > 1) {
      this.workActivities.removeAt(index);
    }
  }

  onFileSelect(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) {
      const activity = this.workActivities.at(index);
      activity.patchValue({ workPhoto: file, workPhotoName: file.name });
    }
  }

  getFileName(index: number): string {
    return this.workActivities.at(index).get('workPhotoName')?.value || '';
  }

  onMaterialsPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) this.materialsPhotoName = file.name;
  }

  onSubmit(): void {
    if (this.proposalForm.valid) {
      console.log('Form submitted:', this.proposalForm.value);
      alert('Work proposal saved successfully!');
    } else {
      alert('Please fill in all required fields');
      this.proposalForm.markAllAsTouched();
    }
  }

  onAddNew(): void {
    this.proposalForm.reset();
    this.workActivities.clear();
    this.addWorkActivity();
    this.materialsPhotoName = '';
  }

  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      this.onAddNew();
    }
  }

  onClearAll(): void {
    if (confirm('Are you sure you want to clear all fields?')) {
      this.onAddNew();
    }
  }
}
