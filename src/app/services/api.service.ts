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
   GET = (endpoint: string) => {
    return this.axiosInstance.get(endpoint, this.apiHeader);
  };

  GET_CONFIG = (endpoint: string, config?: object) => {
    return this.axiosInstance.get(endpoint, { ...this.apiHeader, ...config });
  };

  GET_AUTH = (endpoint: string) => {
    return this.authAxiosInstance.get(endpoint, this.apiHeader);
  };

  POST = (endpoint: string, payload: {}) => {
    return this.axiosInstance.post(endpoint, payload, this.apiHeader);
  };

  POST_AUTH = (endpoint: string, payload: {}) => {
    return this.authAxiosInstance.post(endpoint, payload, this.apiHeader);
  };

  POST_FORM_DATA = (endpoint: string, payload: FormData) => {
    return this.axiosInstance.post(endpoint, payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  PUTWITHPAYLOAD = (endpoint: string, payload: {}) => {
    return this.axiosInstance.put(endpoint, payload, this.apiHeader);
  };

  PUT = (endpoint: string) => {
    return this.axiosInstance.put(endpoint, {}, this.apiHeader);
  };

  PATCH = (endpoint: string, payload: {}) => {
    return this.axiosInstance.patch(endpoint, payload, this.apiHeader);
  };

  DELETE = (endpoint: string) => {
    return this.axiosInstance.delete(endpoint, this.apiHeader);
  };
}
