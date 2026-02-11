// src/app/services/employee.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../app/services/auth.service';

export interface Employee {
  _id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  photo?: string;
  status: 'pending' | 'accept' | 'reject';
  createdAt: Date;
  updatedAt?: Date;
}

export interface EmployeeStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface ApiResponse<T> {
  statusCode?: number;
  message: string;
  data?: T;
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'http://localhost:3000/employee';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Get authorization headers
   */
  private getHeaders(): { headers: HttpHeaders } {
    return {
      headers: this.authService.getAuthHeaders()
    };
  }

  /**
   * Get all employees
   */
  getAllEmployees(): Observable<Employee[]> {
    return this.http.get<ApiResponse<Employee[]>>(this.apiUrl, this.getHeaders()).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Get employee by ID
   */
  getEmployeeById(id: string): Observable<Employee> {
    return this.http.get<ApiResponse<Employee>>(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('Employee not found');
        }
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get employees by status (pending, accept, reject)
   */
  getEmployeesByStatus(status: 'pending' | 'accept' | 'reject'): Observable<Employee[]> {
    return this.http.get<ApiResponse<Employee[]>>(`${this.apiUrl}/status/${status}`, this.getHeaders()).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error(`Error fetching employees with status '${status}':`, error);
        // Return empty array instead of throwing error for better UX
        return throwError(() => error);
      })
    );
  }

  /**
   * Approve/Accept an employee
   */
  approveEmployee(id: string): Observable<Employee> {
    return this.http.patch<ApiResponse<Employee>>(
      `${this.apiUrl}/accept/${id}`,
      {},
      this.getHeaders()
    ).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('Failed to approve employee');
        }
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Reject an employee
   */
  rejectEmployee(id: string): Observable<Employee> {
    return this.http.patch<ApiResponse<Employee>>(
      `${this.apiUrl}/reject/${id}`,
      {},
      this.getHeaders()
    ).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('Failed to reject employee');
        }
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete an employee
   */
  deleteEmployee(id: string): Observable<Employee> {
    return this.http.delete<ApiResponse<Employee>>(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('Failed to delete employee');
        }
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update employee details
   */
  updateEmployee(id: string, updateData: Partial<Employee>): Observable<Employee> {
    return this.http.patch<ApiResponse<Employee>>(
      `${this.apiUrl}/${id}`,
      updateData,
      this.getHeaders()
    ).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('Failed to update employee');
        }
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get employee statistics
   */
  getEmployeeStats(): Observable<EmployeeStats> {
    return this.http.get<ApiResponse<EmployeeStats>>(`${this.apiUrl}/stats`, this.getHeaders()).pipe(
      map(response => response.data || { pending: 0, approved: 0, rejected: 0, total: 0 }),
      catchError(this.handleError)
    );
  }

  /**
   * Register a new employee
   */
  registerEmployee(formData: FormData): Observable<Employee> {
    // Note: For file uploads, we don't set Content-Type header
    // The browser will automatically set it with boundary for multipart/form-data
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<ApiResponse<Employee>>(
      `${this.apiUrl}/register`,
      formData,
      { headers }
    ).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('Failed to register employee');
        }
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Error handling
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }

    console.error('Employee Service Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}