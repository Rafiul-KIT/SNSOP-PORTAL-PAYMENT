import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule, Button } from 'primeng/button';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { Loader } from '../../components/loader/loader';
import { ApiService} from '../../services/api.service';
import { ChangeDetectorRef } from '@angular/core';
import { DatePickerModule } from 'primeng/datepicker';

interface WorkDetail {
  id: number;
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
  equipmentPhotoUrl: string | null;
  workPhotoUrl: string | null;
  materialPhotoUrl: string | null;
  status: boolean;
}

interface ApiResponse {
  code: number;
  message: string;
  content: WorkDetail[];
}

interface Target {
estCost: any;
estManPower: any;
workActivity: any;
  workName: string;
  areaOfWork: string;
  state?: string;
  county?: string;
  stateId?: number;
  countyId?: number;
  workCode?: string;
  id?: number;
}

@Component({
  selector: 'app-sub-project-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbModule,
    DatePickerModule,
    TooltipModule,
    FormsModule,
    Button
  ],
  templateUrl: './sub-project-details.html',
  styleUrls: ['./sub-project-details.scss'],
})
export class SubProjectDetails implements OnInit {
  projectForm!: FormGroup;
  targetForm!: FormGroup;

  subprojectId: string | null = null;
  isEditMode = false;
  isLoading = false;


  statusList = ['Active', 'Inactive', 'Completed'];
  states = ['Jonglei', 'Unity', 'Upper Nile'];
  counties = ['Bor', 'Twic East', 'Akobo'];


  breadCrumbItems = [
    { label: 'Sub-Project List' },
    { label: 'Sub-Project Details' }
  ];
  breadcrumbHome = { icon: 'pi pi-home', routerLink: '/' };

  targets: Target[] = [];
  statusMsg: string | null = null;
  
  private readonly PROJECTS_ENDPOINT = '/api/subproject/work-details/get';

  constructor(
    private route: ActivatedRoute, 
    private fb: FormBuilder, 
    private apiService: ApiService, 
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  private qs(params: Record<string, any>): string {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') usp.set(k, String(v));
    });
    return usp.toString();
  }

  ngOnInit(): void {
   
    this.subprojectId = this.route.snapshot.paramMap.get('id');

    if (this.subprojectId) {
      this.isEditMode = true;
      this.loadProjectData(this.subprojectId);
    } else {
      this.isEditMode = false;
    }

    this.projectForm = this.fb.group({
      projectName: ['', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      sanctionDate: [null],
      targetBeneficiaries: ['', [Validators.required, Validators.min(1)]],
      cost: ['', [Validators.required, Validators.min(0)]],
      inchargeName: ['', Validators.required],
      inchargeMobile: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
      inchargeEmail: ['', [Validators.required, Validators.email]],
      status: ['', Validators.required],
    });

    this.targetForm = this.fb.group({
      state: ['', Validators.required],
      county: ['', Validators.required]
    });
  }

  async loadProjectData(id: string): Promise<void> {
    this.isLoading = true;
    this.statusMsg = 'Loading project data...';
    
    try {
      const query = this.qs({ subprojectId: id });
      const url = `${this.PROJECTS_ENDPOINT}?${query}`;

      const res = await this.apiService.GET(url);

      const data = res.data;

      if (data && data.code === 200 && Array.isArray(data.content) && data.content.length > 0) {
       
        this.targets = data.content.map((item: WorkDetail) => ({
          id: item.id,
          workName: item.workName,
          workCode: item.workCode,
          areaOfWork: item.areaOfWork,
          workActivity: item.workActivity,
          estManPower: item.estManPower,
          estCost: item.estCost,
          state: (item as any).stateName || '',
          county: (item as any).countyName || '',
          stateId: (item as any).stateId,
          countyId: (item as any).countyId
        }));

        this.statusMsg = `Loaded ${this.targets.length} work detail(s) successfully.`;
      } else {
        this.statusMsg = 'No work details found for this project.';
        this.targets = [];
      }
    } catch (err: any) {
      console.error('Failed to load project data:', err);
      this.statusMsg = err?.response?.data?.message || 'Error loading project data.';
      this.targets = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // Add a new target (state/county)
  addTarget(): void {
    if (this.targetForm.valid) {
      const newTarget: Target = {
        state: this.targetForm.value.state,
        county: this.targetForm.value.county,
        workName: '',
        areaOfWork: '',
        estCost: 0,
        estManPower: 0,
        workActivity: 0
      };
      
      this.targets.push(newTarget);
      this.targetForm.reset();
      this.statusMsg = 'Target location added successfully.';
    } else {
      this.targetForm.markAllAsTouched();
      this.statusMsg = 'Please select both state and county.';
    }
  }

  // Remove a target
  removeTarget(index: number): void {
    if (index >= 0 && index < this.targets.length) {
      this.targets.splice(index, 1);
      this.statusMsg = 'Target removed successfully.';
    }
  }

  // Save project details
  async onSave(): Promise<void> {
    if (this.projectForm.valid) {
      if (this.targets.length === 0) {
        this.statusMsg = 'Please add at least one target location.';
        return;
      }

      this.isLoading = true;
      const payload = {
        ...this.projectForm.value,
        targets: this.targets,
        subprojectId: this.subprojectId
      };

      try {

        console.log('Project Data:', payload);
        this.statusMsg = 'Project saved successfully!';
        
      } catch (err: any) {
        console.error('Failed to save project:', err);
        this.statusMsg = err?.response?.data?.message || 'Error saving project.';
      } finally {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    } else {
      this.projectForm.markAllAsTouched();
      this.statusMsg = 'Please fill all required fields correctly.';
    }
  }

  // Clear all form fields
  onClear(): void {
    this.projectForm.reset();
    this.targetForm.reset();
    this.targets = [];
    this.statusMsg = 'Form cleared.';
  }

  // Cancel the operation
  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      this.projectForm.reset();
      this.targetForm.reset();
      this.targets = [];
      this.statusMsg = 'Action cancelled.';
      // Optionally navigate back
      // this.router.navigate(['/projects']);
    }
  }
}