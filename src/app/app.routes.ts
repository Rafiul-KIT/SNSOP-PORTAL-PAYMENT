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

import { ApplyForDisPayment } from './pages/apply-wages-request/apply-for-dis-payment/apply-for-dis-payment';
import { BeneficiaryRemove } from './pages/beneficiary-assignment/beneficiary-remove/beneficiary-remove';
import { BeneficiarySubprojectRemove } from './pages/beneficiary-assignment/beneficiary-subproject-remove/beneficiary-subproject-remove';
import { BeneficiarySubprojectList } from './pages/beneficiary-assignment/beneficiary-subproject-list/beneficiary-subproject-list';
import { WageRequestDrafts } from './pages/wages-request-approval/wage-request-drafts/wage-request-drafts';
import { WageDashboard } from './pages/wages-request-approval/wage-dashboard-lipw/wage-dashboard';
import { WageDashboardDis } from './pages/wages-request-approval/wage-dashboard-dis/wage-dashboard-dis';
import { WageRequestDetails } from './pages/wages-request-approval/wage-request-details/wage-request-details';
import { WageRequestApproval } from './pages/wages-request-approval/wage-request-approval/wage-request-approval';
import { PayrollDownload } from './pages/payroll/payroll-download/payroll-download';
import { ListOfWages } from './pages/apply-wages-request/list-of-wages/list-of-wages';
import { Profile } from './pages/profile/profile';
import { routeGuard } from './route.guard';



export const routes: Routes = [
  {
    component: Dashboard,
    path: 'dashboard',
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
      },
      {
        path: 'add-new',
        component: Project,
      },
      {
        path: 'details/:id',
        component: Project,
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
      },
      {
        path: 'add-new',
        component: SubProject,
      },
      {
        path: 'details/:id',
        component: SubProject,
      },
      {
        path: 'approval',
        component: WorkApproval,
      },
      {
        path: 'approval-details',
        component: WorkReview,
      },
    ],
  },
  {
    path: 'beneficiaries',
    canActivate: [routeGuard],
    children: [
      {
        path: 'assignment-asign-list',
        component: BeneficiarySubprojectList,
      },
      {
        path: 'assignment-remove-list',
        component: BeneficiarySubprojectRemove,
      },
      {
        path: 'assignment-assign/:id',
        component: BeneficiaryAssignment,
      },
      {
        path: 'assignment-remove/:id',
        component: BeneficiaryRemove,
      },
      {
        path: 'attendance',
        component: BeneficiaryAttendance,
      },
      {
        path: 'attendance/view/:id',
        component: BeneficiaryAttendancePerform,
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
      },
      {
        path: 'apply-dis',
        component: ApplyForDisPayment,
      },
      {
        path: 'create/:id',
        component: ApplyForWagesPaymentComponent,
      },
       {
        path: 'list',
        component: ListOfWages,
      },
      {
        path: 'details/:wageId/:subprojectId',
        component: WageRequestDetails,
      }   
    ],
  },
  {
    path: 'wage-request-approval',
    canActivate: [routeGuard],
    children: [
       {
        path: 'list',
       component: WageRequestApproval,
      },
      {
        path: 'drafts',
        component: WageRequestDrafts,
      },
      {
        path: 'details/:wageId/:subprojectId',
        component: WageRequestDetails,
      }
    ],
  },
  {
    path: 'report',
    children: [
      {
        path: 'details',
        loadComponent: () => import('./pages/report/report').then(m => m.ReportComponent),
        data: { reportType: 9, reportTitle: 'Reconciliation Detail Report' }
      },
      {
        path: 'summary',
        loadComponent: () => import('./pages/report/report').then(m => m.ReportComponent),
        data: { reportType: 10, reportTitle: 'Reconciliation Summary Report' }
      }
    ]
  },

  {
    path: 'payroll',
    component: PayrollDownload,
    canActivate: [routeGuard],
  },

  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    component: NotFound,
    path: '**',
  },
];
