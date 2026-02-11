// src/app/features/dashboard/sales-dashboard/sales-dashboard.component.ts - FULLY FIXED WITH LIGHT MODE
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';
import { AuthService } from '../services/auth.service';
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
  icon: string;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  route?: string;
}

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './sales-dashboard.component.html',
  styleUrls: ['./sales-dashboard.component.css']
})
export class SalesDashboardComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  userName: string = 'Sales Executive';
  userEmail: string = '';
  currentDate: Date = new Date();
  greetingMessage: string = '';
  isLoading: boolean = true;

  stats: StatCard[] = [];

  // Chart configuration
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Won Deals',
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
        label: 'Total Leads',
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
          color: this.getChartTextColor(), // Dynamic color
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
        grid: { color: this.getChartGridColor() }, // Dynamic color
        border: { display: false },
        ticks: { color: this.getChartTextColor(), font: { size: 11 } } // Dynamic color
      },
      y: {
        grid: { color: this.getChartGridColor() }, // Dynamic color
        border: { display: false },
        ticks: { color: this.getChartTextColor(), font: { size: 11 } }, // Dynamic color
        beginAtZero: true
      }
    }
  };

  public lineChartType: ChartType = 'line';

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Sales Dashboard Component Initialized');
    this.loadUserInfo();
    this.setGreeting();
    this.loadDashboardData();
    this.setupThemeListener();
  }

  loadUserInfo(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.userName = user.name || user.fullName || user.username || 'Sales Executive';
        this.userEmail = user.email || '';
        console.log('✅ Sales User:', this.userName, '|', this.userEmail);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }

  setGreeting(): void {
    const hour = this.currentDate.getHours();
    if (hour < 12) {
      this.greetingMessage = 'Good Morning';
    } else if (hour < 17) {
      this.greetingMessage = 'Good Afternoon';
    } else {
      this.greetingMessage = 'Good Evening';
    }
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    console.log('🔵 ========== LOADING SALES DASHBOARD ==========');
    console.log('🔵 Calling dashboardService.getSalesDashboard()');
    console.log('='.repeat(60));
    
    this.dashboardService.getSalesDashboard({ period: 'thisMonth' }).subscribe({
      next: (response) => {
        console.log('📦 Raw API Response:', response);
        
        if (!response.success || !response.data) {
          console.error('❌ Invalid response structure');
          this.loadFallbackData();
          this.isLoading = false;
          return;
        }

        const data = response.data;
        
        console.log('📊 SALES DASHBOARD DATA:');
        console.log('  - Stats:', data.stats);
        console.log('='.repeat(60));

        this.mapBackendDataToFrontend(data);
        
        this.isLoading = false;
        console.log('✅ SALES DASHBOARD LOADED SUCCESSFULLY');
      },
      error: (error) => {
        console.error('❌ Error loading sales dashboard:', error);
        this.loadFallbackData();
        this.isLoading = false;
      }
    });
  }

  mapBackendDataToFrontend(data: any): void {
    console.log('🔄 Mapping backend data to frontend...');
    console.log('📊 Raw stats from backend:', data.stats);

    // ✅ FIXED: Correctly extract the numeric value from totalQuotations
    const quotationsValue = data.stats.totalQuotations?.value;
    const quotationsCount = typeof quotationsValue === 'number' 
      ? quotationsValue.toString() 
      : (quotationsValue || '0').toString();

    const leadsValue = data.stats.myLeads?.value;
    const leadsCount = typeof leadsValue === 'number' 
      ? leadsValue.toString() 
      : (leadsValue || '0').toString();

    const projectsValue = data.stats.myProjects?.value;
    const projectsCount = typeof projectsValue === 'number' 
      ? projectsValue.toString() 
      : (projectsValue || '0').toString();

    console.log('🔍 Extracted values:');
    console.log('  - Quotations:', quotationsCount);
    console.log('  - Leads:', leadsCount);
    console.log('  - Projects:', projectsCount);

    // ✅ Map 3 key stats for sales executive
    this.stats = [
      { 
        icon: 'fa-file-invoice', 
        label: 'Total Quotations', 
        value: quotationsCount,
        change: data.stats.totalQuotations?.change || 'No data', 
        trend: data.stats.totalQuotations?.trend || 'neutral',
        route: '/sales-my-quotations'
      },
      { 
        icon: 'fa-users', 
        label: 'My Leads', 
        value: leadsCount,
        change: data.stats.myLeads?.change || 'No data', 
        trend: data.stats.myLeads?.trend || 'neutral',
        route: '/sales-leads'
      },
      { 
        icon: 'fa-project-diagram', 
        label: 'My Projects', 
        value: projectsCount,
        change: data.stats.myProjects?.change || 'No data', 
        trend: data.stats.myProjects?.trend || 'neutral',
        route: '/sales-my-projects'
      }
    ];

    console.log('✅ Stats mapped:', this.stats.length, 'cards');
    console.log('📊 Card values:');
    this.stats.forEach((stat, i) => {
      console.log(`  Card ${i+1}: ${stat.label} = ${stat.value} (${stat.change})`);
    });

    // ✅ Build chart from backend data
    if (data.chartData && data.chartData.labels && data.chartData.labels.length > 0) {
      console.log('📈 Building chart from backend data');
      console.log('  - Labels:', data.chartData.labels);
      console.log('  - Revenue (Won Deals):', data.chartData.revenue);
      console.log('  - Deals (Total Leads):', data.chartData.deals);

      this.lineChartData = {
        labels: data.chartData.labels,
        datasets: [
          {
            data: data.chartData.revenue || [], // Won deals
            label: 'Won Deals',
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
            data: data.chartData.deals || [], // Total leads
            label: 'Total Leads',
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

      // Trigger chart update
      setTimeout(() => {
        if (this.chart) {
          this.chart.update();
        }
      }, 100);

      console.log('✅ Chart built successfully');
    } else {
      console.warn('⚠️ No chart data in response or empty labels');
      this.buildEmptyChart();
    }
  }

  loadFallbackData(): void {
    console.log('⚠️ Loading fallback data');
    
    this.stats = [
      { 
        icon: 'fa-file-invoice', 
        label: 'Total Quotations', 
        value: '0', 
        change: 'Unable to load', 
        trend: 'neutral',
        route: '/sales-my-quotations'
      },
      { 
        icon: 'fa-users', 
        label: 'My Leads', 
        value: '0', 
        change: 'Unable to load', 
        trend: 'neutral',
        route: '/sales-leads'
      },
      { 
        icon: 'fa-project-diagram', 
        label: 'My Projects', 
        value: '0', 
        change: 'Unable to load', 
        trend: 'neutral',
        route: '/sales-my-projects'
      }
    ];

    this.buildEmptyChart();
  }

  buildEmptyChart(): void {
    const months = this.getLast6Months();
    this.lineChartData = {
      labels: months.map(m => m.label),
      datasets: [
        {
          data: [0, 0, 0, 0, 0, 0],
          label: 'Won Deals',
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
          label: 'Total Leads',
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

  navigateTo(route: string): void {
    if (route) {
      this.router.navigate([route]);
    }
  }

  getTrendIcon(trend: string): string {
    if (trend === 'up') return 'fa-arrow-up';
    if (trend === 'down') return 'fa-arrow-down';
    return 'fa-minus';
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
    // Listen for theme changes
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
      
      // WITH THIS:
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