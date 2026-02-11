// src/app/features/quotations/quotation-list/quotation-list.component.ts (Updated with pagination)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Quotation {
  id: string;
  quoteNumber: string;
  customerName: string;
  email: string;
  phone: string;
  elevatorType: string;
  floors: number;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
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

  quotations: Quotation[] = [
    {
      id: '1',
      quoteNumber: 'QT-2024-001',
      customerName: 'John Smith',
      email: 'john@example.com',
      phone: '+91 9876543210',
      elevatorType: '8-Floor Passenger',
      floors: 8,
      amount: 1829000,
      status: 'sent',
      createdDate: new Date('2024-10-02'),
      validUntil: new Date('2024-11-02'),
      createdBy: 'Rajesh Kumar'
    },
    {
      id: '2',
      quoteNumber: 'QT-2024-002',
      customerName: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+91 9876543211',
      elevatorType: '5-Floor Home Lift',
      floors: 5,
      amount: 850000,
      status: 'accepted',
      createdDate: new Date('2024-10-01'),
      validUntil: new Date('2024-11-01'),
      createdBy: 'Amit Shah'
    },
    {
      id: '3',
      quoteNumber: 'QT-2024-003',
      customerName: 'Michael Brown',
      email: 'michael@example.com',
      phone: '+91 9876543212',
      elevatorType: '12-Floor Goods',
      floors: 12,
      amount: 2500000,
      status: 'draft',
      createdDate: new Date('2024-09-28'),
      validUntil: new Date('2024-10-28'),
      createdBy: 'Priya Sharma'
    },
    {
      id: '4',
      quoteNumber: 'QT-2024-004',
      customerName: 'Emily Davis',
      email: 'emily@example.com',
      phone: '+91 9876543213',
      elevatorType: '6-Floor Hospital',
      floors: 6,
      amount: 1950000,
      status: 'sent',
      createdDate: new Date('2024-10-05'),
      validUntil: new Date('2024-11-05'),
      createdBy: 'Vikram Singh'
    },
    {
      id: '5',
      quoteNumber: 'QT-2024-005',
      customerName: 'David Wilson',
      email: 'david@example.com',
      phone: '+91 9876543214',
      elevatorType: '10-Floor Commercial',
      floors: 10,
      amount: 2200000,
      status: 'rejected',
      createdDate: new Date('2024-09-25'),
      validUntil: new Date('2024-10-25'),
      createdBy: 'Rajesh Kumar'
    }
  ];

  filteredQuotations: Quotation[] = [];
  paginatedQuotations: Quotation[] = [];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 7;
  totalPages: number = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.filteredQuotations = [...this.quotations];
    this.updatePagination();
  }

  // Getter methods for stats - REMOVED draftCount
  get sentCount(): number {
    return this.quotations.filter(q => q.status === 'sent').length;
  }

  get acceptedCount(): number {
    return this.quotations.filter(q => q.status === 'accepted').length;
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

  deleteQuotation(id: string): void {
    if (confirm('Are you sure you want to delete this quotation?')) {
      this.quotations = this.quotations.filter(q => q.id !== id);
      this.filterQuotations();
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