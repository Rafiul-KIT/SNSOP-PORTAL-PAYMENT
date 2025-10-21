import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './components/not-found/not-found';
import { ProjectList } from './pages/project-list/project-list';
import {Project} from './pages/project/project';
import { SubProject } from './pages/sub-project/sub-project';
import { BeneficiaryAttendance } from './pages/beneficiary-attendance/beneficiary-attendance';
import { SubProjectList } from './pages/sub-project-list/sub-project-list';
import { SubProjectDetails } from './pages/sub-project-details/sub-project-details';

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
    component: BeneficiaryAttendance,
    path: 'beneficiary-attendance',  
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
