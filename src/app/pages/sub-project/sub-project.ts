import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  FormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Loader } from '../../components/loader/loader';
import { ApiService } from '../../services/api.service';
import { LookupItem, LookupService } from '../../services/lookup.service';
import { ButtonModule } from 'primeng/button';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../../environments/environment';
import axios from 'axios';
import Swal from 'sweetalert2';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Loader,
    Breadcrumb,
    FormsModule,
    ButtonModule,
    DatePickerModule
  ],
  templateUrl: './sub-project.html',
  styleUrl: './sub-project.scss',
})
export class SubProject implements OnInit {
  searchCtrl = new FormControl<string>('');
  isLoading = false;
  proposalForm: FormGroup;
  public workActivities: FormArray;
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;
  subprojectId: string | null = null;
  workCode: string | null =null;

  availableProjects: { id: number; name: string }[] = [];
  availableTypesOfWork: { id: string; description: string }[] = [];
  availableActivities: Map<string, { id: string; description: string }[]> = new Map();

  availablePayams: { id: string; name: string }[] = [];
  availableBomas: { id: string; name: string }[] = [];
  workActivitiesList: { id: string; name: string }[] = [];

  targets: any[] = [];  // List to hold targets
  selectedTargetId: number | null = null; // To store the selected target's ID
  
  private removedWorkActivities: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private lookupService: LookupService, // Injected
    private cookieService: CookieService // Injected
  ) {
    this.proposalForm = this.fb.group({
      projectName: ['', Validators.required],
      typeOfMeeting: ['', Validators.required],
      meetingDate: ['', Validators.required],
      targetBeneficiaries: [''],
      projectCost: [0],
      stateName: [''],
      countyName: [''],
      stateId: [''],
      countyId: [''],
      payamId: ['', Validators.required],
      bomaId: ['', Validators.required],
      workActivities: this.fb.array([this.createWorkActivity()]),
      paperScreeningStatus: ['', Validators.required],
    });
    this.workActivities = this.proposalForm.get('workActivities') as FormArray;
  }

  ngOnInit(): void {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Sub-Project List', icon: '', routerLink: '/sub-project/list'  }, { label: 'Sub-Project' }];

    this.loadAvailableProjects();
    this.loadAvailableTypesOfWork();


    this.subprojectId = this.route.snapshot.paramMap.get('id');
    if (this.subprojectId) {
      this.loadSubProject(this.subprojectId);
       this.cdr.detectChanges();
    }
     this.cdr.detectChanges();
  }



  private async loadPayamsForCounty(countyId: string): Promise<void> {
    if (!countyId) {
      this.availablePayams = [];
      this.availableBomas = [];
      this.proposalForm.patchValue({ payamId: '', bomaId: '' });
      this.cdr.detectChanges();
      return;
    }

    try {
      this.availablePayams = await this.lookupService.getPayamListByCountyId(countyId);
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Failed to load available payams', err);
      this.availablePayams = [];
    }
  }

  private async loadBomasForPayam(payamId: string): Promise<void> {
    if (!payamId) {
      this.availableBomas = [];
      this.proposalForm.patchValue({ bomaId: '' });
      this.cdr.detectChanges();
      return;
    }

    try {
      this.availableBomas = await this.lookupService.getBomaListByPayamId(payamId);
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Failed to load available bomas', err);
      this.availableBomas = [];
    }
  }

  async onPayamChange(event: Event): Promise<void> {
    const payamId = (event.target as HTMLSelectElement).value;
    
    // Reset Boma selection
    this.proposalForm.get('bomaId')?.setValue('');
    this.availableBomas = [];
    
    if (payamId) {
      await this.loadBomasForPayam(payamId);
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
      this.proposalForm.patchValue({
        stateName: '',
        countyName: '',
        stateId: '',
        countyId: '',
        payamId: '',
        bomaId: '',
      });
      this.availablePayams = [];
      this.availableBomas = [];
      return;
    }

    const selectedTarget = this.targets.find(
      (target) => target.id === this.selectedTargetId
    );

    if (selectedTarget) {
      this.proposalForm.patchValue({
        stateName: selectedTarget.stateName,
        countyName: selectedTarget.countyName,
        stateId: selectedTarget.stateId,
        countyId: selectedTarget.countyId,
        payamId: '',
        bomaId: '',
      });

      // Directly call the efficient helper method with the known ID
      await this.loadPayamsForCounty(selectedTarget.countyId);

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
      const workDetailsData = workDetailsRes.data;
      const activities = Array.isArray(workDetailsData)
        ? workDetailsData
        : workDetailsData?.content ?? [];

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
          this.cdr.detectChanges(); // Manually trigger change detection after modifying array for dropdown
        }
      }

      // Assuming subProjectData from the API includes stateId and countyId
      this.proposalForm.patchValue({
        projectName: Number(subProjectData.projectId), // Re-insert and ensure project ID is a number for dropdown selection
        typeOfMeeting: subProjectData.typeOfMeeting,
        meetingDate: this.parseApiDate(subProjectData.meetingDate),
        stateName: subProjectData.stateName,
        countyName: subProjectData.countyName,
        stateId: subProjectData.stateId,
        countyId: subProjectData.countyId,
        payamId: String(subProjectData.payamId || ''),
        bomaId: String(subProjectData.bomaId || ''),
        paperScreeningStatus: subProjectData.screeningStatus,
      });

      this.cdr.detectChanges();

      if (subProjectData.countyId) {
        await this.loadPayamsForCounty(String(subProjectData.countyId));
      }
      if (subProjectData.payamId) {
        await this.loadBomasForPayam(String(subProjectData.payamId));
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

            if (typeOfWorkId) {
              await this.onTypeOfWorkChange({ target: { value: typeOfWorkId } } as any, i);
            }

            // Patch all values, ensuring IDs are strings for form binding
            currentActivityControl.patchValue({
              id: activity.id,
              name: activity.workName || '',
              code: activity.workCode || '',
              typeOfWork: typeOfWorkId ? String(typeOfWorkId) : null,
              secondaryActivity: workActivityId ? String(workActivityId) : null,
              estimatedManpower: activity.estManPower,
              estimatedManDays: activity.estDay,
              estimatedCostOfEquipment: activity.equipmentCost,
              workStartDate: this.parseApiDate(activity.estStartAt),
              workEndDate: this.parseApiDate(activity.estEndAt),
              estimatedMaterialCost: activity.materialCost,
              estimatedSkillLabour: activity.estSkilledLabourDay,
              estimatedCost: activity.estCost,
              workPhotoUrl: activity.workPhotoUrl || '',
              equipmentPhotoUrl: activity.equipmentPhotoUrl || '',
              materialPhotoUrl: activity.materialPhotoUrl || '',
            });
          }
          setTimeout(() => this.cdr.detectChanges(), 0);

        }
      }


    }
    catch (err) {
      console.error('Failed to load sub-project', err);
    }

    finally {
      this.isLoading = false;
    }

  }

  private static dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
    const startDate = group.get('workStartDate')?.value;
    const endDate = group.get('workEndDate')?.value;

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return { 'dateRangeInvalid': true };
    }
    return null;
  }

  private static nonNegativeNumberValidator(control: FormControl): { [key: string]: boolean } | null {
    const value = control.value;
    if (value !== null && value < 0) {
      return { 'nonNegativeNumber': true };
    }
    return null;
  }

  private createWorkActivity(): FormGroup {
    return this.fb.group({
      id: [null],
      name: ['', Validators.required],
      code: ['', Validators.required],
      typeOfWork: ['', Validators.required],
      secondaryActivity: ['', Validators.required],
      estimatedManpower: [null, [Validators.required, SubProject.nonNegativeNumberValidator]],
      estimatedManDays: [null, [Validators.required, SubProject.nonNegativeNumberValidator]],
      estimatedCostOfEquipment: [null, [Validators.required, SubProject.nonNegativeNumberValidator]],
      workPhoto: [null],
      workPhotoName: [''],
      workPhotoSize: [null],
      equipmentPhoto: [null],
      equipmentPhotoName: [''],
      equipmentPhotoSize: [null],
      workPhotoUrl: [''],
      equipmentPhotoUrl: [''],
      materialPhoto: [''],
      materialPhotoName: [''],
      materialPhotoSize: [null],
      materialPhotoUrl: [''],
      startCoordinate: [''],
      endCoordinate: [''],

      workStartDate: ['', Validators.required],
      workEndDate: ['', Validators.required],
      estimatedCost: [null, [Validators.required, SubProject.nonNegativeNumberValidator]],
      estimatedSkillLabour: [null, [Validators.required, SubProject.nonNegativeNumberValidator]],
      estimatedMaterialCost: [null, [Validators.required, SubProject.nonNegativeNumberValidator]],
    }, { validators: SubProject.dateRangeValidator });
  }

  addWorkActivity(): void {
    this.workActivities.push(this.createWorkActivity());
  }

  removeWorkActivity(index: number): void {
    if (this.workActivities.length > 1) {
      const activityControl = this.workActivities.at(index);
      if (activityControl.value.id) {
        this.removedWorkActivities.push(activityControl.value);
      }
      this.workActivities.removeAt(index);
    }
  }

  private handleFileInput(event: Event, index: number, fileControlName: string, fileNameControlName: string, fileSizeControlName: string): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    const MAX_FILE_SIZE_MB = 1;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: `File size exceeds the limit of ${MAX_FILE_SIZE_MB} MB. Please select a smaller file.`,
        });
        // Clear the input field
        if (input) {
          input.value = '';
        }
        const activity = this.workActivities.at(index);
        activity.patchValue({
          [fileControlName]: null,
          [fileNameControlName]: '',
          [fileSizeControlName]: null
        });
        return;
      }

      const activity = this.workActivities.at(index);
      activity.patchValue({
        [fileControlName]: file,
        [fileNameControlName]: file.name,
        [fileSizeControlName]: file.size
      });
    }
  }

  onWorkPhotoSelect(event: Event, index: number): void {
    this.handleFileInput(event, index, 'workPhoto', 'workPhotoName', 'workPhotoSize');
  }

  onEquipmentPhotoSelect(event: Event, index: number): void {
    this.handleFileInput(event, index, 'equipmentPhoto', 'equipmentPhotoName', 'equipmentPhotoSize');
  }

  onMaterialsPhotoSelect(event: Event, index: number): void {
    this.handleFileInput(event, index, 'materialPhoto', 'materialPhotoName', 'materialPhotoSize');
  }

  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  getWorkPhotoName(index: number): string {
    const activity = this.workActivities.at(index);
    if (!activity) return '';

    const fileName = activity.get('workPhotoName')?.value || '';
    const fileSize = activity.get('workPhotoSize')?.value;

    return fileName && fileSize !== null
      ? `${fileName} (${this.formatBytes(fileSize)})`
      : fileName;
  }

  getEquipmentPhotoName(index: number): string {
    const activity = this.workActivities.at(index);
    if (!activity) return '';

    const fileName = activity.get('equipmentPhotoName')?.value || '';
    const fileSize = activity.get('equipmentPhotoSize')?.value;

    return fileName && fileSize !== null
      ? `${fileName} (${this.formatBytes(fileSize)})`
      : fileName;
  }

  getMaterialPhotoName(index: number): string {
    const activity = this.workActivities.at(index);
    if (!activity) return '';

    const fileName = activity.get('materialPhotoName')?.value || '';
    const fileSize = activity.get('materialPhotoSize')?.value;

    return fileName && fileSize !== null
      ? `${fileName} (${this.formatBytes(fileSize)})`
      : fileName;
  }

  clearAttachment(index: number, fieldName: string, fileInput: HTMLInputElement): void {
    const activity = this.workActivities.at(index);
    if (activity) {
      activity.get(fieldName)?.reset();
      activity.get(`${fieldName}Name`)?.reset();
      // Clear the corresponding size field
      const sizeFieldName = `${fieldName}Size`;
      if (activity.get(sizeFieldName)) {
        activity.get(sizeFieldName)?.reset();
      }

      if (fileInput) {
        fileInput.value = ''; // Clear the input element's value
      }
    }
  }

  async viewAttachment(path: string): Promise<void> {
    if (!path) {
      Swal.fire({
        icon: 'warning',
        title: 'No Attachment',
        text: 'No attachment path found.',
      });
      return;
    }

    this.isLoading = true;
    try {
      const token = this.cookieService.get(environment.cookie_name);
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      // Construct the full URL with the query parameter
      // Decode the path first, then let the browser re-encode it.
      const decodedPath = decodeURIComponent(path);
      const fullUrl = `${environment.globalApi}api/subproject/work-details/attachment/get?filePath=${decodedPath}`;


      const response = await axios.get(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });

      const blob = response.data;
      const objectUrl = URL.createObjectURL(blob);

      // Check if the file is an image by its MIME type
      if (blob.type.startsWith('image/')) {
        const newTab = window.open();
        if (newTab) {
          newTab.document.body.innerHTML = `<img src="${objectUrl}" style="width:100%">`;
          // Revoke the object URL after the image has loaded in the new tab
          newTab.onload = () => {
            URL.revokeObjectURL(objectUrl);
          };
        } else {
          // Fallback if pop-up is blocked
          URL.revokeObjectURL(objectUrl);
        }
      } else {
        // For other file types, trigger a download
        const link = document.createElement('a');
        link.href = objectUrl;

        // Extract filename from path for the download attribute
        const filename = path.split('/').pop()?.split('?')[0] || 'download';
        link.setAttribute('download', decodeURIComponent(filename));

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Revoke the object URL after the download is initiated
        setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
      }

    } catch (err) {
      console.error('Failed to fetch attachment', err);
      Swal.fire({
        icon: 'error',
        title: 'Load Failed',
        text: 'Failed to fetch attachment. See console for details.',
      });
    }
    finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.proposalForm.valid) {
      Swal.fire({
        icon: 'error',
        title: 'Incomplete Form',
        text: 'Please fill in all required fields.',
      });
      this.proposalForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    let newSubProjectId: number | null = null;
    let projectId: number;
    let projectName: string;
    let finalWorkCode: string = '';
    const submissionWarnings: string[] = [];

    // --- Step 1: Prepare and Save Sub-project Basic Info ---
    try {
      const formValue = this.proposalForm.value;

      const rawProjectId = formValue.projectName;
      if (!rawProjectId) throw new Error(`Project not selected.`);
      projectId = parseInt(rawProjectId, 10);
      if (isNaN(projectId)) throw new Error(`Invalid Project ID.`);

      const selectedProject = this.availableProjects.find(p => p.id === projectId);
      if (!selectedProject) throw new Error(`Project name not found for ID: ${projectId}.`);
      projectName = selectedProject.name;

      const { stateId, stateName, countyId, countyName, payamId, bomaId } = formValue;
      if (!stateId) throw new Error(`State ID for '${stateName}' was not found. Please re-select the project target.`);
      if (!countyId) throw new Error(`County ID for '${countyName}' was not found. Please re-select the project target.`);

      const payam = this.availablePayams.find(p => p.id === payamId);
      if (!payam) throw new Error(`Payam name for ID '${payamId}' could not be found.`);
      const boma = this.availableBomas.find(b => b.id === bomaId);
      if (!boma) throw new Error(`Boma name for ID '${bomaId}' could not be found.`);

      const year = new Date().getFullYear();

      if (this.subprojectId) {
        finalWorkCode = `${year}-SNSOP-${projectName}-${this.subprojectId}`;
      }

      const subProjectPayload: any = {
        id: this.subprojectId ? parseInt(this.subprojectId, 10) : null,
        workCode: this.subprojectId ? finalWorkCode : null,
        projectId,
        projectName,
        stateId,
        stateName,
        countyId,
        countyName,
        payamId,
        payamName: payam.name,
        bomaId,
        bomaName: boma.name,
        typeOfMeeting: formValue.typeOfMeeting,
        meetingDate: formValue.meetingDate ? this.formatDateForApi(formValue.meetingDate) : null,
        screeningStatus: formValue.paperScreeningStatus ? parseInt(formValue.paperScreeningStatus, 10) : null,
        status: '',
      };

      const subProjectResponse = await this.api.POST('api/subproject/save', subProjectPayload);
      newSubProjectId = subProjectResponse.data.entityId;
      if (!newSubProjectId) throw new Error('Failed to get sub-project ID after saving.');

      // Update the work code for the final message
      if (!this.subprojectId) {
        finalWorkCode = `${year}-SNSOP-${projectName}-${newSubProjectId}`;
      }
      // Update the component's subprojectId to prevent re-creation on a subsequent failed step
      this.subprojectId = newSubProjectId.toString();

    } catch (err: any) {
      console.error('Failed to save sub-project basic info', err);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: `Critical Error: Could not save the work proposal's basic information. ${err.message}`,
      });
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    // --- Step 2 & 3: Save Work Details and Attachments ---
    for (const [index, activityControl] of this.workActivities.controls.entries()) {
      const activityValue = activityControl.value;
      let newWorkDetailId: number | null = null;

      try {
        const workDetailPayload = {
          subprojectId: newSubProjectId,
          id: activityValue.id ? parseInt(activityValue.id, 10) : null,
          workName: activityValue.name,
          workCode: activityValue.code,
          areaOfWorkId: Number(activityValue.typeOfWork),
          workActivityId: Number(activityValue.secondaryActivity),
          estManPower: activityValue.estimatedManpower || 0,
          estDay: activityValue.estimatedManDays || 0,
          estSkilledLabourDay: activityValue.estimatedSkillLabour || 0,
          estStartAt: activityValue.workStartDate ? this.formatDateForApi(activityValue.workStartDate) : null,
          estEndAt: activityValue.workEndDate ? this.formatDateForApi(activityValue.workEndDate) : null,
          estCost: activityValue.estimatedCost || 0,
          equipmentCost: activityValue.estimatedCostOfEquipment || 0,
          materialCost: activityValue.estimatedMaterialCost || 0,
          status: true,
        };

        const workDetailResponse = await this.api.POST('api/subproject/work-details/save', workDetailPayload);
        newWorkDetailId = workDetailResponse.data.entityId;
        if (!newWorkDetailId) throw new Error('Failed to get work detail ID after saving.');
        activityControl.patchValue({ id: newWorkDetailId }); // Update ID in the form

      } catch (err: any) {
        submissionWarnings.push(`Saving Activity #${index + 1} ('${activityValue.name || 'Untitled'}') failed: ${err.message}`);
        continue; // Skip to next activity if this one failed
      }

      // --- Attachment Saving ---
      try {
        const formData = new FormData();
        let hasFiles = false;
        ['workPhoto', 'equipmentPhoto', 'materialPhoto'].forEach(photoType => {
          if (activityValue[photoType]) {
            formData.append(photoType, activityValue[photoType], activityValue[`${photoType}Name`]);
            hasFiles = true;
          }
        });

        if (hasFiles) {
          formData.append('projectId', projectId!.toString());
          formData.append('subprojectId', newSubProjectId.toString());
          formData.append('subprojectWorkDetailId', newWorkDetailId.toString());
          await this.api.POST_FORM_DATA('api/subproject/work-details/attachment/save', formData);
        }
      } catch (err: any) {
        submissionWarnings.push(`Uploading attachments for Activity #${index + 1} failed: ${err.message}. Please add them later by editing.`);
      }
    }

    // --- Step 4: Deactivate Removed Work Activities ---
    for (const activityValue of this.removedWorkActivities) {
      try {
        if (!activityValue.id) continue;

        const workDetailPayload = {
          subprojectId: newSubProjectId,
          id: parseInt(activityValue.id, 10),
          workName: activityValue.name,
          workCode: activityValue.code,
          areaOfWorkId: Number(activityValue.typeOfWork),
          workActivityId: Number(activityValue.secondaryActivity),
          estManPower: activityValue.estimatedManpower || 0,
          estDay: activityValue.estimatedManDays || 0,
          estSkilledLabourDay: activityValue.estimatedSkillLabour || 0,
          estStartAt: activityValue.workStartDate ? this.formatDateForApi(activityValue.workStartDate) : null,
          estEndAt: activityValue.workEndDate ? this.formatDateForApi(activityValue.workEndDate) : null,
          estCost: activityValue.estimatedCost || 0,
          equipmentCost: activityValue.estimatedCostOfEquipment || 0,
          materialCost: activityValue.estimatedMaterialCost || 0,
          status: false,
        };

        await this.api.POST('api/subproject/work-details/save', workDetailPayload);
      } catch (err: any) {
        submissionWarnings.push(`Failed to remove an old activity (ID: ${activityValue.id}): ${err.message}.`);
      }
    }
    
    this.removedWorkActivities = []; // Clear the array after processing
    this.isLoading = false;
    this.cdr.detectChanges();

    // --- Final Step: Show Summary and Redirect ---
    if (submissionWarnings.length === 0) {
      Swal.fire({
        title: 'Success!',
        text: `Work proposal ${finalWorkCode} was saved successfully.`,
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        this.router.navigate(['/sub-project/list']);
      });
    } else {
      const warningHtml = submissionWarnings.map(msg => `<li>${msg}</li>`).join('');
      Swal.fire({
        title: 'Saved with Warnings',
        html: `
          <div style="text-align: left;">
            <p><strong>Work proposal ${finalWorkCode} was saved, but some issues occurred:</strong></p>
            <ul style="padding-left: 20px;">
              ${warningHtml}
            </ul>
          </div>
        `,
        icon: 'warning',
        confirmButtonText: 'OK'
      }).then(() => {
        this.router.navigate(['/sub-project/list']);
      });
    }
  }

  onAddNew(): void {
    this.proposalForm.reset();
    this.workActivities.clear();
    this.addWorkActivity();
    this.isLoading = false;
    this.removedWorkActivities = [];
    this.targets = []; // Clear targets
    this.selectedTargetId = null; // Clear selected target
    this.availablePayams = []; // Clear available payams
    this.availableBomas = []; // Clear available bomas
  }

  onCancel(): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'All unsaved changes will be lost.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, keep editing'
    }).then((result) => {
      if (result.isConfirmed) {
        this.onAddNew();
      }
    });
  }

  onClearAll(): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will clear all fields.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.onAddNew();
      }
    });
  }

  limitToTwoDecimals(event: Event, controlName: string, index: number): void {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value;

    // Regex to match numbers with up to two decimal places
    const regex = /^-?\d*\.?\d{0,2}/;
    const matched = value.match(regex);

    if (matched) {
      const newValue = matched[0];
      if (value !== newValue) {
        inputElement.value = newValue; // Update the displayed value
        const activity = this.workActivities.at(index);
        const control = activity.get(controlName);
        if (control && control.value !== newValue) { // Prevent unnecessary updates
          control.setValue(newValue, { emitEvent: false }); // Update form control, suppress further input events
        }
      }
    } else {
      // If the input doesn't match the regex (e.g., more than 2 decimals), clear it
      inputElement.value = ''; // Clear invalid input for safety
      const activity = this.workActivities.at(index);
      const control = activity.get(controlName);
      if (control) {
        control.setValue('', { emitEvent: false });
      }
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseApiDate(dateString: string | null): Date | null {
    if (!dateString) {
      return null;
    }
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateString);
  }





  submitSubProject(): void {
    if (!this.subprojectId) {
      Swal.fire('Error', 'Sub-project ID not found. Please save the project first.', 'error');
      return;
    }

    Swal.fire({
      title: 'Are you sure you want to submit?',
      // text: "Once submitted, you may not be able to edit it.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, submit it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.cdr.detectChanges();

        this.api.POST(`/api/subproject/submit?subprojectId=${this.subprojectId}`, {})
          .then((res: any) => {
            if (res.data && res.data.code === 200) {
              Swal.fire(
                'Submitted!',
                'The sub-project has been submitted successfully.',
                'success'
              ).then(() => {
                this.router.navigate(['/sub-project/list']);
              });
            } else {
              Swal.fire(
                'Submission Failed',
                res.data.message || 'An unknown error occurred during submission.',
                'error'
              );
            }
          })
          .catch(err => {
            console.error('Sub-project submission failed', err);
            Swal.fire(
              'API Error',
              'An error occurred while submitting the sub-project.',
              'error'
            );
          })
          .finally(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          });
      }
    });
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
       this.cdr.detectChanges();
    } catch (err) {
      console.error('Failed to load available projects', err);
      this.availableProjects = [{ id: 1, name: 'Project Alpha' }, { id: 2, name: 'Project Beta' }];
    }
  }

  async loadAvailableTypesOfWork(): Promise<void> {
    try {
      const res: any = await this.api.GET('api/lookup/generic/area-of-work');
      if (res.data && Array.isArray(res.data.content)) {
        this.availableTypesOfWork = res.data.content.map((item: any) => ({
          id: String(item.id),
          description: item.description,
        }));
      }
       this.cdr.detectChanges();
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
        `api/lookup/generic/work-activity?areaOfWorkId=${areaOfWorkId}`
      );
      if (res.data && Array.isArray(res.data.content)) {
        const activities = res.data.content.map((item: any) => ({
          id: String(item.id),
          description: item.description,
        }));
        this.availableActivities.set(String(areaOfWorkId), activities);
         this.cdr.detectChanges();
      } else {
        this.availableActivities.set(String(areaOfWorkId), []);
      }
       this.cdr.detectChanges();
    } catch (err) {
      console.error('Failed to load available activities', err);
      this.availableActivities.set(String(areaOfWorkId), []);
    }
  }

}
