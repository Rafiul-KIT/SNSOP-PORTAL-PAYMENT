import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { Loader } from "../../components/loader/loader";

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
  status?: string;
}

interface FileUpload {
  file: File;
  fileName: string;
  activityIndex: number;
  type: 'equipment' | 'work' | 'materials';
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
  
  // Signals for reactive state management
  isLoading = signal<boolean>(false);
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
    this.setupSearchListener();
    this.setupFormValueChanges();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Initialize the reactive form with validators
   */
  private initializeForm(): void {
    this.proposalForm = this.fb.group({
      // Basic Information
      ip: ['', Validators.required],
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
  private createWorkActivityGroup(): FormGroup {
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
      status: ['']
    });
    
    // Auto-calculate total cost when equipment or material cost changes
    group.get('estimatedCostOfEquipment')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateTotalCost(group));
      
    group.get('estimatedCost')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateTotalCost(group));
    
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
    this.workActivities.push(this.createWorkActivityGroup());
  }
  
  /**
   * Remove work activity at index
   */
  removeWorkActivity(index: number): void {
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
        console.log('Form values changed:', values);
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
      // await this.workProposalService.createProposal(proposalData);
      
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