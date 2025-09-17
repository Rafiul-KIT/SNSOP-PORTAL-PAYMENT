import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { Loader } from '../../components/loader/loader';

interface Project {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  inchargeName: string;
}

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    FormsModule,
    BreadcrumbModule,
    PaginatorModule,
    InputTextModule,
    TooltipModule,
    FloatLabelModule,
    Loader,
  ],
  templateUrl: './project-list.html',
  styleUrls: ['./project-list.scss'],
})
export class ProjectList implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  searchText: string = '';
  isLoading = true;
  totalRecords = 0;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  currentPage = 0; // 0-based
  pageSize = 10;

  constructor(private router: Router) {}

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Project List' }];
  }

  ngOnInit(): void {
    this.initBreadcrumb();
    // ✅ Replace with API call later
    this.projects = [
      {
        id: 1,
        name: 'Health Project',
        status: 'Active',
        startDate: '2025-01-01',
        endDate: '2025-06-30',
        inchargeName: 'John Doe',
      },
      {
        id: 2,
        name: 'Education Project',
        status: 'Completed',
        startDate: '2024-03-01',
        endDate: '2024-12-31',
        inchargeName: 'Jane Smith',
      },
      {
        id: 3,
        name: 'Food Program',
        status: 'Inactive',
        startDate: '2025-02-15',
        endDate: '2025-10-15',
        inchargeName: 'Ali Hassan',
      },
    ];
    this.filteredProjects = [...this.projects];
    this.isLoading = false;
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
  }

  onSearch(): void {
    const term = this.searchText.toLowerCase();
    this.filteredProjects = this.projects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.status.toLowerCase().includes(term) ||
        p.inchargeName.toLowerCase().includes(term)
    );
  }

  newProject(): void {
    this.router.navigate(['/project']); // matches { path: 'project' }
  }

  editProject(id: number): void {
    this.router.navigate(['/project', id]); // matches { path: 'project/:id' }
  }

  viewProject(id: number): void {
    this.router.navigate(['/project', id]); // same as edit for now
  }

  deleteProject(id: number): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projects = this.projects.filter((p) => p.id !== id);
      this.filteredProjects = [...this.projects];
    }
  }
}
