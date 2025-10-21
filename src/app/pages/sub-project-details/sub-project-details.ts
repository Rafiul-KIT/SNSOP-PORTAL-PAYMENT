import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { ActivatedRoute } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { HttpClient, HttpHeaders, HttpParams, provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Loader } from '../../components/loader/loader';

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
    ReactiveFormsModule,
    BreadcrumbModule,
    DatePickerModule,
    TooltipModule,
    ButtonModule,
    Loader,
  ],
  templateUrl: './sub-project-details.html',
  styleUrl: './sub-project-details.scss',
 
})
export class SubProjectDetails implements OnInit {
  // Inject modern way (Angular 20)
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  projectForm!: FormGroup;
  targetForm!: FormGroup;
  isEditMode = false;
  isLoading = false;

  subprojectId: string | null = null;
  workDetails: WorkDetail[] = [];

  // Dropdowns
  statusList = ['Active', 'Inactive', 'Completed'];
  states = ['Jonglei', 'Unity', 'Upper Nile'];
  counties = ['Bor', 'Twic East', 'Akobo'];

  breadCrumbItems = [{ label: 'Settings' }, { label: 'Sub Project Details' }];
  breadcrumbHome = { icon: 'pi pi-home', routerLink: '/' };

  targets: { state: string; county: string }[] = [];
  statusMsg: string | null = null;

  private readonly WORK_DETAILS_API = '/api/subproject/work-details/get';

  ngOnInit(): void {
    this.subprojectId = this.route.snapshot.paramMap.get('id');
    this.initForms();

    if (this.subprojectId) {
      this.isEditMode = true;
      this.loadWorkDetails(this.subprojectId);
    } else {
      console.warn('⚠️ No subprojectId provided in route.');
    }
  }

  private initForms(): void {
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

    this.targetForm = this.fb.group({
      state: ['', Validators.required],
      county: ['', Validators.required],
    });
  }

  /** ✅ Fetch work details from API (modern way) */
  async loadWorkDetails(id: string) {
    this.isLoading = true;
    try {
      const params = new HttpParams().set('subprojectId', id);
      const headers = new HttpHeaders();

      const response = await firstValueFrom(
        this.http.get<ApiResponse>(this.WORK_DETAILS_API, { params, headers })
      );

      this.workDetails = response?.content ?? [];
      console.log('✅ Work details loaded:', this.workDetails);
    } catch (err) {
      console.error('❌ Failed to load work details', err);
    } finally {
      this.isLoading = false;
    }
  }

  addTarget(): void {
    if (this.targetForm.valid) {
      this.targets.push(this.targetForm.value);
      this.targetForm.reset();
    }
  }

  removeTarget(index: number): void {
    this.targets.splice(index, 1);
  }

  onSave(): void {
    if (this.projectForm.valid) {
      const payload = { ...this.projectForm.value, targets: this.targets };
      console.log('📤 Saving Project Data:', payload);
      this.statusMsg = 'Project saved successfully!';
    } else {
      this.projectForm.markAllAsTouched();
      this.statusMsg = 'Please fill all required fields.';
    }
  }

  onClear(): void {
    this.projectForm.reset();
    this.targetForm.reset();
    this.targets = [];
    this.statusMsg = 'Form cleared.';
  }

  onCancel(): void {
    this.projectForm.reset();
    this.targetForm.reset();
    this.targets = [];
    this.statusMsg = 'Action cancelled.';
  }
}
