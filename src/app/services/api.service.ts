import { Injectable, signal } from '@angular/core';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosHeaders } from 'axios';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

type BaseKey = 'global' | 'alt';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // ---- Base URLs ----
  private globalApi = environment.globalApi;              // e.g. https://api.yourdomain.com
  private altApi = environment.authBackend;          // <-- hardcode here if you want
  // OR: private altApi = environment.altApi;

  public ACCESS_TOKEN = environment.cookie_name;

  public loginState = signal<{ token: string | null; user: any | null }>({
    token: null,
    user: null,
  });

  private apiHeader = {
    headers: new AxiosHeaders().set('Content-Type', 'application/json'),
  };

  // ---- Two axios clients ----
  private axiosGlobal: AxiosInstance = axios.create({ baseURL: this.globalApi });
  private axiosAlt: AxiosInstance = axios.create({ baseURL: this.altApi });



  constructor(private cookies: CookieService, private router: Router) {
    const token = this.cookies.get(this.ACCESS_TOKEN);
    if (token) {
      const userData: any = safeDecode(token);
      this.loginState.set({ token, user: userData });

      this.axiosGlobal.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      this.axiosAlt.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Attach interceptors to BOTH instances
    this.attachInterceptors(this.axiosGlobal);
    this.attachInterceptors(this.axiosAlt);
  }

  private attachInterceptors(inst: AxiosInstance) {
    // Request: fresh token
    inst.interceptors.request.use(
      (config) => {
        const fresh = this.cookies.get(this.ACCESS_TOKEN);
        if (fresh) {
          config.headers = config.headers ?? {};
          config.headers['Authorization'] = `Bearer ${fresh}`;
        }
        if (!config.headers?.['Content-Type']) {
          config.headers = config.headers ?? {};
          config.headers['Content-Type'] = 'application/json';
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response: 401
    inst.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error?.response?.status === 401) {
          console.warn('401 Unauthorized → logging out…');
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }


  private client(base: BaseKey): AxiosInstance {
    return base === 'alt' ? this.axiosAlt : this.axiosGlobal;
  }

  getUserRole(): number | null {
    const token = this.cookies.get(this.ACCESS_TOKEN);
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return decoded?.roleId || null;
    } catch (err) {
      console.error('Invalid token:', err);
      return null;
    }
  }

  getToken(): string | null {
    return this.cookies.get(this.ACCESS_TOKEN) || null;
  }


  logout = () => {
    const host = (() => {
      try {
        return new URL(environment.domain).hostname;
      } catch {
        return environment.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      }
    })();
    this.cookies.delete(this.ACCESS_TOKEN, '/', host, true, 'Lax'); // Explicitly delete mis_ta
    sessionStorage.clear();
    this.loginState.set({ token: null, user: null });

    // Build redirect URL dynamically
    const landingPath = environment.useHash ? '/#/landing' : '/landing';
    const redirectUrl = `${environment.portals.master}${landingPath}`;

    window.location.href = redirectUrl;
  };

  // -------------- Helpers with optional base param (default: 'global') --------------
  GET = <T = any>(endpoint: string, params?: Record<string, any>, base: BaseKey = 'global', config?: AxiosRequestConfig) =>
    this.client(base).get<T>(endpoint, { ...this.apiHeader, params, ...(config ?? {}) });

  POST = <T = any>(endpoint: string, payload: any, base: BaseKey = 'global', config?: AxiosRequestConfig) =>
    this.client(base).post<T>(endpoint, payload, { ...this.apiHeader, ...(config ?? {}) });

  PUT = <T = any>(endpoint: string, payload?: any, base: BaseKey = 'global', config?: AxiosRequestConfig) =>
    this.client(base).put<T>(endpoint, payload ?? {}, { ...this.apiHeader, ...(config ?? {}) });

  PATCH = <T = any>(endpoint: string, payload: any, base: BaseKey = 'global', config?: AxiosRequestConfig) =>
    this.client(base).patch<T>(endpoint, payload, { ...this.apiHeader, ...(config ?? {}) });

  DELETE = <T = any>(endpoint: string, base: BaseKey = 'global', config?: AxiosRequestConfig) =>
    this.client(base).delete<T>(endpoint, { ...this.apiHeader, ...(config ?? {}) });

  PUTWITHPAYLOAD = <T = any>(endpoint: string, payload: {}, base: BaseKey = 'global', config?: AxiosRequestConfig) => {
    return this.client(base).put<T>(endpoint, payload, { ...this.apiHeader, ...(config ?? {}) });
  };

  POST_FORM_DATA = <T = any>(
    endpoint: string,
    payload: FormData,
    base: BaseKey = 'global',
    config?: AxiosRequestConfig
  ) => {
    return this.client(base).post<T>(endpoint, payload, {
      headers: new AxiosHeaders().set('Content-Type', 'multipart/form-data'),
      ...(config ?? {}),
    });
  };

  postFormData<T>(
    endpoint: string,
    formData: FormData,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    return this.axiosGlobal
      .post<T>(`/${endpoint}`, formData, config)
      .then(response => response.data)
      .catch((error) => {
        console.error('Error posting FormData:', error);
        throw error;
      });
  }

  downloadFile<T>(
    endpoint: string,
    payload: any,
    config: AxiosRequestConfig = {}
  ): Promise<Blob> {
    return this.axiosGlobal
      .post<T>(`/${endpoint}`, payload, {
        responseType: 'blob',
        ...config
      })
      .then((response) => response.data as Blob)
      .catch((error) => {
        console.error('Error downloading file:', error);
        throw error;
      });
  }

  sendFormData<T>(
    method: 'POST' | 'PATCH',
    endpoint: string,
    formData: FormData,
    base: BaseKey = 'global',
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    const axiosMethod = method === 'POST' ? this.client(base).post : this.client(base).patch;

    return axiosMethod(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    })
      .then((response) => response.data)
      .catch((error) => {
        console.error(`${method} request failed for ${endpoint}:`, error);
        throw error;
      });
  }

  patchFormData<T>(
    endpoint: string,
    formData: FormData,
    base: BaseKey = 'global',
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    return this.sendFormData('PATCH', endpoint, formData, base, config);
  }
}

// safe decode
function safeDecode(token: string) {
  try { return jwtDecode(token); } catch { return null; }
}
