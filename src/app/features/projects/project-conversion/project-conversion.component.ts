// src/app/features/projects/project-conversion/project-conversion.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

interface Deal {
  id: string;
  title: string;
  company: string;
  amount: number;
  elevatorType: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

@Component({
  selector: 'app-project-conversion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-conversion.component.html',
  styleUrls: ['./project-conversion.component.css']
})
export class ProjectConversionComponent implements OnInit {
  conversionForm!: FormGroup;
  isSubmitting: boolean = false;
  dealData: Deal | null = null;

  teamLeaders: TeamMember[] = [
    { id: '1', name: 'Suresh Menon', role: 'Senior Engineer' },
    { id: '2', name: 'Arun Kumar', role: 'Project Manager' },
    { id: '3', name: 'Deepak Singh', role: 'Installation Head' },
    { id: '4', name: 'Ravi Krishnan', role: 'Senior Technician' }
  ];

  teamMembers: TeamMember[] = [
    { id: '1', name: 'Ravi Krishnan', role: 'Technician' },
    { id: '2', name: 'Manoj Kumar', role: 'Electrician' },
    { id: '3', name: 'Vinod Thomas', role: 'Helper' },
    { id: '4', name: 'Anil Kumar', role: 'Technician' },
    { id: '5', name: 'Rajesh Nair', role: 'Welder' },
    { id: '6', name: 'Sunil Varma', role: 'Fitter' }
  ];

  selectedMembers: string[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Get deal data from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['deal']) {
      this.dealData = navigation.extras.state['deal'];
    }
  }

  ngOnInit(): void {
    this.initForm();
    
    // Check if deal ID is passed via route
    const dealId = this.route.snapshot.queryParamMap.get('dealId');
    if (dealId && !this.dealData) {
      this.loadDealData(dealId);
    }

    if (!this.dealData) {
      // If no deal data, redirect back to deals
      alert('No deal selected. Please select a won deal to convert.');
      this.router.navigate(['/deals']);
    }
  }

  initForm(): void {
    const today = new Date();
    const startDate = new Date(today.setDate(today.getDate() + 7));
    const endDate = new Date(today.setDate(today.getDate() + 60));

    this.conversionForm = this.fb.group({
      projectName: [
        this.dealData ? `${this.dealData.company} - ${this.dealData.elevatorType} Installation` : '',
        Validators.required
      ],
      projectCode: [this.generateProjectCode(), Validators.required],
      teamLeader: ['', Validators.required],
      startDate: [this.formatDate(startDate), Validators.required],
      completionDate: [this.formatDate(endDate), Validators.required],
      siteAddress: ['', Validators.required],
      contactPerson: [this.dealData?.contactPerson || '', Validators.required],
      contactPhone: [this.dealData?.phone || '', Validators.required],
      contactEmail: [this.dealData?.email || ''],
      specifications: [''],
      specialRequirements: [''],
      handoverNotes: ['']
    });
  }

  loadDealData(dealId: string): void {
    // Simulate API call - replace with actual service
    this.dealData = {
      id: dealId,
      title: 'Sunrise Mall',
      company: 'Sunrise Mall Pvt Ltd',
      amount: 4500000,
      elevatorType: '15-Floor Passenger Elevator',
      contactPerson: 'John Smith',
      email: 'john@sunrisemall.com',
      phone: '+91 9876543210'
    };

    this.conversionForm.patchValue({
      projectName: `${this.dealData.company} - ${this.dealData.elevatorType} Installation`,
      contactPerson: this.dealData.contactPerson,
      contactPhone: this.dealData.phone,
      contactEmail: this.dealData.email
    });
  }

  generateProjectCode(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PRJ-${year}-${random}`;
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  toggleTeamMember(memberId: string): void {
    const index = this.selectedMembers.indexOf(memberId);
    if (index > -1) {
      this.selectedMembers.splice(index, 1);
    } else {
      this.selectedMembers.push(memberId);
    }
  }

  isSelected(memberId: string): boolean {
    return this.selectedMembers.includes(memberId);
  }

  getSelectedMembersNames(): string {
    return this.teamMembers
      .filter(m => this.selectedMembers.includes(m.id))
      .map(m => m.name)
      .join(', ');
  }

  onSubmit(): void {
    if (this.conversionForm.valid && this.selectedMembers.length > 0) {
      this.isSubmitting = true;

      const projectData = {
        ...this.conversionForm.value,
        dealId: this.dealData?.id,
        dealAmount: this.dealData?.amount,
        teamMembers: this.selectedMembers,
        status: 'planning',
        createdAt: new Date().toISOString()
      };

      console.log('Project Data:', projectData);

      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        alert('Project created successfully!');
        this.router.navigate(['/projects']);
      }, 1500);

      // TODO: Replace with actual API call
      // this.projectService.createProject(projectData).subscribe(...)
    } else {
      if (this.selectedMembers.length === 0) {
        alert('Please select at least one team member');
      }
      this.markFormGroupTouched(this.conversionForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  cancel(): void {
    if (confirm('Are you sure? Project conversion will be cancelled.')) {
      this.router.navigate(['/deals']);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.conversionForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.conversionForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}