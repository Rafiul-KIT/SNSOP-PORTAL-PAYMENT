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

interface SubProjectItemDto {
  id: number;
  projectName: string;
  stateName: string;
  countyName: string;
  payamName: string;
  bomaName: string; 
  status: string | null;           
}


interface PagedResponseProjectDto {
  code: number;
  message: string;
  content: SubProjectItemDto[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
}

@Component({
  selector: 'app-sub-project-list',
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
  templateUrl: './sub-project-list.html',
  styleUrl: './sub-project-list.scss',
})
export class SubProjectList implements OnInit {
  rows: SubProjectItemDto[] = [];
  searchText = '';
  isLoading = false;
  totalRecords = 0;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  currentPage = 0;
  pageSize = 10;

  selectedProjectId?: number;

  private readonly SUBPROJECTS_ENDPOINT = '/api/subproject/get';

  constructor(
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: ' Sub-Project List' }];
    this.loadSubProjects();
  }

  private qs(params: Record<string, any>): string {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') usp.set(k, String(v));
    });
    return usp.toString();
  }

  async loadSubProjects() {
    this.isLoading = true;
    try {
      const query = this.qs({
        page: this.currentPage,
        size: this.pageSize,
      });

      const url = `${this.SUBPROJECTS_ENDPOINT}?${query}`;

      const payload = {};

      const res = await this.api.POST(url, payload);
      const data = res.data as PagedResponseProjectDto;

      this.rows = data?.content ?? [];
      this.totalRecords = data?.totalElements ?? 0;
    } catch (err) {
      console.error('Failed to load subprojects', err);
      this.rows = [];
      this.totalRecords = 0;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadSubProjects();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadSubProjects();
  }

  newProject() {
    this.router.navigate(['/sub-project']);
  }
  editProject(id: number) {
    this.router.navigate(['/sub-project', id]);
  }
viewProject(id: number) {
  this.router.navigate(['/sub-project-details', id]);
}

  async deleteProject(id: number) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await this.api.DELETE(`${this.SUBPROJECTS_ENDPOINT}/${id}`);
      this.loadSubProjects();
    } catch (e) {
      console.error('Delete failed', e);
    }
  }

  //trackById(_i: number, r: ProjectItemDto) { return r.id; }
}
