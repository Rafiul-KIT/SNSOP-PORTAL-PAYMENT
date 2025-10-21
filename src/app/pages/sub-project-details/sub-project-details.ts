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
  areaOfWork: string;
  workActivity: string;
  estManPower: number;
  estDay: number;
  estSkilledLabourDay: number;
  estStartAt: string;
  estEndAt: string;
  estCost: number;
  equipmentCost: number;
  materialCost: number;
  equipmentPhotoUrl: string;
  workPhotoUrl: string;
  materialPhotoUrl: string;
  status: boolean;
}

interface ApiResponse {
  code: number;
  message: string;
  content: WorkDetail[];
}

@Component({
  selector: 'app-sub-project-details',
  standalone: true,
   imports: [
    CommonModule,
    ReactiveFormsModule, // For reactive forms
    BreadcrumbModule, // Added BreadcrumbModule
    DatePickerModule, // PrimeNG DatePicker
    TooltipModule,
    Loader,
    FormsModule,
    Button
],
  templateUrl: './sub-project-details.html',
  styleUrls: ['./sub-project-details.scss'],
})
export class SubProjectDetails   implements OnInit {
  projectForm!: FormGroup;
  targetForm!: FormGroup;

  projectId: string | null = null;
 
  isEditMode = false;
  isLoading = false;

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
  private readonly PROJECTS_ENDPOINT = '/api/project/target/get';

  constructor(private route: ActivatedRoute, private fb: FormBuilder, private apiService: ApiService, private cdr: ChangeDetectorRef) { }

  private qs(params: Record<string, any>): string {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') usp.set(k, String(v));
    });
    return usp.toString();
  }

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
  async loadProjectData(id: string): Promise<void> {
    this.isLoading = true;
    try {
      const query = this.qs({ projectId: id });
      const url = `${this.PROJECTS_ENDPOINT}?${query}`;

      const res = await this.apiService.GET(url);

      // ✅ Axios wraps actual data in res.data
      const data = res.data;

      if (data && data.code === 200 && Array.isArray(data.content)) {
        this.targets = data.content.map((item: any) => ({
          state: item.stateName,
          county: item.countyName,
          stateId: item.stateId,
          countyId: item.countyId
        }));

        this.statusMsg = `Loaded ${this.targets.length} target(s) successfully.`;
      } else {
        this.statusMsg = 'No project data found.';
      }
    } catch (err) {
      console.error('Failed to load project data:', err);
      this.statusMsg = 'Error loading project data.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
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
