// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * ====================================================================
 * 1. AUTH GUARD - General Authentication Check
 * ====================================================================
 * Purpose: Prevent unauthenticated users from accessing protected routes
 * Usage: Apply to routes that require any logged-in user (admin or employee)
 * 
 * Example in routes:
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [authGuard]
 * }
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is logged in
  if (authService.isLoggedIn) {
    return true;
  }

  // Not logged in - redirect to login page with return URL
  console.warn('Access denied - User not authenticated');
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

/**
 * ====================================================================
 * 2. ADMIN GUARD - Admin Role Check
 * ====================================================================
 * Purpose: Restrict access to admin-only routes
 * Usage: Apply to routes that only admins can access
 * 
 * Example in routes:
 * {
 *   path: 'admin',
 *   children: [
 *     {
 *       path: 'dashboard',
 *       component: AdminDashboardComponent,
 *       canActivate: [adminGuard]
 *     },
 *     {
 *       path: 'employees',
 *       component: EmployeeManagementComponent,
 *       canActivate: [adminGuard]
 *     }
 *   ]
 * }
 */
export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is logged in
  if (!authService.isLoggedIn) {
    console.warn('Access denied - User not authenticated');
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Check if user is admin
  if (authService.isAdmin) {
    return true;
  }

  // User is logged in but not an admin
  console.warn('Access denied - Admin privileges required');
  alert('Access Denied: This page is only accessible to administrators.');
  
  // Redirect to appropriate dashboard based on role
  if (authService.isEmployee) {
    router.navigate(['/employee/dashboard']);
  } else {
    router.navigate(['/login']);
  }
  
  return false;
};

/**
 * ====================================================================
 * 3. EMPLOYEE GUARD - Employee Role Check
 * ====================================================================
 * Purpose: Restrict access to employee-only routes
 * Usage: Apply to routes that only employees can access
 * 
 * Example in routes:
 * {
 *   path: 'employee',
 *   children: [
 *     {
 *       path: 'dashboard',
 *       component: EmployeeDashboardComponent,
 *       canActivate: [employeeGuard]
 *     },
 *     {
 *       path: 'my-quotations',
 *       component: MyQuotationsComponent,
 *       canActivate: [employeeGuard]
 *     }
 *   ]
 * }
 */
export const employeeGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is logged in
  if (!authService.isLoggedIn) {
    console.warn('Access denied - User not authenticated');
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Check if user is employee
  if (authService.isEmployee) {
    return true;
  }

  // User is logged in but not an employee
  console.warn('Access denied - Employee privileges required');
  alert('Access Denied: This page is only accessible to employees.');
  
  // Redirect to appropriate dashboard based on role
  if (authService.isAdmin) {
    router.navigate(['/admin/dashboard']);
  } else {
    router.navigate(['/login']);
  }
  
  return false;
};

/**
 * ====================================================================
 * 4. GUEST GUARD - Redirect logged-in users
 * ====================================================================
 * Purpose: Prevent logged-in users from accessing guest pages (login, register)
 * Usage: Apply to login and registration pages
 * 
 * Example in routes:
 * {
 *   path: 'login',
 *   component: LoginComponent,
 *   canActivate: [guestGuard]
 * },
 * {
 *   path: 'register',
 *   component: RegisterComponent,
 *   canActivate: [guestGuard]
 * }
 */
export const guestGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is already logged in, redirect to their dashboard
  if (authService.isLoggedIn) {
    console.log('User already logged in - Redirecting to dashboard');
    authService.navigateToDashboard();
    return false;
  }

  // User is not logged in, allow access to guest pages
  return true;
};

/**
 * ====================================================================
 * USAGE IN app.routes.ts
 * ====================================================================
 * 
 * import { Routes } from '@angular/router';
 * import { authGuard, adminGuard, employeeGuard, guestGuard } from './guards/auth.guard';
 * 
 * export const routes: Routes = [
 *   // Guest routes (login, register)
 *   {
 *     path: 'login',
 *     component: LoginComponent,
 *     canActivate: [guestGuard]
 *   },
 *   {
 *     path: 'register',
 *     component: RegisterComponent,
 *     canActivate: [guestGuard]
 *   },
 * 
 *   // Admin routes
 *   {
 *     path: 'admin',
 *     canActivate: [adminGuard],
 *     children: [
 *       {
 *         path: 'dashboard',
 *         component: AdminDashboardComponent
 *       },
 *       {
 *         path: 'employees',
 *         component: EmployeeManagementComponent
 *       },
 *       {
 *         path: 'quotations',
 *         component: AllQuotationsComponent
 *       }
 *     ]
 *   },
 * 
 *   // Employee routes
 *   {
 *     path: 'employee',
 *     canActivate: [employeeGuard],
 *     children: [
 *       {
 *         path: 'dashboard',
 *         component: EmployeeDashboardComponent
 *       },
 *       {
 *         path: 'my-quotations',
 *         component: MyQuotationsComponent
 *       }
 *     ]
 *   },
 * 
 *   // General authenticated routes
 *   {
 *     path: 'profile',
 *     component: ProfileComponent,
 *     canActivate: [authGuard]
 *   },
 * 
 *   // Default redirects
 *   {
 *     path: '',
 *     redirectTo: '/login',
 *     pathMatch: 'full'
 *   },
 *   {
 *     path: '**',
 *     redirectTo: '/login'
 *   }
 * ];
 */