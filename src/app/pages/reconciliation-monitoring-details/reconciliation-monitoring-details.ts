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
  records: any[] = [];

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
      routerLink: '/reconciliation-monitoring',
    };
    this.items = [{ label: 'Details' }];

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.filterCriteria = navigation.extras.state;
      this.loadReconciliationData();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No filter criteria found for details.',
      });
      // Optionally navigate back if no state is found
      this.location.back();
    }
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
        if (res.statusCode === 0 && res.data) {
          this.records = res.data;
        } else {
          this.records = [];
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
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  goBack(): void {
    this.location.back();
  }
}
