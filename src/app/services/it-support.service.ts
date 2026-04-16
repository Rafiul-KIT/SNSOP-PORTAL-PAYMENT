import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface ITCategory {
  id: number;
  name: string;
  description: string;
}

export interface ITModule {
  id: number;
  name: string;
  description: string;
}

export interface ITAttachment {
  id: number;
  requestId: number;
  path: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  createdBy: number;
  createdAt: string;
  downloadUrl: string;
}

export interface ITHistory {
  id: number;
  requestId: number;
  action: string;
  changes: string;
  comment: string;
  performedBy: number;
  performedAt: string;
}

export interface ITRequest {
  id: number;
  trackingNumber: string;
  title: string;
  description: string;
  categoryId: number;
  categoryName: string;
  moduleId: number;
  moduleName: string;
  priority: string;
  status: string;
  comment: string;
  createdBy: number;
  createdAt: string;
  updatedBy: number;
  updatedAt: string;
  attachmentCount?: number;
  attachments?: ITAttachment[];
  history?: ITHistory[];
}

export interface ITPagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ITApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  path: string;
  data: T;
  pagination?: ITPagination;
}

export interface ITSearchParams {
  status?: string;
  categoryId?: number;
  moduleId?: number;
  priority?: string;
  trackingNumber?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface ITDashboardCount {
  totalRequests: number;
  resolvedRequests: number;
}

export interface ITDashboardModuleSummary {
  moduleId: number;
  moduleName: string;
  totalRequests: number;
  resolvedRequests: number;
}

export interface ITDashboardMonthReport {
  month: string;
  year: number;
  monthNumber: number;
  reportedCount: number;
}

export interface ITDashboardData {
  totalRequests: number;
  countsByStatus: Record<string, ITDashboardCount>;
  requestsByModule: ITDashboardModuleSummary[];
  reportedIssuesLastSixMonths: ITDashboardMonthReport[];
  countsByPriority: Record<string, ITDashboardCount>;
}

@Injectable({
  providedIn: 'root',
})
export class ItSupportService {
  private readonly baseEndpoint = 'api/v1/it-support';

  constructor(private api: ApiService) {}

  private parseApiResponse<T>(res: any): ITApiResponse<T> | null {
    const response = res?.data;
    if (response && typeof response === 'object' && 'success' in response) {
      return response as ITApiResponse<T>;
    }
    return null;
  }

  private appendFiles(formData: FormData, files?: File[]): void {
    if (!files?.length) return;

    files.forEach((file) => {
      if (file) {
        formData.append('files', file, file.name);
      }
    });
  }

  async getCategories(): Promise<ITCategory[]> {
    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/categories`);
      const response = this.parseApiResponse<ITCategory[]>(res);
      return response?.success && Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  }

  async getModules(): Promise<ITModule[]> {
    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/modules`);
      const response = this.parseApiResponse<ITModule[]>(res);
      return response?.success && Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  }

  async getRequests(params: ITSearchParams = {}): Promise<{ items: ITRequest[]; total: number; pagination?: ITPagination }> {
    const queryParams: Record<string, any> = {};

    if (params.status) queryParams['status'] = params.status;
    if (params.categoryId) queryParams['categoryId'] = params.categoryId;
    if (params.moduleId) queryParams['moduleId'] = params.moduleId;
    if (params.priority) queryParams['priority'] = params.priority;
    if (params.trackingNumber) queryParams['trackingNumber'] = params.trackingNumber;
    if (params.search) queryParams['search'] = params.search;
    if (params.page !== undefined) queryParams['page'] = params.page;
    if (params.size !== undefined) queryParams['size'] = params.size;

    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/requests`, queryParams);
      const response = this.parseApiResponse<ITRequest[]>(res);

      if (response?.success) {
        const items = Array.isArray(response.data) ? response.data : [];
        const total = response.pagination?.totalElements ?? items.length;
        return { items, total, pagination: response.pagination };
      }

      return { items: [], total: 0 };
    } catch {
      return { items: [], total: 0 };
    }
  }

  async getRequestById(id: number): Promise<ITRequest | null> {
    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/requests/${id}`);
      const response = this.parseApiResponse<ITRequest>(res);
      return response?.success ? response.data : null;
    } catch {
      return null;
    }
  }

  async getRequestByTrackingNumber(trackingNumber: string): Promise<ITRequest | null> {
    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/requests/tracking/${trackingNumber}`);
      const response = this.parseApiResponse<ITRequest>(res);
      return response?.success ? response.data : null;
    } catch {
      return null;
    }
  }

  async getRequestHistory(id: number): Promise<ITHistory[]> {
    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/requests/${id}/history`);
      const response = this.parseApiResponse<ITHistory[]>(res);
      return response?.success && Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  }

  async getDashboard(): Promise<ITDashboardData | null> {
    try {
      const res = await this.api.GET<any>(`${this.baseEndpoint}/dashboard`);
      const response = this.parseApiResponse<ITDashboardData>(res);
      return response?.success ? response.data : null;
    } catch {
      return null;
    }
  }

  async createRequest(payload: {
    title: string;
    description: string;
    categoryId: number;
    moduleId: number;
    priority: string;
    files?: File[];
  }): Promise<{ success: boolean; request?: ITRequest; trackingNumber?: string; message?: string }> {
    try {
      const formData = new FormData();

      const requestPayload = {
        title: payload.title,
        description: payload.description,
        categoryId: payload.categoryId,
        moduleId: payload.moduleId,
        priority: payload.priority,
      };

      formData.append('payload', new Blob([JSON.stringify(requestPayload)], { type: 'application/json' }));
      this.appendFiles(formData, payload.files);

      const res = await this.api.POST_FORM<any>(`${this.baseEndpoint}/requests`, formData);
      const response = this.parseApiResponse<ITRequest>(res);

      return {
        success: response?.success || false,
        request: response?.data,
        trackingNumber: response?.data?.trackingNumber,
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to create request',
      };
    }
  }

  async updateRequest(
    id: number,
    payload: { description: string; categoryId: number; moduleId: number; priority: string }
  ): Promise<{ success: boolean; request?: ITRequest; message?: string }> {
    try {
      const res = await this.api.PUT<any>(`${this.baseEndpoint}/requests/${id}`, payload);
      const response = this.parseApiResponse<ITRequest>(res);

      return {
        success: response?.success || false,
        request: response?.data,
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to update request',
      };
    }
  }

  async addAttachments(id: number, files: File[]): Promise<{ success: boolean; request?: ITRequest; message?: string }> {
    try {
      const formData = new FormData();
      this.appendFiles(formData, files);

      const res = await this.api.POST_FORM<any>(`${this.baseEndpoint}/requests/${id}/attachments`, formData);
      const response = this.parseApiResponse<ITRequest>(res);

      return {
        success: response?.success || false,
        request: response?.data,
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to add attachments',
      };
    }
  }

  async downloadAttachment(id: number, attachmentId: number): Promise<Blob | null> {
    try {
      const res = await this.api.GET<Blob>(
        `${this.baseEndpoint}/requests/${id}/attachments/${attachmentId}`,
        undefined,
        'global',
        { responseType: 'blob' }
      );
      return (res as any)?.data || null;
    } catch {
      return null;
    }
  }

  async updateRequestStatus(
    id: number,
    payload: { status: string; comment?: string }
  ): Promise<{ success: boolean; request?: ITRequest; message?: string }> {
    try {
      const res = await this.api.PATCH<any>(`${this.baseEndpoint}/requests/${id}/status`, payload);
      const response = this.parseApiResponse<ITRequest>(res);

      return {
        success: response?.success || false,
        request: response?.data,
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to update status',
      };
    }
  }

  async submitInfo(
    id: number,
    payload?: { description?: string; comment?: string },
    files?: File[]
  ): Promise<{ success: boolean; request?: ITRequest; message?: string }> {
    try {
      const formData = new FormData();

      const cleanPayload: { description?: string; comment?: string } = {};
      if (payload?.description?.trim()) cleanPayload.description = payload.description.trim();
      if (payload?.comment?.trim()) cleanPayload.comment = payload.comment.trim();

      if (Object.keys(cleanPayload).length) {
        formData.append('payload', new Blob([JSON.stringify(cleanPayload)], { type: 'application/json' }));
      }

      this.appendFiles(formData, files);

      const res = await this.api.POST_FORM<any>(`${this.baseEndpoint}/requests/${id}/submit-info`, formData);
      const response = this.parseApiResponse<ITRequest>(res);

      return {
        success: response?.success || false,
        request: response?.data,
        message: response?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to submit required information',
      };
    }
  }
}
