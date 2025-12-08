import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  constructor(
    private apiService: ApiService,
    private cookieService: CookieService
  ) {}

  loadPermissions(): Promise<any> {
    return new Promise(async (resolve) => {
      const ACCESS_TOKEN = environment.cookie_name;
      const token = this.cookieService.get(ACCESS_TOKEN);

      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          const roleId = decoded.roleId;
          const menus = sessionStorage.getItem(`menus_${roleId}`);

          if (menus) {
            resolve(true);
          } else {
            try {
              const axiosResponse = await this.apiService.GET<any>(
                `api/menus/role/${roleId}`,
                {},
                'alt'
              );
              const responseData = axiosResponse.data;
              if (responseData && Array.isArray(responseData.data)) {
                sessionStorage.setItem(
                  `menus_${roleId}`,
                  JSON.stringify(responseData.data)
                );
              }
              resolve(true);
            } catch (error) {
              console.error('Error loading menus:', error);
              resolve(false);
            }
          }
        } catch (error) {
          resolve(false);
        }
      } else {
        resolve(true);
      }
    });
  }
}
