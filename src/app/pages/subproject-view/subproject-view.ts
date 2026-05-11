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
import { TooltipModule } from 'primeng/tooltip';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { saveAs } from 'file-saver';
import {
  LookupItem,
  LookupService,
  TypeOfMeetingEnum,
  StatusEnum,
  ScreeningStatusEnum,
  ProjectNameDescription,
} from '../../services/lookup.service';
import { ApiService } from '../../services/api.service';
import { Loader } from '../../components/loader/loader';

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

interface BeneficiaryDetailsDto {
  id: number;
  householdNumber: string;
  beneficiaryName: string;
  gender: string;
  age: number;
  registrationPhase: string;
  phoneNo: string;
  householdMonthlyAvgIncome: number;
  assigned: boolean;
}

@Component({
  selector: 'app-subproject-view',
  templateUrl: './subproject-view.html',
  styleUrl: './subproject-view.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    DialogModule,
    PaginatorModule,
    BreadcrumbModule,
    FloatLabelModule,
    SelectModule,
    RouterModule,
    TooltipModule,
    Loader,
    InputTextModule,
    ProgressBarModule,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubprojectView implements OnInit {
  private readonly FILTER_STORAGE_KEY = 'subProjectView_filters';
  isLoading = true;
  showDownloadProgressModal = false;
  downloadProgress = 0;
  downloadStatus = 'Downloading...';
  showBeneficiaryDownloadDialog = false;
  showNoBeneficiaryDialog = false;
  noBeneficiaryMessage = 'No beneficiary assigned to this sub-project.';
  selectedBeneficiarySubProject: SubProjectDto | null = null;
  beneficiaryDownloadFormat: 'excel' | 'pdf' | null = null;
  isBeneficiaryDownloading = false;
  beneficiaryDownloadOptions = [
    { label: 'Excel', value: 'excel' },
    { label: 'PDF', value: 'pdf' },
  ];
  lookupsLoaded = false;
  searchForm!: FormGroup;
  roleId: number | null = null;
  
  states: LookupItem[] = [];
  counties: LookupItem[] = [];
  payams: LookupItem[] = [];
  bomas: LookupItem[] = [];

  projects: ProjectNameDescription[] = [];
  workTypes: any[] = [];
  statuses: any[] = [];
  screeningStatuses: any[] = [];

  subProjects: SubProjectDto[] = [];
  totalRecords = 0;
  userRole: number | null = null;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  currentPage = 0;
  pageSize = 10;
  advanceSearchPanelVisible = false;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef
  ) {}

  private async loadInitialLookups() {
    await Promise.all([
      this.lookup.getOrFetchStateList(),
      this.lookup.getProjectNameDescription(),
    ]);

    this.states = this.lookup.getStateList();
    this.projects = this.lookup.projectNameDescriptionList;
    this.cdr.markForCheck();
  }

  async ngOnInit() {
    this.roleId = this.api.getUserRole();
    this.isLoading = true;
    this.cdr.markForCheck();
    this.workTypes = TypeOfMeetingEnum;

    this.userRole = this.api.getUserRole();
    this.statuses = StatusEnum;
    this.screeningStatuses = ScreeningStatusEnum;
    
    this.initBreadcrumb();
    this.initForm();

    try {
      await this.loadInitialLookups();
      this.lookupsLoaded = true;
      await this.restoreFiltersFromStorage();
    } catch (err) {
      console.error('Lookups loading error:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load lookup data.',
      });
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.fetchPage(this.currentPage, this.pageSize);
  }

  initForm() {
    this.searchForm = this.fb.group({
      projectId: [null],
      state: [null],
      county: [{ value: null, disabled: true }],
      projectName: [null],
      typeOfMeeting: [null],
      payam: [{ value: null, disabled: true }],
      boma: [{ value: null, disabled: true }],
      status: [null],
      workCode: [''],
      workActivity: [null],
      screeningStatus: [null],
    });
  }

  private saveFiltersToStorage(): void {
    const state = {
      filters: this.searchForm.getRawValue(),
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      advanceSearchPanelVisible: this.advanceSearchPanelVisible,
    };
    sessionStorage.setItem(this.FILTER_STORAGE_KEY, JSON.stringify(state));
  }

  private async restoreFiltersFromStorage(): Promise<boolean> {
    const stored = sessionStorage.getItem(this.FILTER_STORAGE_KEY);
    if (!stored) return false;

    try {
      const savedState = JSON.parse(stored);
      const filters = savedState.filters;

      this.currentPage = savedState.currentPage ?? 0;
      this.pageSize = savedState.pageSize ?? 10;
      this.advanceSearchPanelVisible = savedState.advanceSearchPanelVisible ?? false;

      this.searchForm.patchValue({
        projectId: filters.projectId,
        projectName: filters.projectName,
        typeOfMeeting: filters.typeOfMeeting,
        status: filters.status,
        workCode: filters.workCode,
        workActivity: filters.workActivity,
        screeningStatus: filters.screeningStatus,
      });

      if (filters.state) {
        const stateObj = this.states.find((s: any) => s.id === filters.state.id);
        if (stateObj) {
          this.searchForm.patchValue({ state: stateObj });
          await this.onStateChange(stateObj);
        }
      }
      if (filters.county && this.counties.length > 0) {
        const countyObj = this.counties.find((c: any) => c.id === filters.county.id);
        if (countyObj) {
          this.searchForm.patchValue({ county: countyObj });
          await this.onCountyChange(countyObj);
        }
      }
      if (filters.payam && this.payams.length > 0) {
        const payamObj = this.payams.find((p: any) => p.id === filters.payam.id);
        if (payamObj) {
          this.searchForm.patchValue({ payam: payamObj });
          await this.onPayamChange(payamObj);
        }
      }
      if (filters.boma && this.bomas.length > 0) {
        const bomaObj = this.bomas.find((b: any) => b.id === filters.boma.id);
        if (bomaObj) {
          this.searchForm.patchValue({ boma: bomaObj });
        }
      }

      this.cdr.markForCheck();
      return true;
    } catch (err) {
      console.error('Error restoring filters:', err);
      return false;
    }
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Sub-Project View List' }];
  }

  toggleAdvanceSearch() {
    this.advanceSearchPanelVisible = !this.advanceSearchPanelVisible;
  }

  async onStateChange(state: LookupItem | null) {
    this.searchForm.get('county')?.reset({ value: null, disabled: true });
    this.searchForm.get('payam')?.reset({ value: null, disabled: true });
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.counties = [];
    this.payams = [];
    this.bomas = [];

    if (state?.id) {
      this.counties = await this.lookup.getCountyListByStateId(state.id);
      this.searchForm.get('county')?.enable();
    }
    this.cdr.markForCheck();
  }

  async onCountyChange(county: LookupItem | null) {
    this.searchForm.get('payam')?.reset({ value: null, disabled: true });
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.payams = [];
    this.bomas = [];

    if (county?.id) {
      this.payams = await this.lookup.getPayamListByCountyId(county.id);
      this.searchForm.get('payam')?.enable();
    }
    this.cdr.markForCheck();
  }

  async onPayamChange(payam: LookupItem | null) {
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.bomas = [];

    if (payam?.id) {
      this.bomas = await this.lookup.getBomaListByPayamId(payam.id);
      this.searchForm.get('boma')?.enable();
    }
    this.cdr.markForCheck();
  }

  private buildSearchBody(page: number, size: number) {
    const f = this.searchForm.value;
    return {
      id: null,
      workCode: f.workCode ? f.workCode.trim() : null,
      projectId: f.projectId ? Number(f.projectId) : null,
      projectName: f.projectName || null,
      stateId: f.state?.id || null,
      stateName: null,
      countyId: f.county?.id || null,
      countyName: null,
      payamId: f.payam?.id || null,
      payamName: null,
      bomaId: f.boma?.id || null,
      bomaName: null,
      typeOfMeeting: f.typeOfMeeting || null,
      meetingDate: null,
      screeningStatus: f.screeningStatus || null,
      status: f.status || null,
    };
  }

  fetchPage(page: number, size: number) {
    this.isLoading = true;
    const body = this.buildSearchBody(page, size);
    
    // We use the same API as SubProjectList
    this.api
      .POST(`api/subproject/get?page=${page}&size=${size}`, body)
      .then((res: any) => {
        if (!res) throw new Error('Empty response');
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
    this.searchForm.get('county')?.disable();
    this.searchForm.get('payam')?.disable();
    this.searchForm.get('boma')?.disable();
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.currentPage = 0;
    sessionStorage.removeItem(this.FILTER_STORAGE_KEY);
    this.fetchPage(this.currentPage, this.pageSize);
    this.cdr.markForCheck();
  }

  viewSubProject(id: number) {
    this.saveFiltersToStorage();
    this.router.navigate(['/sub-project/view-details'], { queryParams: { id } });
  }

  async exportPdf(content: any[]) {
    const jsPDF = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF.default('l', 'px', 'a4');

    const head = [
      [
        'Serial',
        'Sub-Project Code',
        'Project Name',
        'State',
        'County',
        'Payam',
        'Boma',
        'Status',
      ],
    ];

    const body = content.map((item, index) => [
      index + 1,
      item.workCode,
      item.projectName,
      item.stateName,
      item.countyName,
      item.payamName,
      item.bomaName,
      item.status,
    ]);

    autoTable(doc, {
      head,
      body,
      didDrawPage: (data) => {
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();

        doc.setFontSize(10);
        const pageNumber = doc.getNumberOfPages();
        const text = `Page ${pageNumber}`;
        const textWidth = doc.getTextWidth(text);

        // Center the page number at the bottom
        doc.text(text, (pageWidth - textWidth) / 2, pageHeight - 20);
      },
    });
    doc.save(`sub_project_list_${Date.now()}.pdf`);
  }

  async exportCsv(content: any[]) {
    const xlsx = await import('xlsx');

    const exportData = content.map((item, index) => ({
      Serial: index + 1,
      'Sub-Project Code': item.workCode,
      'Project Name': item.projectName,
      State: item.stateName,
      County: item.countyName,
      Payam: item.payamName,
      Boma: item.bomaName,
      Status: item.status,
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const csvContent = xlsx.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `sub_project_list_${Date.now()}.csv`);
  }

  isInProgressStatus(status: string | null | undefined): boolean {
    return status === 'InProgress' || status === 'In Progress';
  }

  openBeneficiaryDownloadDialog(subProject: SubProjectDto) {
    if (!this.isInProgressStatus(subProject.status)) return;

    this.selectedBeneficiarySubProject = subProject;
    this.beneficiaryDownloadFormat = 'pdf';
    this.showBeneficiaryDownloadDialog = true;
    this.cdr.markForCheck();
  }

  closeBeneficiaryDownloadDialog() {
    if (this.isBeneficiaryDownloading) return;

    this.showBeneficiaryDownloadDialog = false;
    this.selectedBeneficiarySubProject = null;
    this.beneficiaryDownloadFormat = null;
    this.cdr.markForCheck();
  }

  closeNoBeneficiaryDialog() {
    this.showNoBeneficiaryDialog = false;
    this.cdr.markForCheck();
  }

  async confirmBeneficiaryDownload() {
    if (
      !this.selectedBeneficiarySubProject ||
      !this.beneficiaryDownloadFormat ||
      this.isBeneficiaryDownloading
    ) {
      return;
    }

    await this.downloadBeneficiaryDetails(
      this.selectedBeneficiarySubProject,
      this.beneficiaryDownloadFormat
    );
  }

  private getBeneficiaryExportData(content: BeneficiaryDetailsDto[]) {
    return content.map((item, index) => ({
      Serial: index + 1,
      'Household Number': item.householdNumber || '',
      'Beneficiary Name': item.beneficiaryName || '',
      Gender: item.gender || '',
      Age: item.age ?? '',
      'Registration Phase': item.registrationPhase || '',
      'Phone No': item.phoneNo || '',
      'Household Monthly Avg Income': item.householdMonthlyAvgIncome ?? '',
      Assigned: item.assigned ? 'Yes' : 'No',
    }));
  }

  private getBeneficiaryFilePrefix(subProject: SubProjectDto): string {
    const rawName = subProject.workCode || `subproject_${subProject.id}`;
    const safeName = rawName.replace(/[^a-zA-Z0-9_-]+/g, '_');
    return `beneficiary_details_${safeName}`;
  }

  async exportBeneficiaryDetailsExcel(
    content: BeneficiaryDetailsDto[],
    subProject: SubProjectDto
  ) {
    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(
      this.getBeneficiaryExportData(content)
    );
    const workbook = {
      Sheets: { Beneficiaries: worksheet },
      SheetNames: ['Beneficiaries'],
    };
    const excelBuffer = xlsx.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    saveAs(blob, `${this.getBeneficiaryFilePrefix(subProject)}_${Date.now()}.xlsx`);
  }

  async exportBeneficiaryDetailsPdf(
    content: BeneficiaryDetailsDto[],
    subProject: SubProjectDto
  ) {
    const jsPDF = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF.default('l', 'px', 'a4');
    const exportData = this.getBeneficiaryExportData(content);

    doc.setFontSize(14);
    doc.text('Beneficiary Details', 30, 28);
    doc.setFontSize(10);
    doc.text(`Sub-Project Code: ${subProject.workCode || '-'}`, 30, 44);

    autoTable(doc, {
      startY: 58,
      head: [
        [
          'Serial',
          'Household Number',
          'Beneficiary Name',
          'Gender',
          'Age',
          'Registration Phase',
          'Phone No',
          'Household Monthly Avg Income',
          'Assigned',
        ],
      ],
      body: exportData.map((item) => [
        item.Serial,
        item['Household Number'],
        item['Beneficiary Name'],
        item.Gender,
        item.Age,
        item['Registration Phase'],
        item['Phone No'],
        item['Household Monthly Avg Income'],
        item.Assigned,
      ]),
      styles: { fontSize: 8, overflow: 'linebreak' },
      headStyles: { fontSize: 8 },
      didDrawPage: () => {
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        const pageNumber = doc.getNumberOfPages();
        const text = `Page ${pageNumber}`;
        const textWidth = doc.getTextWidth(text);

        doc.setFontSize(9);
        doc.text(text, (pageWidth - textWidth) / 2, pageHeight - 16);
      },
    });

    doc.save(`${this.getBeneficiaryFilePrefix(subProject)}_${Date.now()}.pdf`);
  }

  async downloadBeneficiaryDetails(
    subProject: SubProjectDto,
    format: 'excel' | 'pdf'
  ) {
    this.showBeneficiaryDownloadDialog = false;
    this.isBeneficiaryDownloading = true;
    this.showDownloadProgressModal = true;
    this.downloadProgress = 0;
    this.downloadStatus = 'Requesting beneficiary details from server...';
    this.cdr.detectChanges();

    try {
      const res: any = await this.api.axiosInstance.get(
        `api/subproject/assign/progress/beneficiary/existing?subprojectId=${subProject.id}&page=0&size=100000`,
        {
          onDownloadProgress: () => {
            this.cdr.detectChanges();
          },
        }
      );

      const data = res?.data || res;
      const content: BeneficiaryDetailsDto[] = Array.isArray(data?.content)
        ? data.content
        : [];
      const totalRecords = data.totalElements || content.length;

      if (content.length === 0) {
        this.showDownloadProgressModal = false;
        this.downloadProgress = 0;
        this.downloadStatus = 'Downloading...';
        this.showNoBeneficiaryDialog = true;
        this.cdr.detectChanges();
        return;
      }

      this.downloadStatus = `Processing ${totalRecords} beneficiaries. Generating file...`;
      this.downloadProgress = 100;
      this.cdr.detectChanges();

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (format === 'pdf') {
        await this.exportBeneficiaryDetailsPdf(content, subProject);
      } else {
        await this.exportBeneficiaryDetailsExcel(content, subProject);
      }
    } catch (err) {
      console.error('Beneficiary details download error:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download beneficiary details.',
      });
    } finally {
      this.isBeneficiaryDownloading = false;
      this.selectedBeneficiarySubProject = null;
      this.beneficiaryDownloadFormat = null;
      this.showDownloadProgressModal = false;
      this.downloadProgress = 0;
      this.downloadStatus = 'Downloading...';
      this.cdr.detectChanges();
    }
  }

  async download(format: 'pdf' | 'csv') {
    this.showDownloadProgressModal = true;
    this.downloadProgress = 0;
    this.downloadStatus = 'Requesting data from server...';
    this.cdr.detectChanges();

    const body = this.buildSearchBody(0, 100000);

    try {
      const res: any = await this.api.axiosInstance.post(
        `api/subproject/get?page=0&size=100000`,
        body,
        {
          onDownloadProgress: (progressEvent: any) => {
            // Keep UI interactive while chunks arrive, but keep mode indeterminate (0)
            this.cdr.detectChanges();
          },
        }
      );
      
      const data = res.data || res;
      const content = data.content || [];
      const totalRecords = data.totalElements || content.length;

      if (content.length === 0) {
        this.messageService.add({
          severity: 'info',
          summary: 'Download',
          detail: 'No data to download',
        });
        this.showDownloadProgressModal = false;
        this.cdr.detectChanges();
        return;
      }

      this.downloadStatus = `Processing ${totalRecords} records. Generating file...`;
      this.downloadProgress = 100;
      this.cdr.detectChanges();

      // Give UI a moment to show the record count before blocking main thread for generation
      await new Promise(resolve => setTimeout(resolve, 500));

      if (format === 'pdf') {
        await this.exportPdf(content);
      } else {
        await this.exportCsv(content);
      }
    } catch (err) {
      console.error('Download error:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download data.',
      });
    } finally {
      this.showDownloadProgressModal = false;
      this.downloadProgress = 0;
      this.downloadStatus = 'Downloading...';
      this.cdr.detectChanges();
    }
  }

  trackById = (_: number, row: SubProjectDto) => row.id;
}
