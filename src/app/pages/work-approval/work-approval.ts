import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';

import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { LookupItem, LookupService, TypeOfMeetingEnum, StatusEnum, ScreeningStatusEnum } from '../../services/lookup.service';
import { ApiService } from '../../services/api.service';
import { Loader } from "../../components/loader/loader";

interface SubProjectDto {
  id: number;
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
}

@Component({
  selector: 'app-work-approval',
  templateUrl: './work-approval.html',
  styleUrl: './work-approval.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    PaginatorModule,
    BreadcrumbModule,
    FloatLabelModule,
    InputTextModule,
    SelectModule,
    RouterModule,
    TooltipModule,
    Loader
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkApproval implements OnInit {
  isLoading = true;
  searchForm!: FormGroup;

  // geo lookup lists
  states: LookupItem[] = [];
  counties: LookupItem[] = [];
  payams: LookupItem[] = [];
  bomas: LookupItem[] = [];

  projects: LookupItem[] = [];
  workTypes: any[] = [];
  workActivities: LookupItem[] = [];
  implementingPartners: LookupItem[] = [];
  statuses: any[] = [];
  screeningStatuses: any[] = [];

  subProjects: SubProjectDto[] = [];
  totalRecords = 0;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  currentPage = 0; // 0-based
  pageSize = 10;
  advanceSearchPanelVisible = false;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef
  ) { }

  private async loadLookups() {
    await Promise.all([
      this.lookup.getOrFetchStateList(),
      this.lookup.fetchAllCountyList(),
      this.lookup.fetchAllPayamList(),
      this.lookup.fetchAllBomaList(),
    ]);

    this.states = this.lookup.getStateList();
    this.counties = this.lookup.getAllCountyList();
    this.payams = this.lookup.getAllPayamList();
    this.bomas = this.lookup.getAllBomaList();

    this.cdr.markForCheck();
  }

  async ngOnInit() {
    this.initForm();
    this.workTypes = TypeOfMeetingEnum;
    this.statuses = StatusEnum;
    this.screeningStatuses = ScreeningStatusEnum;
    this.initBreadcrumb();
    await this.loadLookups();
    this.fetchPage(this.currentPage, this.pageSize);
  }

  initForm() {
 this.searchForm = this.fb.group({
  implementingPartner: [null],
  state: [null],
  county: [{ value: null, disabled: true }],
  projectName: [null],
  typeOfWork: [null],
  payam: [{ value: null, disabled: true }],
  boma: [{ value: null, disabled: true }],
  status: [null],
  workCode: [''],
  workActivity: [null],
  screeningStatus: [null]
});

  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Work Approval' }];
  }

  // ---------- dependent dropdowns ----------
onStateChange(state: LookupItem | null) {
  if (state?.id) {
    this.searchForm.get('county')?.enable();
  } else {
    this.searchForm.get('county')?.disable();
  }
}

onCountyChange(county: LookupItem | null) {
  if (county?.id) {
    this.searchForm.get('payam')?.enable();
  } else {
    this.searchForm.get('payam')?.disable();
  }
}

onPayamChange(payam: LookupItem | null) {
  if (payam?.id) {
    this.searchForm.get('boma')?.enable();
  } else {
    this.searchForm.get('boma')?.disable();
  }
}

  // ---------- Request building ----------
  private buildSearchBody(page: number, size: number) {
    const f = this.searchForm.value;
    return {
      id: null,
      workCode: f.workCode ? f.workCode.trim() : null,
      projectId: f.projectName || null,
      projectName: null,
      stateId: f.state?.id || null,
      stateName: null,
      countyId: f.county?.id || null,
      countyName: null,
      payamId: f.payam?.id || null,
      payamName: null,
      bomaId: f.boma?.id || null,
      bomaName: null,
      typeOfMeeting: f.typeOfWork || null,
      meetingDate: null,
      screeningStatus: f.screeningStatus || null,
      status: f.status || null
    };
  }

  // ---------- Data loading ----------
  fetchPage(page: number, size: number) {
    this.isLoading = true;
    const body = this.buildSearchBody(page, size);
    
    this.api
      .POST(`api/subproject/get?page=${page}&size=${size}`, body)
      .then((res: any) => {
        console.log('API Response:', res);
        
        if (!res) throw new Error('Empty response');
        
        // Access data from nested structure: res.data.content
        const data = res.data || res;
        const content = data.content || [];
        this.subProjects = content;
        this.totalRecords = data.totalElements || 0;
        
        if (content.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Search',
            detail: 'No sub-projects found',
          });
        }
      })
      .catch((err) => {
        console.error('Fetch sub-projects error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch sub-projects',
        });
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  searchBeneficiaries() {
    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize);
  }

resetForm() {
  this.searchForm.reset();
  this.counties = this.lookup.getAllCountyList();  // Reset to full list
  this.payams = [];
  this.bomas = [];
  this.currentPage = 0;
  this.fetchPage(this.currentPage, this.pageSize);
  this.cdr.markForCheck();
}


  // ---------- Actions ----------
  editBeneficiary(item: SubProjectDto) {
    if (!item?.id) return;
    this.router.navigate(['/apply-wage-request/create'], {
      queryParams: { id: item.id }
    });
  }

  trackById = (_: number, row: SubProjectDto) => row.id;
}