import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import Swal from 'sweetalert2';

import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../services/api.service';
import { LookupItem, LookupService } from '../../../services/lookup.service';

interface CycleData {
  paymentCycle: number;
  cycleName: string;
  finlitMale: number;
  finlitFemale: number;
  finlitTotal: number;
  washMale: number;
  washFemale: number;
  washTotal: number;
  ecdMale: number;
  ecdFemale: number;
  ecdTotal: number;
  gbvMale: number;
  gbvFemale: number;
  gbvTotal: number;
}

interface ReportData {
  bomaName: string;
  payamName: string;
  countyName: string;
  stateName: string;
  cycles: CycleData[];
  totalFinlitMale: number;
  totalFinlitFemale: number;
  totalFinlitTotal: number;
  totalWashMale: number;
  totalWashFemale: number;
  totalWashTotal: number;
  totalEcdMale: number;
  totalEcdFemale: number;
  totalEcdTotal: number;
  totalGbvMale: number;
  totalGbvFemale: number;
  totalGbvTotal: number;
}

@Component({
  selector: 'app-complementary-social-measures-progress-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Loader,
    BreadcrumbModule,
    TableModule,
    SelectModule,
    FloatLabelModule,
    TooltipModule,
    ToastModule,
  ],
  templateUrl: './complementary-social-measures-progress-report.html',
  styleUrl: './complementary-social-measures-progress-report.scss',
  providers: [MessageService],
})
export class ComplementarySocialMeasuresProgressReport implements OnInit {
  isLoading = false;
  isShow = false;

  items: MenuItem[] | undefined;
  home: MenuItem | undefined;

  searchForm!: FormGroup;
  reportData: ReportData | null = null;

  // Lookup data
  states: LookupItem[] = [];
  countyList: LookupItem[] = [];
  payamList: LookupItem[] = [];
  bomaList: LookupItem[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public lookupService: LookupService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initBreadcrumb();
    this.initForm();
    this.loadStates();
  }

  private initBreadcrumb(): void {
    this.home = {
      label: 'Dashboard',
      icon: 'fas fa-home me-2',
      routerLink: '/dashboard',
    };
    this.items = [
      {
        label: 'Complementary Social Measures Progress Report',
        icon: 'fas fa-chart-bar',
      },
    ];
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      state: [null, Validators.required],
      county: [{ value: null, disabled: true }, Validators.required],
      payam: [{ value: null, disabled: true }, Validators.required],
      boma: [{ value: null, disabled: true }, Validators.required],
    });
  }

  private async loadStates(): Promise<void> {
    try {
      await this.lookupService.getOrFetchStateList();
      this.states = this.lookupService.getStateList();
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading states:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load states.',
      });
    }
  }

  async onStateChange(state: any): Promise<void> {
    this.searchForm.get('county')?.reset({ value: null, disabled: true });
    this.searchForm.get('payam')?.reset({ value: null, disabled: true });
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.countyList = [];
    this.payamList = [];
    this.bomaList = [];

    if (state?.id) {
      try {
        this.countyList = await this.lookupService.getCountyListByStateId(String(state.id));
        this.searchForm.get('county')?.enable();
      } catch (error) {
        console.error('Error loading counties:', error);
      }
    }
    this.cdr.markForCheck();
  }

  async onCountyChange(county: any): Promise<void> {
    this.searchForm.get('payam')?.reset({ value: null, disabled: true });
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.payamList = [];
    this.bomaList = [];

    if (county?.id) {
      try {
        this.payamList = await this.lookupService.getPayamListByCountyId(String(county.id));
        this.searchForm.get('payam')?.enable();
      } catch (error) {
        console.error('Error loading payams:', error);
      }
    }
    this.cdr.markForCheck();
  }

  async onPayamChange(payam: any): Promise<void> {
    this.searchForm.get('boma')?.reset({ value: null, disabled: true });
    this.bomaList = [];

    if (payam?.id) {
      try {
        this.bomaList = await this.lookupService.getBomaListByPayamId(String(payam.id));
        this.searchForm.get('boma')?.enable();
      } catch (error) {
        console.error('Error loading bomas:', error);
      }
    }
    this.cdr.markForCheck();
  }

  search(): void {
    if (this.searchForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please select all required fields (State, County, Payam, Boma).',
      });
      return;
    }
    this.fetchReport();
  }

  reset(): void {
    this.searchForm.reset({
      state: null,
      county: null,
      payam: null,
      boma: null,
    });
    this.searchForm.get('county')?.disable();
    this.searchForm.get('payam')?.disable();
    this.searchForm.get('boma')?.disable();

    this.countyList = [];
    this.payamList = [];
    this.bomaList = [];
    this.reportData = null;
    this.isShow = false;
    this.cdr.markForCheck();
  }

  async fetchReport(): Promise<void> {
    this.isLoading = true;
    this.isShow = false;
    this.cdr.markForCheck();

    const formValues = this.searchForm.value;
    const stateId = formValues.state?.id;
    const countyId = formValues.county?.id;
    const payamId = formValues.payam?.id;
    const bomaId = formValues.boma?.id;

    const endpoint = `/api/training-attendance-report/cycle-wise?stateId=${stateId}&countyId=${countyId}&payamId=${payamId}&bomaId=${bomaId}`;

    try {
      const axiosResponse: any = await this.apiService.GET(endpoint);
      const apiResponse = axiosResponse.data;

      if (apiResponse && apiResponse.cycles && apiResponse.cycles.length > 0) {
        this.reportData = apiResponse;
        this.isShow = true;
      } else {
        this.reportData = null;
        this.messageService.add({
          severity: 'info',
          summary: 'Info',
          detail: 'No data found for the selected criteria.',
        });
        this.isShow = false;
      }
    } catch (error: any) {
      console.error('Error fetching report:', error);
      this.reportData = null;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'An error occurred while fetching data.',
      });
      this.isShow = false;
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }
}
