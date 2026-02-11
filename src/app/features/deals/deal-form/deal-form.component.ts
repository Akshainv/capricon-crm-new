// src/app/features/deals/deal-form/deal-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-deal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './deal-form.component.html',
  styleUrls: ['./deal-form.component.css']
})
export class DealFormComponent implements OnInit {
  dealForm!: FormGroup;
  isEditMode: boolean = false;
  dealId: string | null = null;
  isSubmitting: boolean = false;

  elevatorTypes = [
    { value: 'passenger', label: 'Passenger Elevator', icon: '🏢' },
    { value: 'goods', label: 'Goods Elevator', icon: '📦' },
    { value: 'home', label: 'Home Lift', icon: '🏠' },
    { value: 'hospital', label: 'Hospital Elevator', icon: '🏥' },
    { value: 'commercial', label: 'Commercial Elevator', icon: '🏪' }
  ];

  statusOptions = [
    { value: 'new', label: 'New', color: '#60a5fa' },
    { value: 'qualified', label: 'Qualified', color: '#f59e0b' },
    { value: 'quoted', label: 'Quoted', color: '#a855f7' },
    { value: 'negotiation', label: 'Negotiation', color: '#ec4899' },
    { value: 'won', label: 'Won', color: '#22c55e' },
    { value: 'lost', label: 'Lost', color: '#ef4444' }
  ];

  salesTeam = [
    { id: '1', name: 'Rajesh Kumar' },
    { id: '2', name: 'Amit Shah' },
    { id: '3', name: 'Priya Sharma' },
    { id: '4', name: 'Vikram Singh' },
    { id: '5', name: 'Deepak Menon' }
  ];

  leadSources = [
    { value: 'website', label: 'Website' },
    { value: 'walk-in', label: 'Walk-in' },
    { value: 'reference', label: 'Reference' },
    { value: 'phone', label: 'Phone Call' },
    { value: 'email', label: 'Email' },
    { value: 'social-media', label: 'Social Media' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForm();

    // Check if editing
    this.dealId = this.route.snapshot.paramMap.get('id');
    if (this.dealId) {
      this.isEditMode = true;
      this.loadDealData(this.dealId);
    }
  }

  initForm(): void {
    this.dealForm = this.fb.group({
      // Basic Information
      title: ['', Validators.required],
      company: ['', Validators.required],
      contactPerson: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],

      // Deal Details
      elevatorType: ['', Validators.required],
      floors: ['', [Validators.required, Validators.min(1)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      amount: ['', [Validators.required, Validators.min(0)]],

      // Sales Information
      status: ['new', Validators.required],
      probability: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      expectedCloseDate: ['', Validators.required],
      assignedTo: ['', Validators.required],
      leadSource: ['', Validators.required],

      // Additional Information
      address: [''],
      requirements: [''],
      notes: ['']
    });
  }

  loadDealData(id: string): void {
    // Simulate loading data - replace with actual service call
    const mockData = {
      title: 'ABC Corporation Deal',
      company: 'ABC Corporation',
      contactPerson: 'John Smith',
      email: 'john@abccorp.com',
      phone: '+91 9876543210',
      elevatorType: 'passenger',
      floors: 8,
      quantity: 1,
      amount: 1829000,
      status: 'qualified',
      probability: 75,
      expectedCloseDate: '2024-11-15',
      assignedTo: '1',
      leadSource: 'website',
      address: 'Infopark, Kochi, Kerala',
      requirements: '8-floor passenger elevator with VFD control',
      notes: 'High priority client, regular follow-ups needed'
    };

    this.dealForm.patchValue(mockData);
  }

  onSubmit(): void {
    if (this.dealForm.valid) {
      this.isSubmitting = true;

      const dealData = this.dealForm.value;
      console.log('Deal Data:', dealData);

      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;

        if (this.isEditMode) {
          alert('Deal updated successfully!');
        } else {
          alert('Deal created successfully!');
        }

        this.router.navigate(['/deals']);
      }, 1000);

      // TODO: Replace with actual API call
      // if (this.isEditMode) {
      //   this.dealService.updateDeal(this.dealId, dealData).subscribe(...)
      // } else {
      //   this.dealService.createDeal(dealData).subscribe(...)
      // }
    } else {
      this.markFormGroupTouched(this.dealForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      this.router.navigate(['/deals']);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.dealForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.dealForm.get(fieldName);

    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }
    if (control?.hasError('min')) {
      return `Minimum value is ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `Maximum value is ${control.errors?.['max'].max}`;
    }

    return '';
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  // Calculate estimated value based on floors and elevator type
  calculateEstimate(): void {
    const floors = this.dealForm.get('floors')?.value;
    const elevatorType = this.dealForm.get('elevatorType')?.value;
    const quantity = this.dealForm.get('quantity')?.value || 1;

    if (floors && elevatorType) {
      let basePrice = 1000000; // Base price
      let floorMultiplier = floors * 150000;

      const typeMultipliers: { [key: string]: number } = {
        'passenger': 1,
        'goods': 1.5,
        'home': 0.8,
        'hospital': 1.3,
        'commercial': 1.2
      };

      const estimate = (basePrice + floorMultiplier) * (typeMultipliers[elevatorType] || 1) * quantity;
      this.dealForm.patchValue({ amount: Math.round(estimate) });
    }
  }
}