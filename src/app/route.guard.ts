import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../environments/environment';

export const routeGuard: CanActivateChildFn = (route: any) => {
  const cookieService = inject(CookieService);
  const router = inject(Router);
  let lState: boolean = true; // Default state is true, meaning access is allowed

  const ACCESS_TOKEN = environment.cookie_name;
  const token = cookieService.get(ACCESS_TOKEN);

  // Step 1: Check if the user is logged in (token exists in cookies)
  const isLoggedIn = token ? true : false;
  if (!isLoggedIn) {
    lState = false; // Set to false if the user is not logged in
    const redirectUrl = `${environment.portals.master}/#/landing`; // Use hash-based routing for production
    window.location.href = redirectUrl; // Redirect to the correct landing page
  }

  // Step 2: If the user is logged in, decode the JWT token
  let decoded: any;
  try {
    decoded = jwtDecode(token);
  } catch {
    router.navigateByUrl('/landing'); // If decoding fails, redirect to the landing page
    return false; // Prevent access to the route
  }

  // Step 3: Check if the token is expired
  if (decoded.exp && Date.now() >= decoded.exp * 1000) {
    router.navigateByUrl('/landing'); // If expired, redirect to landing
    return false; // Prevent access to the route
  }

  // Step 4: Get the menus from sessionStorage for the current user's role
  const menus = sessionStorage.getItem(`menus_${decoded.roleId}`);
  if (!menus) {
    router.navigateByUrl('/unauthorized'); // If no menus found in sessionStorage, redirect to unauthorized
    return false; // Prevent access to the route
  }

  // Parse the menus to check for route access
  const permittedMenus = JSON.parse(menus);

  // Step 5: Check if the target route is allowed based on the user's role
  const targetUrl = route.routeConfig?.path; // The current route's path
  const allowed = permittedMenus.some((menu: any) => menu.url === targetUrl);

  if (!allowed) {
    console.warn('Access denied for route:', targetUrl);
    router.navigateByUrl('/unauthorized'); // Redirect to unauthorized if no access
    return false; // Prevent access to the route
  }

  // If all checks pass, allow access to the route
  return lState; // Return the value of lState, which is true if the user is logged in and authorized
};

