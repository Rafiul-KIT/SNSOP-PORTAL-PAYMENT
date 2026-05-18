import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { MessageService } from 'primeng/api';

import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { LookupItem, LookupService } from '../../services/lookup.service';
import { ApiService } from '../../services/api.service';
import { Loader } from "../../components/loader/loader";

@Component({
  selector: 'app-reconciliation-monitoring-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BreadcrumbModule,
    TableModule,
    SelectModule,
    FloatLabelModule,
    Loader
],
  templateUrl: './reconciliation-monitoring-details.html',
  styleUrl: './reconciliation-monitoring-details.scss',
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReconciliationMonitoringDetails implements OnInit {
  isLoading = false;
  items: MenuItem[] | undefined;
  home: MenuItem | undefined;

  filterCriteria: any;
  records: any[] = []; // All records from server
  filteredRecords: any[] = []; // Filtered records
  totalBeneficiaries: number = 0;

  // Pagination properties
  rows: number = 10;
  rowsPerPageOptions: any[] = [10, 20, 50, 100, { showAll: 'All' }];

  // Sorting properties
  sortField: string = '';
  sortOrder: number = 0; // 0 = none, 1 = ascending, -1 = descending

  // Filter properties
  filters: any = {
    beneficiaryName: '',
    beneficiaryId: '',
    supportType: null, // Use null for dropdown
    paymentCycle: '',
    totalAttendance: '',
    wageTotal: '',
    wageRateSspTotal: '',
    alternate1Name: '',
    paymentStatus: null // Use null for dropdown
  };

  // Status options for dropdown
  statusOptions = [
    { label: 'All Status', value: null },
    { label: 'PAID', value: 'PAID' },
    { label: 'UNPAID', value: 'UNPAID' }
  ];

  // Support type options for dropdown
  supportTypeOptions: any[] = [{ label: 'All Types', value: null }];

  states: LookupItem[] = [];
  countyList: any[] = [];
  payamList: any[] = [];
  bomaList: any[] = [];

  constructor(
    private router: Router,
    private location: Location,
    private apiService: ApiService,
    public lookupService: LookupService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.home = {
      label: 'Reconciliation Monitoring',
      icon: 'fas fa-chart-line',
      routerLink: '/reconciliation-monitoring/list',
    };
    this.items = [{ label: 'details' }];

    const state = history.state;
    if (state && Object.keys(state).length > 1) {
      this.filterCriteria = state;
      this.loadReconciliationData();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No filter criteria found for details.',
      });

      this.location.back();
    }
  }

  getPaidCount(): number {
    return this.filteredRecords?.filter(record => record.paymentStatus === 'PAID').length || 0;
  }

  getUnpaidCount(): number {
    return this.filteredRecords?.filter(record => record.paymentStatus === 'UNPAID').length || 0;
  }

  getPaidPercentage(): number {
    if (this.filteredRecords.length === 0) return 0;
    return Math.round((this.getPaidCount() / this.filteredRecords.length) * 100);
  }

  getUnpaidPercentage(): number {
    if (this.filteredRecords.length === 0) return 0;
    return Math.round((this.getUnpaidCount() / this.filteredRecords.length) * 100);
  }

  loadReconciliationData(): void {
    this.isLoading = true;

    const payload = {
      state: this.filterCriteria.state,
      county: this.filterCriteria.county,
      payam: this.filterCriteria.payam,
      boma: this.filterCriteria.boma,
      paymentCycles: this.filterCriteria.paymentCycles,
    };

    this.apiService
      .POST('api/payroll/recon/monitoring/geo/details', payload)
      .then((res: any) => {
        if (res.data.code === 200 && res.data.data) {
          this.totalBeneficiaries = res.data.metadata?.totalElements || res.data.data.length;
          this.records = res.data.data;
          this.filteredRecords = [...this.records];

          this.extractSupportTypes();
        } else {
          this.records = [];
          this.filteredRecords = [];
          this.totalBeneficiaries = 0;
          this.supportTypeOptions = [{ label: 'All Types', value: null }];
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      })
      .catch((err) => {
        console.error(
          'Error loading reconciliation data:',
          err.response?.data || err.message
        );
        this.records = [];
        this.filteredRecords = [];
        this.totalBeneficiaries = 0;
        this.supportTypeOptions = [{ label: 'All Types', value: null }];
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  // Extract unique support types from records
  extractSupportTypes(): void {
    const uniqueTypes = new Set<string>();
    this.records.forEach(record => {
      if (record.supportType) {
        uniqueTypes.add(record.supportType);
      }
    });

    // Convert to array and sort
    const typesArray = Array.from(uniqueTypes).sort();

    // Create options array with "All Types" as first option using null
    this.supportTypeOptions = [
      { label: 'All Types', value: null },
      ...typesArray.map(type => ({ label: type, value: type }))
    ];
  }

  // Sorting methods
  sortOnClient(field: string): void {
    if (this.sortField === field) {
      // Toggle sort order if same field
      this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    } else {
      // New field, default to ascending
      this.sortField = field;
      this.sortOrder = 1;
    }
    this.applySorting();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'pi-sort-alt';
    }
    return this.sortOrder === 1 ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down';
  }

  applySorting(): void {
    if (!this.sortField) return;

    this.filteredRecords.sort((a, b) => {
      let valueA = a[this.sortField];
      let valueB = b[this.sortField];

      // Handle null/undefined values
      if (valueA === null || valueA === undefined) return 1;
      if (valueB === null || valueB === undefined) return -1;

      // Handle string comparison
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB?.toLowerCase() || '';
      }

      // Handle numeric comparison
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return this.sortOrder * (valueA - valueB);
      }

      // Handle string comparison
      if (valueA < valueB) {
        return -1 * this.sortOrder;
      }
      if (valueA > valueB) {
        return 1 * this.sortOrder;
      }
      return 0;
    });

    this.cdr.markForCheck();
  }

  // Filter methods
  applyFilters(): void {
    this.filteredRecords = this.records.filter(record => {
      // Check each filter field
      for (const key in this.filters) {
        const filterValue = this.filters[key];

        // Skip if filter is null, undefined, or empty string
        if (filterValue === null || filterValue === undefined || filterValue === '') {
          continue;
        }

        // Special handling for alternate names
        if (key === 'alternate1Name') {
          const alt1Match = record.alternate1Name &&
            record.alternate1Name.toLowerCase().includes(filterValue.toLowerCase());
          const alt2Match = record.alternate2Name &&
            record.alternate2Name.toLowerCase().includes(filterValue.toLowerCase());

          if (!alt1Match && !alt2Match) {
            return false;
          }
        }
        // Special handling for numeric fields
        else if (key === 'totalAttendance' || key === 'wageTotal' || key === 'wageRateSspTotal') {
          const recordValue = record[key];
          if (recordValue === null || recordValue === undefined) {
            return false;
          }

          // Convert to string for comparison
          if (!recordValue.toString().includes(filterValue.toString())) {
            return false;
          }
        }
        // Default string comparison
        else {
          const recordValue = record[key];
          if (!recordValue) {
            return false;
          }

          const recordValueStr = recordValue.toString().toLowerCase();
          const filterValueStr = filterValue.toString().toLowerCase();

          if (!recordValueStr.includes(filterValueStr)) {
            return false;
          }
        }
      }
      return true;
    });

    // Reapply sorting after filtering
    if (this.sortField) {
      this.applySorting();
    }

    this.cdr.markForCheck();
  }

  clearFilters(): void {
    // Reset all filters to null for dropdowns, empty string for inputs
    this.filters = {
      beneficiaryName: '',
      beneficiaryId: '',
      supportType: null,
      paymentCycle: '',
      totalAttendance: '',
      wageTotal: '',
      wageRateSspTotal: '',
      alternate1Name: '',
      paymentStatus: null
    };

    // Reset to original data
    this.filteredRecords = [...this.records];

    // Reapply sorting if needed
    if (this.sortField) {
      this.applySorting();
    }

    this.cdr.markForCheck();
  }
}
