import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Loader } from '../../components/loader/loader';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-beneficiary-assignment',
  templateUrl: './beneficiary-assignment.html',
  styleUrl: './beneficiary-assignment.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    DatePickerModule,
    ButtonModule,
    InputNumberModule,
    DividerModule,
    SelectModule,
    Breadcrumb,
    Loader,
  ],
})
export class BeneficiaryAssignment implements OnInit {
  loading = false;
  projectInfo: any;
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;
  subprojectId: string | null = null;
  projectForm!: FormGroup;
  targets: any[] = [];
  statusMsg = '';
  isLoading = false;

  private readonly PROJECTS_ENDPOINT = '/api/subproject/get';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.initBreadcrumb();

    this.subprojectId = this.route.snapshot.paramMap.get('id');

    if (this.subprojectId) {
      this.loadProjectData(this.subprojectId);
    }
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Beneficiary Assignment' }];
  }

  async loadProjectData(id: string): Promise<void> {
    this.isLoading = true;
    this.statusMsg = 'Loading project data...';

    try {
      const requestBody = { id: Number(id) };
      const queryParams = `page=0&size=1`;

      const response: any = await this.apiService.POST(
        `api/subproject/get?${queryParams}`,
        requestBody
      );

      const data = response.data;

      if (
        data?.code === 200 &&
        Array.isArray(data.content) &&
        data.content.length > 0
      ) {
        this.projectInfo = data.content[0];

        this.targets = data.content.map((item: any) => ({
          id: item.id,
          workCode: item.workCode,
          workName: item.projectName,
          areaOfWork: '',
          workActivity: '',
          estManPower: 0,
          estCost: 0,
          state: item.stateName,
          county: item.countyName,
          stateId: item.stateId,
          countyId: item.countyId,
          status: item.status,
          screeningStatus: item.screeningStatus,
        }));

        this.statusMsg = `Loaded ${data.totalElements} record(s) successfully.`;
      } else {
        this.projectInfo = null;
        this.targets = [];
        this.statusMsg = 'No data found.';
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
      this.statusMsg = 'Error loading project data.';
      this.targets = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
