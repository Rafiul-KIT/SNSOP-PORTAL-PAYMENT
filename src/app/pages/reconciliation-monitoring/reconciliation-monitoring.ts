import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../services/api.service';
import { LookupService } from '../../services/lookup.service';
import { Loader } from '../../components/loader/loader';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-reconciliation-monitoring',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Loader,
    BreadcrumbModule,
    TableModule,
    PaginatorModule,
  ],
  templateUrl: './reconciliation-monitoring.html',
  styleUrl: './reconciliation-monitoring.scss',
  providers: [MessageService],
})
export class ReconciliationMonitoring implements OnInit {
  isLoading = false;
  isDataLoading = false;

  items: MenuItem[] | undefined;
  home: MenuItem | undefined;

  reconciliationForm!: FormGroup;
  records: any[] = [];

  countyList: any[] = [];
  payamList: any[] = [];
  bomaList: any[] = [];
  totalRecords: number = 0;
  currentPage: number = 1;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public lookupService: LookupService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.home = {
      label: 'Dashboard',
      icon: 'fas fa-home me-2',
      routerLink: '/admin/dashboard',
    };
    this.items = [
      { label: 'Reconciliation Monitoring', icon: 'fas fa-chart-line' },
    ];

    this.reconciliationForm = this.fb.group({
      paymentCycle: ['', Validators.required],
      fromDate: ['', Validators.required],
      toDate: ['', Validators.required],
      stateId: ['', Validators.required],
      countyId: [''],
      payamId: [''],
      bomaId: [''],
    });
  }

  getCountyLookupByStateId = (evt: any) => {
    const stateId = evt.target.value;
    this.apiService
      .POST('api/lookup/geo/search', {
        lookupType: 'COUNTY',
        parentId: stateId != -1 ? stateId : '',
        size: -1,
      })
      .then((res) => {
        if (res.status === 200) {
          this.countyList = res.data.lookups;
          this.payamList = [];
          this.bomaList = [];
          this.reconciliationForm.patchValue({
            countyId: '',
            payamId: '',
            bomaId: '',
          });
        }
      })
      .catch(() => {
        this.countyList = [];
      });
  };

  getPayamLookupByCountyId = (evt: any) => {
    const countyId = evt.target.value;
    this.apiService
      .POST('api/lookup/geo/search', {
        lookupType: 'PAYAM',
        parentId: countyId != -1 ? countyId : '',
        size: -1,
      })
      .then((res) => {
        if (res.status === 200) {
          this.payamList = res.data.lookups;
          this.bomaList = [];
          this.reconciliationForm.patchValue({
            payamId: '',
            bomaId: '',
          });
        }
      })
      .catch(() => {
        this.payamList = [];
      });
  };

  getBomaLookupByPayamId = (evt: any) => {
    const payamId = evt.target.value;
    this.apiService
      .POST('api/lookup/geo/search', {
        lookupType: 'BOMA',
        parentId: payamId != -1 ? payamId : '',
        size: -1,
      })
      .then((res) => {
        if (res.status === 200) {
          this.bomaList = res.data.lookups;
          this.reconciliationForm.patchValue({
            bomaId: '',
          });
        }
      })
      .catch(() => {
        this.bomaList = [];
      });
  };

  loadReconciliationData(page: number = 0): void {
    // if (this.reconciliationForm.invalid) {
    //   return;
    // }

    this.isLoading = true;

    const formValues = this.reconciliationForm.value;

    const payload = new FormData();
    payload.append('paymentCycle', formValues.paymentCycle || '');
    payload.append('fromDate', formValues.fromDate || '');
    payload.append('toDate', formValues.toDate || '');
    payload.append('state', formValues.stateId || '');
    payload.append('county', formValues.countyId || '');
    payload.append('payam', formValues.payamId || '');
    payload.append('boma', formValues.bomaId || '');
    payload.append('reconciliationDate', '');
    payload.append('page', String(page));
    payload.append('size', '10');

    this.apiService
      .POST_FORM_DATA('api/payroll/reconciliation/monitor', payload)

      .then((res) => {
        if (res.status === 200 && res.data) {
          this.records = res.data.content;
          this.totalRecords = res.data.totalElements;
        } else {
          this.records = [];
        }
        this.isLoading = false;
      })
      .catch((err) => {
        console.error(
          'Error loading reconciliation data:',
          err.response?.data || err.message
        );
        this.records = [];
        this.isLoading = false;
      });
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.loadReconciliationData(this.currentPage);
  }

  authorize(record: any): void {
    if (!record?.batchId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Batch ID',
        detail: 'Cannot approve record without a batch ID.',
      });
      return;
    }

    this.apiService
      .GET(`api/payroll/reconciliation/approve/${record.batchId}`)
      .then((res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Approved',
          detail: 'Reconciliation approved successfully.',
        });

        // Refresh current page
        this.loadReconciliationData(this.currentPage);
      })
      .catch((err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Approval Failed',
          detail: 'Something went wrong during approval.',
        });
      });
  }

  deleteUnMatched(record: any): void {}
}
