import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl, FormsModule,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Loader } from '../../components/loader/loader';
import { ApiService } from '../../services/api.service';
import {LookupItem, LookupService} from '../../services/lookup.service'; // Assuming this service exists

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Loader, Breadcrumb, FormsModule],
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

  availableProjects: { id: number; name: string }[] = [];
  availableTypesOfWork: { id: string; description: string }[] = [];
  availableActivities: Map<string, { id: string; description: string }[]> = new Map();
  availableStates: { id: string; name: string }[] = [];
  availableCounties: { id: string; name: string }[] = [];
  availablePayams: { id: string; name: string }[] = [];
  availableBomas: { id: string; name: string }[] = [];
  workActivitiesList: { id: string; name: string }[] = [];

  targets: any[] = [];  // List to hold targets
  selectedTargetId: number | null = null; // To store the selected target's ID

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private lookupService: LookupService // Injected
  ) {
    this.proposalForm = this.fb.group({
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
            paperScreeningStatus: [''],
          });
  }

  ngOnInit(): void {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Project List' }, { label: 'Sub-Project' }];

    this.loadAvailableProjects();
    this.loadAvailableTypesOfWork();
    this.loadAvailableStates();

    this.subprojectId = this.route.snapshot.paramMap.get('id');
    if (this.subprojectId) {
      this.loadSubProject(this.subprojectId);
    }
  }

  async loadAvailableStates(): Promise<void> {
    try {
      this.availableStates = await this.lookupService.getOrFetchStateList();
    } catch (err) {
      console.error('Failed to load available states', err);
    }
  }

  async onStateChange(event: Event): Promise<void> {
    const stateName = (event.target as HTMLSelectElement).value;
    try {
      const stateId = await this.lookupService.getStateIdByName(stateName);
      if (stateId) {
        this.availableCounties = await this.lookupService.getCountyListByStateId(String(stateId));
        this.cdr.detectChanges();
      }
    } catch (err) {
      console.error('Failed to load available counties', err);
    }
  }

  async onCountyChange(event: Event): Promise<void> {
    const countyName = (event.target as HTMLSelectElement).value;
    try {
      const countyId = await this.lookupService.getCountyIdByName(countyName);
      if (countyId) {
        this.availablePayams = await this.lookupService.getPayamListByCountyId(String(countyId));
        this.cdr.detectChanges();
      }
    } catch (err) {
      console.error('Failed to load available payams', err);
    }
  }

  async onPayamChange(event: Event): Promise<void> {
    const payamName = (event.target as HTMLSelectElement).value;
    try {
      const payamId = await this.lookupService.getPayamIdByName(payamName);
      if (payamId) {
        this.availableBomas = await this.lookupService.getBomaListByPayamId(String(payamId));
        this.cdr.detectChanges();
      }
    } catch (err) {
      console.error('Failed to load available bomas', err);
    }
  }

  async onProjectSelect(event: Event): Promise<void> {
    const projectId = (event.target as HTMLSelectElement).value;
    if (!projectId) {
      this.targets = [];
      this.cdr.detectChanges();
      return;
    }

    try {
      const res: any = await this.api.GET(
        `/api/project/target/get?projectId=${projectId}`
      );
      if (res.data && Array.isArray(res.data.content)) {
        this.targets = res.data.content;
      } else {
        this.targets = [];
      }
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Failed to load targets', err);
      this.targets = [];
      this.cdr.detectChanges();
    }
  }

  async onTargetSelect(): Promise<void> {
    if (this.selectedTargetId === null) {
      return;
    }

    const selectedTarget = this.targets.find(
      (target) => target.id === this.selectedTargetId
    );

    if (selectedTarget) {
      this.proposalForm.patchValue({
        stateName: selectedTarget.stateName,
        countyName: selectedTarget.countyName,
        payamName: '', // Reset payam and boma
        bomaName: '',
      });

      // Trigger updates for dependent dropdowns
      await this.onStateChange({
        target: { value: selectedTarget.stateName },
      } as any);
      await this.onCountyChange({
        target: { value: selectedTarget.countyName },
      } as any);

      this.cdr.detectChanges();
    }
  }

  async loadSubProject(id: string) {
    this.isLoading = true;
    try {
      const subProjectPromise = this.api.POST(`/api/subproject/get?page=0&size=1`, { id: parseInt(id, 10) });
      const workDetailsPromise = this.api.GET(`/api/subproject/work-details/get?subprojectId=${id}`);

      const [subProjectRes, workDetailsRes] = await Promise.all([subProjectPromise, workDetailsPromise]);

      const subProjectData = subProjectRes.data.content[0];
      const activities = workDetailsRes.data.content;

      if (!subProjectData) {
        console.error(`Sub-project with id ${id} not found.`);
        this.isLoading = false;
        return;
      }

      // Populate basic info
      if (subProjectData.projectId && subProjectData.projectName) {
        const projectExists = this.availableProjects.some(p => p.id === subProjectData.projectId);
        if (!projectExists) {
            this.availableProjects.push({ id: Number(subProjectData.projectId), name: String(subProjectData.projectName) });
        }
      }

      this.proposalForm.patchValue({
        projectName: subProjectData.projectId,
        typeOfMeeting: subProjectData.typeOfMeeting,
        meetingDate: subProjectData.meetingDate,
        stateName: subProjectData.stateName,
        countyName: subProjectData.countyName,
        payamName: subProjectData.payamName,
        bomaName: subProjectData.bomaName,
        paperScreeningStatus: subProjectData.screeningStatus,
      });

      if (subProjectData.stateName) {
        this.onStateChange({ target: { value: subProjectData.stateName } } as any);
      }
      if (subProjectData.countyName) {
        this.onCountyChange({ target: { value: subProjectData.countyName } } as any);
      }
      if (subProjectData.payamName) {
        this.onPayamChange({ target: { value: subProjectData.payamName } } as any);
      }



      if (!activities || !Array.isArray(activities) || activities.length === 0) {
        this.workActivities.clear();
      } else {
        // Clear existing activities to repopulate
        this.workActivities.clear();

        for (const [i, activity] of activities.entries()) {
          if (activity) {
            this.addWorkActivity();
            const currentActivityControl = this.workActivities.at(i);

            const typeOfWorkId = activity.areaOfWorkId;
            const workActivityId = activity.workActivityId;

            // Patch all values except secondaryActivity first
            currentActivityControl.patchValue({
              id: activity.id,
              name: activity.workName || '',
              code: activity.workCode || '',
              typeOfWork: typeOfWorkId,
              estimatedManpower: activity.estManPower || 0,
              estimatedManDays: activity.estDay || 0,
              estimatedCostOfEquipment: activity.equipmentCost || 0,
              workStartDate: activity.estStartAt || '',
              workEndDate: activity.estEndAt || '',
              estimatedMaterialCost: activity.materialCost || 0,
              estimatedSkillLabour: activity.estSkilledLabourDay || 0,
              estimatedCost: activity.estCost || 0,
            });

            if (typeOfWorkId) {
              await this.onTypeOfWorkChange({ target: { value: typeOfWorkId } } as any, i);
              // Now that the secondary activities are loaded, patch the value
              currentActivityControl.patchValue({
                secondaryActivity: workActivityId,
              });
            }
          }
        }
      }

      this.cdr.detectChanges();

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
      id: [null],
      name: [''],
      code: [''],
      typeOfWork: [null],
      secondaryActivity: [null],
      estimatedManpower: [0],
      estimatedManDays: [0],
      estimatedCostOfEquipment: [0],
      workPhoto: [null],
      workPhotoName: [''],
      equipmentPhoto: [null],
      equipmentPhotoName: [''],
      startCoordinate: [''],
      endCoordinate: [''],

      workStartDate: [''],
      workEndDate: [''],
      estimatedCost: [0],
      estimatedSkillLabour: [0],
      estimatedMaterialCost: [0],
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
    const activity = this.workActivities.at(index);
    return activity ? activity.get('workPhotoName')?.value || '' : '';
  }

  getEquipmentPhotoName(index: number): string {
    const activity = this.workActivities.at(index);
    return activity ? activity.get('equipmentPhotoName')?.value || '' : '';
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

      const rawProjectId = formValue.projectName;
      if (!rawProjectId) throw new Error(`Project not selected.`);
      const projectId = parseInt(rawProjectId, 10);
      if (isNaN(projectId)) throw new Error(`Invalid Project ID.`);

      const selectedProject = this.availableProjects.find(p => p.id === projectId);
      const projectName = selectedProject ? selectedProject.name : '';
      if (!projectName) throw new Error(`Project name not found for ID: ${projectId}.`);

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
        id: this.subprojectId ? parseInt(this.subprojectId, 10) : null,
        workCode: `W-CODE-${Date.now()}`,
        projectId: projectId,
        projectName: projectName,
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
        screeningStatus: formValue.paperScreeningStatus ? parseInt(formValue.paperScreeningStatus, 10) : null,
        status: 'IP_Submitted',
      };

      const subProjectResponse = await this.api.POST('/api/subproject/save', subProjectPayload);

      console.log('Response from /api/subproject/save:', JSON.stringify(subProjectResponse, null, 2));

      const newSubProjectId = subProjectResponse.data.entityId;
      if (!newSubProjectId) throw new Error('Failed to get sub-project ID after saving.');

      // --- API Calls 2 & 3: Save Work Details and Attachments ---
      for (const activityControl of this.workActivities.controls) {
        const activityValue = activityControl.value;

        const areaOfWorkId = activityValue.typeOfWork;
        if (!areaOfWorkId) throw new Error(`Area of Work not selected.`);

        const workActivityId = activityValue.secondaryActivity;
        if (!workActivityId) throw new Error(`Work Activity not selected.`);

        const workDetailPayload = {
          subprojectId: newSubProjectId,
          id: activityValue.id ? parseInt(activityValue.id, 10) : null,
          workName: activityValue.name,
          workCode: activityValue.code,
          areaOfWorkId: Number(activityValue.typeOfWork),
          workActivityId: Number(activityValue.secondaryActivity),
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
        const newWorkDetailId = workDetailResponse.data.entityId;
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
          await this.api.POST_FORM_DATA('/api/subproject/work-details/attachment/save', formData);
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

  async loadAvailableProjects(): Promise<void> {
    try {
      const res = await this.api.GET('api/project/get?page=0&size=100&status=InProgress',);
      if (res.data && Array.isArray(res.data.content)) {
        const projects = res.data.content.map((project: any) => ({
          id: Number(project.id),
          name: String(project.projectName)
        }));
        const projectMap = new Map<number, string>();
        this.availableProjects.forEach((p: { id: number; name: string }) => projectMap.set(p.id, p.name));
        projects.forEach((p: { id: number; name: string }) => projectMap.set(p.id, p.name));
        this.availableProjects = Array.from(projectMap, ([id, name]) => ({ id, name }));
      }
    } catch (err) {
      console.error('Failed to load available projects', err);
      this.availableProjects = [{id: 1, name: 'Project Alpha'}, {id: 2, name: 'Project Beta'}];
    }
  }

  async loadAvailableTypesOfWork(): Promise<void> {
    try {
      const res: any = await this.api.GET('api/lookup/generic/area-of-work');
      if (res.data && Array.isArray(res.data.content)) {
        this.availableTypesOfWork = res.data.content.map((item: any) => ({
          id: Number(item.id),
          description: item.description,
        }));
      }
    } catch (err) {
      console.error('Failed to load available types of work', err);
    }
  }


  async onTypeOfWorkChange(event: Event, index: number): Promise<void> {
    const areaOfWorkId = (event.target as HTMLSelectElement).value;
    const activityControl = this.workActivities.at(index);

    if (!areaOfWorkId) {
      this.availableActivities.set(areaOfWorkId, []);
      activityControl.get('secondaryActivity')?.setValue('');
      return;
    }
    try {
      const res: any = await this.api.GET(
        `/api/lookup/generic/work-activity?areaOfWorkId=${areaOfWorkId}`
      );
      if (res.data && Array.isArray(res.data.content)) {
        const activities = res.data.content.map((item: any) => ({
          id: Number(item.id),
          description: item.description,
        }));
        this.availableActivities.set(areaOfWorkId, activities);
        this.cdr.detectChanges();
      } else {
        this.availableActivities.set(areaOfWorkId, []);
      }
    } catch (err) {
      console.error('Failed to load available activities', err);
      this.availableActivities.set(areaOfWorkId, []);
    }
  }

}
