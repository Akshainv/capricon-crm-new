// src/app/features/reports/custom-report-builder/custom-report-builder.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-custom-report-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './custom-report-builder.component.html',
  styleUrls: ['./custom-report-builder.component.css']
})
export class CustomReportBuilderComponent implements OnInit {
  reportForm!: FormGroup;
  isGenerating: boolean = false;

  reportTemplates: ReportTemplate[] = [
    {
      id: 'leads',
      name: 'Leads Performance',
      description: 'Analyze lead generation and conversion',
      icon: 'fa-users',
      color: '#3b82f6'
    },
    {
      id: 'sales',
      name: 'Sales Revenue',
      description: 'Track sales performance and revenue',
      icon: 'fa-chart-line',
      color: '#22c55e'
    },
    {
      id: 'quotations',
      name: 'Quotation Analysis',
      description: 'Review quotation success rates',
      icon: 'fa-file-invoice',
      color: '#a855f7'
    },
    {
      id: 'pipeline',
      name: 'Deal Pipeline',
      description: 'Monitor deals through pipeline stages',
      icon: 'fa-filter',
      color: '#f59e0b'
    },
    {
      id: 'salesperson',
      name: 'Salesperson Performance',
      description: 'Compare team member performance',
      icon: 'fa-user-tie',
      color: '#ec4899'
    },
    {
      id: 'customer',
      name: 'Customer Activity',
      description: 'Track customer engagement',
      icon: 'fa-building',
      color: '#8b5cf6'
    }
  ];

  reportFormats = [
    { value: 'pdf', label: 'PDF Document', icon: 'fa-file-pdf' },
    { value: 'excel', label: 'Excel Spreadsheet', icon: 'fa-file-excel' },
    { value: 'csv', label: 'CSV File', icon: 'fa-file-csv' }
  ];

  salesTeam = [
    { id: 'all', name: 'All Team Members' },
    { id: '1', name: 'Rajesh Kumar' },
    { id: '2', name: 'Amit Shah' },
    { id: '3', name: 'Priya Sharma' },
    { id: '4', name: 'Vikram Singh' },
    { id: '5', name: 'Deepak Menon' }
  ];

  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Seeded Lead', label: 'Seeded Lead' },
    { value: 'Meeting Fixed', label: 'Meeting Fixed' },
    { value: 'Meeting Completed', label: 'Meeting Completed' },
    { value: 'CS Executed', label: 'CS Executed' }
  ];

  includeOptions = [
    { id: 'summary', label: 'Executive Summary', checked: true },
    { id: 'revenue', label: 'Revenue Analysis', checked: true },
    { id: 'conversion', label: 'Conversion Metrics', checked: true },
    { id: 'timeline', label: 'Activity Timeline', checked: false },
    { id: 'charts', label: 'Charts & Graphs', checked: true },
    { id: 'detailed', label: 'Detailed Lead List', checked: false }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.reportForm = this.fb.group({
      reportType: ['', Validators.required],
      reportFormat: ['pdf', Validators.required],
      dateFrom: [this.formatDate(firstDayOfMonth), Validators.required],
      dateTo: [this.formatDate(lastDayOfMonth), Validators.required],
      salesPerson: ['all'],
      status: ['all'],
      reportName: ['', Validators.required],
      description: ['']
    });
  }

  selectTemplate(template: ReportTemplate): void {
    this.reportForm.patchValue({
      reportType: template.id,
      reportName: `${template.name} Report - ${new Date().toLocaleDateString()}`
    });
  }

  isTemplateSelected(templateId: string): boolean {
    return this.reportForm.get('reportType')?.value === templateId;
  }

  toggleIncludeOption(optionId: string): void {
    const option = this.includeOptions.find(opt => opt.id === optionId);
    if (option) {
      option.checked = !option.checked;
    }
  }

  getSelectedIncludes(): string[] {
    return this.includeOptions
      .filter(opt => opt.checked)
      .map(opt => opt.id);
  }

  onGenerateReport(): void {
    if (this.reportForm.valid) {
      this.isGenerating = true;

      const reportData = {
        ...this.reportForm.value,
        includes: this.getSelectedIncludes(),
        generatedAt: new Date().toISOString()
      };

      console.log('Generating report:', reportData);

      // Simulate report generation
      setTimeout(() => {
        this.isGenerating = false;
        alert('Report generated successfully!');
        // Navigate to export page or download
        this.router.navigate(['/reports/export'], {
          state: { reportData }
        });
      }, 2000);

      // TODO: Replace with actual API call
      // this.reportService.generateReport(reportData).subscribe(...)
    } else {
      this.markFormGroupTouched(this.reportForm);
    }
  }

  onSaveTemplate(): void {
    if (this.reportForm.valid) {
      const templateData = {
        ...this.reportForm.value,
        includes: this.getSelectedIncludes(),
        savedAt: new Date().toISOString()
      };

      console.log('Saving template:', templateData);
      alert('Report template saved successfully!');

      // TODO: Save to localStorage or API
    }
  }

  cancel(): void {
    if (confirm('Are you sure? Any unsaved changes will be lost.')) {
      this.router.navigate(['/reports']);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.reportForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.reportForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getSelectedTemplate(): ReportTemplate | undefined {
    const selectedId = this.reportForm.get('reportType')?.value;
    return this.reportTemplates.find(t => t.id === selectedId);
  }
}