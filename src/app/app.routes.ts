import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './components/not-found/not-found';
import { ProjectList } from './pages/project-list/project-list';
import {Project} from './pages/project/project';
import { SubProject } from './pages/sub-project/sub-project';

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
    component: SubProject,
    path: 'sub-project',  
  },
  {
    component: Project,
    path: 'project', 
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
