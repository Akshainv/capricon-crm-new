import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
}

@Component({
  selector: 'app-task-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.css']
})
export class TaskDashboardComponent implements OnInit {
  taskForm!: FormGroup;
  loading: boolean = false;
  
  // Search states
  employeeSearchTerm: string = '';
  projectSearchTerm: string = '';
  showEmployeeDropdown: boolean = false;
  showProjectDropdown: boolean = false;
  
  selectedEmployee: Employee | null = null;
  selectedProject: Project | null = null;

  // Mock data - Replace with API calls
  employees: Employee[] = [
    { id: 'E001', name: 'Rajesh Kumar', email: 'rajesh@company.com', department: 'Sales', role: 'Sales Executive' },
    { id: 'E002', name: 'Priya Sharma', email: 'priya@company.com', department: 'Sales', role: 'Sales Manager' },
    { id: 'E003', name: 'Amit Shah', email: 'amit@company.com', department: 'Technical', role: 'Engineer' },
    { id: 'E004', name: 'Vikram Singh', email: 'vikram@company.com', department: 'Operations', role: 'Project Manager' },
    { id: 'E005', name: 'Sneha Patel', email: 'sneha@company.com', department: 'Sales', role: 'Sales Representative' },
    { id: 'E006', name: 'Rahul Verma', email: 'rahul@company.com', department: 'Technical', role: 'Senior Engineer' },
    { id: 'E007', name: 'Kavita Nair', email: 'kavita@company.com', department: 'Marketing', role: 'Marketing Manager' },
    { id: 'E008', name: 'Arjun Reddy', email: 'arjun@company.com', department: 'Operations', role: 'Operations Head' }
  ];

  projects: Project[] = [
    { id: 'P001', name: 'ABC Tower Elevators', client: 'ABC Corporation', status: 'In Progress' },
    { id: 'P002', name: 'XYZ Mall Installation', client: 'XYZ Developers', status: 'Planning' },
    { id: 'P003', name: 'City Hospital Lift System', client: 'City Hospital', status: 'In Progress' },
    { id: 'P004', name: 'Residential Complex Project', client: 'Green Homes Ltd', status: 'Completed' },
    { id: 'P005', name: 'Tech Park Elevator Modernization', client: 'Tech Park Management', status: 'In Progress' },
    { id: 'P006', name: 'Metro Station Lift Installation', client: 'Metro Rail Corporation', status: 'Planning' },
    { id: 'P007', name: 'Shopping Complex Elevators', client: 'Retail Developers Inc', status: 'In Progress' }
  ];

  filteredEmployees: Employee[] = [];
  filteredProjects: Project[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.filteredEmployees = [...this.employees];
    this.filteredProjects = [...this.projects];
  }

  initForm(): void {
    // Simplified: Only description is required
    this.taskForm = this.fb.group({
      description: ['', Validators.required]
    });
  }

  // Employee Search Methods (unchanged)
  onEmployeeSearch(): void {
    const term = this.employeeSearchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredEmployees = [...this.employees];
    } else {
      this.filteredEmployees = this.employees.filter(emp =>
        emp.name.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.department.toLowerCase().includes(term) ||
        emp.role.toLowerCase().includes(term)
      );
    }
  }

  onEmployeeSearchFocus(): void {
    this.showEmployeeDropdown = true;
    this.onEmployeeSearch();
  }

  onEmployeeSearchBlur(): void {
    setTimeout(() => this.showEmployeeDropdown = false, 200);
  }

  selectEmployee(employee: Employee): void {
    this.selectedEmployee = employee;
    this.employeeSearchTerm = employee.name;
    this.showEmployeeDropdown = false;
  }

  clearEmployeeSearch(): void {
    this.employeeSearchTerm = '';
    this.selectedEmployee = null;
    this.filteredEmployees = [...this.employees];
  }

  // Project Search Methods (unchanged)
  onProjectSearch(): void {
    const term = this.projectSearchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredProjects = [...this.projects];
    } else {
      this.filteredProjects = this.projects.filter(proj =>
        proj.name.toLowerCase().includes(term) ||
        proj.client.toLowerCase().includes(term) ||
        proj.id.toLowerCase().includes(term)
      );
    }
  }

  onProjectSearchFocus(): void {
    this.showProjectDropdown = true;
    this.onProjectSearch();
  }

  onProjectSearchBlur(): void {
    setTimeout(() => this.showProjectDropdown = false, 200);
  }

  selectProject(project: Project): void {
    this.selectedProject = project;
    this.projectSearchTerm = project.name;
    this.showProjectDropdown = false;
  }

  clearProjectSearch(): void {
    this.projectSearchTerm = '';
    this.selectedProject = null;
    this.filteredProjects = [...this.projects];
  }

  onSubmit(): void {
    if (this.taskForm.valid && this.selectedEmployee) {
      this.loading = true;

      const formData = this.taskForm.value;

      const taskData = {
        description: formData.description.trim(),
        assignedTo: this.selectedEmployee.id,
        assignedToName: this.selectedEmployee.name,
        projectId: this.selectedProject?.id || null,
        projectName: this.selectedProject?.name || null,
        createdAt: new Date(),
        status: 'pending'
      };

      console.log('Task Data:', taskData);

      // Simulate API call
      setTimeout(() => {
        this.loading = false;
        alert(`Task assigned to ${taskData.assignedToName} successfully!\nDescription: ${taskData.description}`);
        this.resetForm();
      }, 1000);
    } else {
      if (!this.selectedEmployee) {
        alert('Please select an employee to assign the task.');
      } else {
        alert('Please enter a task description.');
      }
    }
  }

  resetForm(): void {
    this.taskForm.reset();
    this.employeeSearchTerm = '';
    this.projectSearchTerm = '';
    this.selectedEmployee = null;
    this.selectedProject = null;
    this.filteredEmployees = [...this.employees];
    this.filteredProjects = [...this.projects];
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      this.router.navigate(['/tasks']);
    }
  }
}