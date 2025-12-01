import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { ActivatedRoute, Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ApiService } from '../../services/api.service';
import { LookupService } from '../../services/lookup.service';
import { Loader } from "../../components/loader/loader";
import { Toast } from "primeng/toast";
import { MessageService } from 'primeng/api';
import Swal from 'sweetalert2';

export function dateRangeValidator(
  group: AbstractControl
): ValidationErrors | null {
  const startDate = group.get('startDate')?.value;
  const endDate = group.get('endDate')?.value;
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return { dateRange: true };
  }
  return null;
}

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbModule,
    DatePickerModule,
    TooltipModule,
    Button,
    Loader,
    Toast
],
providers: [MessageService],
  templateUrl: './project.html',
  styleUrls: ['./project.scss'],
})
export class Project implements OnInit {
  projectForm!: FormGroup;
  targetForm!: FormGroup;

  projectId: string | null = null;
  savedProjectId: number | null = null; // Store the ID after saving
  isEditMode = false;
  isLoading = false;

  statusList = ['InProgress', 'Closed'];
  states: any[] = [];
  counties: any[] = [];

  breadCrumbItems = [{ label: 'Settings' }, { label: 'Project Registration' }];
  breadcrumbHome = { icon: 'pi pi-home', routerLink: '/' };

  targets: {
    id: number;
    state: string;
    county: string;
    stateId: number;
    countyId: number;
  }[] = [];
  statusMsg: string | null = null;

  private readonly PROJECTS_ENDPOINT = '/api/project/target/get';
  private readonly PROJECTS_DETAILS = '/api/project/get';
  private readonly PROJECT_SAVE = '/api/project/save';
  private readonly PROJECT_TARGET_SAVE = '/api/project/target/save';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private lookupService: LookupService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService  
  ) {}
private showToast(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string): void {
  this.messageService.add({ severity, summary, detail, life: 3000 });
}
  private qs(params: Record<string, any>): string {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') usp.set(k, String(v));
    });
    return usp.toString();
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    this.loadStateList();

    if (this.projectId) {
      this.isEditMode = true;
      this.savedProjectId = parseInt(this.projectId);
      this.loadProjectData(this.projectId);
      this.loadProjectDetails(this.projectId);
    } else {
      this.isEditMode = false;
    }

    // Initialize the project form
    this.projectForm = this.fb.group(
      {
        projectName: ['', [Validators.required, Validators.minLength(2)]],
        startDate: [null, Validators.required],
        endDate: [null, Validators.required],
        sanctionDate: [null],
        targetBeneficiaries: [
          null,
          [
            Validators.required,
            Validators.min(1),
            Validators.pattern(/^[0-9]+$/),
          ],
        ],
        cost: [
          null,
          [
            Validators.required,
            Validators.min(0),
            Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/),
          ],
        ],
        inchargeName: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.pattern(/^[a-zA-Z\s]*$/),
          ],
        ],
        inchargeMobile: [
          '',
          [Validators.required, Validators.pattern(/^[0-9]{9,13}$/)],
        ],
        inchargeEmail: ['', [Validators.required, Validators.email]],
        status: ['', Validators.required],
      },
      { validators: dateRangeValidator }
    );

    // Initialize the target form for adding state/county details
    this.targetForm = this.fb.group({
      state: ['', Validators.required],
      county: ['', Validators.required],
    });
  }

  async loadStateList() {
    this.states = await this.lookupService.getOrFetchStateList();
    this.cdr.detectChanges();
  }

  async onStateChange(event: Event) {
    const select = event.target as HTMLSelectElement | null;
    const stateId = select?.value || '';
    if (!stateId) {
      this.counties = [];
      this.targetForm.patchValue({ county: '' });
      this.cdr.detectChanges();
      return;
    }
    try {
      this.counties = await this.lookupService.getCountyListByStateId(stateId);
      this.targetForm.patchValue({ county: '' });
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Failed to load counties:', err);
      this.counties = [];
    }
  }

  async loadProjectDetails(id: string): Promise<void> {
    this.isLoading = true;
    try {
      const query = this.qs({ page: 0, size: 10, id: id });
      const url = `${this.PROJECTS_DETAILS}?${query}`;
      const res = await this.apiService.GET(url);
      const data = res.data;

      if (
        data &&
        data.code === 200 &&
        Array.isArray(data.content) &&
        data.content.length > 0
      ) {
        const project = data.content[0];

        this.projectForm.patchValue({
          projectName: project.projectName,
          startDate: new Date(project.startAt),
          endDate: new Date(project.endAt),
          sanctionDate: project.sanctionedAt
            ? new Date(project.sanctionedAt)
            : null,
          targetBeneficiaries: project.targetBeneficiary,
          cost: project.estimatedCost,
          inchargeName: project.inchargeName,
          inchargeMobile: project.inchargeMobile,
          inchargeEmail: project.inchargeEmail,
          status: project.status,
        });

    
      } else {
        this.statusMsg = 'No project data found.';
      }
    } catch (err) {
      console.error('Failed to load project data:', err);
     this.showToast('error', 'Error', 'Error loading project data.');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async loadProjectData(id: string): Promise<void> {
    this.isLoading = true;
    try {
      const query = this.qs({ projectId: id });
      const url = `${this.PROJECTS_ENDPOINT}?${query}`;
      const res = await this.apiService.GET(url);
      const data = res.data;

      if (data && data.code === 200 && Array.isArray(data.content)) {
        this.targets = data.content.map((item: any) => ({
          id: item.id || 0,
          state: item.stateName,
          county: item.countyName,
          stateId: item.stateId,
          countyId: item.countyId,
        }));

        this.statusMsg = `Loaded ${this.targets.length} target(s) successfully.`;
      } else {
        this.statusMsg = 'No target data found.';
      }
    } catch (err) {
      console.error('Failed to load project targets:', err);
      this.statusMsg = 'Error loading project targets.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // Add a new target (state/county)
  addTarget(): void {
    if (!this.targetForm.valid) {
      this.targetForm.markAllAsTouched();
    this.showToast('warn', 'Warning', 'Please select both state and county.');
      return;
    }

    const stateId = this.targetForm.value.state;
    const countyId = this.targetForm.value.county;

    // Convert to number if they are strings
    const stateIdNum =
      typeof stateId === 'string' ? parseInt(stateId) : stateId;
    const countyIdNum =
      typeof countyId === 'string' ? parseInt(countyId) : countyId;

    const stateName = this.states.find((s) => s.id == stateIdNum)?.name || '';
    const countyName =
      this.counties.find((c) => c.id == countyIdNum)?.name || '';

    // Check if already exists
    const exists = this.targets.some(
      (t) => t.stateId === stateIdNum && t.countyId === countyIdNum
    );
    if (exists) {
      this.statusMsg = 'This state/county combination already exists.';
      return;
    }

    this.targets.push({
      state: stateName,
      county: countyName,
      stateId: stateIdNum,
      countyId: countyIdNum,
      id: 0,
    });

    this.targetForm.reset();
    this.counties = [];
   this.showToast('info', 'Info', 'Target added successfully.');
    this.cdr.detectChanges();
  }

  // Remove a target (state/county)
  removeTarget(index: number): void {
    this.targets.splice(index, 1);
    this.statusMsg = 'Target removed.';
  }

  // Format date to YYYY-MM-DD
  private formatDate(date: Date | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Save project details
async onSave(): Promise<void> {
 
  this.projectForm.markAllAsTouched();

  if (!this.projectForm.valid) {
  
    const invalidFields = Object.keys(this.projectForm.controls).filter(
      (key) => this.projectForm.get(key)?.invalid
    );
   

    Swal.fire({
      title: 'Validation Error',
      html: 'Please fill all required fields correctly.<br>' +
            invalidFields.join('<br>'),
      icon: 'warning',
    });
    return;
  }
  if (!this.isEditMode && this.targets.length === 0) {
    Swal.fire({
      title: 'Validation Error',
      text: 'Please add at least one State/County target before saving a new project.',
      icon: 'warning',
    });
    return;
  }


  try {
    const projectPayload: any = {
      projectName: this.projectForm.value.projectName,
      startAt: this.formatDate(this.projectForm.value.startDate),
      endAt: this.formatDate(this.projectForm.value.endDate),
      sanctionedAt: this.formatDate(this.projectForm.value.sanctionDate),
      targetBeneficiary: parseInt(this.projectForm.value.targetBeneficiaries),
      estimatedCost: parseFloat(this.projectForm.value.cost),
      inchargeName: this.projectForm.value.inchargeName,
      inchargeMobile: this.projectForm.value.inchargeMobile,
      inchargeEmail: this.projectForm.value.inchargeEmail,
      status: this.projectForm.value.status,
    };

    if (this.isEditMode && this.savedProjectId) {
      projectPayload.id = this.savedProjectId;
    }

    // Save/Update Project
    const projectRes = await this.apiService.POST(
      this.PROJECT_SAVE,
      projectPayload
    );
    const projectData = projectRes.data;

    if (projectData.code === 200) {
      this.savedProjectId = projectData.entityId || this.projectId;

      // Save Project Targets if any
      if (this.targets.length > 0 && this.savedProjectId) {
        const targetPayload = {
          projectId: this.savedProjectId,
          list: this.targets.map((t) => ({
            id: t.id !== 0 ? t.id : undefined,
            stateId: t.stateId,
            countyId: t.countyId,
          })),
        };

        const targetRes = await this.apiService.POST(
          this.PROJECT_TARGET_SAVE,
          targetPayload
        );
        const targetData = targetRes.data;

        if (!(targetData && targetData.code === 200)) {
          Swal.fire({
            title: 'Partial Success',
            text: `Project saved but failed to save targets: ${targetData?.message || 'Unknown error'}`,
            icon: 'warning',
          });
        }
      }

      // Success modal
      Swal.fire({
        title: 'Success!',
        text: `Project ${this.isEditMode ? 'updated' : 'saved'} successfully!`,
        icon: 'success',
      }).then(() => {
        this.router.navigate(['/project/list']);
      });
    } else {
      // Failure modal
      Swal.fire({
        title: 'Error',
        text: `Failed to save project: ${projectData?.message || 'Unknown error'}`,
        icon: 'error',
      })
      ;
    }
  } catch (err: any) {
    console.error('Failed to save project:', err);
    Swal.fire({
      title: 'Error',
      text: `Error saving project: ${err.message || 'Unknown error'}`,
      icon: 'error',
    });
  } finally {
    this.isLoading = false;
    this.cdr.detectChanges();
  }
}


  // Clear all form fields
  onClear(): void {
    this.projectForm.reset();
    this.targetForm.reset();
    this.targets = [];
    this.counties = [];
    this.statusMsg = 'Form cleared.';
  }

  // Cancel the operation

}
