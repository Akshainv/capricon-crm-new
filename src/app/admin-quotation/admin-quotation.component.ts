// src/app/admin-quotation/admin-quotation.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuotationService, Quotation } from '../services/quotation.service';
import { AuthService } from '../services/auth.service';
import { EmployeeService, Employee } from '../../employee/employee.service';

@Component({
    selector: 'app-admin-quotation',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-quotation.component.html',
    styleUrls: ['./admin-quotation.component.css']
})
export class AdminQuotationComponent implements OnInit {
    searchTerm: string = '';
    quotations: Quotation[] = [];
    filteredQuotations: Quotation[] = [];
    paginatedQuotations: Quotation[] = [];
    loading: boolean = false;
    error: string = '';
    dateFilter: string = '';

    // Pagination - 7 items per page
    currentPage: number = 1;
    pageSize: number = 7;
    totalPages: number = 0;

    employees: Employee[] = [];
    employeeMap: { [key: string]: string } = {};

    constructor(
        private router: Router,
        private quotationService: QuotationService,
        private authService: AuthService,
        private employeeService: EmployeeService
    ) { }

    ngOnInit(): void {
        this.loadEmployees();
        this.loadQuotations();
    }

    loadEmployees(): void {
        this.employeeService.getAllEmployees().subscribe({
            next: (data) => {
                this.employees = data;
                this.employeeMap = {};
                this.employees.forEach(emp => {
                    // Map both _id and employeeId (if available) to fullName
                    if (emp._id) {
                        this.employeeMap[emp._id.trim()] = emp.fullName;
                    }
                    if (emp.employeeId) {
                        this.employeeMap[emp.employeeId.trim()] = emp.fullName;
                    }
                });
                console.log('Employees loaded and mapped:', Object.keys(this.employeeMap).length);
                this.mapEmployeeNames();
                this.applyFiltersAndSort();
            },
            error: (err) => {
                console.error('Error loading employees', err);
            }
        });
    }

    mapEmployeeNames(): void {
        if (Object.keys(this.employeeMap).length === 0 || this.quotations.length === 0) return;

        this.quotations.forEach(q => {
            if (q.createdBy) {
                const id = q.createdBy.trim();
                if (this.employeeMap[id]) {
                    // Only update if we have a name for this ID
                    q.createdBy = this.employeeMap[id];
                }
            }
        });
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

                        // Normalize status for Admin View
                        const currentStatus = (formatted as any).status?.toLowerCase();
                        if (currentStatus === 'approved') {
                            (formatted as any).status = 'Approved';
                        } else if (currentStatus === 'rejected') {
                            (formatted as any).status = 'Rejected';
                        } else {
                            (formatted as any).status = 'Pending';
                        }
                        return formatted;
                    });
                    this.mapEmployeeNames();
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

    get totalValue(): number {
        return this.quotations.reduce((sum, q) => sum + (q.totalAmount || q.totalCost || 0), 0);
    }

    get averageValue(): number {
        if (this.quotations.length === 0) return 0;
        return this.totalValue / this.quotations.length;
    }

    selectedFilter: string = 'All';
    pendingCount: number = 0;
    approvedCount: number = 0;
    rejectedCount: number = 0;

    setFilterStatus(status: string): void {
        this.selectedFilter = status;
        this.applyFiltersAndSort();
    }

    applyFiltersAndSort(): void {
        // First Apply Search
        let tempQuotations = this.quotations.filter(quote => {
            const matchesSearch = !this.searchTerm ||
                (quote.customerName || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (quote.quoteNumber || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (quote.customerEmail || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (quote.customerCompany || quote.companyName || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                ((quote.createdBy || '').toLowerCase().includes(this.searchTerm.toLowerCase())); // Search by employee too

            let matchesDate = true;
            if (this.dateFilter) {
                const quoteDateObj = quote.createdDate || (quote.createdAt ? new Date(quote.createdAt) : null);
                const quoteDateStr = quoteDateObj ? new Date(quoteDateObj).toISOString().split('T')[0] : null;
                matchesDate = quoteDateStr === this.dateFilter;
            }

            return matchesSearch && matchesDate;
        });

        // Calculate Counts based on Search Results (before status filter)
        this.pendingCount = tempQuotations.filter(q => {
            const s = (q as any).status?.toLowerCase();
            return s !== 'approved' && s !== 'rejected';
        }).length;
        this.approvedCount = tempQuotations.filter(q => (q as any).status?.toLowerCase() === 'approved').length;
        this.rejectedCount = tempQuotations.filter(q => (q as any).status?.toLowerCase() === 'rejected').length;

        // Apply Status Filter
        tempQuotations = tempQuotations.filter(quote => {
            if (this.selectedFilter === 'All') return true;
            const s = (quote as any).status?.toLowerCase();
            if (this.selectedFilter === 'Pending') return s !== 'approved' && s !== 'rejected';
            return s === this.selectedFilter.toLowerCase();
        });

        this.filteredQuotations = tempQuotations;

        this.filteredQuotations.sort((a, b) => {
            const dateA = a.createdDate || new Date(a.createdAt || 0);
            const dateB = b.createdDate || new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
        });

        this.currentPage = 1;
        this.updatePagination();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.selectedFilter = 'All';
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

    viewQuotation(id: string | undefined): void {
        try {
            if (!id) {
                alert('Invalid quotation ID');
                return;
            }

            const local = this.quotations.find(q => (q.id || q._id) === id || q._id === id || q.id === id);
            if (local) {
                const previewData = this.buildPreviewFromQuotation(local);
                try { localStorage.setItem('quotationPreview', JSON.stringify(previewData)); } catch (e) { }
                this.router.navigate(['/admin/quotations/preview'], { state: { quotationData: previewData } });
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
                        this.router.navigate(['/admin/quotations/preview'], { state: { quotationData: previewData } });
                    } else {
                        alert('Quotation data not found');
                    }
                },
                error: (err) => {
                    this.loading = false;
                    console.error('Error fetching quotation:', err);
                    alert('Failed to load quotation. Please try again.');
                }
            });
        } catch (err) {
            console.error('Unexpected error in viewQuotation:', err);
            alert('An unexpected error occurred. Check console for details.');
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

    deleteQuotation(id: string | undefined): void {
        if (!id) {
            alert('Invalid quotation ID');
            return;
        }

        const quotation = this.quotations.find(q => (q.id || q._id) === id);
        if (confirm(`Are you sure you want to delete quotation ${quotation?.quoteNumber}?`)) {
            const quotationId = quotation?._id || quotation?.id;
            if (!quotationId) {
                alert('Invalid quotation ID');
                return;
            }

            this.quotationService.deleteQuotation(quotationId).subscribe({
                next: (response) => {
                    if (response.statusCode === 200) {
                        alert('Quotation deleted successfully!');
                        this.loadQuotations();
                    }
                },
                error: (error) => {
                    console.error('Error deleting quotation:', error);
                    alert('Failed to delete quotation. Please try again.');
                }
            });
        }
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

    // Admin Only Logic
    updateStatus(quote: Quotation, newStatus: string): void {
        const quotationId = (quote._id || quote.id) as string;
        if (!quotationId) {
            console.error('Cannot update status: quotation ID missing');
            return;
        }

        // Convert to lowercase for backend (common pattern: 'approved', 'rejected')
        const backendStatus = newStatus.toLowerCase();
        console.log('🔄 Updating status:', { quotationId, newStatus, backendStatus });

        this.loading = true;
        this.quotationService.updateQuotationStatus(quotationId, backendStatus).subscribe({
            next: (response) => {
                this.loading = false;
                if (response.statusCode === 200) {
                    (quote as any).status = newStatus; // Keep UI status capitalized
                    console.log(`✅ Status updated for ${quote.quoteNumber} to ${newStatus}`);
                    // Refresh view to move item out of current filter
                    this.applyFiltersAndSort();
                }
            },
            error: (error) => {
                this.loading = false;
                console.error('❌ Error updating status:', error);
                console.error('❌ Error details:', error.error);
                alert('Failed to update status. Please try again.');
            }
        });
    }

    getStatusClass(status: string): string {
        if (status === 'Approved') return 'status-approved';
        if (status === 'Rejected') return 'status-rejected';
        return 'status-pending';
    }
}
