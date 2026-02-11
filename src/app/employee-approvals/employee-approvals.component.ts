import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService } from '../../employee/employee.service';
import { AuthService } from '../services/auth.service';

declare var Toastify: any;

interface EmployeeRegistration {
  _id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  photo?: string;
  status: 'pending' | 'accept' | 'reject';
  createdAt?: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-employee-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-approvals.component.html',
  styleUrls: ['./employee-approvals.component.css']
})
export class EmployeeApprovalsComponent implements OnInit {
  filterStatus: string = 'pending';
  searchQuery: string = '';
  
  totalRegistrations: number = 0;
  pendingCount: number = 0;
  approvedCount: number = 0;
  rejectedCount: number = 0;

  allEmployees: EmployeeRegistration[] = [];
  filteredEmployees: EmployeeRegistration[] = [];
  selectedEmployee: EmployeeRegistration | null = null;
  
  currentPage: number = 1;
  itemsPerPage: number = 7;
  totalPages: number = 0;
  paginatedEmployees: EmployeeRegistration[] = [];
  
  showDetailModal: boolean = false;
  isLoading: boolean = false;

  currentAdminName: string = '';

  Math = Math;

  constructor(
    private router: Router,
    private employeeService: EmployeeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    this.currentAdminName = currentUser?.email || 'Admin';
    
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading = true;

    this.employeeService.getAllEmployees().subscribe({
      next: (employees: any[]) => {
        console.log('Employees loaded:', employees);
        this.allEmployees = employees.map(emp => ({
          _id: emp._id,
          employeeId: emp.employeeId,
          fullName: emp.fullName,
          email: emp.email,
          phoneNumber: emp.phoneNumber,
          photo: emp.photo,
          status: emp.status,
          createdAt: emp.createdAt,
          updatedAt: emp.updatedAt
        }));
        
        this.calculateStatistics();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading employees:', error);
        this.isLoading = false;
        this.showToast('Failed to load employee registrations. Please try again.', 'error');
        
        if (error.status === 401) {
          this.showToast('Session expired. Please login again.', 'warning');
          setTimeout(() => this.authService.logout(), 2000);
        }
      }
    });
  }

  calculateStatistics(): void {
    this.totalRegistrations = this.allEmployees.length;
    this.pendingCount = this.allEmployees.filter(e => e.status === 'pending').length;
    this.approvedCount = this.allEmployees.filter(e => e.status === 'accept').length;
    this.rejectedCount = this.allEmployees.filter(e => e.status === 'reject').length;
  }

  applyFilters(): void {
    let filtered = [...this.allEmployees];

    const statusMap: { [key: string]: string } = {
      'pending': 'pending',
      'approved': 'accept'
    };
    filtered = filtered.filter(emp => emp.status === statusMap[this.filterStatus]);

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(emp => 
        emp.fullName.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.phoneNumber.includes(query) ||
        emp.employeeId.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    this.filteredEmployees = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEmployees = this.filteredEmployees.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  viewDetails(employee: EmployeeRegistration): void {
    this.selectedEmployee = employee;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedEmployee = null;
  }

  approveEmployee(employee: EmployeeRegistration): void {
    this.isLoading = true;

    this.employeeService.approveEmployee(employee._id).subscribe({
      next: (response: any) => {
        console.log('Employee approved:', response);

        const index = this.allEmployees.findIndex(e => e._id === employee._id);
        if (index > -1) {
          this.allEmployees[index].status = 'accept';
          this.allEmployees[index].updatedAt = new Date();
        }

        this.calculateStatistics();
        this.applyFilters();
        this.isLoading = false;

        this.showToast('Employee approved successfully!', 'success');
      },
      error: (error: any) => {
        console.error('Error approving employee:', error);
        this.isLoading = false;
        this.showToast(error.error?.message || 'Failed to approve employee. Please try again.', 'error');
      }
    });
  }

  rejectEmployee(employee: EmployeeRegistration): void {
    this.isLoading = true;

    this.employeeService.rejectEmployee(employee._id).subscribe({
      next: (response: any) => {
        console.log('Employee rejected:', response);

        const index = this.allEmployees.findIndex(e => e._id === employee._id);
        if (index > -1) {
          this.allEmployees[index].status = 'reject';
          this.allEmployees[index].updatedAt = new Date();
        }

        this.calculateStatistics();
        this.applyFilters();
        this.isLoading = false;

        this.showToast('Employee registration rejected.', 'warning');
      },
      error: (error: any) => {
        console.error('Error rejecting employee:', error);
        this.isLoading = false;
        this.showToast(error.error?.message || 'Failed to reject employee. Please try again.', 'error');
      }
    });
  }

  deleteEmployee(employee: EmployeeRegistration): void {
    if (typeof Toastify !== 'undefined') {
      const toast = Toastify({
        text: `Are you sure you want to permanently delete ${employee.fullName}? This action cannot be undone.`,
        duration: -1,
        close: true,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        style: {
          background: "linear-gradient(to right, #ff5f6d, #ffc371)",
          borderRadius: "12px",
          fontSize: "15px",
          fontWeight: "500",
          textAlign: "center",
          maxWidth: "420px",
          padding: "20px"
        }
      }).showToast();

      // Wait a tick for toast to render, then inject buttons
      setTimeout(() => {
        const toastElement = document.querySelector('.toastify') as HTMLElement;
        if (toastElement) {
          const buttonsHTML = `
            <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
              <button id="toast-confirm-delete" style="padding: 10px 24px; background: #ff5f6d; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Yes, Delete Permanently
              </button>
              <button id="toast-cancel-delete" style="padding: 10px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Cancel
              </button>
            </div>
          `;
          toastElement.insertAdjacentHTML('beforeend', buttonsHTML);

          document.getElementById('toast-confirm-delete')?.addEventListener('click', () => {
            toast.hideToast();  // Properly hide this specific toast
            this.proceedDeleteEmployee(employee);
          });

          document.getElementById('toast-cancel-delete')?.addEventListener('click', () => {
            toast.hideToast();  // Properly hide this specific toast
            this.showToast('Delete cancelled', 'info');
          });
        }
      }, 100);
    } else {
      if (confirm(`Are you sure you want to permanently delete ${employee.fullName}? This action cannot be undone.`)) {
        this.proceedDeleteEmployee(employee);
      }
    }
  }

  private proceedDeleteEmployee(employee: EmployeeRegistration): void {
    this.isLoading = true;

    this.employeeService.deleteEmployee(employee._id).subscribe({
      next: (response: any) => {
        console.log('Employee deleted:', response);
        
        const index = this.allEmployees.findIndex(e => e._id === employee._id);
        if (index > -1) {
          this.allEmployees.splice(index, 1);
        }
        
        this.calculateStatistics();
        this.applyFilters();
        this.closeDetailModal();
        this.isLoading = false;
        
        this.showToast('Employee record deleted permanently.', 'success');
      },
      error: (error: any) => {
        console.error('Error deleting employee:', error);
        this.isLoading = false;
        this.showToast(error.error?.message || 'Failed to delete employee. Please try again.', 'error');
      }
    });
  }

  refreshData(): void {
    this.loadEmployees();
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'status-pending',
      'accept': 'status-approved',
      'reject': 'status-rejected'
    };
    return statusClasses[status] || '';
  }

  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'pending': 'fa-clock',
      'accept': 'fa-check-circle',
      'reject': 'fa-times-circle'
    };
    return statusIcons[status] || 'fa-question-circle';
  }

  getStatusDisplay(status: string): string {
    const statusDisplay: { [key: string]: string } = {
      'pending': 'Pending',
      'accept': 'Approved',
      'reject': 'Rejected'
    };
    return statusDisplay[status] || status;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(date?: Date | string): string {
    if (!date) {
      return 'N/A';
    }
    
    const now = new Date();
    const targetDate = new Date(date);
    const diff = now.getTime() - targetDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} minutes ago`;
      }
      return `${hours} hours ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return targetDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    if (typeof Toastify !== 'undefined') {
      const backgroundColor = 
        type === 'success' ? 'linear-gradient(to right, #00b09b, #96c93d)' :
        type === 'error' ? 'linear-gradient(to right, #ff5f6d, #ffc371)' :
        type === 'warning' ? 'linear-gradient(to right, #f39c12, #e67e22)' :
        'linear-gradient(to right, #667eea, #764ba2)';

      Toastify({
        text: message,
        duration: 4000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
          background: backgroundColor,
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: "500"
        }
      }).showToast();
    } else {
      alert(message);
    }
  }
}