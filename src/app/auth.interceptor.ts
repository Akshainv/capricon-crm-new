// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * HTTP Interceptor for Authentication
 * 
 * Purpose:
 * 1. Automatically attach JWT token to all outgoing HTTP requests
 * 2. Handle authentication errors (401, 403)
 * 3. Redirect to login on token expiration
 * 4. Skip token attachment for public endpoints (login, signup, etc.)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // List of public endpoints that don't require authentication
  const publicEndpoints = [
    '/login',
    '/admin',
    '/employee/register',
    '/password/forgot-password',
    '/password/reset-password'
  ];

  // Check if the request URL is a public endpoint
  const isPublicEndpoint = publicEndpoints.some(endpoint => 
    req.url.includes(endpoint)
  );

  // Clone the request and add authorization header if not a public endpoint
  let authReq = req;
  
  if (!isPublicEndpoint) {
    const token = authService.getToken();
    
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  // Handle the request and catch errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle different HTTP error codes
      switch (error.status) {
        case 401:
          // Unauthorized - Invalid or expired token
          console.error('Unauthorized access - Token invalid or expired');
          authService.logout();
          router.navigate(['/login'], { 
            queryParams: { returnUrl: router.url },
            queryParamsHandling: 'merge'
          });
          break;

        case 403:
          // Forbidden - User doesn't have permission or pending approval
          console.error('Access forbidden');
          
          // Check if it's an employee pending approval
          if (error.error?.message?.includes('pending approval')) {
            alert('Your account is pending admin approval. Please wait for approval to access the system.');
            authService.logout();
            router.navigate(['/login']);
          } else {
            alert('You do not have permission to access this resource.');
          }
          break;

        case 404:
          // Not Found
          console.error('Resource not found:', error.url);
          break;

        case 500:
          // Internal Server Error
          console.error('Server error:', error.message);
          alert('An error occurred on the server. Please try again later.');
          break;

        case 0:
          // Network error (server not reachable)
          console.error('Network error - Unable to connect to server');
          alert('Unable to connect to the server. Please check your internet connection.');
          break;

        default:
          console.error('HTTP Error:', error);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Usage in app.config.ts:
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([authInterceptor])
 *     ),
 *     // other providers...
 *   ]
 * };
 */