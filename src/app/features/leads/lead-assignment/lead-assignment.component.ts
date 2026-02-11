// src/app/features/leads/lead-assignment/lead-assignment.component.ts - FIXED VERSION
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeadsService, Lead } from '../../../lead.service';
import { EmployeeService, Employee } from '../../../../employee/employee.service';
import { AuthService } from '../../../services/auth.service';

interface LeadDisplay {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  selected: boolean;
}

interface SalesPerson {
  id: string;
  name: string;
  email: string;
  activeLeads: number;
}

@Component({
  selector: 'app-lead-assignment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lead-assignment.component.html',
  styleUrls: ['./lead-assignment.component.css']
})
export class LeadAssignmentComponent implements OnInit {
  assignmentForm!: FormGroup;
  leads: LeadDisplay[] = [];
  salesPersons: SalesPerson[] = [];
  selectAll = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private leadsService: LeadsService,
    private employeeService: EmployeeService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadUnassignedLeads();
    this.loadApprovedEmployees();
  }

  initForm(): void {
    this.assignmentForm = this.fb.group({
      salesPerson: ['', Validators.required]
    });
  }

  loadUnassignedLeads(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.leadsService.getAllLeads().subscribe({
      next: (allLeads: Lead[]) => {
        const unassignedLeads = allLeads.filter(lead => {
          const isUnassigned = !lead.assignedTo || lead.assignedTo === '' || lead.assignedTo === null;
          const isNew = lead.status === 'Seeded Lead';
          const notConverted = !lead.isConverted;

          return isNew && isUnassigned && notConverted;
        });

        this.leads = unassignedLeads.map(lead => ({
          id: lead._id,
          name: lead.fullName,
          email: lead.email,
          phone: lead.phoneNumber,
          source: lead.leadSource,
          status: lead.status,
          selected: false
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading leads:', error);
        this.errorMessage = 'Failed to load unassigned leads';
        this.isLoading = false;
      }
    });
  }

  loadApprovedEmployees(): void {
    this.employeeService.getEmployeesByStatus('accept').subscribe({
      next: (employees: Employee[]) => {
        this.leadsService.getAllLeads().subscribe({
          next: (allLeads: Lead[]) => {
            this.salesPersons = employees.map(emp => {
              const activeLeadsCount = allLeads.filter(
                lead => lead.assignedTo === emp._id &&
                  lead.status !== 'CS Executed'
              ).length;

              return {
                id: emp._id,
                name: emp.fullName,
                email: emp.email,
                activeLeads: activeLeadsCount
              };
            });
          },
          error: (error) => {
            console.error('Error loading all leads for count:', error);
            this.salesPersons = employees.map(emp => ({
              id: emp._id,
              name: emp.fullName,
              email: emp.email,
              activeLeads: 0
            }));
          }
        });
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.errorMessage = 'Failed to load sales team members';
      }
    });
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.leads.forEach(lead => lead.selected = this.selectAll);
  }

  toggleLeadSelection(lead: LeadDisplay): void {
    lead.selected = !lead.selected;
    this.updateSelectAllState();
  }

  updateSelectAllState(): void {
    this.selectAll = this.leads.length > 0 && this.leads.every(lead => lead.selected);
  }

  get selectedLeads(): LeadDisplay[] {
    return this.leads.filter(lead => lead.selected);
  }

  get selectedCount(): number {
    return this.selectedLeads.length;
  }

  removeSelectedLead(leadId: string): void {
    const lead = this.leads.find(l => l.id === leadId);
    if (lead) {
      lead.selected = false;
      this.updateSelectAllState();
    }
  }

  // ✅ CRITICAL FIX: Add delay to allow backend to complete updates
  onSubmit(): void {
    if (this.assignmentForm.invalid) {
      alert('Please select a sales person');
      return;
    }

    if (this.selectedCount === 0) {
      alert('Please select at least one lead to assign');
      return;
    }

    const formData = this.assignmentForm.value;
    const selectedLeadIds = this.selectedLeads.map(lead => lead.id);

    const assignmentData = {
      leadIds: selectedLeadIds,
      assignedSales: formData.salesPerson,
      notes: ''
    };

    this.isLoading = true;
    this.errorMessage = '';

    console.log('==============================================');
    console.log('Frontend: Assigning leads:', assignmentData);
    console.log('==============================================');

    this.leadsService.assignLeads(assignmentData).subscribe({
      next: (response) => {
        console.log('==============================================');
        console.log('Frontend: Assignment response received:', response);
        console.log('==============================================');

        // ✅ CRITICAL FIX: Add delay to ensure backend MongoDB writes are persisted
        // Wait 800ms before triggering refresh to allow backend updates to complete
        setTimeout(() => {
          console.log('Frontend: Triggering refresh after delay...');

          // Trigger real-time update for all subscribed components
          this.leadsService.leadsUpdated.next();

          this.isLoading = false;

          alert(`Successfully assigned ${this.selectedCount} lead(s) to ${this.getSelectedSalesPersonName()}`);

          // Reset form and reload unassigned leads
          this.assignmentForm.reset();
          this.selectAll = false;
          this.loadUnassignedLeads();

          console.log('Frontend: Refresh completed');
        }, 800); // 800ms delay to ensure backend persistence
      },
      error: (error) => {
        console.error('==============================================');
        console.error('Frontend: Error assigning leads:', error);
        console.error('==============================================');
        this.isLoading = false;
        this.errorMessage = 'Failed to assign leads. Please try again.';
        alert('Failed to assign leads: ' + (error.message || 'Unknown error'));
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/leads']);
  }

  goBack(): void {
    this.router.navigate(['/admin/leads']);
  }

  getSelectedSalesPersonName(): string {
    const salesPersonId = this.assignmentForm.get('salesPerson')?.value;
    const salesPerson = this.salesPersons.find(sp => sp.id === salesPersonId);
    return salesPerson ? salesPerson.name : '';
  }

  autoAssign(): void {
    if (this.selectedCount === 0) {
      alert('Please select at least one lead first');
      return;
    }

    if (this.salesPersons.length === 0) {
      alert('No sales team members available');
      return;
    }

    const leastBusySalesPerson = this.salesPersons.reduce((prev, current) =>
      prev.activeLeads < current.activeLeads ? prev : current
    );

    this.assignmentForm.patchValue({
      salesPerson: leastBusySalesPerson.id
    });

    alert(`Auto-assigned to ${leastBusySalesPerson.name} (${leastBusySalesPerson.activeLeads} active leads)`);
  }
}