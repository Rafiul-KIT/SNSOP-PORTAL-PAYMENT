import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { Loader } from "../../components/loader/loader";
import { ApiService } from "../../services/api.service";

// Interfaces
interface WorkProposal {
  id?: number;
  workCode: string;
  projectId: number;
  projectName: string;
  stateId: number;
  stateName: string;
  countyId: number;
  countyName: string;
  payamId: number;
  payamName: string;
  bomaId: number;
  bomaName: string;
  typeOfMeeting: string;
  meetingDate: string;
  screeningStatus: string;
  status: string;
  targetBeneficiaries: number;
  projectCost: number;
  workActivities: WorkActivity[];
}

interface WorkActivity {
  id?: number;
  workName: string;
  workCode: string;
  areaOfWorkId: number;
  areaOfWork: string;
  workActivityId: number;
  workActivity: string;
  estManPower: number;
  estDay: number;
  estSkilledLabourDay: number;
  estStartAt: string;
  estEndAt: string;
  estCost: number;
  equipmentCost: number;
  materialCost: number;
  equipmentPhotoUrl?: string;
  workPhotoUrl?: string;
  materialPhotoUrl?: string;
  startCoordinate?: string;
  endCoordinate?: string;
  paperScreeningStatus?: string;
  status?: boolean | string;
}

interface FileUpload {
  file: File;
  fileName: string;
  activityIndex: number;
  type: 'equipment' | 'work' | 'materials';
}

interface ApiResponse<T> {
  code: number;
  message: string;
  content: T;
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
}

@Component({
  selector: 'app-work-proposal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbModule, Loader],
  templateUrl: './work-review.html',
  styleUrls: ['./work-review.scss']
})
export class WorkReview implements OnInit, OnDestroy {
  // Dependency Injection using inject()
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  
  // Signals for reactive state management
  isLoading = signal<boolean>(false);
  isViewMode = signal<boolean>(false);
  subprojectId = signal<number | null>(null);
  availableActivities = signal<string[]>([
    'Road Construction',
    'Bridge Building',
    'Water Supply',
    'Drainage System',
    'Building Construction',
    'Rehabilitation'
  ]);
  
  // File storage signals
  equipmentFiles = signal<Map<number, FileUpload>>(new Map());
  workPhotoFiles = signal<Map<number, FileUpload>>(new Map());
  materialsPhotoFiles = signal<Map<number, FileUpload>>(new Map());
  
  // Form controls
  proposalForm!: FormGroup;
  searchCtrl = new FormControl('');
  
  // Breadcrumb
  breadcrumbItems: MenuItem[] = [
    { label: 'Dashboard', routerLink: '/dashboard' },
    { label: 'Work Proposals', routerLink: '/work-proposals' },
    { label: 'Create Proposal' }
  ];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };
  
  // Cleanup
  private destroy$ = new Subject<void>();
  
  // Computed values
  totalActivities = computed(() => this.workActivities.length);
  
  ngOnInit(): void {
    this.initializeForm();
    this.checkViewMode();
    this.setupSearchListener();
    this.setupFormValueChanges();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Check if component is in view mode and load data
   */
  private checkViewMode(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(async params => {
        const id = params['id'];
        if (id) {
          this.subprojectId.set(+id);
          this.isViewMode.set(true);
          await this.loadSubprojectData(+id);
        }
      });
  }
  
  /**
   * Load subproject data from API
   */
  private async loadSubprojectData(id: number): Promise<void> {
    this.isLoading.set(true);
    
    try {
      // Fetch subproject basic info and work details in parallel
      const [subprojectData, workDetails] = await Promise.all([
        this.fetchSubprojectInfo(id),
        this.fetchWorkDetails(id)
      ]);
      
      console.log('Subproject Data:', subprojectData);
      console.log('Work Details:', workDetails);
      
      // Populate form with data FIRST
      this.populateForm(subprojectData, workDetails);
      
      // THEN disable form for view mode after a small delay to ensure data is set
      setTimeout(() => {
        this.proposalForm.disable();
      }, 100);
      
    } catch (error) {
      console.error('Error loading subproject data:', error);
      alert('Failed to load work proposal data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  /**
   * Fetch subproject basic information
   */
  private async fetchSubprojectInfo(id: number): Promise<any> {
    try {
      const requestBody = { id };
      const queryParams = `page=0&size=1`;
      
      const response: any = await this.api.POST(
        `api/subproject/get?${queryParams}`,
        requestBody
      );
      
      const responseData = response.data;

      // Handle response structure
      if (responseData?.content && Array.isArray(responseData.content)) {
        return responseData.content[0];
      } else if (responseData?.content) {
        return responseData.content;
      }
      
      return responseData;
      
    } catch (error) {
      console.error('Error fetching subproject info:', error);
      throw error;
    }
  }
  
  /**
   * Fetch work details for subproject
   */
  private async fetchWorkDetails(subprojectId: number): Promise<WorkActivity[]> {
    try {
      const response: any = await this.api.GET(
        `api/subproject/work-details/get?subprojectId=${subprojectId}`
      );
      
      const responseData = response.data;

      // Handle response structure
      if (responseData?.content && Array.isArray(responseData.content)) {
        return responseData.content;
      }
      
      return [];
      
    } catch (error) {
      console.error('Error fetching work details:', error);
      throw error;
    }
  }
  
  /**
   * Populate form with fetched data
   */
  private populateForm(subprojectData: any, workDetails: WorkActivity[]): void {
    if (!subprojectData) {
      console.error('No subproject data to populate');
      return;
    }
    
    console.log('Populating form with:', { subprojectData, workDetails });
    
    // Populate basic information - map API fields to form fields
    const basicInfo = {
      projectName: subprojectData.projectName || '',
      workActivityCode: subprojectData.workCode || '',
      targetbeneficiaries: subprojectData.targetBeneficiaries || subprojectData.targetBeneficiary || 0,
      projectCost: subprojectData.projectCost || 0,
      typeOfMeeting: subprojectData.typeOfMeeting || '',
      meetingDate: subprojectData.meetingDate || '',
      screeningStatus: this.formatScreeningStatus(subprojectData.screeningStatus),
      stateName: subprojectData.stateName || '',
      countyName: subprojectData.countyName || '',
      payamName: subprojectData.payamName || '',
      bomaName: subprojectData.bomaName || ''
    };
    
    console.log('Setting basic info:', basicInfo);
    this.proposalForm.patchValue(basicInfo, { emitEvent: false });
    
    // Clear existing work activities
    while (this.workActivities.length > 0) {
      this.workActivities.removeAt(0);
    }
    
    // Populate work activities - map API fields to form fields
    if (workDetails && workDetails.length > 0) {
      workDetails.forEach((activity, index) => {
        console.log(`Adding activity ${index + 1}:`, activity);
        
        const activityGroup = this.fb.group({
          // Work identification
          name: [activity.workName || ''],
          code: [activity.workCode || ''],
          
          // Work type and activity
          typeOfWork: [activity.areaOfWork || ''],
          secondaryActivity: [activity.workActivity || ''],
          
          // Manpower estimates
          estimatedManpower: [activity.estManPower || 0],
          estimatedManDays: [activity.estDay || 0],
          estimatedSkillLabour: [activity.estSkilledLabourDay || 0],
          
          // Cost estimates
          estimatedCostOfEquipment: [activity.equipmentCost || 0],
          estimatedCost: [activity.materialCost || 0],
          totalEstimatedCost: [activity.estCost || 0],
          
          // Timeline
          workStartDate: [activity.estStartAt || ''],
          workEndDate: [activity.estEndAt || ''],
          
          // Coordinates
          startCoordinate: [activity.startCoordinate || ''],
          endCoordinate: [activity.endCoordinate || ''],
          
          // Status fields
          paperScreeningStatus: [activity.paperScreeningStatus || ''],
          status: [this.formatStatus(activity.status)],
          
          // Photo URLs
          equipmentPhotoUrl: [activity.equipmentPhotoUrl || ''],
          workPhotoUrl: [activity.workPhotoUrl || ''],
          materialPhotoUrl: [activity.materialPhotoUrl || '']
        });
        
        this.workActivities.push(activityGroup);
      });
    } else {
      console.log('No work details, adding empty activity');
      // Add at least one empty activity if no data
      this.workActivities.push(this.createWorkActivityGroup());
    }
    
    console.log('Form value after population:', this.proposalForm.getRawValue());
    
    // Update breadcrumb for view mode
    if (this.isViewMode()) {
      this.breadcrumbItems = [
        { label: 'Dashboard', routerLink: '/dashboard' },
        { label: 'Work Proposals', routerLink: '/work-proposals' },
        { label: 'View Proposal' }
      ];
    }
  }
  
  /**
   * Format screening status (handle number or string)
   */
  private formatScreeningStatus(status: number | string | undefined): string {
    if (status === undefined || status === null) return '';
    if (typeof status === 'number') {
      // Map number to status string if needed
      const statusMap: { [key: number]: string } = {
        0: 'Pending',
        1: 'Approved',
        2: 'Rejected'
      };
      return statusMap[status] || String(status);
    }
    return String(status);
  }
  
  /**
   * Format status value (handle boolean or string)
   */
  private formatStatus(status: boolean | string | undefined): string {
    if (status === undefined || status === null) return '';
    if (typeof status === 'boolean') return status ? 'Active' : 'Inactive';
    return String(status);
  }
  
  /**
   * Initialize the reactive form with validators
   */
  private initializeForm(): void {
    this.proposalForm = this.fb.group({
      // Basic Information
      ip: [''],
      projectName: ['', Validators.required],
      workActivityCode: [''],
      targetbeneficiaries: [null, [Validators.required, Validators.min(1)]],
      projectCost: [null, [Validators.required, Validators.min(0)]],
      typeOfMeeting: ['', Validators.required],
      meetingDate: ['', Validators.required],
      screeningStatus: [''],
      
      // Location Information
      stateName: ['', Validators.required],
      countyName: ['', Validators.required],
      payamName: ['', Validators.required],
      bomaName: ['', Validators.required],
      
      // Work Activities Array
      workActivities: this.fb.array([this.createWorkActivityGroup()])
    });
  }
  
  /**
   * Create a single work activity form group
   */
  private createWorkActivityGroup(skipValueChanges: boolean = false): FormGroup {
    const group = this.fb.group({
      name: ['', Validators.required],
      code: [''],
      typeOfWork: ['', Validators.required],
      secondaryActivity: ['', Validators.required],
      estimatedManpower: [null, [Validators.required, Validators.min(1)]],
      estimatedManDays: [null, [Validators.required, Validators.min(1)]],
      estimatedSkillLabour: [null, [Validators.required, Validators.min(0)]],
      estimatedCostOfEquipment: [null, [Validators.required, Validators.min(0)]],
      estimatedCost: [null, [Validators.required, Validators.min(0)]],
      totalEstimatedCost: [{ value: 0, disabled: true }],
      workStartDate: ['', Validators.required],
      workEndDate: ['', Validators.required],
      startCoordinate: ['', Validators.pattern(/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/)],
      endCoordinate: ['', Validators.pattern(/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/)],
      paperScreeningStatus: [''],
      status: [''],
      equipmentPhotoUrl: [''],
      workPhotoUrl: [''],
      materialPhotoUrl: ['']
    });
    
    // Only set up value change listeners if not skipping (i.e., not in view mode)
    if (!skipValueChanges) {
      // Auto-calculate total cost when equipment or material cost changes
      group.get('estimatedCostOfEquipment')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.calculateTotalCost(group));
        
      group.get('estimatedCost')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.calculateTotalCost(group));
    }
    
    return group;
  }
  
  /**
   * Calculate total estimated cost for an activity
   */
  private calculateTotalCost(activityGroup: FormGroup): void {
    const equipmentCost = activityGroup.get('estimatedCostOfEquipment')?.value || 0;
    const materialCost = activityGroup.get('estimatedCost')?.value || 0;
    const total = Number(equipmentCost) + Number(materialCost);
    activityGroup.get('totalEstimatedCost')?.setValue(total.toFixed(2), { emitEvent: false });
  }
  
  /**
   * Get work activities form array
   */
  get workActivities(): FormArray {
    return this.proposalForm.get('workActivities') as FormArray;
  }
  
  /**
   * Add a new work activity
   */
  addWorkActivity(): void {
    if (this.isViewMode()) return;
    this.workActivities.push(this.createWorkActivityGroup());
  }
  
  /**
   * Remove work activity at index
   */
  removeWorkActivity(index: number): void {
    if (this.isViewMode()) return;
    
    if (this.workActivities.length > 1) {
      this.workActivities.removeAt(index);
      
      // Clean up associated files
      this.equipmentFiles.update(files => {
        files.delete(index);
        return new Map(files);
      });
      this.workPhotoFiles.update(files => {
        files.delete(index);
        return new Map(files);
      });
      this.materialsPhotoFiles.update(files => {
        files.delete(index);
        return new Map(files);
      });
    }
  }
  
  /**
   * Track by function for ngFor performance
   */
  trackByIndex(index: number): number {
    return index;
  }
  
  /**
   * Handle equipment photo file selection
   */
  onEquipmentPhotoSelect(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.equipmentFiles.update(files => {
        files.set(index, {
          file,
          fileName: file.name,
          activityIndex: index,
          type: 'equipment'
        });
        return new Map(files);
      });
    }
  }
  
  /**
   * Handle work photo file selection
   */
  onWorkPhotoSelect(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.workPhotoFiles.update(files => {
        files.set(index, {
          file,
          fileName: file.name,
          activityIndex: index,
          type: 'work'
        });
        return new Map(files);
      });
    }
  }
  
  /**
   * Handle materials photo file selection
   */
  onMaterialsPhotoSelect(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.materialsPhotoFiles.update(files => {
        files.set(index, {
          file,
          fileName: file.name,
          activityIndex: index,
          type: 'materials'
        });
        return new Map(files);
      });
    }
  }
  
  /**
   * Get equipment file name for activity
   */
  getEquipmentFileName(index: number): string {
    return this.equipmentFiles().get(index)?.fileName || '';
  }
  
  /**
   * Get work photo file name for activity
   */
  getWorkPhotoName(index: number): string {
    return this.workPhotoFiles().get(index)?.fileName || '';
  }
  
  /**
   * Get materials photo file name for activity
   */
  getMaterialsPhotoName(index: number): string {
    return this.materialsPhotoFiles().get(index)?.fileName || '';
  }
  
  /**
   * Setup search control listener with debounce
   */
  private setupSearchListener(): void {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.performSearch(searchTerm || '');
      });
  }
  
  /**
   * Perform search operation
   */
  private performSearch(term: string): void {
    console.log('Searching for:', term);
    // Implement search logic here
  }
  
  /**
   * Setup form value changes listeners
   */
  private setupFormValueChanges(): void {
    this.proposalForm.valueChanges
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(values => {
        // Auto-save draft or perform other actions
        if (!this.isViewMode()) {
          console.log('Form values changed:', values);
        }
      });
  }
  
  /**
   * Validate date range for work activity
   */
  private validateDateRange(activityGroup: FormGroup): boolean {
    const startDate = new Date(activityGroup.get('workStartDate')?.value);
    const endDate = new Date(activityGroup.get('workEndDate')?.value);
    
    if (startDate && endDate && startDate > endDate) {
      activityGroup.get('workEndDate')?.setErrors({ invalidRange: true });
      return false;
    }
    return true;
  }
  
  /**
   * Transform form data to API format
   */
  private transformFormData(): WorkProposal {
    const formValue = this.proposalForm.getRawValue();
    
    const proposal: WorkProposal = {
      workCode: formValue.workActivityCode,
      projectId: 0, // Set from dropdown
      projectName: formValue.projectName,
      stateId: 0, // Set from dropdown
      stateName: formValue.stateName,
      countyId: 0, // Set from dropdown
      countyName: formValue.countyName,
      payamId: 0, // Set from dropdown
      payamName: formValue.payamName,
      bomaId: 0, // Set from dropdown
      bomaName: formValue.bomaName,
      typeOfMeeting: formValue.typeOfMeeting,
      meetingDate: formValue.meetingDate,
      screeningStatus: formValue.screeningStatus,
      status: 'IP_Submitted',
      targetBeneficiaries: formValue.targetbeneficiaries,
      projectCost: formValue.projectCost,
      workActivities: formValue.workActivities.map((activity: any) => ({
        workName: activity.name,
        workCode: activity.code,
        areaOfWorkId: 0, // Set from dropdown
        areaOfWork: activity.typeOfWork,
        workActivityId: 0, // Set from dropdown
        workActivity: activity.secondaryActivity,
        estManPower: activity.estimatedManpower,
        estDay: activity.estimatedManDays,
        estSkilledLabourDay: activity.estimatedSkillLabour,
        estStartAt: activity.workStartDate,
        estEndAt: activity.workEndDate,
        estCost: activity.totalEstimatedCost,
        equipmentCost: activity.estimatedCostOfEquipment,
        materialCost: activity.estimatedCost,
        startCoordinate: activity.startCoordinate,
        endCoordinate: activity.endCoordinate,
        paperScreeningStatus: activity.paperScreeningStatus,
        status: activity.status
      }))
    };
    
    return proposal;
  }
  
  /**
   * Handle form submission
   */
  async onSubmit(): Promise<void> {
    if (this.isViewMode()) {
      return;
    }
    
    if (this.proposalForm.invalid) {
      this.markFormGroupTouched(this.proposalForm);
      alert('Please fill in all required fields correctly.');
      return;
    }
    
    // Validate all activity date ranges
    for (let i = 0; i < this.workActivities.length; i++) {
      const activity = this.workActivities.at(i) as FormGroup;
      if (!this.validateDateRange(activity)) {
        alert(`Activity ${i + 1}: End date must be after start date.`);
        return;
      }
    }
    
    this.isLoading.set(true);
    
    try {
      const proposalData = this.transformFormData();
      console.log('Submitting proposal:', proposalData);
      
      // TODO: Implement API call
      // await this.api.POST('api/subproject/create', proposalData);
      
      // Upload files if any
      await this.uploadFiles();
      
      alert('Work proposal submitted successfully!');
      this.router.navigate(['/work-proposals']);
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert('Failed to submit proposal. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  /**
   * Upload all files
   */
  private async uploadFiles(): Promise<void> {
    const uploads: Promise<void>[] = [];
    
    // Upload equipment photos
    this.equipmentFiles().forEach((fileData, index) => {
      uploads.push(this.uploadFile(fileData));
    });
    
    // Upload work photos
    this.workPhotoFiles().forEach((fileData, index) => {
      uploads.push(this.uploadFile(fileData));
    });
    
    // Upload materials photos
    this.materialsPhotoFiles().forEach((fileData, index) => {
      uploads.push(this.uploadFile(fileData));
    });
    
    await Promise.all(uploads);
  }
  
  /**
   * Upload a single file
   */
  private async uploadFile(fileData: FileUpload): Promise<void> {
    const formData = new FormData();
    formData.append('file', fileData.file);
    formData.append('type', fileData.type);
    formData.append('activityIndex', fileData.activityIndex.toString());
    
    // TODO: Implement file upload API call
    console.log('Uploading file:', fileData.fileName);
  }
  
  /**
   * Mark all form controls as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  /**
   * Clear all form data
   */
  onClearAll(): void {
    if (this.isViewMode()) return;
    
    if (confirm('Are you sure you want to clear all data?')) {
      this.proposalForm.reset();
      this.workActivities.clear();
      this.workActivities.push(this.createWorkActivityGroup());
      this.equipmentFiles.set(new Map());
      this.workPhotoFiles.set(new Map());
      this.materialsPhotoFiles.set(new Map());
    }
  }
  
  /**
   * Cancel and navigate back
   */
  onCancel(): void {
    if (this.isViewMode()) {
      this.router.navigate(['/work-proposals']);
      return;
    }
    
    if (this.proposalForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.router.navigate(['/work-proposals']);
      }
    } else {
      this.router.navigate(['/work-proposals']);
    }
  }
  
  /**
   * Get form control error message
   */
  getErrorMessage(controlName: string): string {
    const control = this.proposalForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('min')) {
      return `Minimum value is ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('pattern')) {
      return 'Invalid format';
    }
    return '';
  }
  
  /**
   * Check if field is invalid and touched
   */
  isFieldInvalid(controlName: string): boolean {
    const control = this.proposalForm.get(controlName);
    return !!(control?.invalid && (control?.dirty || control?.touched));
  }
}