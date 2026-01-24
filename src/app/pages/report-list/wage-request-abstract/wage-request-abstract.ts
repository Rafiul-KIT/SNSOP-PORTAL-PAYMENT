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
  ReactiveFormsModule,
} from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../services/api.service';
import { LookupService, LookupItem } from '../../../services/lookup.service';

interface WageAbstractRecord {
  sNo: number;
  ipName: string;
  state: string;
  county: string;
  payam: string;
  boma: string;
  workCode: string;
  requestNumber: string;
  fromDate: string;
  toDate: string;
  totalMembers: number;
  workDays: number;
  amountPaid: number;
  wageStatus: string;
  paymentCycle: string;
}

@Component({
  selector: 'app-wage-request-abstract',
  templateUrl: './wage-request-abstract.html',
  styleUrl: './wage-request-abstract.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    PaginatorModule,
    BreadcrumbModule,
    FloatLabelModule,
    SelectModule,
    InputTextModule,
    TooltipModule,
    Loader,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WageRequestAbstract implements OnInit {
  isLoading = true;
  searchForm!: FormGroup;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  // Location lookups
  states: LookupItem[] = [];
  countyList: LookupItem[] = [];
  payamList: LookupItem[] = [];
  bomaList: LookupItem[] = [];

  // Implementing partners (dummy - will come from API later)
  implementingPartners: { id: number; name: string }[] = [
    { id: 1, name: 'UNOPS Field Office' },
  ];

  // Table data
  abstractRecords: WageAbstractRecord[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  // Summary
  totalMembers = 0;
  totalWorkDays = 0;
  totalPaidAmount = 0;

  advanceSearchPanelVisible = false;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private api: ApiService,
    private lookupService: LookupService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.initBreadcrumb();
    this.initForm();
    await this.loadStates();
    this.loadDummyData();
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Wages Request Abstract' }];
  }

  initForm() {
    this.searchForm = this.fb.group({
      state: [null],
      county: [{ value: null, disabled: true }],
      payam: [{ value: null, disabled: true }],
      boma: [{ value: null, disabled: true }],
      implementingPartnerId: [null],
      workCode: [''],
      requestNo: [''],
    });
  }

  private async loadStates(): Promise<void> {
    try {
      await this.lookupService.getOrFetchStateList();
      this.states = this.lookupService.getStateList();
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading states:', error);
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

  // Dummy data loader - will be replaced with actual API call later
  private loadDummyData() {
    this.abstractRecords = [
      { sNo: 1, ipName: 'UNOPS FIELD OFFICE', state: 'CENTRAL EQUATORIA', county: 'JUBA', payam: 'JUBA TOWN', boma: 'HAI-BULUK', workCode: '2024-SNSOP 2023-3469', requestNumber: '2024-SNSOPWR-9228', fromDate: '11 NOV 2024', toDate: '04 DEC 2024', totalMembers: 182, workDays: 3276, amountPaid: 8905.95, wageStatus: 'PAID FROM API', paymentCycle: 'PAYMENT CYCLE 1' },
      { sNo: 2, ipName: 'UNOPS FIELD OFFICE', state: 'CENTRAL EQUATORIA', county: 'JUBA', payam: 'JUBA TOWN', boma: 'HAI-BULUK', workCode: '2025-SNSOP 2023-4300', requestNumber: '2025-SNSOPWR-10733', fromDate: '04 FEB 2025', toDate: '10 MAR 2025', totalMembers: 80, workDays: 1346, amountPaid: 3635.10, wageStatus: 'PAID FROM API', paymentCycle: 'PAYMENT CYCLE 2' },
      { sNo: 3, ipName: 'UNOPS FIELD OFFICE', state: 'CENTRAL EQUATORIA', county: 'JUBA', payam: 'JUBA TOWN', boma: 'HAI-BULUK', workCode: '2025-SNSOP 2023-4300', requestNumber: '2025-SNSOPWR-10784', fromDate: '11 MAR 2025', toDate: '07 APR 2025', totalMembers: 77, workDays: 1310, amountPaid: 3538.58, wageStatus: 'PAID FROM API', paymentCycle: 'PAYMENT CYCLE 3' },
      { sNo: 4, ipName: 'UNOPS FIELD OFFICE', state: 'CENTRAL EQUATORIA', county: 'JUBA', payam: 'JUBA TOWN', boma: 'HAI-BULUK', workCode: '2025-SNSOP 2023-4300', requestNumber: '2025-SNSOPWR-12080', fromDate: '08 APR 2025', toDate: '03 MAY 2025', totalMembers: 72, workDays: 1184, amountPaid: 1382.79, wageStatus: 'PAID FROM API', paymentCycle: 'PAYMENT CYCLE 4' },
      { sNo: 5, ipName: 'UNOPS FIELD OFFICE', state: 'CENTRAL EQUATORIA', county: 'JUBA', payam: 'JUBA TOWN', boma: 'HAI-BULUK', workCode: '2025-SNSOP 2023-4300', requestNumber: '2025-SNSOPWR-12206', fromDate: '06 MAY 2025', toDate: '30 MAY 2025', totalMembers: 78, workDays: 1395, amountPaid: 1507.06, wageStatus: 'PAID FROM API', paymentCycle: 'PAYMENT CYCLE 5' },
      { sNo: 6, ipName: 'UNOPS FIELD OFFICE', state: 'CENTRAL EQUATORIA', county: 'JUBA', payam: 'JUBA TOWN', boma: 'HAI-BULUK', workCode: '2025-SNSOP 2023-4300', requestNumber: '2025-SNSOPWR-12925', fromDate: '03 JUN 2025', toDate: '27 JUN 2025', totalMembers: 80, workDays: 1440, amountPaid: 1604.27, wageStatus: 'PAID FROM API', paymentCycle: 'PAYMENT CYCLE 6' },
    ];

    this.totalRecords = this.abstractRecords.length;
    this.calculateSummary();
  }

  private calculateSummary() {
    this.totalMembers = this.abstractRecords.reduce((sum, r) => sum + r.totalMembers, 0);
    this.totalWorkDays = this.abstractRecords.reduce((sum, r) => sum + r.workDays, 0);
    this.totalPaidAmount = this.abstractRecords.reduce((sum, r) => sum + r.amountPaid, 0);
  }

  toggleAdvanceSearch() {
    this.advanceSearchPanelVisible = !this.advanceSearchPanelVisible;
    this.cdr.markForCheck();
  }

  searchAbstract() {
    // TODO: Integrate with API
    this.currentPage = 0;
    this.messageService.add({
      severity: 'info',
      summary: 'Search',
      detail: 'Search functionality will be integrated with API later.',
    });
  }

  resetForm() {
    this.searchForm.reset();
    this.searchForm.get('county')?.disable();
    this.searchForm.get('payam')?.disable();
    this.searchForm.get('boma')?.disable();
    this.countyList = [];
    this.payamList = [];
    this.bomaList = [];
    this.cdr.markForCheck();
  }

  exportData() {
    // TODO: Integrate with API
    this.messageService.add({
      severity: 'info',
      summary: 'Export',
      detail: 'Export functionality will be integrated later.',
    });
  }

  exportCompressed() {
    // TODO: Integrate with API
    this.messageService.add({
      severity: 'info',
      summary: 'Export Compressed',
      detail: 'Compressed export functionality will be integrated later.',
    });
  }

  printData() {
    window.print();
  }

  viewBeneficiaries(item: WageAbstractRecord) {
    // TODO: Navigate to beneficiaries view
    this.messageService.add({
      severity: 'info',
      summary: 'View',
      detail: `Viewing beneficiaries for ${item.requestNumber}`,
    });
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    // TODO: Fetch from API with pagination
  }
}
