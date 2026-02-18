// src/app/features/reports/reports-dashboard/reports-dashboard.component.ts - REDESIGNED
import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import 'chart.js/auto';
import { ReportService } from '../../../services/report.service';
import { ProjectService, Project } from '../../../services/project.service';
import { LeadsService, Lead } from '../../../lead.service';
import { QuotationService, Quotation } from '../../../services/quotation.service';
import { EmployeeService, Employee } from '../../../../employee/employee.service';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

// Chart.js components are registered globally via provideCharts in app.config.ts

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
  private _revenueChart?: BaseChartDirective;
  @ViewChild(BaseChartDirective) set revenueChartDirective(content: BaseChartDirective) {
    if (content) {
      this._revenueChart = content;
      console.log('📈 Admin Chart Directive Captured');
      // Trigger a final update when the directive is first available
      setTimeout(() => this._revenueChart?.update(), 100);
    }
  }

  get revenueChart(): BaseChartDirective | undefined {
    return this._revenueChart;
  }

  chartReady: boolean = false;

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
          font: { size: 12, family: "'Inter', sans-serif", weight: 'bold' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#d4b347',
        bodyColor: '#fff',
        borderColor: '#d4b347',
        borderWidth: 1,
        padding: 12,
        displayColors: true
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: this.getChartTextColor(), font: { size: 11 } }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: this.getChartGridColor(), drawTicks: false },
        ticks: { color: this.getChartTextColor(), padding: 10 },
        beginAtZero: true,
        title: { display: true, text: 'Revenue (₹L)', color: '#d4b347' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false }, // Only show grid lines for the main Y axis
        ticks: { color: this.getChartTextColor(), padding: 10 },
        beginAtZero: true,
        title: { display: true, text: 'Counts', color: '#818cf8' }
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
    private router: Router,
    private cdr: ChangeDetectorRef
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
    const now = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (this.analysisType === 'daily') {
      startDate = now.toISOString().split('T')[0];
      // ✅ FIX: Include the whole day by setting end date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      endDate = tomorrow.toISOString().split('T')[0];
    } else if (this.analysisType === 'monthly') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      startDate = thirtyDaysAgo.toISOString().split('T')[0];
    }

    const filters: any = { startDate, endDate };
    if (this.selectedEmployeeId !== 'all') {
      filters.employeeId = this.selectedEmployeeId;
    }

    // Fetch aggregated data from backend AND raw data for the employee list/trend
    const summary$ = this.reportService.getAdminReports(filters).toPromise();
    const leads$ = this.leadsService.getAllLeads().toPromise();
    const projects$ = this.projectService.getAllProjects().toPromise();
    const quotations$ = this.quotationService.getAllQuotations().toPromise();

    // ✅ FIX: Use allSettled so the dashboard doesn't fail completely if one service is down
    Promise.allSettled([summary$, leads$, projects$, quotations$]).then((results) => {
      const summaryResponse = results[0].status === 'fulfilled' ? results[0].value : null;
      const leads = results[1].status === 'fulfilled' ? results[1].value : [];
      const projects = results[2].status === 'fulfilled' ? results[2].value : [];
      const quotesResponse = results[3].status === 'fulfilled' ? results[3].value : null;

      const summary = (summaryResponse as any);
      const quotes = (quotesResponse as any)?.data || [];
      const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

      this.loading = false;
      this.cdr.detectChanges();

      // ✅ Process data after loading is false and DOM is updated
      setTimeout(() => {
        const safeLeads = leads || [];
        const safeProjects = projects || [];
        const safeQuotes = quotesArray || [];

        const filteredLeads = this.selectedEmployeeId === 'all' ? safeLeads : safeLeads.filter(l => this.compareIds(l.assignedTo, this.selectedEmployeeId) || this.compareIds(l.createdBy, this.selectedEmployeeId));
        const filteredQuotes = this.selectedEmployeeId === 'all' ? safeQuotes : safeQuotes.filter((q: any) => this.compareIds(q.createdBy, this.selectedEmployeeId));
        const filteredProjects = this.selectedEmployeeId === 'all' ? safeProjects : safeProjects.filter(p => this.compareIds(p.assignedTo, this.selectedEmployeeId) || this.compareIds(p.createdBy, this.selectedEmployeeId));

        this.processAggregatedData(summary, safeLeads, safeProjects, safeQuotes);
        this.updateTrendChart(filteredProjects.filter(p => p.projectStatus?.toLowerCase() === 'completed'), filteredLeads, filteredQuotes);
        this.cdr.detectChanges();

        // Final force update
        setTimeout(() => {
          if (this.revenueChart) {
            console.log('📈 Final update for Admin Revenue Chart');
            this.revenueChart.update();
          }
        }, 300);
      }, 100);
    }).catch(error => {
      console.error('❌ Error loading dashboard data:', error);
      this.loading = false;
      // Initialize with empty cards on error to avoid blank screen
      this.statCards = this.getDefaultStatCards();
    });
  }

  private getDefaultStatCards(): StatCard[] {
    return [
      { label: 'Leads', value: 0, subtitle: 'No data', icon: 'fa-users', color: '#22d3ee' },
      { label: 'Proposals', value: 0, subtitle: 'No data', icon: 'fa-file-invoice', color: '#818cf8' },
      { label: 'Win Rate', value: '0%', subtitle: 'No deals', icon: 'fa-project-diagram', color: '#a855f7' },
      { label: 'Revenue', value: '₹0', subtitle: 'No revenue', icon: 'fa-rupee-sign', color: '#d4b347' }
    ];
  }

  private processAggregatedData(summary: any, leads: Lead[], projects: Project[], quotations: Quotation[]): void {
    // 1. Update Stat Cards from Backend Summary
    // The service now returns the unwrapped data object
    const stats = summary || {};
    // Calculate fallback counts from raw data
    // Choose the best value for leads
    // ✅ Use backend leadsCount if available, otherwise fallback
    let leadsValue = stats.leadsCount ?? stats.totalLeads ?? stats.count ?? 0;

    // Process "Today" leads with robust local date comparison
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    const todayLeadsCount = leads.filter(l => {
      if (!l.createdAt) return false;
      const leadDate = new Date(l.createdAt).toLocaleDateString('en-CA');
      return leadDate === todayStr;
    }).length;

    if (this.analysisType === 'daily' && leadsValue === 0) {
      leadsValue = todayLeadsCount;
    }

    this.statCards = [
      {
        label: this.analysisType === 'daily' ? 'Leads Today' : 'Lead Flow',
        value: leadsValue,
        subtitle: this.analysisType === 'daily' ? 'New leads today' : (this.analysisType === 'monthly' ? 'Last 30 days' : 'Lifetime'),
        icon: 'fa-users',
        color: '#22d3ee'
      },
      {
        label: this.analysisType === 'daily' ? 'Quotes Today' : 'Proposals',
        value: stats.totalQuotations ?? stats.quotationsSent ?? stats.quotationsAccepted ?? 0,
        subtitle: `${stats.quotationsAccepted ?? 0} accepted`,
        icon: 'fa-file-invoice',
        color: '#818cf8'
      },
      {
        label: 'Project Win Rate',
        value: `${stats.conversionRate ?? 0}%`,
        subtitle: `${stats.projectsWon ?? stats.dealsWon ?? 0} deals won`,
        icon: 'fa-project-diagram',
        color: '#a855f7'
      },
      {
        label: this.analysisType === 'daily' ? 'Daily Revenue' : 'Realized Revenue',
        value: this.formatCurrency(stats.totalRevenue ?? 0),
        subtitle: 'From completed deals',
        icon: 'fa-rupee-sign',
        color: '#d4b347'
      }
    ];

    // Force chart update after data processing
    setTimeout(() => {
      this.updateChartColors(); // This also calls this.revenueChart?.update()
    }, 300);

    // Force chart update after state changes
    setTimeout(() => {
      this.updateChartColors();
    }, 200);


    // 2. Filter raw projects by employee for Trend Chart
    let trendProjects = projects;
    if (this.selectedEmployeeId !== 'all') {
      trendProjects = projects.filter(p => p.assignedTo === this.selectedEmployeeId || p.createdBy === this.selectedEmployeeId);
    }
    const trendCompletedProjects = trendProjects.filter(p => p.projectStatus?.toLowerCase() === 'completed');
    this.updateTrendChart(trendCompletedProjects);

    // 3. Calculate Employee Daily Performance if "Daily" is selected
    if (this.analysisType === 'daily') {
      this.calculateEmployeeDailyStats(leads, quotations, projects);
    } else {
      this.employeeDailyStats = [];
    }
  }

  private calculateEmployeeDailyStats(leads: Lead[], quotations: Quotation[], projects: Project[]): void {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA'); // Local YYYY-MM-DD

    const todayLeads = leads.filter(l => {
      if (!l.createdAt) return false;
      return new Date(l.createdAt).toLocaleDateString('en-CA') === todayStr;
    });
    const todayQuotes = quotations.filter(q => {
      if (!q.createdAt) return false;
      return new Date(q.createdAt).toLocaleDateString('en-CA') === todayStr;
    });
    const todayProjects = projects.filter(p => {
      if (!p.createdAt) return false;
      return new Date(p.createdAt).toLocaleDateString('en-CA') === todayStr && p.projectStatus === 'completed';
    });

    this.employeeDailyStats = this.employees.map(emp => {
      // ✅ Use robust comparison for IDs that might be objects or strings
      const empLeads = todayLeads.filter(l => this.compareIds(l.assignedTo, emp._id) || this.compareIds(l.createdBy, emp._id)).length;
      const empQuotes = todayQuotes.filter(q => this.compareIds(q.createdBy, emp._id) || this.compareIds((q as any).userId, emp._id)).length;
      const empRevenue = todayProjects
        .filter(p => this.compareIds(p.assignedTo, emp._id) || this.compareIds(p.createdBy, emp._id))
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

  private updateTrendChart(completedProjects: Project[], allLeads: Lead[] = [], allQuotes: Quotation[] = []): void {
    const intervals = this.getTrendIntervals(completedProjects);

    // Calculate Data for each interval
    const revenueData = intervals.map(interval => {
      const intervalProjects = completedProjects.filter(p => {
        const date = new Date(p.createdAt || p.updatedAt! || p.startDate);
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
        const date = new Date(p.createdAt || p.updatedAt! || p.startDate);
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
          hoverBackgroundColor: '#16a34a',
          borderRadius: 6,
          yAxisID: 'y1'
        }
      ]
    };

    setTimeout(() => {
      if (this.revenueChart) {
        console.log('📈 Updating Admin Revenue Chart');
        this.revenueChart.update();
      } else {
        console.warn('⚠️ Admin Revenue Chart directive not found for update');
      }
    }, 500);
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
          (count > 6 ? ` ${date.getFullYear().toString().slice(-2)} ` : ''),
        index: date.getMonth(),
        year: date.getFullYear()
      });
    }
    return intervals;
  }

  formatCurrency(amount: number): string {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
    return `₹${amount.toLocaleString('en-IN')} `;
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

  private compareIds(id1: any, id2: any): boolean {
    if (!id1 || !id2) return false;
    const cid1 = typeof id1 === 'object' ? id1._id : id1;
    const cid2 = typeof id2 === 'object' ? id2._id : id2;
    if (!cid1 || !cid2) return false;
    return String(cid1).toLowerCase().trim() === String(cid2).toLowerCase().trim();
  }
}