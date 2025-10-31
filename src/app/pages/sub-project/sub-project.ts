import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
} from '@angular/forms';
import { Loader } from '../../components/loader/loader';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Breadcrumb } from 'primeng/breadcrumb';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Loader, Breadcrumb],
  templateUrl: './sub-project.html',
  styleUrl: './sub-project.scss',
})
export class SubProject {
  // 🔎 modern reactive control for search
  searchCtrl = new FormControl<string>('');
  isLoading = false;
  materialsPhotoName = '';
  proposalForm: FormGroup;
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;
  subprojectId: string | null = null;

  availableActivities: string[] = [];
  workActivitiesList: { id: string; name: string }[] = [];

  ngOnInit(): void {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Project List' }];
    this.breadcrumbItems = [{ label: 'Sub-Project' }];

    this.subprojectId = this.route.snapshot.paramMap.get('id');
    if (this.subprojectId) {
      this.loadSubProject(this.subprojectId);
    }
    this.loadAvailableActivities();
  }

  async loadSubProject(id: string) {
    this.isLoading = true;
    try {
      const res = await this.api.GET(`/api/subproject/work-details/get?subprojectId=${id}`);

      // Mapping the response content to the form
      const subProjectData = res.data.content[0];  // Assuming single subproject response

      // Patch form values for available fields
      this.proposalForm.patchValue({
        ip: subProjectData.areaOfWork,  // Assuming 'areaOfWork' maps to 'ip' field
        projectName: '',  // Not available in the response, leave blank or handle
        typeOfMeeting: '', // Not available in the response, leave blank or handle
        meetingDate: '', // Not available in the response, leave blank or handle
        targetBeneficiaries: '', // Not available in the response, leave blank or handle
        projectCost: subProjectData.estCost,  // Assuming 'estCost' is the project cost
        stateName: '',  // Not available in the response, leave blank or handle
        countyName: '', // Not available in the response, leave blank or handle
        payamName: '', // Not available in the response, leave blank or handle
        bomaName: '', // Not available in the response, leave blank or handle
        workActivities: []  // Clear any existing activities
      });

      // Map work activities from the response
      const workActivitiesArray = subProjectData.map((activity: any) => this.fb.group({
        name: [activity.workName],
        code: [activity.workCode],
        typeOfWork: activity.areaOfWork, // Adjust based on what is available
        secondaryActivity: activity.workActivity, // Adjust based on what is available
        estimatedManpower: activity.estManPower,
        estimatedManDays: activity.estDay,
        typeOfEquipment: '', // Not available in the response, leave blank or handle
        estimatedCostOfEquipment: activity.equipmentCost,
        workPhoto: null,  // Handle file uploads separately
        workPhotoName: '', // Handle file uploads separately
      }));

      this.workActivities.clear(); // Clear any existing work activities
      workActivitiesArray.forEach((activity: any) => this.workActivities.push(activity));

    } catch (err) {
      console.error('Failed to load sub-project', err);
    } finally {
      this.isLoading = false;
    }
  }
  constructor(private fb: FormBuilder, private route: ActivatedRoute, private api: ApiService) {
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
      paperScreeningStatus: [''],
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
      workPhotoName: [''],
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
    if (
      confirm(
        'Are you sure you want to cancel? All unsaved changes will be lost.'
      )
    ) {
      this.onAddNew();
    }
  }

  onClearAll(): void {
    if (confirm('Are you sure you want to clear all fields?')) {
      this.onAddNew();
    }
  }

  trackByIndex(index: number, activity: any): number {
    return index;  // Using the index as the unique identifier
  }

  loadAvailableActivities(): void {
    // Dynamically create activities, you can adjust the number based on your requirements
    this.availableActivities = Array.from({ length: 10 }, (_, i) => `Activity ${i + 1}`);
  }
}
