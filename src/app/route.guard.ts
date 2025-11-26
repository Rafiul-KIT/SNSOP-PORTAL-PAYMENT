import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../environments/environment';

export const routeGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const cookieService = inject(CookieService);
  const router = inject(Router);

  const ACCESS_TOKEN = environment.cookie_name;
  const token = cookieService.get(ACCESS_TOKEN);

  // Check if the user is logged in
  if (!token) {
    const redirectUrl = `${environment.portals.master}/#/landing`;
    window.location.href = redirectUrl;
    return false;
  }

  // Decode the JWT token
  let decoded: any;
  try {
    decoded = jwtDecode(token);
  } catch {
    router.navigateByUrl('/landing');
    return false;
  }

  // Check if the token is expired
  if (decoded.exp && Date.now() >= decoded.exp * 1000) {
    router.navigateByUrl('/landing');
    return false;
  }

  // Get menus from sessionStorage
  const menus = sessionStorage.getItem(`menus_${decoded.roleId}`);
  if (!menus) {
    router.navigateByUrl('/unauthorized');
    return false;
  }

  const permittedMenus = JSON.parse(menus);
  const targetUrl = state.url.split('?')[0]; // Strip query parameters

  const hasAccess = (menus: any[], url: string): boolean => {
    const cleanUrl = url.split('?')[0]; // Remove query parameters from the URL
    const urlSegments = cleanUrl.split('/').filter(s => s.length > 0);

    for (const menu of menus) {
      if (!menu.url) continue;

      const menuUrlSegments = menu.url.split('/').filter((s: string) => s.length > 0);

      // Check for exact match or parameterized match
      if (urlSegments.length === menuUrlSegments.length) {
        let match = true;
        for (let i = 0; i < urlSegments.length; i++) {
          // If the menu segment is a parameter placeholder (e.g., ':id'), it matches any value
          // Otherwise, segments must match exactly
          if (menuUrlSegments[i].startsWith(':') || menuUrlSegments[i] === urlSegments[i]) {
            continue;
          } else {
            match = false;
            break;
          }
        }
        if (match) {
          return true;
        }
      }
    }
    // If the route is not found in the menu, allow access to known dynamic paths like:
    //  - /beneficiary/details/:id
    //  - /beneficiary/edit/:applicationId
    //  - Any other parameterized route you want to allow
    const dynamicRoutePrefixes = ['/beneficiary/details/','/beneficiary/edit/','/beneficiary/migrate/', '/adjudication/', '/report/', '/restore/', '/pending-beneficiary/', '/beneficiary-approval/', '/beneficiary-audit/'];

    // Check if the route starts with any of the dynamic prefixes
    for (const prefix of dynamicRoutePrefixes) {
      if (cleanUrl.startsWith(prefix)) {
        return true; // Allow access to dynamic routes
      }
    }

    return false;
  };

  const allowed = hasAccess(permittedMenus, targetUrl);

  if (!allowed) {
    console.warn('Access denied for route:', targetUrl);
    router.navigateByUrl('/unauthorized');
    return false;
  }

  return true;
};
