import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule } from '@angular/forms';
import { Loader } from '../../components/loader/loader';

import { TableModule } from 'primeng/table';
import { UIChart } from 'primeng/chart';
import { Breadcrumb } from "primeng/breadcrumb";

interface BomaPayment {
  name: string;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  beneficiaries: number;
  maleCount: number;
  femaleCount: number;
}

interface DashboardStats {
  totalProjects: number;
  totalSubprojects: number;
  totalBeneficiaries: { paid: number; unpaid: number };
  totalAmount: { paid: number; unpaid: number };
}

interface ApprovalStatus {
  approved: number;
  pending: number;
  rejected: number;
}
interface SupportType {
  name: string;
  beneficiaries: number;
  total: number;
  paid: number;
  unpaid: number;
}

interface PaymentCycle {
  name: string;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  beneficiaries: number;
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
  stats: DashboardStats = {
    totalProjects: 15,
    totalSubprojects: 45,
    totalBeneficiaries: { paid: 5500, unpaid: 2500 },
    totalAmount: { paid: 5500000, unpaid: 2500000 },
  };

  projectApproval: ApprovalStatus = {
    approved: 12,
    pending: 2,
    rejected: 1,
  };

  subprojectApproval: ApprovalStatus = {
    approved: 38,
    pending: 5,
    rejected: 2,
  };

  getPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  paymentCycles: PaymentCycle[] = [
    {
      name: 'Payment Cycle 1',
      totalAmount: 368576,
      paidAmount: 449758,
      unpaidAmount: 105057,
      beneficiaries: 182,
    },
    {
      name: 'Payment Cycle 2',
      totalAmount: 450000,
      paidAmount: 320000,
      unpaidAmount: 130000,
      beneficiaries: 200,
    },
    {
      name: 'Payment Cycle 3',
      totalAmount: 520000,
      paidAmount: 380000,
      unpaidAmount: 140000,
      beneficiaries: 215,
    },
  ];

  selectedPaymentCycle: PaymentCycle = this.paymentCycles[0];

  supportTypes: SupportType[] = [
    {
      name: 'LIPW',
      beneficiaries: 4500,
      total: 4500000,
      paid: 3200000,
      unpaid: 1300000,
    },
    {
      name: 'DIS',
      beneficiaries: 3500,
      total: 3500000,
      paid: 2300000,
      unpaid: 1200000,
    },
  ];
  bomaPayments: BomaPayment[] = [
    {
      name: 'Juba',
      totalAmount: 2500000,
      paidAmount: 1800000,
      unpaidAmount: 700000,
      beneficiaries: 2500,
      maleCount: 1200,
      femaleCount: 1300,
    },
    {
      name: 'Wau',
      totalAmount: 1800000,
      paidAmount: 1200000,
      unpaidAmount: 600000,
      beneficiaries: 1800,
      maleCount: 900,
      femaleCount: 900,
    },
    {
      name: 'Malakal',
      totalAmount: 1500000,
      paidAmount: 1000000,
      unpaidAmount: 500000,
      beneficiaries: 1500,
      maleCount: 750,
      femaleCount: 750,
    },
    {
      name: 'Yei',
      totalAmount: 1200000,
      paidAmount: 800000,
      unpaidAmount: 400000,
      beneficiaries: 1200,
      maleCount: 600,
      femaleCount: 600,
    },
    {
      name: 'Aweil',
      totalAmount: 1000000,
      paidAmount: 700000,
      unpaidAmount: 300000,
      beneficiaries: 1000,
      maleCount: 500,
      femaleCount: 500,
    },
  ];

  maleTotal = 4000;
  femaleTotal = 4000;

  genderChartData: any;
  bomaChartData: any;
  pieChartOptions: any;
  barChartOptions: any;
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;
  ngOnInit() {
     this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Dashboard' }];
    
    this.initializeCharts();
  }

  initializeCharts() {
    // Gender Pie Chart
    this.genderChartData = {
      labels: ['Male', 'Female'],
      datasets: [
        {
          data: [this.maleTotal, this.femaleTotal],
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

    // Boma Bar Chart
    const bomaNames = this.bomaPayments.map((b) => b.name);
    const paidAmounts = this.bomaPayments.map((b) => b.paidAmount);
    const unpaidAmounts = this.bomaPayments.map((b) => b.unpaidAmount);

    this.bomaChartData = {
      labels: bomaNames,
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
  }
}
