// src/app/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface DashboardStat {
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface AdminDashboardData {
  totalDeals: DashboardStat;
  totalProjects: DashboardStat;
  totalLeads: DashboardStat;
  chartData?: {
    labels: string[];
    revenue: number[];
    deals: number[];
  };
}

export interface SalesDashboardStats {
  totalQuotations: { value: number; change: string; trend: 'up' | 'down' | 'neutral' };
  myLeads: { value: number; change: string; trend: 'up' | 'down' | 'neutral' };
  myProjects: { value: number; change: string; trend: 'up' | 'down' | 'neutral' };
}

export interface SalesDashboardData {
  stats: SalesDashboardStats;
  chartData?: {
    labels: string[];
    revenue: number[];
    deals: number[];
  };
}

export interface DashboardFilter {
  period?: 'today' | 'thisWeek' | 'thisMonth' | 'thisQuarter' | 'last6Months';
  startDate?: string;
  endDate?: string;
}

export interface DashboardResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:3000/dashboard';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders() {
    return {
      headers: this.authService.getAuthHeaders()
    };
  }

  /**
   * ✅ Get ADMIN dashboard data
   * Returns: Deals (Deal Pipeline), Projects (Project List), Leads (Lead List)
   */
  getAdminDashboard(filter?: DashboardFilter): Observable<DashboardResponse<AdminDashboardData>> {
    let params = new HttpParams();

    if (filter) {
      if (filter.period) {
        params = params.set('period', filter.period);
      }
      if (filter.startDate) {
        params = params.set('startDate', filter.startDate);
      }
      if (filter.endDate) {
        params = params.set('endDate', filter.endDate);
      }
    }

    console.log('🔵 Frontend: Calling GET /dashboard/admin');

    return this.http.get<DashboardResponse<AdminDashboardData>>(
      `${this.apiUrl}/admin`,
      { ...this.getHeaders(), params }
    );
  }

  /**
   * ✅ Get SALES dashboard data
   * Returns: My Quotations, My Leads, My Projects (user-specific)
   */
  getSalesDashboard(filter?: DashboardFilter): Observable<DashboardResponse<SalesDashboardData>> {
    let params = new HttpParams();

    if (filter) {
      if (filter.period) {
        params = params.set('period', filter.period);
      }
      if (filter.startDate) {
        params = params.set('startDate', filter.startDate);
      }
      if (filter.endDate) {
        params = params.set('endDate', filter.endDate);
      }
    }

    console.log('🔵 Frontend: Calling GET /dashboard/sales');

    return this.http.get<DashboardResponse<SalesDashboardData>>(
      `${this.apiUrl}/sales`,
      { ...this.getHeaders(), params }
    );
  }
}