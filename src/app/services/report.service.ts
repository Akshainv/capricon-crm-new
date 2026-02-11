// src/app/services/report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

// ✅ NEW: Interfaces for top performers
export interface TopPerformer {
  name: string;
  dealsClosed: number;
  revenue: number;
}

export interface TopPerformersResponse {
  success: boolean;
  data: TopPerformer[];
  count: number;
  filters: {
    limit: number;
    startDate: string | null;
    endDate: string | null;
  };
  generatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:3000/reports';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): { headers: HttpHeaders } {
    return {
      headers: this.authService.getAuthHeaders()
    };
  }

  // Sales reports for individual employees
  getSalesReports(userId: string, filters?: any): Observable<any> {
    const salesFilters = { ...filters, employeeId: userId };
    return this.http.post(
      `${this.apiUrl}/custom`,
      salesFilters,
      this.getHeaders()
    );
  }

  // Admin reports - general summary
  getAdminReports(filters?: any): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/summary`,
      {
        params: this.buildParams(filters),
        ...this.getHeaders()
      }
    );
  }

  // ✅ NEW: Dedicated method for fetching top performers
  getTopPerformers(limit: number = 10, startDate?: string, endDate?: string): Observable<TopPerformersResponse> {
    let params = new HttpParams().set('limit', limit.toString());

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<TopPerformersResponse>(
      `${this.apiUrl}/top-performers`,
      {
        params,
        ...this.getHeaders()
      }
    );
  }

  private buildParams(filters?: any): HttpParams {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params = params.set(key, filters[key].toString());
        }
      });
    }
    return params;
  }
}