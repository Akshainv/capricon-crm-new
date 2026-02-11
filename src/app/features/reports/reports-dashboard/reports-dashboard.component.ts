// src/app/features/reports/reports-dashboard/reports-dashboard.component.ts - REDESIGNED
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  ArcElement,
  PieController,
  LineElement,
  PointElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { ReportService } from '../../../services/report.service';
import { ProjectService, Project } from '../../../services/project.service';
import { LeadsService, Lead } from '../../../lead.service';
import { QuotationService, Quotation } from '../../../services/quotation.service';
import { EmployeeService, Employee } from '../../../../employee/employee.service';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  ArcElement,
  PieController,
  LineElement,
  PointElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatCard {
  label: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
}

interface EmployeeDailyStats {
  employeeName: string;
  employeeEmail: string;
  leads: number;
  quotations: number;
  revenue: number;
}

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './reports-dashboard.component.html',
  styleUrls: ['./reports-dashboard.component.css']
})
export class ReportsDashboardComponent implements OnInit {
  @ViewChild('revenueChart') revenueChart?: BaseChartDirective;

  loading: boolean = false;

  // Selection Controls
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  selectedEmployeeId: string = 'all';
  analysisType: 'daily' | 'monthly' | 'total' = 'monthly';
  employeeSearchQuery: string = '';
  showEmployeeDropdown: boolean = false;

  // Stats Cards
  statCards: StatCard[] = [];
  employeeDailyStats: EmployeeDailyStats[] = [];

  // Performance Trend Chart Data
  public revenueChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Monthly Revenue (₹L)',
      backgroundColor: '#d4b347',
      hoverBackgroundColor: '#c9a642',
      borderRadius: 6,
      borderWidth: 0,
    }]
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
          font: { size: 12, family: "'Inter', sans-serif", weight: 'bold' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#d4b347',
        bodyColor: '#fff',
        borderColor: '#d4b347',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => ` Revenue: ₹${context.parsed.y} L`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: this.getChartTextColor(), font: { size: 11 } }
      },
      y: {
        grid: { color: this.getChartGridColor(), drawTicks: false },
        ticks: { color: this.getChartTextColor(), padding: 10 },
        beginAtZero: true
      }
    }
  };

  public revenueChartType: ChartType = 'bar';

  constructor(
    private reportService: ReportService,
    private projectService: ProjectService,
    private leadsService: LeadsService,
    private quotationService: QuotationService,
    private employeeService: EmployeeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadReportData();
    this.setupThemeListener();
  }

  loadEmployees(): void {
    this.employeeService.getEmployeesByStatus('accept').subscribe({
      next: (data) => {
        this.employees = data;
        this.filteredEmployees = data;
      },
      error: (err) => console.error('Error loading employees:', err)
    });
  }

  filterEmployees(): void {
    const query = this.employeeSearchQuery.toLowerCase();
    this.filteredEmployees = this.employees.filter(emp =>
      emp.fullName.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query)
    );
  }

  selectEmployee(emp: Employee | 'all'): void {
    if (emp === 'all') {
      this.selectedEmployeeId = 'all';
      this.employeeSearchQuery = 'All Sales Executives';
    } else {
      this.selectedEmployeeId = emp._id;
      this.employeeSearchQuery = emp.fullName;
    }
    this.showEmployeeDropdown = false;
    this.loadReportData();
  }

  toggleAnalysisType(type: 'daily' | 'monthly' | 'total'): void {
    this.analysisType = type;
    this.loadReportData();
  }

  loadReportData(): void {
    this.loading = true;

    // Concurrently fetch data from all relevant services with type safety
    const leads$ = this.leadsService.getAllLeads().toPromise();
    const quotes$ = this.quotationService.getAllQuotations().toPromise();
    const projects$ = this.projectService.getAllProjects().toPromise();

    Promise.all([leads$, quotes$, projects$]).then(([leads, quotationResponse, projects]) => {
      // Extract quotations array from response object
      const quotations = (quotationResponse as any)?.data;
      const quotationArray = Array.isArray(quotations) ? quotations : (quotations ? [quotations] : []);

      this.processAggregatedData(leads || [], quotationArray, projects || []);
      this.loading = false;
    }).catch(error => {
      console.error('❌ Error loading dashboard data:', error);
      this.loading = false;
    });
  }

  private processAggregatedData(leads: Lead[], quotations: Quotation[], projects: Project[]): void {
    // 1. Filter by Employee if selected
    let filteredLeads = leads;
    let filteredQuotes = quotations;
    let filteredProjects = projects;

    if (this.selectedEmployeeId !== 'all') {
      filteredLeads = leads.filter(l => l.assignedTo === this.selectedEmployeeId);
      filteredQuotes = quotations.filter(q => q.createdBy === this.selectedEmployeeId);
      filteredProjects = projects.filter(p => p.assignedTo === this.selectedEmployeeId || p.createdBy === this.selectedEmployeeId);
    }

    // 2. Separate data for Stat Cards (potentially period-filtered) and Trend Chart (always 6-month trend)
    const trendProjects = filteredProjects; // Trend chart data should only be filtered by employee

    // Apply period filtering only for Stat Cards if "Daily" or "Monthly" selected
    const now = new Date();
    const todayISO = now.toISOString().split('T')[0];

    if (this.analysisType === 'daily') {
      filteredLeads = filteredLeads.filter(l => {
        const date = l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : null;
        return date === todayISO;
      });
      filteredQuotes = filteredQuotes.filter(q => {
        const dateObj = q.createdAt ? new Date(q.createdAt) : ((q as any).quoteDate ? new Date((q as any).quoteDate) : null);
        const date = dateObj ? dateObj.toISOString().split('T')[0] : null;
        return date === todayISO;
      });
      filteredProjects = filteredProjects.filter(p => {
        const dateObj = p.createdAt ? new Date(p.createdAt) : (p.startDate ? new Date(p.startDate) : null);
        const date = dateObj ? dateObj.toISOString().split('T')[0] : null;
        return date === todayISO;
      });
    } else if (this.analysisType === 'monthly') {
      // ✅ 30-DAY ROLLING WINDOW: Show records from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      filteredLeads = filteredLeads.filter(l => {
        const date = l.createdAt ? new Date(l.createdAt) : null;
        return date && date >= thirtyDaysAgo;
      });
      filteredQuotes = filteredQuotes.filter(q => {
        const date = q.createdAt ? new Date(q.createdAt) : ((q as any).quoteDate ? new Date((q as any).quoteDate) : null);
        return date && date >= thirtyDaysAgo;
      });
      filteredProjects = filteredProjects.filter(p => {
        const date = p.createdAt ? new Date(p.createdAt) : (p.startDate ? new Date(p.startDate) : null);
        return date && date >= thirtyDaysAgo;
      });
    }

    // 3. Calculate Metrics for Stat Cards
    const totalLeads = filteredLeads.length;
    const totalQuotes = filteredQuotes.length;
    const totalProjects = filteredProjects.length;

    // ✅ FIX: Use lowercase 'approved' to match schema
    const approvedQuotes = filteredQuotes.filter(q => q.status === 'approved' || q.status === 'Approved');
    const currentCompletedProjects = filteredProjects.filter(p => p.projectStatus === 'completed');
    const totalRevenue = currentCompletedProjects.reduce((sum, p) => sum + (p.projectValue || 0), 0);

    const winRate = totalProjects > 0 ? Math.round((currentCompletedProjects.length / totalProjects) * 100) : 0;

    // 4. Update Stat Cards
    this.statCards = [
      {
        label: this.analysisType === 'daily' ? 'Leads Today' : 'Lead Flow',
        value: totalLeads,
        subtitle: this.analysisType === 'daily' ? 'New leads today' : (this.analysisType === 'monthly' ? 'New leads this month' : 'Lifetime leads'),
        icon: 'fa-users',
        color: '#22d3ee'
      },
      {
        label: this.analysisType === 'daily' ? 'Quotes Today' : 'Proposals',
        value: totalQuotes,
        subtitle: `${approvedQuotes.length} approved`,
        icon: 'fa-file-invoice',
        color: '#818cf8'
      },
      {
        label: 'Project Win Rate',
        value: `${winRate}%`,
        subtitle: `${currentCompletedProjects.length} projects won`,
        icon: 'fa-project-diagram',
        color: '#a855f7'
      },
      {
        label: this.analysisType === 'daily' ? 'Daily Revenue' : 'Realized Revenue',
        value: this.formatCurrency(totalRevenue),
        subtitle: 'From completed deals',
        icon: 'fa-rupee-sign',
        color: '#d4b347'
      }
    ];

    // 5. Update Trend Chart using all employee projects (for 6-month history)
    const trendCompletedProjects = trendProjects.filter(p => p.projectStatus === 'completed');
    this.updateTrendChart(trendCompletedProjects);

    // 6. Calculate Employee Daily Performance if "Daily" is selected
    if (this.analysisType === 'daily') {
      this.calculateEmployeeDailyStats(leads, quotations, projects);
    } else {
      this.employeeDailyStats = [];
    }
  }

  private calculateEmployeeDailyStats(leads: Lead[], quotations: Quotation[], projects: Project[]): void {
    const now = new Date();
    const todayISO = now.toISOString().split('T')[0];

    const todayLeads = leads.filter(l => l.createdAt && new Date(l.createdAt).toISOString().split('T')[0] === todayISO);
    const todayQuotes = quotations.filter(q => q.createdAt && new Date(q.createdAt).toISOString().split('T')[0] === todayISO);
    const todayProjects = projects.filter(p => p.createdAt && new Date(p.createdAt).toISOString().split('T')[0] === todayISO && p.projectStatus === 'completed');

    this.employeeDailyStats = this.employees.map(emp => {
      // ✅ FIX: Credit to either assignedTo OR createdBy if they are the same person (sales)
      const empLeads = todayLeads.filter(l => l.assignedTo === emp._id || l.createdBy === emp._id).length;
      const empQuotes = todayQuotes.filter(q => q.createdBy === emp._id || (q as any).userId === emp._id).length;
      const empRevenue = todayProjects
        .filter(p => p.assignedTo === emp._id || p.createdBy === emp._id)
        .reduce((sum, p) => sum + (p.projectValue || 0), 0);

      return {
        employeeName: emp.fullName,
        employeeEmail: emp.email,
        leads: empLeads,
        quotations: empQuotes,
        revenue: empRevenue
      };
    }).filter(stat => stat.leads > 0 || stat.quotations > 0 || stat.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue || b.leads - a.leads);
  }

  private updateTrendChart(completedProjects: Project[]): void {
    const intervals = this.getTrendIntervals(completedProjects);
    const revenueByInterval = intervals.map(interval => {
      const intervalProjects = completedProjects.filter(p => {
        const date = new Date(p.createdAt || p.updatedAt!);
        if (this.analysisType === 'daily') {
          return date.getDate() === interval.day &&
            date.getMonth() === interval.index &&
            date.getFullYear() === interval.year;
        } else {
          return date.getMonth() === interval.index &&
            date.getFullYear() === interval.year;
        }
      });
      return intervalProjects.reduce((sum, p) => sum + (p.projectValue || 0), 0);
    });

    this.revenueChartData = {
      labels: intervals.map(m => m.label),
      datasets: [{
        data: revenueByInterval.map(r => parseFloat((r / 100000).toFixed(1))),
        label: this.analysisType === 'total' ? 'Total Revenue Growth (₹L)' : (this.analysisType === 'daily' ? 'Daily Revenue (₹L)' : 'Monthly Revenue (₹L)'),
        backgroundColor: '#d4b347',
        hoverBackgroundColor: '#c9a642',
        borderRadius: 6,
        borderWidth: 0
      }]
    };

    setTimeout(() => {
      this.revenueChart?.update();
    }, 100);
  }

  private getTrendIntervals(projects: Project[] = []): { label: string; index: number; year: number; day?: number }[] {
    const intervals = [];
    const now = new Date();

    if (this.analysisType === 'daily') {
      // Last 7 days
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

    let count = 6; // Default for "Monthly Status"

    if (this.analysisType === 'total' && projects.length > 0) {
      // Find the earliest project date to determine how many months to show
      const earliestProjectDate = projects.reduce((earliest, p) => {
        const date = new Date(p.createdAt || p.updatedAt!);
        return date < earliest ? date : earliest;
      }, new Date());

      const diffMonths = (now.getFullYear() - earliestProjectDate.getFullYear()) * 12 + (now.getMonth() - earliestProjectDate.getMonth());
      count = Math.max(12, diffMonths + 1); // Show at least 12 months or all if more

      // Limit to 24 months to keep the graph readable
      if (count > 24) count = 24;
    } else if (this.analysisType === 'total') {
      count = 12; // Fallback
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
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  getChartTextColor(): string {
    const isLightMode = document.documentElement.classList.contains('light-theme');
    return isLightMode ? '#1f2937' : 'rgba(255, 255, 255, 0.6)';
  }

  getChartGridColor(): string {
    const isLightMode = document.documentElement.classList.contains('light-theme');
    return isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(212, 179, 71, 0.1)';
  }

  setupThemeListener(): void {
    const observer = new MutationObserver(() => this.updateChartColors());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  updateChartColors(): void {
    if (this.revenueChartOptions?.plugins?.legend?.labels) {
      this.revenueChartOptions.plugins.legend.labels.color = this.getChartTextColor();
    }
    if (this.revenueChartOptions?.scales) {
      const scales = this.revenueChartOptions.scales as any;
      if (scales.x) {
        scales.x.grid.color = this.getChartGridColor();
        scales.x.ticks.color = this.getChartTextColor();
      }
      if (scales.y) {
        scales.y.grid.color = this.getChartGridColor();
        scales.y.ticks.color = this.getChartTextColor();
      }
    }
    this.revenueChart?.update();
  }
}