import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './components/not-found/not-found';
import { ProjectList } from './pages/project-list/project-list';
import { Project } from './pages/project/project';
import { SubProject } from './pages/sub-project/sub-project';
import { BeneficiaryAttendance } from './pages/beneficiay-attendance/beneficiary-attendance-list/beneficiary-attendance';
import { SubProjectList } from './pages/sub-project-list/sub-project-list';
import { WagesRequestLipw } from './pages/apply-wages-request/wages-request-lipw/wages-request-lipw';
import { ApplyForWagesPaymentComponent } from './pages/apply-wages-request/apply-for-wages-payment/apply-for-wages-payment.component';
import { BeneficiaryAttendancePerform } from './pages/beneficiay-attendance/beneficiary-attendance-perform/beneficiary-attendance-perform';
import { WorkApproval } from './pages/work-approval/work-approval';
import { WorkReview } from './pages/work-review/work-review';
import { BeneficiaryAssignment } from './pages/beneficiary-assignment/beneficiary-assign/beneficiary-assignment';
import { SubprojectView } from './pages/subproject-view/subproject-view';
import { SubprojectViewDetails } from './pages/subproject-view-details/subproject-view-details';

import { ApplyForDisPayment } from './pages/apply-wages-request/apply-for-dis-payment/apply-for-dis-payment';
import { BeneficiaryRemove } from './pages/beneficiary-assignment/beneficiary-remove/beneficiary-remove';
import { BeneficiarySubprojectRemove } from './pages/beneficiary-assignment/beneficiary-subproject-remove/beneficiary-subproject-remove';
import { BeneficiarySubprojectList } from './pages/beneficiary-assignment/beneficiary-subproject-list/beneficiary-subproject-list';
import { WageRequestDrafts } from './pages/wages-request-approval/wage-request-drafts/wage-request-drafts';
import { WageRequestDetails } from './pages/wages-request-approval/wage-request-details/wage-request-details';
import { InitialReviewerWageRequestApproval } from './pages/wages-request-approval/initial-reviewer-wage-request-approval/initial-reviewer-wage-request-approval';
import { FinancialApproverWageRequestApproval } from './pages/wages-request-approval/financial-approver-wage-request-approval/financial-approver-wage-request-approval';
import { FinalPaymentAuthoriserWageRequestApproval } from './pages/wages-request-approval/final-payment-authoriser-wage-request-approval/final-payment-authoriser-wage-request-approval';
import { PayrollDownload } from './pages/payroll/payroll-download/payroll-download';
import { MobileMoneyDetails } from './pages/payroll/mobile-money-details/mobile-money-details';
import { ListOfWages } from './pages/apply-wages-request/list-of-wages/list-of-wages';
import { Profile } from './pages/profile/profile';
import { routeGuard } from './route.guard';
import { Unauthorized } from './components/unauthorized/unauthorized';
import { PayrollMobileMoney } from './pages/payroll/payroll-mobile-money/payroll-mobile-money';
import { GeneratePayroll } from './pages/payroll/generate-payroll/generate-payroll';
import { ReconciliationMonitoring } from './pages/reconciliation-monitoring/reconciliation-monitoring';
import { ReconciliationMonitoringDetails } from './pages/reconciliation-monitoring-details/reconciliation-monitoring-details';
import { WageRequestAbstract } from './pages/report-list/wage-request-abstract/wage-request-abstract';
import { MultipleAttendanceReport } from './pages/report-list/multiple-attendance-report/multiple-attendance-report';
import { WagePaidRequestAbstractWithInvoice } from './pages/invoice/wage-paid-request-abstract-with-invoice/wage-paid-request-abstract-with-invoice';
import { PaidDateWisePaymentInvoice } from './pages/invoice/paid-date-wise-payment-invoice/paid-date-wise-payment-invoice';
import { PaidDateWisePaymentInvoiceDetails } from './pages/invoice/paid-date-wise-payment-invoice-details/paid-date-wise-payment-invoice-details';
import { WagePaidReqiestAbstractWithInvoiceDetails } from './pages/invoice/wage-paid-reqiest-abstract-with-invoice-details/wage-paid-reqiest-abstract-with-invoice-details';
import { TrainingAttendance } from './pages/beneficiay-attendance/training-attendance/training-attendance';
import { TrainingAttendancePerform } from './pages/beneficiay-attendance/training-attendance-perform/training-attendance-perform';
import { TrainingAttendanceAndParticipantSummaryReport } from './pages/report-list/training-attendance-and-participant-summary-report/training-attendance-and-participant-summary-report';
import { ComplementarySocialMeasuresProgressReport } from './pages/report-list/complementary-social-measures-progress-report/complementary-social-measures-progress-report';
import { BeneficiaryAtendanceReport } from './pages/report-list/beneficiary-atendance-report/beneficiary-atendance-report';


export const routes: Routes = [
  {
    component: Dashboard,
    path: 'dashboard',
    canActivate: [routeGuard],
  },
  {
    component: Profile,
    path: 'profile',
  },
  {
    path: 'project',
    canActivate: [routeGuard],
    children: [
      {
        path: 'list',
        component: ProjectList,
        canActivate: [routeGuard],
      },
      {
        path: 'add-new',
        component: Project,
        canActivate: [routeGuard],
      },
      {
        path: 'details/:id',
        component: Project,
        canActivate: [routeGuard],
      },
    ],
  },
  {
    path: 'sub-project',
    canActivate: [routeGuard],
    children: [
      {
        path: 'list',
        component: SubProjectList,
        canActivate: [routeGuard],
      },
      {
        path: 'add-new',
        component: SubProject,
        canActivate: [routeGuard],
      },
      {
        path: 'details/:id',
        component: SubProject,
        canActivate: [routeGuard],
      },
      {
        path: 'approval',
        component: WorkApproval,
        canActivate: [routeGuard],
      },
      {
        path: 'approval-details',
        component: WorkReview,
        canActivate: [routeGuard],
      },
      {
        path: 'view',
        component: SubprojectView,
        canActivate: [routeGuard],
      },
      {
        path: 'view-details',
        component: SubprojectViewDetails,
        canActivate: [routeGuard],
      },
    ],
  },
  {
    path: 'attendance',
    component: BeneficiaryAttendance,
    canActivate: [routeGuard],
  },
    {
    path: 'training-attendance',
    component: TrainingAttendance,
    canActivate: [routeGuard],
  },
    {
    path: 'training-attendance/view/:id',
    component: TrainingAttendancePerform,
    canActivate: [routeGuard],
  },
  {
    path: 'attendance/view/:id',
    component: BeneficiaryAttendancePerform,
    canActivate: [routeGuard],
  },
  {
    path: 'beneficiaries',
    canActivate: [routeGuard],
    children: [
      {
        path: 'assignment-asign-list',
        component: BeneficiarySubprojectList,
        canActivate: [routeGuard],
      },
      {
        path: 'assignment-remove-list',
        component: BeneficiarySubprojectRemove,
        canActivate: [routeGuard],
      },
      {
        path: 'assignment-assign/:id',
        component: BeneficiaryAssignment,
        canActivate: [routeGuard],
      },
      {
        path: 'assignment-remove/:id',
        component: BeneficiaryRemove,
        canActivate: [routeGuard],
      },
    ],
  },
  {
    path: 'wage-request',
    canActivate: [routeGuard],
    children: [
      {
        path: 'apply-lipw',
        component: WagesRequestLipw,
        canActivate: [routeGuard],
      },
      {
        path: 'apply-dis',
        component: ApplyForDisPayment,
        canActivate: [routeGuard],
      },
      {
        path: 'create/:id',
        component: ApplyForWagesPaymentComponent,
        canActivate: [routeGuard],
      },
      {
        path: 'list',
        component: ListOfWages,
        canActivate: [routeGuard],
      },
      {
        path: 'details/:wageId/:subprojectId',
        component: WageRequestDetails,
        canActivate: [routeGuard],
      },
    ],
  },
  {
    path: 'wage-request-approval',
    canActivate: [routeGuard],
    children: [
      {
        path: 'initial-reviewer',
        component: InitialReviewerWageRequestApproval,
        canActivate: [routeGuard],
      },
      {
        path: 'financial-approver',
        component: FinancialApproverWageRequestApproval,
        canActivate: [routeGuard],
      },
      {
        path: 'final-payment-authoriser',
        component: FinalPaymentAuthoriserWageRequestApproval,
        canActivate: [routeGuard],
      },
      // {
      //   path: 'list',
      //   redirectTo: 'initial-reviewer',
      //   canActivate: [routeGuard],
      // },
      {
        path: 'drafts',
        component: WageRequestDrafts,
        canActivate: [routeGuard],
      },
      {
        path: 'details/:wageId/:subprojectId',
        component: WageRequestDetails,
        canActivate: [routeGuard],
      },
    ],
  },
  {
    path: 'report',
    canActivate: [routeGuard],
    children: [
      {
        path: 'details',
        loadComponent: () =>
          import('./pages/report/report').then((m) => m.ReportComponent),
        data: { reportType: 9, reportTitle: 'Reconciliation Detail Report' },
        canActivate: [routeGuard],
      },
      {
        path: 'summary',
        loadComponent: () =>
          import('./pages/report/report').then((m) => m.ReportComponent),
        data: { reportType: 10, reportTitle: 'Reconciliation Summary Report' },
        canActivate: [routeGuard],
      },
      {
        path: 'payment-details',
        loadComponent: () =>
          import('./pages/report/report').then((m) => m.ReportComponent),
        data: { reportType: 11, reportTitle: 'Total Beneficiary Payment Details' },
        canActivate: [routeGuard],
      },
       {
        path: 'wage-request-abstract',
        component: WageRequestAbstract,
        canActivate: [routeGuard],
       },
       {
        path: 'multiple-attendance',
        component: MultipleAttendanceReport,
        canActivate: [routeGuard],
       },
       {
        path: 'beneficiary-attendance',
        component: BeneficiaryAtendanceReport,
        canActivate: [routeGuard],
       },
           {
        path: 'training-attendance-and-participant-summary-report',
        component: TrainingAttendanceAndParticipantSummaryReport,
        canActivate: [routeGuard],
       },
           {
        path: 'complementary-social-measures-progress-report',
        component: ComplementarySocialMeasuresProgressReport,
        canActivate: [routeGuard],
       }
      ,
    ],
  },
  {
    path: 'payroll',
    canActivate: [routeGuard],
    children: [
      {
        path: 'generate',
        component: GeneratePayroll,
        canActivate: [routeGuard],
      },
      {
        path: 'download',
        component: PayrollDownload,
        canActivate: [routeGuard],
      },
      {
        path: 'mobile-money-download',
        component: PayrollMobileMoney,
        canActivate: [routeGuard],
      },
      {
        path: 'mobile-money-details/:requestId',
        component: MobileMoneyDetails,
        // canActivate: [routeGuard],
      },
    ],
  },
  {
    path: 'invoice',
    canActivate: [routeGuard],
    children: [
      {
        path: 'wage-paid-request-abstract-with-invoice',
        component: WagePaidRequestAbstractWithInvoice,
        canActivate: [routeGuard],
      },
      {
        path: 'paid-date-wise-payment-invoice',
        component: PaidDateWisePaymentInvoice,
        canActivate: [routeGuard],
      },
      {
        path: 'paid-date-wise-payment-invoice-details',
        component: PaidDateWisePaymentInvoiceDetails,
        canActivate: [routeGuard],
      },
      {
        path: 'wage-paid-reqiest-abstract-with-invoice-details',
        component: WagePaidReqiestAbstractWithInvoiceDetails,
        canActivate: [routeGuard],
      },
    ],
  },
  {
    path: 'reconciliation-monitoring',
    canActivate: [routeGuard],
    children: [
      {
        path: 'list',
        component: ReconciliationMonitoring,
        canActivate: [routeGuard],
      },
      {
        path: 'details',
        component: ReconciliationMonitoringDetails,
        canActivate: [routeGuard],
      },
    ],
  },
  { path: 'unauthorized', component: Unauthorized },

  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    component: NotFound,
    path: '**',
  },
];
