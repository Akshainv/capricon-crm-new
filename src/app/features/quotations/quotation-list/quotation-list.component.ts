// src/app/features/quotations/quotation-list/quotation-list.component.ts (Updated with pagination)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuotationService } from '../../../services/quotation.service';

interface Quotation {
  id: string;
  quoteNumber: string;
  customerName: string;
  email: string;
  phone: string;
  elevatorType: string;
  floors: number;
  amount: number;
  status: string;
  createdDate: Date;
  validUntil: Date;
  createdBy: string;
}


@Component({
  selector: 'app-quotation-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quotation-list.component.html',
  styleUrls: ['./quotation-list.component.css']
})
export class QuotationListComponent implements OnInit {
  searchTerm: string = '';
  statusFilter: string = '';

  quotations: Quotation[] = [];

  filteredQuotations: Quotation[] = [];
  paginatedQuotations: Quotation[] = [];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 7;
  totalPages: number = 0;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private quotationService: QuotationService
  ) { }

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.isLoading = true;
    this.quotationService.getAllQuotations().subscribe({
      next: (response: any) => {
        this.quotations = (response.data as any[]).map(q => ({
          id: q._id || q.id,
          quoteNumber: q.quoteNumber,
          customerName: q.customerName,
          email: q.customerEmail,
          phone: q.customerPhone,
          elevatorType: q.elevatorType,
          floors: q.noOfStops || 2,
          amount: q.totalCost || 0,
          status: q.status || 'draft',
          createdDate: new Date(q.createdAt),
          validUntil: new Date(q.validUntil),
          createdBy: q.createdBy || 'System'
        }));
        this.filterQuotations();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching quotations:', err);
        this.isLoading = false;
      }
    });
  }


  // Getter methods for stats - REMOVED draftCount
  get sentCount(): number {
    return this.quotations.filter(q => q.status === 'sent' || q.status === 'delivered').length;
  }

  get acceptedCount(): number {
    return this.quotations.filter(q => q.status === 'accepted' || q.status === 'approved').length;
  }

  get totalValue(): number {
    return this.quotations.reduce((sum, q) => sum + q.amount, 0);
  }

  filterQuotations(): void {
    this.filteredQuotations = this.quotations.filter(quote => {
      const matchesSearch = !this.searchTerm ||
        quote.customerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        quote.quoteNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        quote.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = !this.statusFilter || quote.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredQuotations.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedQuotations = this.filteredQuotations.slice(start, end);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  viewQuotation(id: string): void {
    this.router.navigate(['/quotations', id]);
  }

  sendQuotation(quote: any): void {
    if (confirm(`Send quotation ${quote.quoteNumber} to ${quote.email}?`)) {
      this.isLoading = true;

      // Fetch full quotation data first to ensure all fields are present
      this.quotationService.getQuotationById(quote.id).subscribe({
        next: (response: any) => {
          const fullData = this.quotationService.formatQuotationForFrontend(response.data);

          this.quotationService.sendQuotationWithPDF(quote.id, quote.email, fullData).subscribe({
            next: () => {
              this.isLoading = false;
              alert(`Quotation sent to ${quote.email} successfully!`);
              this.loadQuotations(); // Refresh to update status
            },
            error: (err: any) => {
              this.isLoading = false;
              console.error('Error sending quotation:', err);
              alert('Failed to send quotation. Please try again.');
            }
          });
        },
        error: (err: any) => {
          this.isLoading = false;
          console.error('Error fetching full quotation data:', err);
          alert('Failed to prepare quotation for sending.');
        }
      });
    }
  }

  deleteQuotation(id: string): void {
    if (confirm('Are you sure you want to delete this quotation?')) {
      this.quotationService.deleteQuotation(id).subscribe({
        next: () => {
          this.loadQuotations();
        },
        error: (err: any) => {
          console.error('Error deleting quotation:', err);
          alert('Failed to delete quotation.');
        }
      });
    }
  }


  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'draft': 'Draft',
      'sent': 'Sent',
      'accepted': 'Accepted',
      'rejected': 'Rejected'
    };
    return labels[status] || status;
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}