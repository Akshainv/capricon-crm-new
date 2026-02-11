// src/app/sales-my-projects/sales-my-projects.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService, Project as BackendProject } from '../services/project.service';
import { EmployeeService,Employee } from '../../employee/employee.service';
import { AuthService } from '../services/auth.service';
import { interval, Subscription } from 'rxjs';

interface Project {
  id: string;
  name: string;
  projectCode: string;
  customer: string;
  value: number;
  teamLeader: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'not_started';
  progress: number;
  startDate: Date;
  expectedCompletion: Date;
  salesExecutive: string;
  salesExecutiveId: string;
  currentMilestone: string;
  lastUpdatedAt?: Date;
  lastUpdatedBy?: string;
  _id?: string;
}

@Component({
  selector: 'app-sales-my-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-my-projects.component.html',
  styleUrls: ['./sales-my-projects.component.css']
})
export class SalesMyProjectsComponent implements OnInit, OnDestroy {
  searchTerm: string = '';
  selectedFilter: string = 'all';
  currentUser: string = '';
  currentUserId: string = '';
  
  projects: Project[] = [];
  employees: Employee[] = [];
  loading: boolean = false;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 7;
  
  // Auto-refresh subscription
  private refreshSubscription?: Subscription;

  constructor(
    public router: Router,
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentUser = currentUser.fullName || currentUser.email || 'User';
      this.currentUserId = currentUser.userId || '';
    }
    
    this.loadEmployees();
    this.loadMyProjects();
    
    // Auto-refresh every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadMyProjects(true); // Silent refresh
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadEmployees(): void {
    this.employeeService.getAllEmployees().subscribe({
      next: (employees) => {
        this.employees = employees;
        console.log('✅ Employees loaded:', employees);
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  loadMyProjects(silent: boolean = false): void {
    if (!silent) {
      this.loading = true;
    }

    if (!this.currentUserId) {
      console.error('No user ID found');
      this.loading = false;
      return;
    }

    console.log('Loading projects for user:', this.currentUserId);

    this.projectService.getProjectsBySalesExecutive(this.currentUserId).subscribe({
      next: (backendProjects) => {
        console.log('Loaded projects:', backendProjects);
        this.projects = this.mapBackendProjects(backendProjects);
        if (!silent) {
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        if (!silent) {
          this.loading = false;
          alert('Failed to load projects. Please try again.');
        }
      }
    });
  }

  private mapBackendProjects(backendProjects: BackendProject[]): Project[] {
    return backendProjects.map(bp => ({
      id: bp._id || bp.id || '',
      _id: bp._id || bp.id,
      name: bp.projectName,
      projectCode: bp.projectCode,
      customer: bp.clientName,
      value: bp.projectValue,
      teamLeader: bp.projectManager || 'Not Assigned',
      status: this.mapProjectStatus(bp.projectStatus),
      progress: bp.progressPercentage,
      startDate: new Date(bp.startDate),
      expectedCompletion: new Date(bp.expectedCompletionDate),
      salesExecutive: this.getSalesPersonName(bp.assignedTo),
      salesExecutiveId: bp.assignedTo,
      currentMilestone: bp.currentMilestone || 'planning',
      lastUpdatedAt: bp.lastProgressUpdate ? new Date(bp.lastProgressUpdate) : undefined,
      lastUpdatedBy: this.getSalesPersonName(bp.assignedTo)
    }));
  }

  private mapProjectStatus(status: string): 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'not_started' {
    const statusMap: { [key: string]: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'not_started' } = {
      'planning': 'planning',
      'not_started': 'not_started',
      'in_progress': 'in_progress',
      'on_hold': 'on_hold',
      'completed': 'completed'
    };
    return statusMap[status] || 'planning';
  }

  getSalesPersonName(userId: string): string {
    console.log('Looking for employee with ID:', userId);
    console.log('Available employees:', this.employees);
    
    // Find employee by _id
    const employee = this.employees.find(emp => emp._id === userId);
    
    if (employee) {
      console.log('✅ Found employee:', employee.fullName);
      return employee.fullName;
    }
    
    console.log('❌ Employee not found, returning default');
    return 'Sales Executive';
  }

  getFilteredProjects(): Project[] {
    let filtered = this.projects;

    // Apply status filter
    if (this.selectedFilter !== 'all') {
      if (this.selectedFilter === 'planning') {
        filtered = filtered.filter(p => p.status === 'planning' || p.status === 'not_started');
      } else {
        filtered = filtered.filter(p => p.status === this.selectedFilter);
      }
    }

    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const matchesProjectName = p.name && p.name.toLowerCase().includes(term);
        const matchesCustomer = p.customer && p.customer.toLowerCase().includes(term);
        const matchesProjectCode = p.projectCode && p.projectCode.toLowerCase().includes(term);
        const matchesSalesPerson = p.salesExecutive.toLowerCase().includes(term);
        
        return matchesProjectName || matchesCustomer || matchesProjectCode || matchesSalesPerson;
      });
    }

    return filtered;
  }

  getPaginatedProjects(): Project[] {
    const filtered = this.getFilteredProjects();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    const totalItems = this.getFilteredProjects().length;
    return Math.ceil(totalItems / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'planning': '#60a5fa',
      'not_started': '#60a5fa',
      'in_progress': '#f59e0b',
      'on_hold': '#ec4899',
      'completed': '#22c55e',
      'cancelled': '#ef4444'
    };
    return colors[status] || '#999';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'planning': 'fa-clipboard-list',
      'not_started': 'fa-clipboard-list',
      'in_progress': 'fa-spinner',
      'on_hold': 'fa-pause-circle',
      'completed': 'fa-check-circle',
      'cancelled': 'fa-times-circle'
    };
    return icons[status] || 'fa-circle';
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return '#22c55e';
    if (progress >= 50) return '#f59e0b';
    return '#ef4444';
  }

  getTotalValue(): number {
    return this.projects.reduce((sum, project) => sum + project.value, 0);
  }

  getActiveProjects(): number {
    return this.projects.filter(p => p.status === 'in_progress').length;
  }

  getCompletedProjects(): number {
    return this.projects.filter(p => p.status === 'completed').length;
  }

  getPlanningProjects(): number {
    return this.projects.filter(p => p.status === 'planning' || p.status === 'not_started').length;
  }

  viewProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  formatDate(date: Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.currentPage = 1; // Reset to first page on search
    console.log('🔍 Search term:', this.searchTerm);
    console.log('📊 Filtered projects count:', this.getFilteredProjects().length);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
  }

  filterByStatus(status: string): void {
    this.selectedFilter = status;
    this.currentPage = 1;
  }

  refreshProjects(): void {
    this.loadMyProjects();
  }
}