import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { Loader } from '../../../components/loader/loader';
import { ITDashboardCount, ITDashboardData, ITDashboardModuleSummary, ITDashboardMonthReport, ItSupportService } from '../../../services/it-support.service';

@Component({
  selector: 'app-help-desk-dashboard',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule, TableModule, ButtonModule, TagModule, ChartModule, Loader],
  templateUrl: './help-desk-dashboard.html',
  styleUrls: ['./help-desk-dashboard.scss']
})
export class HelpDeskDashboard implements OnInit {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Help Desk' }, { label: 'Dashboard' }];

  isLoading = false;
  dashboard: ITDashboardData | null = null;

  stats = {
    totalRequests: 0,
    newRequests: 0,
    inProgress: 0,
    resolved: 0,
    reopened: 0
  };

  modulesSummary: ITDashboardModuleSummary[] = [];
  sixMonthsIssues: ITDashboardMonthReport[] = [];
  prioritySummary: Array<{ priority: string; totalRequests: number; resolvedRequests: number }> = [];
  statusChartData: any;
  priorityChartData: any;
  moduleChartData: any;
  sixMonthsChartData: any;
  doughnutChartOptions: any;
  barChartOptions: any;
  lineChartOptions: any;

  constructor(
    private router: Router,
    private itSupportService: ItSupportService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  private detectChanges(): void {
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.initChartOptions();
    this.loadDashboardData();
  }

  private initChartOptions(): void {
    this.doughnutChartOptions = {
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 10 } },
      },
      cutout: '62%',
      maintainAspectRatio: false,
    };

    this.barChartOptions = {
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 10 } },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
      maintainAspectRatio: false,
    };

    this.lineChartOptions = {
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
      elements: {
        line: { tension: 0.35, borderWidth: 3 },
        point: { radius: 4, hoverRadius: 6 },
      },
      maintainAspectRatio: false,
    };
  }

  private getCountByStatus(status: string): ITDashboardCount {
    return this.dashboard?.countsByStatus?.[status] || { totalRequests: 0, resolvedRequests: 0 };
  }

  async loadDashboardData(): Promise<void> {
    this.isLoading = true;
    this.detectChanges();

    this.zone.runOutsideAngular(async () => {
      try {
        const result = await this.itSupportService.getDashboard();

        this.zone.run(() => {
          this.dashboard = result;

          this.stats.totalRequests = result?.totalRequests || 0;
          this.stats.newRequests = this.getCountByStatus('NEW').totalRequests;
          this.stats.inProgress =
            this.getCountByStatus('PROCESSING').totalRequests + this.getCountByStatus('REQUIRED_MORE_INFO').totalRequests;
          this.stats.resolved =
            this.getCountByStatus('RESOLVED').totalRequests + this.getCountByStatus('CLOSED').totalRequests;
          this.stats.reopened = this.getCountByStatus('REOPENED').totalRequests;

          this.modulesSummary = result?.requestsByModule || [];
          this.sixMonthsIssues = result?.reportedIssuesLastSixMonths || [];

          const priorityMap = result?.countsByPriority || {};
          this.prioritySummary = Object.keys(priorityMap).map((priority) => ({
            priority,
            totalRequests: priorityMap[priority]?.totalRequests || 0,
            resolvedRequests: priorityMap[priority]?.resolvedRequests || 0
          }));
          this.buildCharts();

          this.isLoading = false;
          this.detectChanges();
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        this.zone.run(() => {
          this.dashboard = null;
          this.statusChartData = null;
          this.priorityChartData = null;
          this.moduleChartData = null;
          this.sixMonthsChartData = null;
          this.isLoading = false;
          this.detectChanges();
        });
      }
    });
  }

  private buildCharts(): void {
    const statusEntries = Object.entries(this.dashboard?.countsByStatus || {});
    const statusLabels = statusEntries.map(([status]) => this.formatText(status));
    const statusValues = statusEntries.map(([, count]) => count.totalRequests || 0);

    this.statusChartData = {
      labels: statusLabels,
      datasets: [
        {
          data: statusValues,
          backgroundColor: ['#5b8ff9', '#5ad8a6', '#f6bd16', '#e8684a', '#6dc8ec', '#9270ca', '#ff9d4d'],
          borderWidth: 1,
        },
      ],
    };

    const priorityLabels = this.prioritySummary.map((p) => this.formatText(p.priority));
    const priorityTotals = this.prioritySummary.map((p) => p.totalRequests);
    const priorityResolved = this.prioritySummary.map((p) => p.resolvedRequests);

    this.priorityChartData = {
      labels: priorityLabels,
      datasets: [
        {
          label: 'Total',
          data: priorityTotals,
          backgroundColor: ['#87d068', '#ffd666', '#ffa940', '#ff7875'],
        },
        {
          label: 'Resolved',
          data: priorityResolved,
          backgroundColor: ['#059669', '#059669', '#059669', '#059669'],
        },
      ],
    };

    const moduleLabels = this.modulesSummary.map((m) => this.formatText(m.moduleName));
    const moduleTotals = this.modulesSummary.map((m) => m.totalRequests);
    const moduleResolved = this.modulesSummary.map((m) => m.resolvedRequests);

    this.moduleChartData = {
      labels: moduleLabels,
      datasets: [
        { label: 'Total', data: moduleTotals, backgroundColor: '#69b1ff' },
        { label: 'Resolved', data: moduleResolved, backgroundColor: '#95de64' },
      ],
    };

    const monthLabels = this.sixMonthsIssues.map((m) => m.month);
    const monthCounts = this.sixMonthsIssues.map((m) => m.reportedCount);

    this.sixMonthsChartData = {
      labels: monthLabels,
      datasets: [
        {
          label: 'Reported Issues',
          data: monthCounts,
          borderColor: '#1677ff',
          backgroundColor: 'rgba(22, 119, 255, 0.2)',
          fill: true,
        },
      ],
    };
  }

  getPrioritySeverity(priority: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'danger';
      case 'medium':
        return 'warn';
      case 'low':
        return 'info';
      default:
        return 'secondary';
    }
  }

  formatText(value: string | undefined): string {
    if (!value) return '--';
    return value.replace(/_/g, ' ');
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
