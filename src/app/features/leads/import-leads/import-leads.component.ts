// src/app/features/leads/import-leads/import-leads.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface ImportedLead {
  name: string;
  email: string;
  phone: string;
  company?: string;
  source?: string;
  notes?: string;
  status: 'valid' | 'invalid';
  errors?: string[];
}

@Component({
  selector: 'app-import-leads',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-leads.component.html',
  styleUrls: ['./import-leads.component.css']
})
export class ImportLeadsComponent {
  selectedFile: File | null = null;
  fileName: string = '';
  fileSize: string = '';
  isDragging: boolean = false;
  isProcessing: boolean = false;
  showPreview: boolean = false;
  
  importedLeads: ImportedLead[] = [];
  validLeadsCount: number = 0;
  invalidLeadsCount: number = 0;

  constructor(private router: Router) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      alert('Please upload a CSV or Excel file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    this.selectedFile = file;
    this.fileName = file.name;
    this.fileSize = this.formatFileSize(file.size);
    
    // Process file
    this.processFile(file);
  }

  processFile(file: File): void {
    this.isProcessing = true;

    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const content = e.target?.result as string;
      this.parseCSV(content);
      this.isProcessing = false;
      this.showPreview = true;
    };

    reader.onerror = () => {
      alert('Error reading file');
      this.isProcessing = false;
    };

    reader.readAsText(file);
  }

  parseCSV(content: string): void {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      alert('CSV file must contain headers and at least one data row');
      return;
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate required headers
    const requiredHeaders = ['name', 'email', 'phone'];
    const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));
    
    if (!hasRequiredHeaders) {
      alert(`CSV must contain these columns: ${requiredHeaders.join(', ')}`);
      return;
    }

    // Parse data rows
    this.importedLeads = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      const lead: ImportedLead = {
        name: values[headers.indexOf('name')] || '',
        email: values[headers.indexOf('email')] || '',
        phone: values[headers.indexOf('phone')] || '',
        company: values[headers.indexOf('company')] || '',
        source: values[headers.indexOf('source')] || 'Import',
        notes: values[headers.indexOf('notes')] || '',
        status: 'valid',
        errors: []
      };

      // Validate lead data
      this.validateLead(lead);
      this.importedLeads.push(lead);
    }

    // Count valid/invalid
    this.validLeadsCount = this.importedLeads.filter(l => l.status === 'valid').length;
    this.invalidLeadsCount = this.importedLeads.filter(l => l.status === 'invalid').length;
  }

  validateLead(lead: ImportedLead): void {
    const errors: string[] = [];

    // Validate name
    if (!lead.name || lead.name.length < 2) {
      errors.push('Name is required (min 2 characters)');
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!lead.email || !emailRegex.test(lead.email)) {
      errors.push('Invalid email format');
    }

    // Validate phone
    const phoneRegex = /^[+]?[\d\s\-()]+$/;
    if (!lead.phone || !phoneRegex.test(lead.phone)) {
      errors.push('Invalid phone format');
    }

    if (errors.length > 0) {
      lead.status = 'invalid';
      lead.errors = errors;
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileName = '';
    this.fileSize = '';
    this.showPreview = false;
    this.importedLeads = [];
    this.validLeadsCount = 0;
    this.invalidLeadsCount = 0;
  }

  importLeads(): void {
    if (this.validLeadsCount === 0) {
      alert('No valid leads to import');
      return;
    }

    const validLeads = this.importedLeads.filter(l => l.status === 'valid');
    
    console.log('Importing leads:', validLeads);
    
    // Simulate API call
    setTimeout(() => {
      alert(`Successfully imported ${this.validLeadsCount} lead(s)!`);
      const redirect = this.router.url.startsWith('/admin') ? '/admin/leads' : '/leads';
      this.router.navigate([redirect]);
    }, 1000);
  }

  downloadTemplate(): void {
    const csvContent = 'name,email,phone,company,source,notes\n' +
                      'John Doe,john@example.com,+91 9876543210,ABC Corp,Website,Interested in 8-floor elevator\n' +
                      'Jane Smith,jane@example.com,+91 9876543211,XYZ Ltd,Reference,Looking for home lift';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  cancel(): void {
    const redirect = this.router.url.startsWith('/admin') ? '/admin/leads' : '/leads';
    this.router.navigate([redirect]);
  }
}