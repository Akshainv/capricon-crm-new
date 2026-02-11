// src/app/features/quotations/quotation-builder/quotation-builder.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

interface ElevatorType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
}

@Component({
  selector: 'app-quotation-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './quotation-builder.component.html',
  styleUrls: ['./quotation-builder.component.css']
})
export class QuotationBuilderComponent implements OnInit {
  quotationForm!: FormGroup;
  currentStep: number = 1;
  isEditMode: boolean = false;
  quotationId: string | null = null;

  // Mock leads data - Replace with actual service call
  leads: Lead[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+91 9876543210',
      company: 'ABC Corporation',
      address: '123 Business Park, Kochi, Kerala, 682001'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@techcorp.com',
      phone: '+91 9988776655',
      company: 'Tech Corp India',
      address: '456 IT Plaza, Bangalore, Karnataka, 560001'
    },
    {
      id: '3',
      name: 'Rajesh Kumar',
      email: 'rajesh.k@builders.in',
      phone: '+91 9123456789',
      company: 'Kumar Builders & Developers',
      address: '789 Construction Avenue, Mumbai, Maharashtra, 400001'
    },
    {
      id: '4',
      name: 'Priya Sharma',
      email: 'priya.sharma@realestate.com',
      phone: '+91 9845612378',
      company: 'Sharma Real Estate',
      address: '321 Property Lane, Delhi, 110001'
    },
    {
      id: '5',
      name: 'Michael Chen',
      email: 'michael.chen@global.com',
      phone: '+91 9765432109',
      company: 'Global Enterprises',
      address: '567 Trade Center, Chennai, Tamil Nadu, 600001'
    }
  ];

  elevatorTypes: ElevatorType[] = [
    {
      id: 'home',
      name: 'Home Lift',
      icon: '🏠',
      description: 'Compact elevator for private homes'
    },
    {
      id: 'commercial',
      name: 'Commercial Elevator',
      icon: '🏬',
      description: 'High-traffic elevators for commercial spaces'
    },
    {
      id: 'shaft-with',
      name: 'Elevator with Shaft',
      icon: '🔲',
      description: 'Traditional elevator requiring shaft construction'
    },
    {
      id: 'shaft-without',
      name: 'Shaftless Elevator',
      icon: '⬜',
      description: 'Modern elevator without traditional shaft requirements'
    }
  ];

  speedOptions = [
    { value: '1.0', label: '1.0 m/s' },
    { value: '1.5', label: '1.5 m/s' },
    { value: '2.0', label: '2.0 m/s' },
    { value: '2.5', label: '2.5 m/s' }
  ];

  capacityOptions = [
    { value: '630', label: '8 Persons (630 kg)' },
    { value: '800', label: '10 Persons (800 kg)' },
    { value: '1000', label: '13 Persons (1000 kg)' },
    { value: '1250', label: '16 Persons (1250 kg)' }
  ];

  driveTypes = [
    { value: 'vfd', label: 'VFD (Variable Frequency Drive)' },
    { value: 'geared', label: 'Geared Drive' },
    { value: 'gearless', label: 'Gearless Drive' }
  ];

  doorOptions = [
    { value: '1-front', label: '1 Door (Front Only)' },
    { value: '2-front-rear', label: '2 Doors (Front & Rear)' },
    { value: '3-doors', label: '3 Doors' }
  ];

  controlSystems = [
    { value: 'microprocessor', label: 'Microprocessor Based' },
    { value: 'plc', label: 'PLC Based' },
    { value: 'iot', label: 'IoT Enabled' }
  ];

  // Pricing
  basePrice: number = 0;
  installationCost: number = 0;
  amcCost: number = 0;
  subtotal: number = 0;
  cgst: number = 0;
  sgst: number = 0;
  totalAmount: number = 0;

  // Get today's date in YYYY-MM-DD format
  today: string = new Date().toISOString().split('T')[0];
  
  // Get default valid until date (30 days from today)
  defaultValidUntil: string = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    // Check if editing
    this.quotationId = this.route.snapshot.paramMap.get('id');
    if (this.quotationId) {
      this.isEditMode = true;
      this.loadQuotationData(this.quotationId);
    }
  }

  initForm(): void {
    this.quotationForm = this.fb.group({
      // Lead Selection
      selectedLeadId: [''],
      
      // Quote Dates
      quoteDate: [this.today, Validators.required],
      validUntil: [this.defaultValidUntil, Validators.required],

      // Step 1: Customer Details
      customerName: ['', Validators.required],
      customerEmail: ['', [Validators.required, Validators.email]],
      customerPhone: ['', Validators.required],
      customerCompany: [''],
      customerAddress: [''],

      // Step 2: Elevator Configuration
      elevatorType: ['', Validators.required],
      floors: ['', [Validators.required, Validators.min(2)]],
      doors: ['', Validators.required],
      speed: ['', Validators.required],
      capacity: ['', Validators.required],
      driveType: ['', Validators.required],
      controlSystem: ['', Validators.required],

      // Step 3: Additional Options
      includeInstallation: [true],
      includeAmc: [true],
      amcYears: [1],
      specialRequirements: [''],
      notes: ['']
    });

    // Watch for lead selection changes
    this.quotationForm.get('selectedLeadId')?.valueChanges.subscribe(leadId => {
      this.onLeadSelected(leadId);
    });

    // Watch for changes to recalculate pricing
    this.quotationForm.valueChanges.subscribe(() => {
      this.calculatePricing();
    });
  }

  onLeadSelected(leadId: string): void {
    if (!leadId) {
      // Clear customer fields if no lead selected
      this.quotationForm.patchValue({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerCompany: '',
        customerAddress: ''
      });
      return;
    }

    // Find the selected lead
    const selectedLead = this.leads.find(lead => lead.id === leadId);
    
    if (selectedLead) {
      // Autofill customer information from lead
      this.quotationForm.patchValue({
        customerName: selectedLead.name,
        customerEmail: selectedLead.email,
        customerPhone: selectedLead.phone,
        customerCompany: selectedLead.company,
        customerAddress: selectedLead.address
      });
    }
  }

  loadQuotationData(id: string): void {
    // Simulate loading data - replace with actual service call
    const mockData = {
      selectedLeadId: '1',
      quoteDate: '2024-12-20',
      validUntil: '2025-01-20',
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      customerPhone: '+91 9876543210',
      customerCompany: 'ABC Corporation',
      customerAddress: 'Kochi, Kerala',
      elevatorType: 'passenger',
      floors: 8,
      doors: '2-front-rear',
      speed: '1.0',
      capacity: '630',
      driveType: 'vfd',
      controlSystem: 'microprocessor',
      includeInstallation: true,
      includeAmc: true,
      amcYears: 1,
      specialRequirements: '',
      notes: ''
    };
    
    this.quotationForm.patchValue(mockData);
  }

  calculatePricing(): void {
    const formValues = this.quotationForm.value;
    
    if (!formValues.elevatorType || !formValues.floors) {
      return;
    }

    // Base price calculation (simplified)
    let base = 1000000; // Base price
    
    // Price per floor
    base += formValues.floors * 150000;
    
    // Elevator type multiplier
    const typeMultipliers: { [key: string]: number } = {
      'home': 0.8,
      'commercial': 1.2,
      'shaft-with': 1,
      'shaft-without': 1.5
    };
    base *= typeMultipliers[formValues.elevatorType] || 1;

    // Speed adjustment
    const speedPrice: { [key: string]: number } = {
      '1.0': 0,
      '1.5': 150000,
      '2.0': 300000,
      '2.5': 450000
    };
    base += speedPrice[formValues.speed] || 0;

    // Capacity adjustment
    const capacityPrice: { [key: string]: number } = {
      '630': 0,
      '800': 100000,
      '1000': 200000,
      '1250': 350000
    };
    base += capacityPrice[formValues.capacity] || 0;

    this.basePrice = base;
    
    // Installation cost
    this.installationCost = formValues.includeInstallation 
      ? formValues.floors * 25000 
      : 0;
    
    // AMC cost
    this.amcCost = formValues.includeAmc 
      ? 50000 * formValues.amcYears 
      : 0;
    
    // Calculate totals
    this.subtotal = this.basePrice + this.installationCost + this.amcCost;
    this.cgst = this.subtotal * 0.09; // 9% CGST
    this.sgst = this.subtotal * 0.09; // 9% SGST
    this.totalAmount = this.subtotal + this.cgst + this.sgst;
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      // Validate customer details and dates
      const customerFields = ['quoteDate', 'validUntil', 'customerName', 'customerEmail', 'customerPhone'];
      const isValid = customerFields.every(field => 
        this.quotationForm.get(field)?.valid
      );
      
      if (!isValid) {
        this.markFieldsAsTouched(customerFields);
        return;
      }

      // Validate that validUntil is after quoteDate
      const quoteDate = new Date(this.quotationForm.get('quoteDate')?.value);
      const validUntil = new Date(this.quotationForm.get('validUntil')?.value);
      
      if (validUntil <= quoteDate) {
        alert('Valid Until date must be after Quote Date');
        return;
      }
    }

    if (this.currentStep === 2) {
      // Validate elevator config
      const configFields = ['elevatorType', 'floors', 'doors', 'speed', 'capacity', 'driveType', 'controlSystem'];
      const isValid = configFields.every(field => 
        this.quotationForm.get(field)?.valid
      );
      
      if (!isValid) {
        this.markFieldsAsTouched(configFields);
        return;
      }
    }

    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  markFieldsAsTouched(fields: string[]): void {
    fields.forEach(field => {
      this.quotationForm.get(field)?.markAsTouched();
    });
  }

  selectElevatorType(typeId: string): void {
    this.quotationForm.patchValue({ elevatorType: typeId });
  }

  onSubmit(): void {
    if (this.quotationForm.valid) {
      const quotationData = {
        ...this.quotationForm.value,
        pricing: {
          basePrice: this.basePrice,
          installationCost: this.installationCost,
          amcCost: this.amcCost,
          subtotal: this.subtotal,
          cgst: this.cgst,
          sgst: this.sgst,
          totalAmount: this.totalAmount
        }
      };

      console.log('Quotation Data:', quotationData);
      
      // Navigate to preview
      this.router.navigate(['/quotations/preview'], { 
        state: { quotationData } 
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/quotations']);
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.quotationForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }
}