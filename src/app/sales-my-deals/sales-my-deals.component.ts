// src/app/sales-my-deals/sales-my-deals.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeadsService, Lead } from '../lead.service';
import { AuthService } from '../services/auth.service';

interface Deal {
  id: string;
  title: string;
  company: string;
  amount: number;
  elevatorType: string;
  probability: number;
  closeDate: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: string;
}

interface Column {
  title: string;
  status: string;
  color: string;
  deals: Deal[];
}

@Component({
  selector: 'app-sales-my-deals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-my-deals.component.html',
  styleUrls: ['./sales-my-deals.component.css']
})
export class SalesMyDealsComponent implements OnInit {
  allDeals: Deal[] = [];
  columns: Column[] = [];
  draggedDeal: Deal | null = null;

  // Filters
  filterValue: string = '';
  filterDate: string = '';
  selectedStatus: string = 'all';

  // Loading state
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    public router: Router,
    private leadsService: LeadsService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initializeColumns();
    this.loadMyDeals();
  }

  initializeColumns(): void {
    this.columns = [
      { title: 'Seeded Lead', status: 'seeded', color: '#3b82f6', deals: [] },
      { title: 'Meeting Fixed', status: 'fixed', color: '#8b5cf6', deals: [] },
      { title: 'Meeting Completed', status: 'completed', color: '#f59e0b', deals: [] },
      { title: 'CS Executed', status: 'executed', color: '#10b981', deals: [] }
    ];
  }

  loadMyDeals(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Get current logged in user
    const currentUser = this.authService.currentUserValue;

    if (!currentUser || !currentUser.userId) {
      this.errorMessage = 'User not logged in';
      this.isLoading = false;
      return;
    }

    // Fetch leads assigned to current sales executive
    this.leadsService.getMyLeads().subscribe({
      next: (leads: Lead[]) => {
        console.log('Loaded my leads:', leads);

        // Convert Lead objects to Deal objects
        this.allDeals = leads.map(lead => this.convertLeadToDeal(lead));

        // Organize deals into columns
        this.organizeDeals();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading deals:', error);
        this.errorMessage = 'Failed to load your deals. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Convert Lead to Deal format
  private convertLeadToDeal(lead: Lead): Deal {
    return {
      id: lead._id,
      title: this.generateDealTitle(lead),
      company: lead.companyName || 'Not Specified',
      amount: this.estimateDealAmount(lead.status),
      elevatorType: this.getElevatorType(lead),
      probability: this.calculateProbability(lead.status),
      closeDate: this.estimateCloseDate(lead),
      contactPerson: lead.fullName,
      phone: lead.phoneNumber,
      email: lead.email,
      status: this.mapLeadStatusToDealStatus(lead.status)
    };
  }

  // Generate deal title from lead data
  private generateDealTitle(lead: Lead): string {
    if (lead.companyName) {
      return `${lead.companyName} Project`;
    }
    return `${lead.fullName} - New Opportunity`;
  }

  // Estimate deal amount based on status
  private estimateDealAmount(status: string): number {
    const baseAmount = 1000000;
    const randomFactor = Math.random() * 3 + 1; // 1x to 4x multiplier

    switch (status) {
      case 'CS Executed':
        return Math.round(baseAmount * randomFactor * 1.5);
      case 'Meeting Completed':
        return Math.round(baseAmount * randomFactor * 1.2);
      case 'Meeting Fixed':
        return Math.round(baseAmount * randomFactor);
      default:
        return Math.round(baseAmount * randomFactor * 0.8);
    }
  }

  // Get elevator type based on amount
  private getElevatorType(lead: Lead): string {
    const types = [
      'Passenger Elevator',
      'High-Speed Elevator',
      'Freight Elevator',
      'Residential Elevator',
      'Commercial Elevator'
    ];
    // Use a consistent index based on lead ID to ensure same elevator type for same lead
    const index = Math.abs(lead._id.charCodeAt(0)) % types.length;
    return types[index];
  }

  // Calculate probability based on lead status
  private calculateProbability(status: string): number {
    const probabilityMap: { [key: string]: number } = {
      'Seeded Lead': 25,
      'Meeting Fixed': 50,
      'Meeting Completed': 75,
      'CS Executed': 100
    };
    return probabilityMap[status] || 25;
  }

  // Estimate close date
  private estimateCloseDate(lead: Lead): string {
    const today = new Date();
    const daysToAdd = this.getDaysBasedOnStatus(lead.status);
    const closeDate = new Date(today);
    closeDate.setDate(today.getDate() + daysToAdd);
    return closeDate.toISOString().split('T')[0];
  }

  private getDaysBasedOnStatus(status: string): number {
    const daysMap: { [key: string]: number } = {
      'Seeded Lead': 60,
      'Meeting Fixed': 45,
      'Meeting Completed': 30,
      'CS Executed': 0
    };
    return daysMap[status] || 45;
  }

  // Map Lead status to Deal status
  private mapLeadStatusToDealStatus(leadStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'Seeded Lead': 'seeded',
      'Meeting Fixed': 'fixed',
      'Meeting Completed': 'completed',
      'CS Executed': 'executed'
    };
    return statusMap[leadStatus] || 'seeded';
  }

  // Map Deal status back to Lead status for updates
  private mapDealStatusToLeadStatus(dealStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'seeded': 'Seeded Lead',
      'fixed': 'Meeting Fixed',
      'completed': 'Meeting Completed',
      'executed': 'CS Executed'
    };
    return statusMap[dealStatus] || 'Seeded Lead';
  }

  organizeDeals(): void {
    // Clear all columns first
    this.columns.forEach(column => {
      column.deals = [];
    });

    // Apply filters
    let filteredDeals = this.allDeals;

    if (this.filterValue) {
      const minValue = parseFloat(this.filterValue);
      filteredDeals = filteredDeals.filter(deal => deal.amount >= minValue);
    }

    if (this.filterDate) {
      filteredDeals = filteredDeals.filter(deal => deal.closeDate <= this.filterDate);
    }

    // Status filter: if not 'all', only include deals matching selected status
    if (this.selectedStatus && this.selectedStatus !== 'all') {
      filteredDeals = filteredDeals.filter(deal => deal.status === this.selectedStatus);
    }

    // Distribute deals to columns
    filteredDeals.forEach(deal => {
      const column = this.columns.find(col => col.status === deal.status);
      if (column) {
        column.deals.push(deal);
      }
    });
  }

  applyFilters(): void {
    this.organizeDeals();
  }

  clearFilters(): void {
    this.filterValue = '';
    this.filterDate = '';
    this.organizeDeals();
  }

  // Drag and Drop Methods
  onDragStart(event: DragEvent, deal: Deal): void {
    this.draggedDeal = deal;
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDrop(event: DragEvent, newStatus: string): void {
    event.preventDefault();

    if (this.draggedDeal) {
      this.updateDealStatusInternal(this.draggedDeal, newStatus);
    }
  }

  private updateDealStatusInternal(deal: Deal, newStatus: string): void {
    const oldStatus = deal.status;

    // Optimistic update
    deal.status = newStatus;
    if (newStatus === 'executed') deal.probability = 100;

    const leadStatus = this.mapDealStatusToLeadStatus(newStatus);

    this.leadsService.updateLead(deal.id, { status: leadStatus as any }).subscribe({
      next: () => {
        this.organizeDeals();
        this.draggedDeal = null;
        alert('Deal status updated successfully!');
      },
      error: (error: any) => {
        console.error('Error updating deal status:', error);
        alert('Failed to update deal status. Reverting.');
        // Revert on error
        deal.status = oldStatus;
        this.organizeDeals();
        this.draggedDeal = null;
      }
    });
  }

  updateDealStatus(deal: Deal, newStatus: string, event: Event): void {
    event.stopPropagation();
    this.updateDealStatusInternal(deal, newStatus);
  }

  // Navigation Methods
  viewDealDetails(deal: Deal): void {
    this.router.navigate(['/leads', deal.id]);
  }

  createNewDeal(): void {
    this.router.navigate(['/leads/create']);
  }

  // Utility Methods
  getColumnCount(column: Column): number {
    return column.deals.length;
  }

  getColumnTotal(column: Column): number {
    return column.deals.reduce((sum, deal) => sum + deal.amount, 0);
  }

  getTotalPipelineValue(): number {
    return this.allDeals
      .filter(deal => deal.status !== 'executed')
      .reduce((sum, deal) => sum + deal.amount, 0);
  }

  getWonDealsValue(): number {
    return this.allDeals
      .filter(deal => deal.status === 'executed')
      .reduce((sum, deal) => sum + deal.amount, 0);
  }

  getActiveDealsCount(): number {
    return this.allDeals.filter(deal => deal.status !== 'executed').length;
  }

  getWinRate(): number {
    const totalClosed = this.allDeals.filter(deal =>
      deal.status === 'executed'
    ).length;

    if (totalClosed === 0) return 0;

    const wonDeals = this.allDeals.filter(deal => deal.status === 'executed').length;
    return Math.round((wonDeals / totalClosed) * 100);
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}