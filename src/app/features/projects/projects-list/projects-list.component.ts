// src/app/features/projects/projects-list/projects-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProjectService, Project } from '../../../services/project.service';
import { EmployeeService, Employee } from '../../../../employee/employee.service';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.css']
})
export class ProjectsListComponent implements OnInit {
  searchTerm: string = '';
  selectedFilter: string = 'all';
  projects: Project[] = [];
  employees: Employee[] = [];
  loading: boolean = false;
  highlightedProjectId: string | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 7;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadProjects();

    this.route.queryParams.subscribe(params => {
      if (params['newProject'] && params['highlight'] === 'true') {
        this.highlightedProjectId = params['newProject'];
        
        setTimeout(() => {
          this.highlightedProjectId = null;
        }, 3000);
      }
    });
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

  loadProjects(): void {
    this.loading = true;

    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.loading = false;
        alert('Failed to load projects. Please try again.');
      }
    });
  }

  getFilteredProjects(): Project[] {
    let filtered = this.projects;

    // Apply status filter
    if (this.selectedFilter !== 'all') {
      if (this.selectedFilter === 'planning') {
        filtered = filtered.filter(p => p.projectStatus === 'planning' || p.projectStatus === 'not_started');
      } else {
        filtered = filtered.filter(p => p.projectStatus === this.selectedFilter);
      }
    }

    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => {
        // Search in project name
        const matchesProjectName = p.projectName && p.projectName.toLowerCase().includes(term);
        
        // Search in client name
        const matchesClientName = p.clientName && p.clientName.toLowerCase().includes(term);
        
        // Search in project code
        const matchesProjectCode = p.projectCode && p.projectCode.toLowerCase().includes(term);
        
        // Search in sales person name
        const salesPersonName = this.getSalesPersonName(p.assignedTo).toLowerCase();
        const matchesSalesPerson = salesPersonName.includes(term);
        
        // Search in site address
        const matchesSiteAddress = p.siteAddress && p.siteAddress.toLowerCase().includes(term);
        
        // Search in elevator type
        const matchesElevatorType = p.elevatorType && p.elevatorType.toLowerCase().includes(term);
        
        return matchesProjectName || matchesClientName || matchesProjectCode || 
               matchesSalesPerson || matchesSiteAddress || matchesElevatorType;
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

  getTotalValue(): number {
    return this.projects.reduce((sum, project) => sum + project.projectValue, 0);
  }

  getTotalAmountPaid(): number {
    return this.projects.reduce((sum, project) => sum + (project.amountPaid || 0), 0);
  }

  getTotalAmountPending(): number {
    return this.projects.reduce((sum, project) => sum + (project.amountPending || project.projectValue), 0);
  }

  getActiveProjects(): number {
    return this.projects.filter(p => p.projectStatus === 'in_progress').length;
  }

  getCompletedProjects(): number {
    return this.projects.filter(p => p.projectStatus === 'completed').length;
  }

  getPlanningProjects(): number {
    return this.projects.filter(p => p.projectStatus === 'planning' || p.projectStatus === 'not_started').length;
  }

  viewProject(project: Project): void {
    const projectId = project._id || project.id;
    this.router.navigate(['/projects', projectId]);
  }

  isHighlighted(project: Project): boolean {
    const projectId = project._id || project.id;
    return projectId === this.highlightedProjectId;
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  formatDate(date: Date | string): string {
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
}