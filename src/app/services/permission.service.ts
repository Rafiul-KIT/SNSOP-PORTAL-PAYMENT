import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  constructor(
    private http: HttpClient,
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
              const response = await firstValueFrom(
                this.http.get<any>(
                  `https://devgwapp.southsudansafetynet.info/mis_auth/api/menus/role/${roleId}`
                  //  `https://gwapp.southsudansafetynet.info/mis_auth/api/menus/role/${roleId}`
                )
              );
              if (response && Array.isArray(response.data)) {
                sessionStorage.setItem(
                  `menus_${roleId}`,
                  JSON.stringify(response.data)
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
