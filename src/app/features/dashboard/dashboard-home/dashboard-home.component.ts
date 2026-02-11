// src/app/features/dashboard/dashboard-home/dashboard-home.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ReportService } from '../../../services/report.service';
import { ProjectService } from '../../../services/project.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css']
})
export class DashboardHomeComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  userName: string = 'User';
  currentDate: Date = new Date();
  isLoading: boolean = true;
  isAdmin: boolean = false;

  // ✅ 4 Report Cards from Reports Dashboard
  statCards: StatCard[] = [];

  // ✅ TWO-LINE CHART (Revenue + Deals Closed)
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Revenue (₹L)',
        fill: true,
        tension: 0.4,
        borderColor: '#d4b347',
        backgroundColor: 'rgba(212, 179, 71, 0.1)',
        pointBackgroundColor: '#d4b347',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#d4b347',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        data: [],
        label: 'Deals Closed',
        fill: true,
        tension: 0.4,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#22c55e',
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: this.getChartTextColor(),
          font: { size: 12, family: "'Inter', sans-serif" },
          padding: 15,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#d4b347',
        bodyColor: '#fff',
        borderColor: '#d4b347',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      }
    },
    scales: {
      x: {
        grid: { color: this.getChartGridColor() },
        border: { display: false },
        ticks: { color: this.getChartTextColor(), font: { size: 11 } }
      },
      y: {
        grid: { color: this.getChartGridColor() },
        border: { display: false },
        ticks: { color: this.getChartTextColor(), font: { size: 11 } },
        beginAtZero: true
      }
    }
  };

  public lineChartType: ChartType = 'line';

  constructor(
    private router: Router,
    private authService: AuthService,
    private reportService: ReportService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Dashboard Component Initialized');
    this.loadUserInfo();
    this.loadReportData();
    this.setupThemeListener();
  }

  loadUserInfo(): void {
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.userName = user.name || user.fullName || user.username || 'User';
        this.isAdmin = user.role === 'admin';
        
        console.log('✅ User Info Loaded:', this.userName);
        console.log('✅ Is Admin:', this.isAdmin);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }

  loadReportData(): void {
    this.isLoading = true;
    
    Promise.all([
      this.reportService.getAdminReports().toPromise(),
      this.projectService.getAllProjects().toPromise()
    ]).then(([reportData, projects]) => {
      this.processReportData(reportData);
      this.processRevenueAndDealsData(projects || []);
      this.isLoading = false;
    }).catch((error: any) => {
      console.error('❌ Error loading report data:', error);
      this.loadFallbackData();
      this.isLoading = false;
    });
  }

  private processReportData(data: any): void {
    // Process Stats Cards - Same as Reports Dashboard
    this.statCards = [
      {
        label: 'Total Revenue',
        value: this.formatCurrency(data.totalRevenue || 0),
        subtitle: `${data.projectsWon || 0} projects completed`,
        icon: 'fa-rupee-sign',
        color: '#22c55e'
      },
      {
        label: 'Total Projects',
        value: data.totalProjects || 0,
        subtitle: `${data.projectsWon || 0} won`,
        icon: 'fa-project-diagram',
        color: '#3b82f6'
      },
      {
        label: 'Conversion Rate',
        value: `${data.conversionRate || 0}%`,
        subtitle: 'Overall performance',
        icon: 'fa-chart-line',
        color: '#f59e0b'
      },
      {
        label: 'Avg Deal Size',
        value: this.formatCurrency(data.avgDealSize || 0),
        subtitle: 'Per completed project',
        icon: 'fa-money-bill-wave',
        color: '#8b5cf6'
      }
    ];
  }

  private processRevenueAndDealsData(projects: any[]): void {
    const completedProjects = projects.filter((p: any) => p.projectStatus === 'completed');
    
    // Get last 6 months
    const months = this.getLast6Months();
    
    // Calculate revenue by month
    const revenueByMonth = months.map(month => {
      const monthProjects = completedProjects.filter((p: any) => {
        const completeDate = new Date(p.actualCompletionDate || p.updatedAt);
        return completeDate.getMonth() === month.index && 
               completeDate.getFullYear() === month.year;
      });
      return monthProjects.reduce((sum: number, p: any) => sum + p.projectValue, 0);
    });

    // Calculate deals closed by month
    const dealsByMonth = months.map(month => {
      const monthProjects = completedProjects.filter((p: any) => {
        const completeDate = new Date(p.actualCompletionDate || p.updatedAt);
        return completeDate.getMonth() === month.index && 
               completeDate.getFullYear() === month.year;
      });
      return monthProjects.length;
    });

    // Build chart with both datasets
    this.lineChartData = {
      labels: months.map(m => m.label),
      datasets: [
        {
          data: revenueByMonth.map(r => parseFloat((r / 100000).toFixed(1))),
          label: 'Revenue (₹L)',
          fill: true,
          tension: 0.4,
          borderColor: '#d4b347',
          backgroundColor: 'rgba(212, 179, 71, 0.1)',
          pointBackgroundColor: '#d4b347',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#d4b347',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          data: dealsByMonth,
          label: 'Deals Closed',
          fill: true,
          tension: 0.4,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          pointBackgroundColor: '#22c55e',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#22c55e',
          pointRadius: 5,
          pointHoverRadius: 7,
        }
      ]
    };

    setTimeout(() => {
      if (this.chart) {
        this.chart.update();
      }
    }, 100);
  }

  getLast6Months(): { label: string; index: number; year: number }[] {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: date.toLocaleString('en-US', { month: 'short' }),
        index: date.getMonth(),
        year: date.getFullYear()
      });
    }
    
    return months;
  }

  loadFallbackData(): void {
    console.log('⚠️ Loading fallback data');
    
    this.statCards = [
      {
        label: 'Total Revenue',
        value: '₹0',
        subtitle: 'Unable to load',
        icon: 'fa-rupee-sign',
        color: '#22c55e'
      },
      {
        label: 'Total Projects',
        value: 0,
        subtitle: 'Unable to load',
        icon: 'fa-project-diagram',
        color: '#3b82f6'
      },
      {
        label: 'Conversion Rate',
        value: '0%',
        subtitle: 'Unable to load',
        icon: 'fa-chart-line',
        color: '#f59e0b'
      },
      {
        label: 'Avg Deal Size',
        value: '₹0',
        subtitle: 'Unable to load',
        icon: 'fa-money-bill-wave',
        color: '#8b5cf6'
      }
    ];

    const months = this.getLast6Months();
    this.lineChartData = {
      labels: months.map(m => m.label),
      datasets: [
        {
          data: [0, 0, 0, 0, 0, 0],
          label: 'Revenue (₹L)',
          fill: true,
          tension: 0.4,
          borderColor: '#d4b347',
          backgroundColor: 'rgba(212, 179, 71, 0.1)',
          pointBackgroundColor: '#d4b347',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#d4b347',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          data: [0, 0, 0, 0, 0, 0],
          label: 'Deals Closed',
          fill: true,
          tension: 0.4,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          pointBackgroundColor: '#22c55e',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#22c55e',
          pointRadius: 5,
          pointHoverRadius: 7,
        }
      ]
    };
  }

  formatCurrency(amount: number): string {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  navigateTo(route: string): void {
    if (route) {
      this.router.navigate([route]);
    }
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
    if (this.lineChartOptions && this.lineChartOptions.plugins && this.lineChartOptions.scales) {
      // Update legend color
      if (this.lineChartOptions.plugins.legend && this.lineChartOptions.plugins.legend.labels) {
        this.lineChartOptions.plugins.legend.labels.color = this.getChartTextColor();
      }
      
      // Update axis colors
      if (this.lineChartOptions.scales['x']) {
        this.lineChartOptions.scales['x'].grid = { color: this.getChartGridColor() };
        if (this.lineChartOptions.scales['x'].ticks) {
          this.lineChartOptions.scales['x'].ticks.color = this.getChartTextColor();
        }
      }
      
      if (this.lineChartOptions.scales['y']) {
        this.lineChartOptions.scales['y'].grid = { color: this.getChartGridColor() };
        if (this.lineChartOptions.scales['y'].ticks) {
          this.lineChartOptions.scales['y'].ticks.color = this.getChartTextColor();
        }
      }
      
      // Update chart
      if (this.chart) {
        this.chart.update();
      }
    }
  }
}