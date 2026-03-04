import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeadsService, Lead } from '../../../lead.service';
import { EmployeeService, Employee } from '../../../../employee/employee.service';
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
    filteredLeads: Lead[] = [];
    isLoading: boolean = false;
    searchTerm: string = '';

    // Assignment Modal State
    showAssignModal = false;
    selectedLead: any = null;
    employees: Employee[] = [];
    selectedEmployeeId = '';
    isAssigning = false;

    private leadsSubscription?: Subscription;

    constructor(
        private leadsService: LeadsService,
        private employeeService: EmployeeService,
        private router: Router,
        private toastr: ToastrService
    ) { }

    ngOnInit(): void {
        this.fetchMetaLeads();
        this.leadsSubscription = this.leadsService.leadsUpdated$.subscribe(() => {
            this.fetchMetaLeads();
        });
    }

    ngOnDestroy(): void {
        if (this.leadsSubscription) {
            this.leadsSubscription.unsubscribe();
        }
    }

    fetchMetaLeads(): void {
        this.isLoading = true;
        this.leadsService.getMetaLeads().subscribe({
            next: (leads) => {
                this.leads = leads;
                this.onSearch();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('❌ [MetaLeadsComponent] Error loading meta leads:', error);
                this.toastr.error('Failed to load Meta leads');
                this.isLoading = false;
            }
        });
    }

    onSearch(): void {
        if (!this.searchTerm.trim()) {
            this.filteredLeads = [...this.leads];
            return;
        }

        const query = this.searchTerm.toLowerCase();
        this.filteredLeads = this.leads.filter(l =>
            l.fullName.toLowerCase().includes(query) ||
            l.email.toLowerCase().includes(query) ||
            l.phoneNumber.includes(query)
        );
    }

    // --- Assignment Logic (Mirrors WebsiteLeads) ---

    openAssignModal(lead: any) {
        this.selectedLead = lead;
        this.showAssignModal = true;
        this.selectedEmployeeId = '';

        if (this.employees.length === 0) {
            this.fetchEmployees();
        }
    }

    closeAssignModal() {
        this.showAssignModal = false;
        this.selectedLead = null;
        this.selectedEmployeeId = '';
    }

    fetchEmployees() {
        this.employeeService.getEmployeesByStatus('accept').subscribe({
            next: (data: Employee[]) => {
                this.employees = data;
            },
            error: (err: any) => {
                console.error('Error fetching employees:', err);
                this.toastr.error('Failed to load sales team');
            }
        });
    }

    onAssign() {
        if (!this.selectedEmployeeId) {
            this.toastr.warning('Please select an employee');
            return;
        }

        this.isAssigning = true;
        this.leadsService.assignMetLead(this.selectedLead._id, this.selectedEmployeeId).subscribe({
            next: (response: any) => {
                this.toastr.success('Lead migrated and assigned successfully');
                this.isAssigning = false;
                this.closeAssignModal();
                this.fetchMetaLeads(); // Refresh list (lead should be gone)
            },
            error: (err: any) => {
                console.error('Error assigning lead:', err);
                this.toastr.error('Failed to assign lead');
                this.isAssigning = false;
            }
        });
    }

    formatDate(date?: Date | string): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
}
