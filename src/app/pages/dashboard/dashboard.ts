import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule } from '@angular/forms';
import { Loader } from '../../components/loader/loader';
import { TableModule } from 'primeng/table';
import { UIChart } from 'primeng/chart';
import { Breadcrumb } from "primeng/breadcrumb";
import { ApiService } from '../../services/api.service';
import { ChangeDetectorRef } from '@angular/core';

interface SubprojectData {
  totalProjects: number;
  totalActiveProjects: number;
  totalInactiveProjects: number;
  totalSubprojects: number;
  totalScreeningApprovedSubprojects: number;
  totalScreeningRejectedSubprojects: number;
  totalSubprojectsInProcessOfApproval: number;
  totalSubprojectsInRejectionState: number;
  totalSubprojectsPendingForQE: number;
  totalSubprojectsPendingForEnvSpec: number;
  totalSubprojectsPendingForTST: number;
  totalSubprojectsPendingForBeneficiaryAssignment: number;
  totalCompletedSubprojects: number;
}

interface WageReqData {
  totalWageRequests: number;
  totalActiveWageRequests: number;
  totalRejectedWageRequests: number;
  totalWageReqPendingForIpApprover: number;
  totalWageReqPendingForInitialReviewer: number;
  totalWageReqPendingForFinancialApprover: number;
  totalWageReqPendingForFinalPaymentAuthorizer: number;
  totalWageReqApprovedInEveryLevel: number;
  totalReconciledWageReq: number;
  totalUniqueBeneficiary: number;
  totalUniqueLIPWBeneficiary: number;
  totalUniqueDISBeneficiary:number;
  totalUniquePaidBeneficiary: number;
  totalUniqueUnpaidBeneficiary: number;
  totalPaymentAmount: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  lipwTotalPaymentAmount: number;
  lipwTotalPaidAmount: number;
  lipwTotalUnpaidAmount: number;
  disTotalPaymentAmount: number;
  disTotalPaidAmount: number;
  disTotalUnpaidAmount: number;
}

interface CycleData {
  paymentCycle: number;
  uniqueBeneficiary: number;
  uniquePaidBeneficiary: number;
  uniqueUnpaidBeneficiary: number;
  totalPaymentAmount: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
}

interface GeoStateData {
  stateId: number;
  stateName: string;
  uniqueBeneficiary: number;
  uniquePaidBeneficiary: number;
  uniqueUnpaidBeneficiary: number;
  totalPaymentAmount: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
}

interface GenderData {
  maleUniquePaidBeneficiary: number;
  femaleUniquePaidBeneficiary: number;
  maleTotalPaidAmount: number;
  femaleTotalPaidAmount: number;
}

interface DashboardApiResponse {
  subprojectData: SubprojectData;
  wageReqData: WageReqData;
  cycleData: CycleData[];
  geoStateData: GeoStateData[];
  genderData: GenderData;
}
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ProgressBarModule,
    Loader,
    FormsModule,
    TableModule,
    UIChart,
    Breadcrumb
],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  isLoading: boolean = false;
  dashboardData: DashboardApiResponse | null = null;

  stats: any = { // Will be populated from dashboardData.subprojectData and dashboardData.wageReqData
    totalProjects: 0,
    totalSubprojects: 0,
    totalBeneficiaries: { total: 0, paid: 0, unpaid: 0 },
    totalAmount: { total: 0, paid: 0, unpaid: 0 },
  };

  projectStats: any = { // Will be populated from dashboardData.subprojectData
    active: 0,
    inactive: 0,
    total: 0
  };

  subprojectStats: any = { // Will be populated from dashboardData.subprojectData
    approved: 0, // apporved and available for beneficiary assignment
    pending: 0, // In the state of approval process
    rejected: 0, // rejected in ay stage
    total: 0 // total subprojects
  };

  wageRequestStats: any = { // Will be populated from dashboardData.wageReqData
    approved: 0,
    pending: 0,
    rejected: 0,
    reconciled: 0, // Added reconciled status
    total: 0
  };

  paymentCycles: CycleData[] = [];
  
  paymentCycleChartData: any;
  paymentCycleChartOptions: any;

  
  supportTypes: any[] = []; // Will be populated based on wageReqData
  geoStateData: GeoStateData[] = [];

  genderstats:any = {
    male: { paidBeneficiary: 0, paidAmount: 0},
    female: { paidBeneficiary: 0, paidAmount: 0},
  }

  genderChartData: any;
  stateChartData: any;
  pieChartOptions: any;
  barChartOptions: any;
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}
  ngOnInit() {
     this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Dashboard' }];
    this.fetchDashboardData();
  }

  getPercentage(value: number, total: number): number {
    return total > 0 && !isNaN(value) && !isNaN(total) ? parseFloat(((value / total) * 100).toFixed(2)) : 0;
  }

  async fetchDashboardData() {
    this.isLoading = true;
    try {
      const response = await this.api.GET('/api/payment-dashboard/all');
      this.dashboardData = response.data as DashboardApiResponse;

      if (this.dashboardData) {
        // Map SubprojectData to existing stats and projectApproval
        this.stats.totalProjects = this.dashboardData.subprojectData.totalProjects;
        this.stats.totalSubprojects = this.dashboardData.subprojectData.totalSubprojects;

        this.projectStats.active = this.dashboardData.subprojectData.totalActiveProjects;
        this.projectStats.inactive = this.dashboardData.subprojectData.totalInactiveProjects;
        this.projectStats.total = this.dashboardData.subprojectData.totalProjects;

        const userRole = this.api.getUserRole();
        let pendingCount = 0;
        if (userRole === 9) {
          pendingCount = this.dashboardData.subprojectData.totalSubprojectsPendingForQE;
        } else if (userRole === 3) {
          pendingCount = this.dashboardData.subprojectData.totalSubprojectsPendingForEnvSpec;
        } else if (userRole === 12) {
          pendingCount = this.dashboardData.subprojectData.totalSubprojectsPendingForTST;
        } else {
          pendingCount = this.dashboardData.subprojectData.totalSubprojectsInProcessOfApproval;
        }

        // Populate subprojectApproval (needs to be derived)
        this.subprojectStats.approved = this.dashboardData.subprojectData.totalSubprojectsPendingForBeneficiaryAssignment;
        this.subprojectStats.pending = pendingCount;
        this.subprojectStats.rejected = this.dashboardData.subprojectData.totalSubprojectsInRejectionState;
        this.subprojectStats.total = this.dashboardData.subprojectData.totalSubprojects;


        // Map WageReqData to existing stats, supportTypes, and other derived values
        this.stats.totalBeneficiaries.total = this.dashboardData.wageReqData.totalUniqueBeneficiary;
        this.stats.totalBeneficiaries.paid = this.dashboardData.wageReqData.totalUniquePaidBeneficiary;
        this.stats.totalBeneficiaries.unpaid = this.dashboardData.wageReqData.totalUniqueUnpaidBeneficiary;

        this.stats.totalAmount.total = this.dashboardData.wageReqData.totalPaymentAmount;
        this.stats.totalAmount.paid = this.dashboardData.wageReqData.totalPaidAmount;
        this.stats.totalAmount.unpaid = this.dashboardData.wageReqData.totalUnpaidAmount;

        // Populate wageRequestStats
        this.wageRequestStats.approved = this.dashboardData.wageReqData.totalWageReqApprovedInEveryLevel;
        this.wageRequestStats.rejected = this.dashboardData.wageReqData.totalRejectedWageRequests;
        
        let pendingWageCount = 0;
        if (userRole === 14) {
          pendingWageCount = this.dashboardData.wageReqData.totalWageReqPendingForIpApprover;
        } else if (userRole === 2) {
          pendingWageCount = this.dashboardData.wageReqData.totalWageReqPendingForInitialReviewer;
        } else if (userRole === 11) {
          pendingWageCount = this.dashboardData.wageReqData.totalWageReqPendingForFinancialApprover;
        } else if (userRole === 6) {
          pendingWageCount = this.dashboardData.wageReqData.totalWageReqPendingForFinalPaymentAuthorizer;
        } else {
          pendingWageCount = this.dashboardData.wageReqData.totalWageReqApprovedInEveryLevel}

        this.wageRequestStats.pending = pendingWageCount;
        this.wageRequestStats.reconciled = this.dashboardData.wageReqData.totalReconciledWageReq; // Populate reconciled
        this.wageRequestStats.total = this.dashboardData.wageReqData.totalWageRequests;

        // Populate supportTypes from wageReqData LIPW and DIS
        // Assuming totalUniqueBeneficiary is for LIPW+DIS combined, adjust if separate
        this.supportTypes = [
          {
            name: 'LIPW',
            beneficiaries: this.dashboardData.wageReqData.totalUniqueLIPWBeneficiary,
            total: this.dashboardData.wageReqData.lipwTotalPaymentAmount,
            paid: this.dashboardData.wageReqData.lipwTotalPaidAmount,
            unpaid: this.dashboardData.wageReqData.lipwTotalUnpaidAmount,
          },
          {
            name: 'DIS',
            beneficiaries: this.dashboardData.wageReqData.totalUniqueDISBeneficiary,
            total: this.dashboardData.wageReqData.disTotalPaymentAmount,
            paid: this.dashboardData.wageReqData.disTotalPaidAmount,
            unpaid: this.dashboardData.wageReqData.disTotalUnpaidAmount,
          },
          {
            name: 'ALL',
            beneficiaries: this.dashboardData.wageReqData.totalUniqueBeneficiary,
            total: this.dashboardData.wageReqData.totalPaymentAmount,
            paid: this.dashboardData.wageReqData.totalPaidAmount,
            unpaid: this.dashboardData.wageReqData.totalUnpaidAmount,
          },
        ];
        
        // Populate paymentCycles
        this.paymentCycles = this.dashboardData.cycleData;

        // Populate geoStateData (GeoStateData)
        this.geoStateData = this.dashboardData.geoStateData;


        // Gender data
        this.genderstats.male.paidBeneficiary = this.dashboardData.genderData.maleUniquePaidBeneficiary;
        this.genderstats.male.paidAmount = this.dashboardData.genderData.maleTotalPaidAmount;
        this.genderstats.female.paidBeneficiary = this.dashboardData.genderData.femaleUniquePaidBeneficiary;
        this.genderstats.female.paidAmount = this.dashboardData.genderData.femaleTotalPaidAmount;

        this.initializeCharts();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Optionally show an error message to the user
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges(); // Manually trigger change detection
    }
  }

  initializeCharts() {
    // Gender Pie Chart
    this.genderChartData = {
      labels: ['Male Payment', 'Female Payment'],
      datasets: [
        {
          data: [this.genderstats.male.paidAmount, this.genderstats.female.paidAmount],
          backgroundColor: ['#5DA5DA', '#F06292'],
          hoverBackgroundColor: ['#4A8BC2', '#E91E63'],
        },
      ],
    };

    this.pieChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 13,
              weight: '500',
            },
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce(
                (a: number, b: number) => a + b,
                0
              );
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString()} (${percentage}%)`;
            },
          },
        },
      },
    };

    // state Bar Chart
    const stateNames = this.geoStateData.map((b) => b.stateName);
    const paidAmounts = this.geoStateData.map((b) => b.totalPaidAmount);
    const unpaidAmounts = this.geoStateData.map((b) => b.totalUnpaidAmount);

    this.stateChartData = {
      labels: stateNames,
      datasets: [
        {
          label: 'Paid',
          backgroundColor: '#10b981',
          data: paidAmounts,
        },
        {
          label: 'Unpaid',
          backgroundColor: '#EF5350',
          data: unpaidAmounts,
        },
      ],
    };

    this.barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 13,
              weight: '500',
            },
            usePointStyle: true,
            pointStyle: 'rect',
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y || 0;
              return `${label}: $${value.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 12,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#e9ecef',
          },
          ticks: {
            callback: (value: any) => {
              return '$' + value / 1000 + 'K';
            },
            font: {
              size: 11,
            },
          },
        },
      },
    };

    // Payment Cycle Bar Chart
    if (this.paymentCycles.length > 0) {
      const cycleLabels = this.paymentCycles.map((cycle) => `Cycle ${cycle.paymentCycle}`);
      const totalAmounts = this.paymentCycles.map((cycle) => cycle.totalPaymentAmount);
      const paidAmounts = this.paymentCycles.map((cycle) => cycle.totalPaidAmount);
      const unpaidAmounts = this.paymentCycles.map((cycle) => cycle.totalUnpaidAmount);

      this.paymentCycleChartData = {
        labels: cycleLabels,
        datasets: [
          {
            label: 'Total Amount',
            backgroundColor: '#42A5F5', // Blue
            data: totalAmounts,
            barPercentage: 0.95, // Increase bar width
            categoryPercentage: 0.95, // Reduce space between categories
          },
          {
            label: 'Paid Amount',
            backgroundColor: '#66BB6A', // Green
            data: paidAmounts,
            barPercentage: 0.95, // Increase bar width
            categoryPercentage: 0.95, // Reduce space between categories
          },
          {
            label: 'Unpaid Amount',
            backgroundColor: '#FF6347', // Red-orange
            data: unpaidAmounts,
            barPercentage: 0.95, // Increase bar width
            categoryPercentage: 0.95, // Reduce space between categories
          },
        ],
      };

      this.paymentCycleChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 13,
                weight: '500',
              },
              usePointStyle: true,
              pointStyle: 'rect',
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y || 0;
                return `${label}: $${value.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 12,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#e9ecef',
            },
            ticks: {
              callback: (value: any) => {
                return '$' + value.toLocaleString(); // Display full amount
              },
              font: {
                size: 11,
              },
            },
          },
        },
      };
    }
  }

}