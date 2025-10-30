import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Loader } from '../../components/loader/loader';
import { ApiService } from '../../services/api.service';
import { LookupService } from '../../services/lookup.service'; // Assuming this service exists

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Loader, Breadcrumb],
  templateUrl: './sub-project.html',
  styleUrl: './sub-project.scss',
})
export class SubProject implements OnInit {
  searchCtrl = new FormControl<string>('');
  isLoading = false;
  proposalForm: FormGroup;
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;
  subprojectId: string | null = null;

  availableActivities: string[] = [];
  workActivitiesList: { id: string; name: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private lookupService: LookupService // Injected
  ) {
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
      materialsPhoto: [null], // Added
      materialsPhotoName: [''], // Added
    });
  }

  ngOnInit(): void {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Project List' }, { label: 'Sub-Project' }];

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
      const activities = res.data.content;
      if (activities && activities.length > 0) {
        const firstActivity = activities[0];
        this.proposalForm.patchValue({
          ip: firstActivity.areaOfWork,
          projectCost: firstActivity.estCost,
        });
        const workActivityControls = activities.map((activity: any) => {
          return this.fb.group({
            name: [activity.workName || ''],
            code: [activity.workCode || ''],
            typeOfWork: [activity.areaOfWork || ''],
            secondaryActivity: [activity.workActivity || ''],
            estimatedManpower: [activity.estManPower || 0],
            estimatedManDays: [activity.estDay || 0],
            estimatedCostOfEquipment: [activity.equipmentCost || 0],
            workPhoto: [null],
            workPhotoName: [''],
            equipmentPhoto: [null],
            equipmentPhotoName: [''],
            startCoordinate: [activity.startCoordinate || ''],
            endCoordinate: [activity.endCoordinate || ''],
            paperScreeningStatus: [activity.paperScreeningStatus || ''],
            workStartDate: [activity.estStartAt || ''],
            workEndDate: [activity.estEndAt || ''],
            estimatedCost: [activity.estCost || 0],
            estimatedSkillLabour: [activity.estSkilledLabourDay || 0],
          });
        });
        this.workActivities.clear();
        workActivityControls.forEach((control: FormGroup) => this.workActivities.push(control));
        this.cdr.detectChanges();
      }
    } catch (err) {
      console.error('Failed to load sub-project', err);
    } finally {
      this.isLoading = false;
    }
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
      estimatedCostOfEquipment: [0],
      workPhoto: [null],
      workPhotoName: [''],
      equipmentPhoto: [null],
      equipmentPhotoName: [''],
      startCoordinate: [''],
      endCoordinate: [''],
      paperScreeningStatus: [''],
      workStartDate: [''],
      workEndDate: [''],
      estimatedCost: [0],
      estimatedSkillLabour: [0],
    });
  }

  addWorkActivity(): void {
    this.workActivities.push(this.createWorkActivity());
    this.cdr.detectChanges();
  }

  removeWorkActivity(index: number): void {
    if (this.workActivities.length > 1) {
      this.workActivities.removeAt(index);
    }
  }

  onWorkPhotoSelect(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) {
      const activity = this.workActivities.at(index);
      activity.patchValue({ workPhoto: file, workPhotoName: file.name });
    }
  }

  onEquipmentPhotoSelect(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) {
      const activity = this.workActivities.at(index);
      activity.patchValue({ equipmentPhoto: file, equipmentPhotoName: file.name });
    }
  }

  onMaterialsPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) {
      this.proposalForm.patchValue({ materialsPhoto: file, materialsPhotoName: file.name });
    }
  }

  getWorkPhotoName(index: number): string {
    return this.workActivities.at(index).get('workPhotoName')?.value || '';
  }

  getEquipmentPhotoName(index: number): string {
    return this.workActivities.at(index).get('equipmentPhotoName')?.value || '';
  }

  get materialsPhotoName(): string {
    return this.proposalForm.get('materialsPhotoName')?.value || '';
  }

  async onSubmit(): Promise<void> {
    if (!this.proposalForm.valid) {
      alert('Please fill in all required fields');
      this.proposalForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const formValue = this.proposalForm.value;

      // --- ID Lookups with validation ---
      const projectId = await this.lookupService.getProjectIdByName(formValue.projectName);
      if (projectId === null) throw new Error(`Project '${formValue.projectName}' not found.`);

      const stateId = await this.lookupService.getStateIdByName(formValue.stateName);
      if (stateId === null) throw new Error(`State '${formValue.stateName}' not found.`);

      const countyId = await this.lookupService.getCountyIdByName(formValue.countyName);
      if (countyId === null) throw new Error(`County '${formValue.countyName}' not found.`);

      const payamId = await this.lookupService.getPayamIdByName(formValue.payamName);
      if (payamId === null) throw new Error(`Payam '${formValue.payamName}' not found.`);

      const bomaId = await this.lookupService.getBomaIdByName(formValue.bomaName);
      if (bomaId === null) throw new Error(`Boma '${formValue.bomaName}' not found.`);

      // --- API Call 1: Save Sub-project ---
      const subProjectPayload = {
        id: this.subprojectId ? parseInt(this.subprojectId, 10) : 0,
        workCode: `W-CODE-${Date.now()}`,
        projectId: projectId,
        projectName: formValue.projectName,
        stateId: stateId,
        stateName: formValue.stateName,
        countyId: countyId,
        countyName: formValue.countyName,
        payamId: payamId,
        payamName: formValue.payamName,
        bomaId: bomaId,
        bomaName: formValue.bomaName,
        typeOfMeeting: formValue.typeOfMeeting,
        meetingDate: formValue.meetingDate,
        screeningStatus: 'Pending',
        status: 'true',
      };

      const subProjectResponse = await this.api.POST('/api/subproject/save', subProjectPayload);
      const newSubProjectId = subProjectResponse.data.id;
      if (!newSubProjectId) throw new Error('Failed to get sub-project ID after saving.');

      // --- API Calls 2 & 3: Save Work Details and Attachments ---
      for (const activityControl of this.workActivities.controls) {
        const activityValue = activityControl.value;

        const areaOfWorkId = await this.lookupService.getAreaOfWorkIdByName(activityValue.typeOfWork);
        if (areaOfWorkId === null) throw new Error(`Area of Work '${activityValue.typeOfWork}' not found.`);

        const workActivityId = await this.lookupService.getWorkActivityIdByName(activityValue.secondaryActivity);
        if (workActivityId === null) throw new Error(`Work Activity '${activityValue.secondaryActivity}' not found.`);

        const workDetailPayload = {
          subprojectId: newSubProjectId,
          id: 0,
          workName: activityValue.name,
          workCode: activityValue.code,
          areaOfWorkId: areaOfWorkId,
          workActivityId: workActivityId,
          estManPower: activityValue.estimatedManpower,
          estDay: activityValue.estimatedManDays,
          estSkilledLabourDay: activityValue.estimatedSkillLabour,
          estStartAt: activityValue.workStartDate,
          estEndAt: activityValue.workEndDate,
          estCost: activityValue.estimatedCost,
          equipmentCost: activityValue.estimatedCostOfEquipment,
          materialCost: 0,
          status: true,
        };

        const workDetailResponse = await this.api.POST('/api/subproject/work-details/save', workDetailPayload);
        const newWorkDetailId = workDetailResponse.data.id;
        if (!newWorkDetailId) throw new Error('Failed to get work detail ID after saving.');

        const formData = new FormData();
        let hasFiles = false;

        if (activityValue.workPhoto) {
          formData.append('workPhoto', activityValue.workPhoto, activityValue.workPhotoName);
          hasFiles = true;
        }
        if (activityValue.equipmentPhoto) {
          formData.append('equipmentPhoto', activityValue.equipmentPhoto, activityValue.equipmentPhotoName);
          hasFiles = true;
        }
        if (formValue.materialsPhoto) {
          formData.append('materialPhoto', formValue.materialsPhoto, formValue.materialsPhotoName);
          hasFiles = true;
        }

        if (hasFiles) {
          formData.append('projectId', projectId.toString()); // No longer possibly null
          formData.append('subprojectId', newSubProjectId.toString());
          formData.append('subprojectWorkDetailId', newWorkDetailId.toString());
          await this.api.POST('/api/subproject/work-details/attachment/save', formData);
        }
      }

      alert('Work proposal saved successfully!');
      this.onAddNew();
    } catch (err: any) { // Catch as any to access err.message
      console.error('Failed to save sub-project', err);
      // Display the specific error message from the thrown Error
      alert(`Failed to save work proposal: ${err.message}`);
    } finally {
      this.isLoading = false;
    }
  }

  onAddNew(): void {
    this.proposalForm.reset();
    this.workActivities.clear();
    this.addWorkActivity();
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

  trackByIndex(index: number): number {
    return index;
  }

  loadAvailableActivities(): void {
    this.availableActivities = Array.from({ length: 10 }, (_, i) => `Activity ${i + 1}`);
  }
}