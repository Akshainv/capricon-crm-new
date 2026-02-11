// src/app/features/leads/lead-form/lead-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-lead-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lead-form.component.html',
  styleUrls: ['./lead-form.component.css']
})
export class LeadFormComponent implements OnInit {
  leadForm!: FormGroup;
  isEditMode = false;
  leadId: string | null = null;

  sources = ['Walk-in', 'Website', 'Reference', 'Phone Call', 'Email', 'Social Media'];
  salesPersons = ['Rajesh Kumar', 'Amit Shah', 'Priya Sharma', 'Vikram Singh'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForm();

    // Check if editing
    this.leadId = this.route.snapshot.paramMap.get('id');
    if (this.leadId) {
      this.isEditMode = true;
      this.loadLeadData(this.leadId);
    }
  }

  initForm(): void {
    this.leadForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-()]+$/)]],
      company: [''],
      source: ['', Validators.required],
      assignedTo: ['', Validators.required],
      notes: ['']
    });
  }

  loadLeadData(id: string): void {
    // Simulate loading data - replace with actual service call
    const mockData = {
      name: 'John Smith',
      email: 'john@example.com',
      phone: '+91 9876543210',
      company: 'ABC Corporation',
      source: 'Website',
      assignedTo: 'Rajesh Kumar',
      notes: 'Interested in 8-floor passenger elevator'
    };

    this.leadForm.patchValue(mockData);
  }

  onSubmit(): void {
    if (this.leadForm.valid) {
      const formData = this.leadForm.value;
      console.log('Form Data:', formData);

      // Implement save logic here
      if (this.isEditMode) {
        console.log('Updating lead:', this.leadId);
      } else {
        console.log('Creating new lead');
      }

      // Navigate back to leads list
      this.router.navigate(['/leads']);
    } else {
      this.markFormGroupTouched(this.leadForm);
    }
  }

  onCancel(): void {
    this.router.navigate(['/leads']);
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.leadForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.leadForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'This field is required';
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email';
    }
    if (field?.hasError('minlength')) {
      return 'Name must be at least 2 characters';
    }
    if (field?.hasError('pattern')) {
      return 'Please enter a valid phone number';
    }

    return '';
  }
}