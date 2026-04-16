import { Injectable, signal } from '@angular/core';
import axios from 'axios';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private globalApi: string = environment.globalApi;
  private authApi: string = environment.authApi;
  public loginState = signal({
    token: null,
    user: null,
  });
  public ACCESS_TOKEN = environment.cookie_name;
  private apiHeader: any = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  axiosInstance = axios.create({
    baseURL: this.globalApi, // ✅ already sets baseURL
  });
  authAxiosInstance = axios.create({
    baseURL: this.authApi,
  });

  constructor(private cookieService: CookieService, private router: Router) {
    const accessToken: any = this.cookieService.get(this.ACCESS_TOKEN);
    if (accessToken) {
      const userData: any = jwtDecode(accessToken);
      this.loginState.set({
        token: accessToken,
        user: userData,
      });
      this.axiosInstance.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${accessToken}`;
      this.authAxiosInstance.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${accessToken}`;
    }

    // ✅ Request interceptor → always attach fresh token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.cookieService.get(this.ACCESS_TOKEN);
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.authAxiosInstance.interceptors.request.use(
      (config) => {
        const token = this.cookieService.get(this.ACCESS_TOKEN);
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // ✅ Response interceptor → handle 401 globally
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.warn('401 Unauthorized → redirecting to login...');
          this.logout(); // reuse your existing logout
        }
        return Promise.reject(error);
      }
    );

    this.authAxiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.warn('401 Unauthorized → redirecting to login...');
          this.logout(); // reuse your existing logout
        }
        return Promise.reject(error);
      }
    );
  }
getUserRole(): number | null {
  const token = this.cookieService.get(this.ACCESS_TOKEN);
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
    return this.cookieService.get(this.ACCESS_TOKEN) || null;
  }

  logout = () => {
    const host = (() => {
      try {
        return new URL(environment.domain).hostname;
      } catch {
        return environment.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      }
    })();
    this.cookieService.delete(this.ACCESS_TOKEN, '/', host, true, 'Lax'); // Explicitly delete mis_ta
    sessionStorage.clear();
    this.loginState.set({ token: null, user: null });

    // Build redirect URL dynamically
    const landingPath = environment.useHash ? '/#/landing' : '/landing';
    const redirectUrl = `${environment.portals.master}${landingPath}`;

    window.location.href = redirectUrl;
  };

  // ================= Basic HTTP Functions =================
  GET = <T = any>(
    endpoint: string,
    params?: any,
    base: 'global' | 'auth' = 'global',
    config?: any
  ) => {
    const instance =
      base === 'auth' ? this.authAxiosInstance : this.axiosInstance;
    return instance.get<T>(endpoint, {
      ...this.apiHeader,
      ...config,
      params: params,
    });
  };

  GET_CONFIG = <T = any>(endpoint: string, config?: any) => {
    return this.axiosInstance.get<T>(endpoint, {
      ...this.apiHeader,
      ...config,
    });
  };

  GET_AUTH = <T = any>(endpoint: string, params?: any) => {
    return this.authAxiosInstance.get<T>(endpoint, {
      ...this.apiHeader,
      params: params,
    });
  };

  POST = <T = any>(
    endpoint: string,
    payload: any,
    base: 'global' | 'auth' = 'global',
    config?: any
  ) => {
    const instance =
      base === 'auth' ? this.authAxiosInstance : this.axiosInstance;
    return instance.post<T>(endpoint, payload, {
      ...this.apiHeader,
      ...config,
    });
  };

  POST_AUTH = <T = any>(endpoint: string, payload: any) => {
    return this.authAxiosInstance.post<T>(endpoint, payload, this.apiHeader);
  };

  POST_FORM_DATA = <T = any>(endpoint: string, payload: FormData) => {
    return this.axiosInstance.post<T>(endpoint, payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  PUTWITHPAYLOAD = <T = any>(endpoint: string, payload: any) => {
    return this.axiosInstance.put<T>(endpoint, payload, this.apiHeader);
  };

  PUT = <T = any>(
    endpoint: string,
    payload: any = {},
    base: 'global' | 'auth' = 'global',
    config?: any
  ) => {
    const instance =
      base === 'auth' ? this.authAxiosInstance : this.axiosInstance;
    return instance.put<T>(endpoint, payload, {
      ...this.apiHeader,
      ...config,
    });
  };

  PATCH = <T = any>(
    endpoint: string,
    payload: any,
    base: 'global' | 'auth' = 'global',
    config?: any
  ) => {
    const instance =
      base === 'auth' ? this.authAxiosInstance : this.axiosInstance;
    return instance.patch<T>(endpoint, payload, {
      ...this.apiHeader,
      ...config,
    });
  };

  DELETE = <T = any>(
    endpoint: string,
    base: 'global' | 'auth' = 'global',
    config?: any
  ) => {
    const instance =
      base === 'auth' ? this.authAxiosInstance : this.axiosInstance;
    return instance.delete<T>(endpoint, {
      ...this.apiHeader,
      ...config,
    });
  };

  POST_FORM = <T = any>(
    endpoint: string,
    formData: FormData,
    base: 'global' | 'auth' = 'global'
  ) => {
    const instance =
      base === 'auth' ? this.authAxiosInstance : this.axiosInstance;
    return instance.post<T>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };
}
