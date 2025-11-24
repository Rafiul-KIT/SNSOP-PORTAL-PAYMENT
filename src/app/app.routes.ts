import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './components/not-found/not-found';
import { ProjectList } from './pages/project-list/project-list';
import {Project} from './pages/project/project';
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
import { WageDashboard } from './pages/wages-request-approval/wage-dashboard/wage-dashboard';
import { WageDashboardDis } from './pages/wages-request-approval/wage-dashboard-dis/wage-dashboard-dis';
import { WageRequestDetails } from './pages/wages-request-approval/wage-request-details/wage-request-details';




export const routes: Routes = [
  {
    component: Dashboard,
    path: 'dashboard',
  },
  {
    component: ProjectList,
    path: 'project-list',  
  },
    {
    component: SubProjectList,
    path: 'sub-project-list',
  },
  {
    component: SubProject,
    path: 'sub-project',
  },
   {
    component: WorkApproval,
    path: 'work-approval',
  },
    {
    component: WorkReview,
    path: 'work-review',
  },
  {
    component: SubProject,
    path: 'sub-project/:id',
  },
    {
    component: BeneficiaryAttendance,
    path: 'beneficiary-attendance',  
  },

    {
    path: 'beneficiary-assignment',
    children: [
      {
        path: 'asign-list',
        component:  BeneficiarySubprojectList,
      },
        {
        path: 'remove-list',
       component: BeneficiarySubprojectRemove  ,
      },
         {
        path: 'assign/:id',
        component: BeneficiaryAssignment ,
      },
         {
        path: 'remove/:id',
        component: BeneficiaryRemove ,
      },
           

    ],
  },
  
     {
    component: BeneficiaryAttendancePerform,
    path: 'beneficiary-attendance/view/:id',  
  
  },
  {
    component: Project,
    path: 'project', 
  },

  {
    path: 'project/:id',
    component: Project, 
  },
  {
    path: 'apply-wage-request',
    children: [
      {
        path: 'lipw',
        component:  WagesRequestLipw,
      },
        {
        path: 'dis',
       component: ApplyForDisPayment ,
      },
         {
        path: 'create/:id',
        component: ApplyForWagesPaymentComponent ,
      },
           

    ],
  },
   {
    path: 'wage-request-approval',
    children: [
      {
        path: 'drafts',
        component:  WageRequestDrafts,
      },
        {
        path: 'lipw',
       component: WageDashboard ,
      },
         {
        path: 'dis',
        component: WageDashboardDis ,
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
  
 
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    component: NotFound,
    path: '**',
  },
];
