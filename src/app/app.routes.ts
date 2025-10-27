import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './components/not-found/not-found';
import { ProjectList } from './pages/project-list/project-list';
import {Project} from './pages/project/project';
import { SubProject } from './pages/sub-project/sub-project';
import { BeneficiaryAttendance } from './pages/beneficiay-attendance/beneficiary-attendance-list/beneficiary-attendance';
import { SubProjectList } from './pages/sub-project-list/sub-project-list';
import { SubProjectDetails } from './pages/sub-project-details/sub-project-details';
import { WagesRequestLipw } from './pages/apply-wages-request/wages-request-lipw/wages-request-lipw';
import { WagesRequestDis } from './pages/apply-wages-request/wages-request-dis/wages-request-dis';
import { ApplyForWagesPaymentComponent } from './pages/apply-wages-request/apply-for-wages-payment/apply-for-wages-payment.component';
import { BeneficiaryAttendancePerform } from './pages/beneficiay-attendance/beneficiary-attendance-perform/beneficiary-attendance-perform';



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
    component: SubProject,
    path: 'sub-project/:id',
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
        component: WagesRequestDis ,
      },
         {
        path: 'create',
        component: ApplyForWagesPaymentComponent ,
      },
       

    ],
  },
   {
    component: BeneficiaryAttendance,
    path: 'beneficiary-attendance',  
  },
     {
    component: BeneficiaryAttendancePerform,
    path: 'beneficiary-attendance/view',  
  
  },
  {
    component: Project,
    path: 'project', 
  },
  {
  path: 'sub-project-details/:id',
  component: SubProjectDetails,
},

  {
    path: 'project/:id',
    component: Project, 
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    component: NotFound,
    path: '**',
  },
];
