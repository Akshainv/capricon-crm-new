// src/app/sales-my-quotations/sales-my-quotations.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuotationService, Quotation } from '../services/quotation.service';
import { DealService } from '../services/deal.service';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

declare var Toastify: any;

@Component({
  selector: 'app-sales-my-quotations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-my-quotations.component.html',
  styleUrls: ['./sales-my-quotations.component.css']
})
export class SalesMyQuotationsComponent implements OnInit {
  searchTerm: string = '';
  quotations: Quotation[] = [];
  filteredQuotations: Quotation[] = [];
  paginatedQuotations: Quotation[] = [];
  loading: boolean = false;
  error: string = '';

  // Pagination - 7 items per page
  currentPage: number = 1;
  pageSize: number = 7;
  totalPages: number = 0;


  // Filter
  selectedStatus: string = 'Pending';
  dateFilter: string = '';

  constructor(
    private router: Router,
    private quotationService: QuotationService,
    private dealService: DealService,
    private authService: AuthService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.loading = true;
    this.error = '';

    this.quotationService.getAllQuotations().subscribe({
      next: (response) => {
        if (response.statusCode === 200) {
          const data = Array.isArray(response.data) ? response.data : [response.data];
          this.quotations = data.map((q, index) => {
            const formatted = this.quotationService.formatQuotationForFrontend(q);
            // Ensure status exists
            if (!(formatted as any).status) {
              (formatted as any).status = 'draft';
            }
            return formatted;
          });
          this.applyFiltersAndSort();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading quotations:', error);
        this.error = 'Failed to load quotations. Please try again.';
        this.loading = false;
      }
    });
  }

  get totalQuotations(): number {
    return this.quotations.length;
  }

  get approvedCount(): number {
    return this.quotations.filter(q => (q as any).status?.toLowerCase() === 'approved').length;
  }

  get rejectedCount(): number {
    return this.quotations.filter(q => (q as any).status?.toLowerCase() === 'rejected').length;
  }

  get sentCount(): number {
    return this.quotations.filter(q => (q as any).status?.toLowerCase() === 'sent').length;
  }

  get dealCount(): number {
    return this.sentCount;
  }

  setFilterStatus(status: string): void {
    this.selectedStatus = status;
    this.loadQuotations(); // Re-fetch to get latest status updates from Admin
  }

  applyFiltersAndSort(): void {
    this.filteredQuotations = this.quotations.filter(quote => {
      const status = (quote as any).status || 'draft';
      const normalizedStatus = status.toLowerCase();

      // Status Filter
      let matchesStatus = false;
      if (this.selectedStatus === 'All') {
        matchesStatus = true;
      } else if (this.selectedStatus === 'Approved') {
        matchesStatus = normalizedStatus === 'approved';
      } else if (this.selectedStatus === 'Rejected') {
        matchesStatus = normalizedStatus === 'rejected';
      } else if (this.selectedStatus === 'Deal') {
        matchesStatus = normalizedStatus === 'sent';
      } else {
        // Default to Pending (catch-all): anything not approved, rejected, or sent
        matchesStatus = !['approved', 'rejected', 'sent'].includes(normalizedStatus);
      }

      // Search Filter
      const matchesSearch = !this.searchTerm ||
        (quote.customerName || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (quote.quoteNumber || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (quote.customerEmail || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (quote.customerCompany || quote.companyName || '').toLowerCase().includes(this.searchTerm.toLowerCase());

      // Date Filter
      let matchesDate = true;
      if (this.dateFilter) {
        const quoteDateObj = quote.createdDate || (quote.createdAt ? new Date(quote.createdAt) : null);
        const quoteDateStr = quoteDateObj ? new Date(quoteDateObj).toISOString().split('T')[0] : null;
        matchesDate = quoteDateStr === this.dateFilter;
      }

      return matchesStatus && matchesSearch && matchesDate;
    });

    this.filteredQuotations.sort((a, b) => {
      const dateA = a.createdDate || new Date(a.createdAt || 0);
      const dateB = b.createdDate || new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    this.updatePagination();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'Pending';
    this.dateFilter = '';
    this.applyFiltersAndSort();
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

  createQuotation(): void {
    this.router.navigate(['/quotations/create']);
  }

  viewQuotation(id: string | undefined): void {
    try {
      if (!id) {
        this.showToast('Invalid quotation ID', 'error');
        return;
      }

      const local = this.quotations.find(q => (q.id || q._id) === id || q._id === id || q.id === id);
      if (local) {
        const previewData = this.buildPreviewFromQuotation(local);
        try { localStorage.setItem('quotationPreview', JSON.stringify(previewData)); } catch (e) { }
        this.router.navigate(['/quotations/preview'], { state: { quotationData: previewData } });
        return;
      }

      this.loading = true;
      this.quotationService.getQuotationById(id).subscribe({
        next: (response) => {
          this.loading = false;
          if (response && response.data) {
            const backend = response.data as any;
            const formatted = this.quotationService.formatQuotationForFrontend(backend);
            const previewData = this.buildPreviewFromQuotation(formatted);
            try { localStorage.setItem('quotationPreview', JSON.stringify(previewData)); } catch (e) { }
            this.router.navigate(['/quotations/preview'], { state: { quotationData: previewData } });
          } else {
            this.showToast('Quotation data not found', 'error');
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error fetching quotation:', err);
          this.showToast('Failed to load quotation. Please try again.', 'error');
        }
      });
    } catch (err) {
      console.error('Unexpected error in viewQuotation:', err);
      this.showToast('An unexpected error occurred.', 'error');
    }
  }

  private buildPreviewFromQuotation(q: Quotation): any {
    const items = (q.items || []).map(it => ({
      product: { name: it.product?.name || '', category: it.product?.category || '' },
      quantity: it.quantity || 1,
      price: it.price || 0,
      discount: it.discount || 0,
      tax: it.tax || 0,
      total: it.total || ((it.quantity || 1) * (it.price || 0))
    }));

    const subtotal = items.reduce((s: number, it: any) => s + (it.quantity * it.price), 0);
    const totalDiscount = items.reduce((s: number, it: any) => s + ((it.quantity * it.price) * (it.discount / 100)), 0);
    const totalTax = items.reduce((s: number, it: any) => {
      const taxable = (it.quantity * it.price) - ((it.quantity * it.price) * (it.discount / 100));
      return s + (taxable * (it.tax / 100));
    }, 0);
    const grandTotal = q.totalAmount || q.totalCost || (subtotal - totalDiscount + totalTax);

    return {
      quoteNumber: q.quoteNumber || '',
      quoteDate: q.quoteDate || q.createdAt || q.createdDate || '',
      validUntil: q.validUntil || '',
      customer: {
        name: q.customerName || '',
        company: q.customerCompany || q.companyName || '',
        email: q.customerEmail || '',
        phone: q.customerPhone || '',
        address: q.address || (q as any).customerAddress || ''
      },
      items,
      subtotal: q.subtotal || q.totalCost || subtotal,
      totalDiscount,
      totalTax: q.totalTax || 0,
      grandTotal: q.totalAmount || q.totalCost || grandTotal,
      termsAndConditions: q.termsAndConditions || q.internalNotes || '',
      notes: q.notes || q.specialRequirements || '',

      // PDF Page 4 Technical Specs
      model: q.model || '',
      quantity: q.quantity || 1,
      noOfStops: q.noOfStops || 2,
      elevatorType: q.elevatorType || 'MRL Gearless - Rope Driven',
      ratedLoad: q.ratedLoad || '',
      maximumSpeed: q.maximumSpeed || '',
      travelHeight: q.travelHeight || '',
      driveSystem: q.driveSystem || '',
      controlSystem: q.controlSystem || '',
      cabinWalls: q.cabinWalls || '',
      cabinDoors: q.cabinDoors || '',
      doorType: q.doorType || '',
      doorOpening: q.doorOpening || '',
      copLopScreen: q.copLopScreen || '',
      cabinCeiling: q.cabinCeiling || '',
      cabinFloor: q.cabinFloor || '',
      handrails: q.handrails || 1,

      // Pricing Summary
      pricingItems: (q as any).pricingItems || [],
      standardSubtotal: (q as any).standardSubtotal || q.totalAmount || 0,
      launchSubtotal: (q as any).launchSubtotal || q.totalAmount || 0,
      standardTax: (q as any).standardTax || 0,
      launchTax: (q as any).launchTax || 0,
      standardGrandTotal: (q as any).standardGrandTotal || q.totalAmount || 0,
      launchGrandTotal: (q as any).launchGrandTotal || q.totalAmount || 0,
      launchGrandTotalInWords: (q as any).launchGrandTotalInWords || ''
    };
  }

  sendToClient(quote: Quotation): void {
    const email = quote.customerEmail;
    if (!email || !this.isValidEmailFormat(email)) {
      this.showToast('Invalid or missing customer email address.', 'error');
      return;
    }

    this.showConfirmToast(`Send quotation to ${email}?`, 'Send', () => {
      this.proceedSendToClient(quote);
    });
  }

  private proceedSendToClient(quote: Quotation): void {
    this.loading = true;
    const quotationId = (quote._id || quote.id) as string;
    const email = quote.customerEmail;

    if (!email || !this.isValidEmailFormat(email)) {
      this.loading = false;
      this.showToast('Invalid customer email address.', 'error');
      return;
    }

    // Use existing buildPreview logic as it matches the PDF data structure
    const quotationData = this.buildPreviewFromQuotation(quote);

    console.log('📧 Sending email to client...');

    this.quotationService.sendQuotationWithPDF(quotationId, email, quotationData).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('✅ Email sent successfully!', response);
        this.showToast(`Quotation sent to ${email} successfully!`, 'success');

        // Optionally update status to 'Sent' if it was 'Approved'
        // But prompt says "Visible only for Approved", typically it might stay approved or change to sent.
        // I'll leave status update optional or separate. The prompt says "Reuse existing logic".
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Error sending email:', error);
        this.showToast('Failed to send email. Please try again.', 'error');
      }
    });
  }

  private isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (typeof Toastify !== 'undefined') {
      let backgroundColor = '#60a5fa';
      if (type === 'success') backgroundColor = '#22c55e';
      if (type === 'error') backgroundColor = '#ef4444';

      Toastify({
        text: message,
        duration: 4000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
          background: backgroundColor,
          borderRadius: "8px",
          padding: "12px 20px",
          fontSize: "14px",
          fontWeight: "500"
        }
      }).showToast();
    } else {
      if (type === 'success') this.toastr.success(message);
      else if (type === 'error') this.toastr.error(message);
      else this.toastr.info(message);
    }
  }

  showConfirmToast(message: string, confirmLabel: string, onConfirm: () => void): void {
    if (typeof Toastify !== 'undefined') {
      // Create a container element
      const container = document.createElement('div');
      container.style.textAlign = 'center';
      container.style.padding = '10px';

      // Create message element
      const msgEl = document.createElement('div');
      msgEl.style.fontWeight = '600';
      msgEl.style.marginBottom = '15px';
      msgEl.innerText = message;
      container.appendChild(msgEl);

      // Create buttons container
      const btnContainer = document.createElement('div');
      btnContainer.style.display = 'flex';
      btnContainer.style.gap = '10px';
      btnContainer.style.justifyContent = 'center';

      const toast = Toastify({
        node: container,
        duration: -1,
        close: true,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        style: {
          background: "#60a5fa",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: "500",
          maxWidth: "400px",
          padding: "15px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
        }
      }).showToast();

      // Create Confirm button
      const confirmBtn = document.createElement('button');
      confirmBtn.innerText = confirmLabel;
      confirmBtn.style.padding = '8px 20px';
      confirmBtn.style.background = 'white';
      confirmBtn.style.color = '#60a5fa';
      confirmBtn.style.border = 'none';
      confirmBtn.style.borderRadius = '6px';
      confirmBtn.style.cursor = 'pointer';
      confirmBtn.style.fontWeight = '700';
      confirmBtn.style.fontSize = '13px';
      confirmBtn.style.transition = 'all 0.2s';
      confirmBtn.addEventListener('click', () => {
        toast.hideToast();
        onConfirm();
      });

      // Create Cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.innerText = 'Cancel';
      cancelBtn.style.padding = '8px 20px';
      cancelBtn.style.background = 'rgba(255,255,255,0.2)';
      cancelBtn.style.color = 'white';
      cancelBtn.style.border = 'none';
      cancelBtn.style.borderRadius = '6px';
      cancelBtn.style.cursor = 'pointer';
      cancelBtn.style.fontWeight = '600';
      cancelBtn.style.fontSize = '13px';
      cancelBtn.style.transition = 'all 0.2s';
      cancelBtn.addEventListener('click', () => {
        toast.hideToast();
      });

      btnContainer.appendChild(confirmBtn);
      btnContainer.appendChild(cancelBtn);
      container.appendChild(btnContainer);
    } else {
      if (confirm(message)) {
        onConfirm();
      } else {
        this.toastr.info('Action cancelled');
      }
    }
  }

  deleteQuotation(id: string | undefined): void {
    if (!id) {
      this.showToast('Invalid quotation ID', 'error');
      return;
    }

    const quotation = this.quotations.find(q => (q.id || q._id) === id);
    this.showConfirmToast(`Delete quotation ${quotation?.quoteNumber}?`, 'Delete', () => {
      const quotationId = quotation?._id || quotation?.id;
      if (!quotationId) {
        this.showToast('Invalid quotation ID', 'error');
        return;
      }

      this.quotationService.deleteQuotation(quotationId).subscribe({
        next: (response) => {
          if (response.statusCode === 200) {
            this.showToast('Quotation deleted successfully!', 'success');
            this.loadQuotations();
          }
        },
        error: (error) => {
          console.error('Error deleting quotation:', error);
          this.showToast('Failed to delete quotation. Please try again.', 'error');
        }
      });
    });
  }

  downloadPdf(quote: Quotation): void {
    const id = this.getQuotationId(quote);
    if (!id) {
      this.showToast('Invalid quotation ID', 'error');
      return;
    }
    // Navigate to preview page which has the Download PDF capability
    const previewData = this.buildPreviewFromQuotation(quote);
    try { localStorage.setItem('quotationPreview', JSON.stringify(previewData)); } catch (e) { }
    this.router.navigate(['/quotations/preview'], { state: { quotationData: previewData } });
  }

  convertToDeal(id: string | undefined): void {
    if (!id) {
      this.showToast('Invalid quotation ID', 'error');
      return;
    }

    const quotation = this.quotations.find(q => (q.id || q._id) === id);
    if (!quotation) {
      this.showToast('Quotation not found', 'error');
      return;
    }

    this.showConfirmToast(`Convert quotation ${quotation.quoteNumber} to a deal?`, 'Convert', () => {
      this.loading = true;

      console.log('Converting quotation to deal:', quotation);

      const quotationData = {
        _id: quotation._id || quotation.id,
        quoteNumber: quotation.quoteNumber || 'N/A',
        customerName: quotation.customerName || 'Unknown',
        customerCompany: quotation.customerCompany || quotation.companyName || 'N/A',
        customerEmail: quotation.customerEmail || 'contact@example.com',
        customerPhone: quotation.customerPhone || '+91 0000000000',
        totalAmount: quotation.totalAmount || quotation.totalCost || 0,
        elevatorType: quotation.elevatorType || 'Home Lift',
        customerAddress: (quotation as any).customerAddress || '',
        termsAndConditions: quotation.termsAndConditions || quotation.internalNotes || '',
        notes: quotation.notes || '',
        specialRequirements: quotation.specialRequirements || ''
      };

      console.log('Quotation data being sent:', quotationData);

      this.dealService.createDealFromQuotation(quotationData).subscribe({
        next: (deal) => {
          console.log('Deal created successfully:', deal);

          const dealTitle = deal.title || deal.dealTitle || 'New Deal';
          const dealAmount = this.formatCurrency(deal.dealAmount || quotation.totalAmount);

          // Update quotation status to 'sent' so it moves from Approved to Deal filter
          const quotationId = (quotation._id || quotation.id) as string;
          this.quotationService.updateQuotationStatus(quotationId, 'sent').subscribe({
            next: () => {
              this.loading = false;
              this.showToast(`✓ Deal created: ${dealTitle} (${dealAmount})`, 'success');
              this.loadQuotations();
            },
            error: () => {
              this.loading = false;
              this.showToast(`✓ Deal created: ${dealTitle} (${dealAmount})`, 'success');
              this.loadQuotations();
            }
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error converting quotation to deal:', error);

          let errorMessage = 'Failed to convert quotation to deal. ';

          if (error.status === 400) {
            errorMessage += error.error?.message || 'Invalid data.';
          } else if (error.status === 401) {
            errorMessage += 'Please log in again.';
          } else if (error.status === 500) {
            errorMessage += 'Server error. Contact support.';
          } else {
            errorMessage += error.message || 'Unknown error.';
          }

          this.showToast(errorMessage, 'error');
        }
      });
    });
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₹0';
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getElevatorTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'Home Lift': '🏠',
      'home lift': '🏠',
      'Commercial Elevator': '🏬',
      'commercial elevator': '🏬',
      'Elevator with Shaft': '🔲',
      'elevator with shaft': '🔲',
      'Shaftless Elevator': '⬜',
      'shaftless elevator': '⬜'
    };
    return icons[type] || '🏢';
  }

  getQuotationId(quote: Quotation): string {
    return (quote._id || quote.id || '') as string;
  }

  updateQuotationStatus(quote: Quotation, newStatus: string, event: Event): void {
    event.stopPropagation();
    // Since we are UI-only, we just update the local object
    (quote as any).status = newStatus;
    // Force UI update if needed, though Angular change detection should handle it
  }

  getQuotationStatusClass(status: string): string {
    if (status === 'Approved') return 'status-approved';
    if (status === 'Not Approved') return 'status-not-approved';
    return ''; // Default or unknown
  }
}