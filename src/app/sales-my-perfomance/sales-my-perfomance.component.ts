import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TargetData {
  metric: string;
  target: number;
  actual: number;
  unit: string;
  icon: string;
  color: string;
}

interface TopClient {
  name: string;
  revenue: number;
  deals: number;
  avatar: string;
}

interface RevenueBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-sales-my-performance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-my-perfomance.component.html',  // Fixed to match folder name
  styleUrls: ['./sales-my-perfomance.component.css']    // Fixed to match folder name
})
export class SalesMyPerformanceComponent implements OnInit {
  selectedMonth: string = 'December 2024';
  currentUser: string = 'John Doe';

  targetsData: TargetData[] = [
    { metric: 'Revenue Target', target: 5000000, actual: 4500000, unit: '₹', icon: 'fa-rupee-sign', color: '#22c55e' },
    { metric: 'Deals Target', target: 20, actual: 18, unit: '', icon: 'fa-handshake', color: '#3b82f6' },
    { metric: 'New Leads Target', target: 50, actual: 62, unit: '', icon: 'fa-users', color: '#f59e0b' },
    { metric: 'Follow-ups Target', target: 100, actual: 125, unit: '', icon: 'fa-phone', color: '#a855f7' }
  ];

  activitySummary = {
    calls: { count: 245, icon: 'fa-phone', color: '#3b82f6' },
    emails: { count: 178, icon: 'fa-envelope', color: '#22c55e' },
    meetings: { count: 42, icon: 'fa-handshake', color: '#f59e0b' },
    quotes: { count: 30, icon: 'fa-file-invoice', color: '#a855f7' }
  };

  topClients: TopClient[] = [
    { name: 'Sunrise Mall Pvt Ltd', revenue: 4500000, deals: 1, avatar: 'Building' },
    { name: 'Metro Hospital', revenue: 3500000, deals: 1, avatar: 'Hospital' },
    { name: 'Green Apartments', revenue: 1200000, deals: 2, avatar: 'Apartments' },
    { name: 'Tech Solutions Ltd', revenue: 850000, deals: 1, avatar: 'Briefcase' },
    { name: 'Royal Plaza', revenue: 750000, deals: 1, avatar: 'Mall' }
  ];

  revenueBreakdown: RevenueBreakdown[] = [
    { category: 'Passenger Elevators', amount: 6500000, percentage: 58, color: '#3b82f6' },
    { category: 'Goods Elevators', amount: 2800000, percentage: 25, color: '#22c55e' },
    { category: 'Home Lifts', amount: 1200000, percentage: 11, color: '#f59e0b' },
    { category: 'Hospital Lifts', amount: 700000, percentage: 6, color: '#a855f7' }
  ];

  monthlyTrend = [
    { month: 'Jul', revenue: 3200000, deals: 12 },
    { month: 'Aug', revenue: 3800000, deals: 15 },
    { month: 'Sep', revenue: 4200000, deals: 16 },
    { month: 'Oct', revenue: 3900000, deals: 14 },
    { month: 'Nov', revenue: 4500000, deals: 18 },
    { month: 'Dec', revenue: 4500000, deals: 18 }
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadPerformanceData();
  }

  loadPerformanceData(): void {
    console.log('Loading performance data for:', this.currentUser);
  }

  getAchievementPercentage(target: number, actual: number): number {
    if (target === 0) return 0;
    return Math.round((actual / target) * 100);
  }

  getAchievementColor(percentage: number): string {
    if (percentage >= 100) return '#22c55e';
    if (percentage >= 80) return '#f59e0b';
    return '#ef4444';
  }

  formatCurrency(amount: number): string {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  getTotalRevenue(): number {
    return this.revenueBreakdown.reduce((sum, item) => sum + item.amount, 0);
  }

  getMaxRevenue(): number {
    const revenues = this.monthlyTrend.map(m => m.revenue);
    return revenues.length > 0 ? Math.max(...revenues) : 1;
  }

  getBarHeight(value: number): number {
    const max = this.getMaxRevenue();
    return max === 0 ? 0 : (value / max) * 100;
  }

  getOverallAchievement(): number {
    let totalWeighted = 0;
    let totalWeight = 0;

    this.targetsData.forEach(t => {
      const weight = t.unit === '₹' ? 4 : 1; // Revenue has higher weight
      totalWeighted += this.getAchievementPercentage(t.target, t.actual) * weight;
      totalWeight += weight;
    });

    return totalWeight === 0 ? 0 : Math.round(totalWeighted / totalWeight);
  }
}