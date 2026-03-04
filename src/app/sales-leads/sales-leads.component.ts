// src/app/sales-leads/sales-leads.component.ts - COMPLETE FILE
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeadsService, Lead } from '../lead.service';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sales-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-leads.component.html',
  styleUrls: ['./sales-leads.component.css']
})
export class SalesLeadsComponent implements OnInit, OnDestroy {
  // Separate arrays for created vs assigned leads
  createdLeads: Lead[] = [];
  assignedLeads: Lead[] = [];

  // Display arrays (after filtering)
  displayedLeads: Lead[] = [];
  paginatedLeads: Lead[] = [];

  // Filter states
  selectedLeadType: 'created' | 'assigned' = 'assigned';
  searchQuery: string = '';
  selectedStatus: string = 'all';
  dateFilter: string = '';

  // Loading and error states
  isLoading: boolean = false;
  errorMessage: string = '';

  // Stats
  totalCreatedLeads: number = 0;
  totalAssignedLeads: number = 0;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 7;
  totalPages: number = 0;
  currentPageMap: { [key in 'created' | 'assigned']: number } = { created: 1, assigned: 1 };

  // Subscription for real-time updates
  private leadsSubscription?: Subscription;

  // Modal
  selectedLead: Lead | null = null;
  showViewModal: boolean = false;
  parsedNotes: { [key: string]: string } = {};

  // Status Note Modal
  showNoteModal: boolean = false;
  pendingStatusLead: Lead | null = null;
  pendingStatusValue: string = '';
  statusNoteText: string = '';

  constructor(
    private router: Router,
    private leadsService: LeadsService,
    private authService: AuthService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadLeads();

    this.leadsSubscription = this.leadsService.leadsUpdated$.subscribe(() => {
      console.log('==============================================');
      console.log('🔔 Leads update notification received');
      console.log('⏳ Waiting 1000ms for backend persistence...');
      console.log('==============================================');

      setTimeout(() => {
        console.log('✅ Delay complete - refreshing sales leads now...');
        this.loadLeads();
      }, 1000);
    });
  }

  ngOnDestroy(): void {
    if (this.leadsSubscription) {
      this.leadsSubscription.unsubscribe();
    }
  }

  loadLeads(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const currentUser = this.authService.currentUserValue;
    console.log('==============================================');
    console.log('👤 Current logged in user:', currentUser);
    console.log('📊 Loading leads for sales user...');
    console.log('==============================================');

    Promise.all([
      this.leadsService.getLeadsCreatedByMe().toPromise(),
      this.leadsService.getLeadsAssignedToMe().toPromise()
    ]).then(([created, assigned]) => {
      this.createdLeads = created || [];
      this.assignedLeads = assigned || [];

      console.log('==============================================');
      console.log('📈 === LEADS LOADED SUCCESSFULLY ===');
      console.log('✅ Created leads (by me):', this.createdLeads.length);
      console.log('✅ Assigned leads (by admin):', this.assignedLeads.length);
      console.log('==============================================');

      if (this.assignedLeads.length > 0) {
        console.log('📋 Assigned Leads Details:');
        this.assignedLeads.forEach((lead, index) => {
          console.log(`  ${index + 1}. ${lead.fullName} (${lead._id})`);
          console.log(`     - Status: ${lead.status}`);
          console.log(`     - AssignedTo ID: ${typeof lead.assignedTo === 'object' ? (lead.assignedTo as any)._id : lead.assignedTo}`);
          console.log(`     - CreatedBy: ${lead.createdBy}`);
          console.log(`     - IsConverted: ${lead.isConverted}`);
        });
      } else {
        console.warn('⚠️ No assigned leads found even after fallback check!');
        console.log('Debugging info:');
        console.log('  - Current user Login ID:', currentUser?.userId);
        console.log('  - Current user Object ID (if any):', (currentUser as any)._id);
      }
      console.log('==============================================');

      this.totalCreatedLeads = this.createdLeads.length;
      this.totalAssignedLeads = this.assignedLeads.length;

      this.applyFilters();
      this.isLoading = false;
    }).catch(error => {
      console.error('==============================================');
      console.error('❌ Error loading leads:', error);
      console.error('==============================================');
      this.errorMessage = 'Failed to load leads. Please try again.';
      this.isLoading = false;
      this.toastr.error('Failed to load leads. Please try again.');
    });
  }

  onLeadTypeChange(): void {
    console.log('🔄 Lead type changed to:', this.selectedLeadType);
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered: Lead[] = this.selectedLeadType === 'created'
      ? [...this.createdLeads]
      : [...this.assignedLeads];

    console.log(`🔍 Applying filters for ${this.selectedLeadType}:`, filtered.length, 'leads');

    if (this.selectedStatus && this.selectedStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === this.selectedStatus);
      console.log(`  After status filter (${this.selectedStatus}):`, filtered.length, 'leads');
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(lead =>
        lead.fullName.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.phoneNumber.includes(query) ||
        (lead.companyName && lead.companyName.toLowerCase().includes(query))
      );
      console.log(`  After search filter ("${this.searchQuery}"):`, filtered.length, 'leads');
    }

    if (this.dateFilter) {
      filtered = filtered.filter(lead => {
        if (!lead.createdAt) return false;
        const leadDate = new Date(lead.createdAt).toISOString().split('T')[0];
        return leadDate === this.dateFilter;
      });
      console.log(`  After date filter (${this.dateFilter}):`, filtered.length, 'leads');
    }

    // ✅ SORT BY CREATED AT DESCENDING (Newest First)
    filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    this.displayedLeads = filtered;
    console.log('✅ Final filtered leads:', this.displayedLeads.length);

    this.currentPage = this.currentPageMap[this.selectedLeadType];
    this.totalPages = Math.ceil(this.displayedLeads.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1;
    }
    this.currentPageMap[this.selectedLeadType] = this.currentPage;
    this.updatePaginatedLeads();
  }

  updatePaginatedLeads(): void {
    this.paginatedLeads = this.displayedLeads.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize
    );
    console.log('📄 Paginated leads (page', this.currentPage, '):', this.paginatedLeads.length);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.currentPageMap[this.selectedLeadType] = this.currentPage;
      this.updatePaginatedLeads();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.currentPageMap[this.selectedLeadType] = this.currentPage;
      this.updatePaginatedLeads();
    }
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onDateFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = 'all';
    this.dateFilter = '';
    this.applyFilters();
  }

  viewLeadDetails(lead: Lead): void {
    this.router.navigate(['/leads', lead._id]);
  }

  editLead(leadOrId: Lead | string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const leadId = typeof leadOrId === 'string' ? leadOrId : leadOrId._id;
    this.router.navigate(['/leads/edit', leadId]);
  }

  deleteLead(leadOrId: Lead | string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const leadId = typeof leadOrId === 'string' ? leadOrId : leadOrId._id;
    const leadName = typeof leadOrId === 'string' ? 'this lead' : leadOrId.fullName;

    if (confirm(`Are you sure you want to delete the lead for ${leadName}?`)) {
      this.leadsService.deleteLead(leadId).subscribe({
        next: () => {
          this.toastr.success('Lead deleted successfully!');
          this.loadLeads();
        },
        error: (error) => {
          console.error('Error deleting lead:', error);
          this.toastr.error('Failed to delete lead. Please try again.');
        }
      });
    }
  }

  // ✅ STEP 1: When employee changes status dropdown, show note modal first
  onStatusChange(lead: Lead, newStatus: string, event: Event): void {
    event.stopPropagation();

    if (!lead || !lead._id) {
      console.error('❌ Cannot update: Lead or Lead ID is missing!');
      this.toastr.error('Invalid lead data. Please refresh the page.');
      return;
    }

    if (!newStatus || newStatus === lead.status) {
      console.log('⚠️ Status unchanged, skipping update');
      return;
    }

    // Store pending status and show note modal
    this.pendingStatusLead = lead;
    this.pendingStatusValue = newStatus;
    this.statusNoteText = '';
    this.showNoteModal = true;
  }

  // ✅ STEP 2: Submit status update with note
  submitStatusWithNote(): void {
    if (!this.pendingStatusLead || !this.pendingStatusValue) return;

    const lead = this.pendingStatusLead;
    const newStatus = this.pendingStatusValue;
    const note = this.statusNoteText.trim();

    console.log('==============================================');
    console.log('🔄 Updating lead status via PATCH with note');
    console.log('Lead ID:', lead._id);
    console.log('New Status:', newStatus);
    console.log('Note:', note);
    console.log('==============================================');

    this.leadsService.updateLeadStatus(lead._id, newStatus, note || undefined).subscribe({
      next: (updatedLead) => {
        console.log('✅ Status PERSISTED to database successfully!');
        lead.status = newStatus as any;
        if (note) {
          lead.statusNote = note;
        }
        this.toastr.success(`Status updated to "${newStatus}" successfully!`);
        this.closeNoteModal();
        setTimeout(() => { this.loadLeads(); }, 500);
      },
      error: (error) => {
        console.error('❌ Error updating lead status:', error);
        let errorMsg = 'Failed to update status. ';
        if (error.status === 400) errorMsg += 'Invalid status value.';
        else if (error.status === 404) errorMsg += 'Lead not found.';
        else errorMsg += 'Please try again.';
        this.toastr.error(errorMsg);
        this.closeNoteModal();
      }
    });
  }

  closeNoteModal(): void {
    this.showNoteModal = false;
    this.pendingStatusLead = null;
    this.pendingStatusValue = '';
    this.statusNoteText = '';
  }

  // ✅ Keep old method for backward compatibility
  updateLeadStatus(lead: Lead, newStatus: string, event: Event): void {
    this.onStatusChange(lead, newStatus, event);
  }

  createNewLead(): void {
    this.router.navigate(['/leads/add']);
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'New Lead': 'status-new',
      'Seeded Lead': 'status-seeded',
      'CS Executive Assigned': 'status-assigned',
      'Qualified': 'status-qualified',
      'Meeting Fixed': 'status-fixed',
      'Meeting Completed': 'status-completed',
      'CS Executed': 'status-executed',
      'Lost': 'status-lost',
      'Junk Lead': 'status-junk'
    };
    return statusClasses[status] || '';
  }

  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'New Lead': 'fa-star',
      'Seeded Lead': 'fa-seedling',
      'CS Executive Assigned': 'fa-user-tag',
      'Qualified': 'fa-check-double',
      'Meeting Fixed': 'fa-calendar-plus',
      'Meeting Completed': 'fa-calendar-check',
      'CS Executed': 'fa-check-circle',
      'Lost': 'fa-times-circle',
      'Junk Lead': 'fa-trash-alt'
    };
    return statusIcons[status] || 'fa-circle';
  }

  formatDate(date?: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  viewLeadModal(lead: Lead): void {
    this.selectedLead = lead;
    this.parseNotesForDisplay(lead);
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedLead = null;
    this.parsedNotes = {};
  }

  parseNotesForDisplay(lead: Lead): void {
    this.parsedNotes = {};

    if (!lead.notes) return;

    const parts = lead.notes.split(' | ');

    parts.forEach(part => {
      const [key, ...valueParts] = part.split(': ');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(': ').trim();
        this.parsedNotes[key.trim()] = value;
      }
    });

    console.log('Parsed notes:', this.parsedNotes);
  }

  getDesignation(): string {
    return this.parsedNotes['Designation'] || 'N/A';
  }

  getPriority(): string {
    return this.selectedLead?.priority || 'medium';
  }

  getAlternatePhone(): string {
    return this.parsedNotes['Alt Phone'] || 'N/A';
  }

  getAddress(): string {
    return this.parsedNotes['Address'] || 'N/A';
  }

  getCity(): string {
    return this.parsedNotes['City'] || 'N/A';
  }

  getState(): string {
    return this.parsedNotes['State'] || 'N/A';
  }

  getPincode(): string {
    return this.parsedNotes['Pincode'] || 'N/A';
  }

  getProductInterest(): string {
    return this.parsedNotes['Product Interest'] || 'N/A';
  }

  getBudget(): string {
    const budget = this.parsedNotes['Budget'];
    return budget ? budget : 'N/A';
  }

  getTimeline(): string {
    return this.parsedNotes['Timeline'] || 'N/A';
  }

  getQuantity(): string {
    return this.parsedNotes['Quantity'] || 'N/A';
  }

  getPriorityClass(priority?: string): string {
    const p = (priority || 'medium').toLowerCase();
    const classes: { [key: string]: string } = {
      'low': 'priority-low',
      'medium': 'priority-medium',
      'high': 'priority-high'
    };
    return classes[p] || 'priority-medium';
  }

  getPriorityIcon(priority?: string): string {
    const p = (priority || 'medium').toLowerCase();
    const icons: { [key: string]: string } = {
      'low': 'fa-flag',
      'medium': 'fa-flag',
      'high': 'fa-flag'
    };
    return icons[p] || 'fa-flag';
  }
}