// src/app/sales-reports/sales-reports.component.ts
import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import 'chart.js/auto';
import { ReportService } from '../services/report.service';
import { AuthService } from '../services/auth.service';
import { ProjectService, Project } from '../services/project.service';
import { QuotationService, Quotation } from '../services/quotation.service';
import { LeadsService, Lead } from '../lead.service';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);


// Chart.js components are registered globally via provideCharts in app.config.ts

interface ReportStat {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
  trend?: number;
}

@Component({
  selector: 'app-sales-reports',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './sales-reports.component.html',
  styleUrls: ['./sales-reports.component.css']
})
export class SalesReportsComponent implements OnInit {
  private _revenueChart?: BaseChartDirective;
  @ViewChild(BaseChartDirective) set revenueChartDirective(content: BaseChartDirective) {
    if (content) {
      this._revenueChart = content;
      console.log('📈 Sales Chart Directive Captured');
      setTimeout(() => this._revenueChart?.update(), 100);
    }
  }

  get revenueChart(): BaseChartDirective | undefined {
    return this._revenueChart;
  }

  chartReady: boolean = false;

  loading: boolean = false;
  currentUserId: string = '';
  currentUserName: string = '';

  stats: ReportStat[] = [];
  analysisType: 'daily' | 'monthly' | 'total' = 'monthly';

  public revenueChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Revenue (₹L)',
        backgroundColor: '#d4b347',
        hoverBackgroundColor: '#c9a642',
        borderRadius: 6,
        borderWidth: 0,
        yAxisID: 'y'
      },
      {
        data: [],
        label: 'Leads',
        backgroundColor: '#22d3ee',
        hoverBackgroundColor: '#06b6d4',
        borderRadius: 6,
        borderWidth: 0,
        yAxisID: 'y1'
      },
      {
        data: [],
        label: 'Quotations',
        backgroundColor: '#818cf8',
        hoverBackgroundColor: '#6366f1',
        borderRadius: 6,
        borderWidth: 0,
        yAxisID: 'y1'
      },
      {
        data: [],
        label: 'Won Projects',
        backgroundColor: '#22c55e',
        hoverBackgroundColor: '#16a34a',
        borderRadius: 6,
        borderWidth: 0,
        yAxisID: 'y1'
      }
    ]
  };

  public revenueChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: this.getChartTextColor(),
          font: { size: 12, family: "'Inter', sans-serif" }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#d4b347',
        bodyColor: '#fff',
        borderColor: '#d4b347',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: this.getChartGridColor() },
        ticks: { color: this.getChartTextColor() }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: this.getChartGridColor() },
        ticks: { color: this.getChartTextColor() },
        beginAtZero: true,
        title: { display: true, text: 'Revenue (₹L)', color: '#d4b347' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: this.getChartTextColor() },
        beginAtZero: true,
        title: { display: true, text: 'Counts', color: '#818cf8' }
      }
    }
  };

  public revenueChartType: ChartType = 'bar';

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private projectService: ProjectService,
    private quotationService: QuotationService,
    private leadsService: LeadsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.currentUserId = user.userId || '';
      this.currentUserName = user.fullName || user.email || 'Sales User';
      this.loadReportsData();
    }
    this.setupThemeListener();
  }

  loadReportsData(): void {
    if (!this.currentUserId) {
      console.error('No user ID found');
      return;
    }
    this.loading = true;
    const now = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (this.analysisType === 'daily') {
      startDate = now.toISOString().split('T')[0];
      // ✅ FIX: Include the whole day by setting end date to tomorrow's start or tonight's end
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      endDate = tomorrow.toISOString().split('T')[0];
    } else if (this.analysisType === 'monthly') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      startDate = thirtyDaysAgo.toISOString().split('T')[0];
    }

    const filters = { startDate, endDate };

    // Use ReportService to get aggregated sales data
    const salesReport$ = this.reportService.getSalesReports(this.currentUserId, filters).toPromise();
    // Raw data for the trend chart
    const projects$ = this.projectService.getProjectsBySalesExecutive(this.currentUserId).toPromise();
    const leads$ = this.leadsService.getLeadsCreatedByMe().toPromise();
    const assignedLeads$ = this.leadsService.getLeadsAssignedToMe().toPromise();
    const quotations$ = this.quotationService.getAllQuotations().toPromise();

    Promise.all([salesReport$, projects$, leads$, assignedLeads$, quotations$]).then(([reportResponse, projects, leads, assignedLeads, quotesResponse]) => {
      const report = (reportResponse as any);
      const stats = report.summary || {};

      const allMyLeads = [...(leads || []), ...(assignedLeads || [])];
      // Filter quotes by current user
      const quotes = (quotesResponse as any)?.data || [];
      const myQuotes = (Array.isArray(quotes) ? quotes : [quotes]).filter((q: any) => {
        const creatorId = typeof q.createdBy === 'object' ? q.createdBy._id : q.createdBy;
        return creatorId && String(creatorId).toLowerCase().trim() === String(this.currentUserId).toLowerCase().trim();
      });

      this.loading = false;
      this.cdr.detectChanges();

      // ✅ Process trend and update chart AFTER loading is false
      this.processSalesReportData(stats, projects || [], myQuotes.length);
      const completedProjects = (projects || []).filter(p => p.projectStatus?.toLowerCase() === 'completed');
      this.processRevenueTrend(completedProjects, allMyLeads, myQuotes);
      this.cdr.detectChanges();

      // Final force update
      setTimeout(() => {
        if (this.revenueChart) {
          console.log('📈 Final update for Sales Revenue Chart');
          this.revenueChart.update();
        }
      }, 300);
    }).catch(error => {
      console.error('❌ Error loading sales reports:', error);
      this.loading = false;
      this.initializeDefaultStats();
    });
  }

  setAnalysisType(type: 'daily' | 'monthly' | 'total'): void {
    this.analysisType = type;
    this.loadReportsData();
  }

  private initializeDefaultStats(): void {
    this.stats = [
      { label: 'My Leads', value: 0, icon: 'fa-users', color: '#22d3ee', trend: 0 },
      { label: 'Proposals', value: 0, icon: 'fa-file-invoice', color: '#818cf8', trend: 0 },
      { label: 'Win Rate', value: '0%', icon: 'fa-handshake', color: '#a855f7', trend: 0 },
      { label: 'Revenue', value: '₹0', icon: 'fa-rupee-sign', color: '#d4b347', trend: 0 }
    ];
  }

  private processSalesReportData(reportStats: any, projects: Project[], localQuoteCount?: number): void {
    // 1. Map backend summary to stats cards
    // The service now returns the unwrapped summary object
    const stats = reportStats || {};

    this.stats = [
      {
        label: 'My Leads',
        value: stats.leadsCount ?? stats.totalDeals ?? stats.totalProjects ?? 0,
        icon: 'fa-users',
        color: '#22d3ee',
        subtitle: 'New opportunities',
        trend: 10
      },
      {
        label: 'Proposals',
        value: localQuoteCount ?? stats.totalQuotations ?? stats.quotationsSent ?? 0,
        icon: 'fa-file-invoice',
        color: '#818cf8',
        subtitle: `${stats.quotationsAccepted ?? 0} accepted`,
        trend: 5
      },
      {
        label: 'Win Rate',
        value: `${stats.conversionRate ?? 0}%`,
        icon: 'fa-handshake',
        color: '#a855f7',
        subtitle: `${stats.dealsWon ?? stats.projectsWon ?? 0} deals won`,
        trend: 15
      },
      {
        label: 'Revenue',
        value: this.formatCurrency(stats.totalRevenue ?? 0),
        icon: 'fa-rupee-sign',
        color: '#d4b347',
        subtitle: 'Realized business',
        trend: 25
      }
    ];

    this.cdr.detectChanges();
  }

  private processRevenueTrend(completedProjects: any[], allLeads: any[], allQuotes: any[]): void {
    const intervals = this.getTrendIntervals(completedProjects);

    const revenueData = intervals.map(interval => {
      const intervalProjects = completedProjects.filter(p => {
        const date = new Date(p.createdAt || p.startDate);
        if (isNaN(date.getTime())) return false;
        if (this.analysisType === 'daily') {
          return date.getDate() === interval.day && date.getMonth() === interval.index && date.getFullYear() === interval.year;
        } else {
          return date.getMonth() === interval.index && date.getFullYear() === interval.year;
        }
      });
      return intervalProjects.reduce((sum, p) => sum + (p.projectValue || 0), 0);
    });

    const leadData = intervals.map(interval => {
      return allLeads.filter(l => {
        if (!l.createdAt) return false;
        const date = new Date(l.createdAt);
        if (isNaN(date.getTime())) return false;
        if (this.analysisType === 'daily') {
          return date.getDate() === interval.day && date.getMonth() === interval.index && date.getFullYear() === interval.year;
        } else {
          return date.getMonth() === interval.index && date.getFullYear() === interval.year;
        }
      }).length;
    });

    const quoteData = intervals.map(interval => {
      return allQuotes.filter(q => {
        if (!q.createdAt) return false;
        const date = new Date(q.createdAt);
        if (isNaN(date.getTime())) return false;
        if (this.analysisType === 'daily') {
          return date.getDate() === interval.day && date.getMonth() === interval.index && date.getFullYear() === interval.year;
        } else {
          return date.getMonth() === interval.index && date.getFullYear() === interval.year;
        }
      }).length;
    });

    const projectsWonData = intervals.map(interval => {
      return completedProjects.filter(p => {
        const date = new Date(p.createdAt || p.startDate);
        if (isNaN(date.getTime())) return false;
        if (this.analysisType === 'daily') {
          return date.getDate() === interval.day && date.getMonth() === interval.index && date.getFullYear() === interval.year;
        } else {
          return date.getMonth() === interval.index && date.getFullYear() === interval.year;
        }
      }).length;
    });

    this.revenueChartData = {
      labels: intervals.map(m => m.label),
      datasets: [
        {
          data: revenueData.map(r => parseFloat((r / 100000).toFixed(1))),
          label: 'Revenue (₹L)',
          backgroundColor: '#d4b347',
          hoverBackgroundColor: '#c9a642',
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          data: leadData,
          label: 'Leads',
          backgroundColor: '#22d3ee',
          hoverBackgroundColor: '#06b6d4',
          borderRadius: 6,
          yAxisID: 'y1'
        },
        {
          data: quoteData,
          label: 'Quotations',
          backgroundColor: '#818cf8',
          hoverBackgroundColor: '#6366f1',
          borderRadius: 6,
          yAxisID: 'y1'
        },
        {
          data: projectsWonData,
          label: 'Won Projects',
          backgroundColor: '#22c55e',
          hoverBackgroundColor: '#11998e',
          borderRadius: 6,
          yAxisID: 'y1'
        }
      ]
    };
  }

  private getTrendIntervals(projects: any[] = []): { label: string; index: number; year: number; day?: number }[] {
    const intervals = [];
    const now = new Date();

    if (this.analysisType === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        intervals.push({
          label: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
          index: date.getMonth(),
          year: date.getFullYear(),
          day: date.getDate()
        });
      }
      return intervals;
    }

    let count = 6;
    if (this.analysisType === 'total' && projects.length > 0) {
      const earliestProjectDate = projects.reduce((earliest, p) => {
        const date = new Date(p.createdAt || p.startDate);
        return date < earliest ? date : earliest;
      }, new Date());

      const diffMonths = (now.getFullYear() - earliestProjectDate.getFullYear()) * 12 + (now.getMonth() - earliestProjectDate.getMonth());
      count = Math.max(12, diffMonths + 1);
      if (count > 24) count = 24;
    } else if (this.analysisType === 'total') {
      count = 12;
    }

    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      intervals.push({
        label: date.toLocaleString('en-US', { month: 'short' }) +
          (count > 6 ? ` ${date.getFullYear().toString().slice(-2)}` : ''),
        index: date.getMonth(),
        year: date.getFullYear()
      });
    }
    return intervals;
  }

  formatCurrency(amount: number): string {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  // ==========================================
  // LIGHT MODE SUPPORT METHODS
  // ==========================================

  getChartTextColor(): string {
    const isLightMode = document.documentElement.classList.contains('light-theme') ||
      document.documentElement.getAttribute('data-theme') === 'light';
    return isLightMode ? '#1f2937' : 'rgba(255, 255, 255, 0.6)';
  }

  getChartGridColor(): string {
    const isLightMode = document.documentElement.classList.contains('light-theme') ||
      document.documentElement.getAttribute('data-theme') === 'light';
    return isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(212, 179, 71, 0.1)';
  }

  setupThemeListener(): void {
    const observer = new MutationObserver(() => {
      this.updateChartColors();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });
  }

  updateChartColors(): void {
    if (this.revenueChartOptions && this.revenueChartOptions.plugins && this.revenueChartOptions.scales) {
      // Update legend color
      if (this.revenueChartOptions.plugins.legend && this.revenueChartOptions.plugins.legend.labels) {
        this.revenueChartOptions.plugins.legend.labels.color = this.getChartTextColor();
      }

      // Update axis colors
      if (this.revenueChartOptions.scales['x']) {
        this.revenueChartOptions.scales['x'].grid = { color: this.getChartGridColor() };
        if (this.revenueChartOptions.scales['x'].ticks) {
          this.revenueChartOptions.scales['x'].ticks.color = this.getChartTextColor();
        }
      }

      if (this.revenueChartOptions.scales['y']) {
        this.revenueChartOptions.scales['y'].grid = { color: this.getChartGridColor() };
        if (this.revenueChartOptions.scales['y'].ticks) {
          this.revenueChartOptions.scales['y'].ticks.color = this.getChartTextColor();
        }
      }

      // Update chart
      if (this.revenueChart) {
        this.revenueChart.update();
      }
    }
  }
}