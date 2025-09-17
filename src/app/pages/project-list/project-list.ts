import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';

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
  imports: [CommonModule, TableModule, ButtonModule, FormsModule, TooltipModule],
  templateUrl: './project-list.html',
  styleUrls: ['./project-list.scss']
})
export class ProjectList implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  searchText: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // ✅ Replace with API call later
    this.projects = [
      { id: 1, name: 'Health Project', status: 'Active', startDate: '2025-01-01', endDate: '2025-06-30', inchargeName: 'John Doe' },
      { id: 2, name: 'Education Project', status: 'Completed', startDate: '2024-03-01', endDate: '2024-12-31', inchargeName: 'Jane Smith' },
      { id: 3, name: 'Food Program', status: 'Inactive', startDate: '2025-02-15', endDate: '2025-10-15', inchargeName: 'Ali Hassan' }
    ];
    this.filteredProjects = [...this.projects];
  }

  onSearch(): void {
    const term = this.searchText.toLowerCase();
    this.filteredProjects = this.projects.filter(
      p =>
        p.name.toLowerCase().includes(term) ||
        p.status.toLowerCase().includes(term) ||
        p.inchargeName.toLowerCase().includes(term)
    );
  }

  newProject(): void {
    this.router.navigate(['/pages/project']);   // matches { path: 'project' }
  }

  editProject(id: number): void {
    this.router.navigate(['/pages/project', id]);  // matches { path: 'project/:id' }
  }

  viewProject(id: number): void {
    this.router.navigate(['/pages/project', id]);  // same as edit for now
  }

  deleteProject(id: number): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projects = this.projects.filter(p => p.id !== id);
      this.filteredProjects = [...this.projects];
    }
  }
}
