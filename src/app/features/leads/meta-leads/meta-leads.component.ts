import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeadsService, Lead } from '../../../lead.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-meta-leads',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './meta-leads.component.html',
    styleUrls: ['./meta-leads.component.css']
})
export class MetaLeadsComponent implements OnInit, OnDestroy {
    leads: Lead[] = [];
    displayedLeads: Lead[] = [];
    paginatedLeads: Lead[] = [];

    isLoading: boolean = false;
    searchQuery: string = '';

    currentPage: number = 1;
    pageSize: number = 10;
    totalPages: number = 0;

    private leadsSubscription?: Subscription;

    constructor(
        private leadsService: LeadsService,
        private router: Router,
        private toastr: ToastrService
    ) { }

    ngOnInit(): void {
        this.loadMetaLeads();
        this.leadsSubscription = this.leadsService.leadsUpdated$.subscribe(() => {
            this.loadMetaLeads();
        });
    }

    ngOnDestroy(): void {
        if (this.leadsSubscription) {
            this.leadsSubscription.unsubscribe();
        }
    }

    loadMetaLeads(): void {
        this.isLoading = true;
        this.leadsService.getMetaLeads().subscribe({
            next: (leads) => {
                this.leads = leads;
                this.applyFilters();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading meta leads:', error);
                this.toastr.error('Failed to load Meta leads');
                this.isLoading = false;
            }
        });
    }

    applyFilters(): void {
        let filtered = [...this.leads];

        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(l =>
                l.fullName.toLowerCase().includes(query) ||
                l.email.toLowerCase().includes(query) ||
                l.phoneNumber.includes(query)
            );
        }

        // Sort newest first
        filtered.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        this.displayedLeads = filtered;
        this.totalPages = Math.ceil(this.displayedLeads.length / this.pageSize);
        this.updatePaginatedLeads();
    }

    updatePaginatedLeads(): void {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        this.paginatedLeads = this.displayedLeads.slice(startIndex, startIndex + this.pageSize);
    }

    onSearch(): void {
        this.currentPage = 1;
        this.applyFilters();
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePaginatedLeads();
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePaginatedLeads();
        }
    }

    viewDetails(lead: Lead): void {
        this.router.navigate(['/leads', lead._id]);
    }

    editLead(lead: Lead): void {
        this.router.navigate(['/leads/edit', lead._id]);
    }

    formatDate(date?: Date | string): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    getMetaInfo(notes: string | undefined): any {
        if (!notes) return {};
        const info: any = {};
        const parts = notes.split(' | ');
        parts.forEach(p => {
            const [key, val] = p.split(': ');
            if (key && val) info[key.trim()] = val.trim();
        });
        return info;
    }
}
