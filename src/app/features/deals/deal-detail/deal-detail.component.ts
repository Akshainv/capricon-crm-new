// src/app/features/deals/deal-detail/deal-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DealService, Deal } from '../../../services/deal.service';

interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'status_change';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  userName: string; // ✅ ADDED: To store user display name
  icon: string;
}

@Component({
  selector: 'app-deal-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deal-detail.component.html',
  styleUrls: ['./deal-detail.component.css']
})
export class DealDetailComponent implements OnInit {
  dealId: string | null = null;
  deal: Deal | null = null;
  activities: Activity[] = [];
  isLoading: boolean = true;

  statusOptions = [
    { value: 'lead', label: 'Lead', color: '#60a5fa' },
    { value: 'qualified', label: 'Qualified', color: '#a855f7' },
    { value: 'proposal', label: 'Proposal', color: '#f59e0b' },
    { value: 'negotiation', label: 'Negotiation', color: '#ec4899' },
    { value: 'won', label: 'Won', color: '#22c55e' },
    { value: 'lost', label: 'Lost', color: '#ef4444' },
    { value: 'pending', label: 'Pending', color: '#f59e0b' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dealService: DealService
  ) { }

  ngOnInit(): void {
    this.dealId = this.route.snapshot.paramMap.get('id');
    if (this.dealId) {
      this.loadDealDetails(this.dealId);
    }
  }

  loadDealDetails(id: string): void {
    this.isLoading = true;

    this.dealService.getDealById(id).subscribe({
      next: (deal) => {
        this.deal = deal;
        this.loadActivities(deal);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading deal:', error);
        this.deal = null;
        this.isLoading = false;
      }
    });
  }

  getDealStatus(): string {
    return this.deal?.DealStatus || '';
  }

  getDealAmount(): number {
    return this.deal?.dealAmount || 0;
  }

  getDealProbability(): number {
    return this.deal?.Probability || 0;
  }

  getDealCloseDate(): string {
    return this.deal?.expectedCloseDate || '';
  }

  // ✅ ADDED: Helper method to get user display name instead of MongoDB ID
  getUserDisplayName(userId: string): string {
    // If it looks like a MongoDB ID (24 hex characters), return generic name
    if (userId && userId.length === 24 && /^[a-f0-9]{24}$/i.test(userId)) {
      return 'Sales Executive';
    }
    return userId || 'System';
  }

  loadActivities(deal: Deal): void {
    const baseActivities: Activity[] = [
      {
        id: '1',
        type: 'note',
        title: deal.createdFrom === 'quotation' ? 'Deal Created from Quotation' : 'Lead Created',
        description: deal.createdFrom === 'quotation'
          ? `Deal created from quotation ${deal.quoteNumber || ''}. Customer: ${deal.contactPerson}.`
          : `New lead captured from ${deal.leadSource}. Initial contact established with ${deal.contactPerson}.`,
        timestamp: deal.createdAt ? new Date(deal.createdAt).toISOString() : new Date().toISOString(),
        user: deal.createdBy || 'System',
        userName: this.getUserDisplayName(deal.createdBy || ''), // ✅ ADDED
        icon: 'fa-sticky-note'
      }
    ];

    if (deal.DealStatus === 'qualified' || deal.DealStatus === 'proposal' || deal.DealStatus === 'negotiation' || deal.DealStatus === 'won' || deal.DealStatus === 'pending') {
      baseActivities.unshift({
        id: '2',
        type: 'call',
        title: 'Qualification Call',
        description: `Discussed requirements with ${deal.contactPerson}. Customer needs ${deal.elevatorType}.`,
        timestamp: this.addDays(deal.createdAt ? new Date(deal.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], 2) + 'T11:00:00',
        user: deal.assignedTo,
        userName: this.getUserDisplayName(deal.assignedTo), // ✅ ADDED
        icon: 'fa-phone'
      });
    }

    if (deal.DealStatus === 'proposal' || deal.DealStatus === 'negotiation' || deal.DealStatus === 'won') {
      baseActivities.unshift({
        id: '3',
        type: 'meeting',
        title: 'Site Visit',
        description: `Conducted site survey. Discussed installation requirements.`,
        timestamp: this.addDays(deal.createdAt ? new Date(deal.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], 5) + 'T10:00:00',
        user: deal.assignedTo,
        userName: this.getUserDisplayName(deal.assignedTo), // ✅ ADDED
        icon: 'fa-handshake'
      });

      baseActivities.unshift({
        id: '4',
        type: 'email',
        title: 'Quotation Sent',
        description: `Sent detailed quotation for ${deal.elevatorType} with specifications and pricing breakdown.`,
        timestamp: this.addDays(deal.createdAt ? new Date(deal.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], 7) + 'T16:45:00',
        user: deal.assignedTo,
        userName: this.getUserDisplayName(deal.assignedTo), // ✅ ADDED
        icon: 'fa-envelope'
      });
    }

    if (deal.DealStatus === 'negotiation' || deal.DealStatus === 'won') {
      baseActivities.unshift({
        id: '5',
        type: 'call',
        title: 'Negotiation Call',
        description: 'Discussed pricing, payment terms, and installation timeline. Customer requested minor adjustments.',
        timestamp: this.addDays(deal.createdAt ? new Date(deal.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], 10) + 'T14:30:00',
        user: deal.assignedTo,
        userName: this.getUserDisplayName(deal.assignedTo), // ✅ ADDED
        icon: 'fa-phone'
      });
    }

    if (deal.DealStatus === 'won' || deal.converted) {
      baseActivities.unshift({
        id: '6',
        type: 'status_change',
        title: 'Deal Won',
        description: `Contract signed! Deal worth ${this.formatCurrency(deal.dealAmount)} closed successfully.`,
        timestamp: deal.convertedDate ? new Date(deal.convertedDate).toISOString() : this.addDays(deal.createdAt ? new Date(deal.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], 15) + 'T11:00:00',
        user: deal.assignedTo,
        userName: this.getUserDisplayName(deal.assignedTo), // ✅ ADDED
        icon: 'fa-trophy'
      });
    }

    if (deal.converted) {
      baseActivities.unshift({
        id: '7',
        type: 'status_change',
        title: 'Converted to Project',
        description: `Deal successfully converted to project. Project ID: ${deal.convertedProjectId || 'N/A'}`,
        timestamp: deal.convertedDate ? new Date(deal.convertedDate).toISOString() : new Date().toISOString(),
        user: deal.convertedBy || deal.assignedTo,
        userName: this.getUserDisplayName(deal.convertedBy || deal.assignedTo), // ✅ ADDED
        icon: 'fa-project-diagram'
      });
    }

    if (deal.DealStatus === 'lost') {
      baseActivities.unshift({
        id: '8',
        type: 'status_change',
        title: 'Deal Lost',
        description: 'Customer decided to go with a competitor. Reason: Better pricing offered by competitor.',
        timestamp: this.addDays(deal.createdAt ? new Date(deal.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], 12) + 'T16:00:00',
        user: deal.assignedTo,
        userName: this.getUserDisplayName(deal.assignedTo), // ✅ ADDED
        icon: 'fa-times-circle'
      });
    }

    this.activities = baseActivities;
  }

  addDays(dateString: string, days: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  editDeal(): void {
    if (this.dealId) {
      this.router.navigate(['/deals/edit', this.dealId]);
    }
  }

  deleteDeal(): void {
    if (confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      if (this.dealId) {
        this.dealService.deleteDeal(this.dealId).subscribe({
          next: () => {
            alert('Deal deleted successfully!');
            this.router.navigate(['/deals']);
          },
          error: (error) => {
            console.error('Error deleting deal:', error);
            alert('Failed to delete deal. Please try again.');
          }
        });
      }
    }
  }

  convertToProject(): void {
    if (this.deal) {
      this.router.navigate(['/projects/create'], {
        state: {
          deal: this.deal
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/deals']);
  }

  getStatusColor(status: string): string {
    const statusOption = this.statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.color : '#666';
  }

  getStatusLabel(status: string): string {
    const statusOption = this.statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.label : status;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ✅ UPDATED: Changed to show actual date and time instead of "X minutes ago"
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}