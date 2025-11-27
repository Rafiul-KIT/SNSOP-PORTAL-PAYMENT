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
import { ApiService } from '../../services/api.service';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';

interface ProjectItemDto {
  id: number;
  projectName: string;
  startAt: string;
  endAt: string;
  sanctionedAt: string;
  targetBeneficiary: number;
  estimatedCost: number;
  inchargeName: string;
  inchargeMobile: string;
  inchargeEmail: string;
  status: 'InProgress' | 'Closed' | string;
}

interface PagedResponseProjectDto {
  code: number;
  message: string;
  content: ProjectItemDto[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
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
  rows: ProjectItemDto[] = [];
  searchText = ''; // kept for UI; gateway will read it downstream
  isLoading = false;
  totalRecords = 0;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  currentPage = 0; // UI state (PrimeNG is 0-based)
  pageSize = 10;

  selectedProjectId?: number;

  // 🔧 Update to your real gateway path
  private readonly PROJECTS_ENDPOINT = '/api/project/get';
  private readonly PROJECT_SAVE_ENDPOINT = '/api/project/save';
  constructor(
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Project List' }];
    this.loadProjects();
  }

  private qs(params: Record<string, any>): string {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') usp.set(k, String(v));
    });
    return usp.toString();
  }

  async loadProjects() {
    this.isLoading = true;
    try {
      const query = this.qs({
        page: this.currentPage,
        size: this.pageSize,
        id: this.selectedProjectId,
      });

      const url = `${this.PROJECTS_ENDPOINT}?${query}`;
      const res = await this.api.GET(url);
      const data = res.data as PagedResponseProjectDto;

      this.rows = data?.content ?? [];
      this.totalRecords = data?.totalElements ?? 0;
    } catch (err) {
      console.error('Failed to load projects', err);
      this.rows = [];
      this.totalRecords = 0;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
  onPageChange(event: any) {
    this.currentPage = event.page; // 0-based from PrimeNG
    this.pageSize = event.rows; // update for correct numbering & [first]
    this.loadProjects(); // backend/gateway figures out the page
  }

  onSearch(): void {
    // Trigger reload; gateway reads search from its own source
    this.loadProjects();
  }

  newProject() {
    this.router.navigate(['/project/add-new']);
  }
  editProject(id: number) {
    this.router.navigate(['/project/details', id]);
  }

async deleteProject(id: number) {
  const row = this.rows.find((r) => r.id === id);
  if (!row) return;

  // Show confirmation dialog
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!"
  }).then(async (result) => {
    if (result.isConfirmed) {
      const payload = {
        id: row.id,
        projectName: row.projectName,
        startAt: row.startAt,
        endAt: row.endAt,
        sanctionedAt: row.sanctionedAt,
        targetBeneficiary: row.targetBeneficiary,
        estimatedCost: row.estimatedCost,
        inchargeName: row.inchargeName,
        inchargeMobile: row.inchargeMobile,
        inchargeEmail: row.inchargeEmail,
        status: 'Closed',
      };

      try {
        await this.api.POST(this.PROJECT_SAVE_ENDPOINT, payload);

        await this.loadProjects(); // refresh table after update

        // Show success message
        Swal.fire({
          title: "Deleted!",
          text: "The project has been closed.",
          icon: "success",
        });
      } catch (error) {
        console.error('Failed to close project:', error);

        // Show error message
        Swal.fire({
          title: "Error!",
          text: "Failed to close the project.",
          icon: "error",
        });
      }
    }
  });
}


  //trackById(_i: number, r: ProjectItemDto) { return r.id; }
}
