import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadsService } from '../services/lead.service';
import { EmployeeService, Employee } from '../../employee/employee.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-website-leads',
  templateUrl: './admin-website-leads.component.html',
  styleUrls: ['./admin-website-leads.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AdminWebsiteLeadsComponent implements OnInit {
  websiteLeads: any[] = [];
  filteredLeads: any[] = [];
  isLoading = true;
  searchTerm = '';

  // Assignment Modal State
  showAssignModal = false;
  selectedLead: any = null;
  employees: Employee[] = [];
  selectedEmployeeId = '';
  isAssigning = false;

  constructor(
    private leadService: LeadsService,
    private employeeService: EmployeeService,
    private toastr: ToastrService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.fetchWebsiteLeads();
  }

  fetchWebsiteLeads() {
    this.isLoading = true;
    this.leadService.getWebsiteLeads().subscribe({
      next: (response: any) => {
        if (response.statusCode === 200) {
          this.websiteLeads = response.data;
          this.filteredLeads = [...this.websiteLeads];
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching website leads:', err);
        this.isLoading = false;
      }
    });
  }

  onSearch() {
    if (!this.searchTerm.trim()) {
      this.filteredLeads = [...this.websiteLeads];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredLeads = this.websiteLeads.filter(lead =>
      (lead.name && lead.name.toLowerCase().includes(term)) ||
      (lead.email && lead.email.toLowerCase().includes(term)) ||
      (lead.phone && lead.phone.includes(term))
    );
  }

  // --- Assignment Logic ---

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
    this.leadService.assignWebsiteLead(this.selectedLead._id, this.selectedEmployeeId).subscribe({
      next: (response: any) => {
        this.toastr.success('Lead migrated and assigned successfully');
        this.isAssigning = false;
        this.closeAssignModal();
        this.fetchWebsiteLeads(); // Refresh list (lead should be gone)
      },
      error: (err: any) => {
        console.error('Error assigning lead:', err);
        this.toastr.error('Failed to assign lead');
        this.isAssigning = false;
      }
    });
  }
}
