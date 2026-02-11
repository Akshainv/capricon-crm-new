import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeadsService, CreateLead } from '../lead.service';
import { AuthService } from '../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as XLSX from 'xlsx';

declare var Toastify: any;  // For Toastify alerts

interface ParsedData {
  [key: string]: string;
}

interface ImportResult {
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  errors: string[];
  warnings: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Component({
  selector: 'app-sales-import-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-import-leads.component.html',
  styleUrls: ['./sales-import-leads.component.css']
})
export class SalesImportLeadsComponent implements OnInit {
  selectedFile: File | null = null;
  isProcessing: boolean = false;
  isImporting: boolean = false;
  previewData: ParsedData[] = [];
  fullData: ParsedData[] = [];
  fileColumns: string[] = [];
  importResult: ImportResult | null = null;
  showImportResult: boolean = false;
  currentUserId: string = '';
  validationErrors: string[] = [];

  columnMapping = {
    name: ['name', 'fullname', 'full name', 'lead name', 'customer name', 'contact name'],
    email: ['email', 'email address', 'e-mail', 'mail'],
    phone: ['phone', 'phonenumber', 'phone number', 'mobile', 'contact', 'telephone', 'tel'],
    company: ['company', 'companyname', 'company name', 'organization', 'organisation'],
    source: ['source', 'leadsource', 'lead source', 'origin'],
    notes: ['notes', 'note', 'comments', 'comment', 'remarks', 'description']
  };

  leadSources = ['Walk-in', 'Website', 'Reference', 'Phone Call', 'Email', 'Social Media', 'Other'];

  constructor(
    private router: Router,
    private leadsService: LeadsService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.userId) {
      this.currentUserId = currentUser.userId;
    } else {
      console.error('User not logged in');
      this.showToast('You must be logged in to import leads', 'error');
      this.router.navigate(['/login']);
    }
  }

  onFileSelect(event: any): void {
    const file = event.target.files[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('File size should not exceed 5MB', 'error');
        event.target.value = '';
        return;
      }

      this.selectedFile = file;
      this.validationErrors = [];
      this.showToast(`File selected: ${file.name} (${this.formatFileSize(file.size)})`, 'info');
      this.parseFile(file);
    }
  }

  parseFile(file: File): void {
    this.isProcessing = true;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, {
          type: file.name.endsWith('.csv') ? 'string' : 'array'
        });

        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];

        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false
        });

        this.processParsedData(jsonData);
      } catch (error) {
        console.error('Parse error:', error);
        this.showToast('Failed to read file. Make sure it is a valid CSV or Excel file.', 'error');
        this.resetFile();
      }
    };

    reader.onerror = () => {
      this.showToast('Error reading file', 'error');
      this.resetFile();
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  private resetFile(): void {
    this.isProcessing = false;
    this.selectedFile = null;
  }

  processParsedData(jsonData: any[]): void {
    if (jsonData.length === 0) {
      this.showToast('No data found in file', 'error');
      this.resetFile();
      return;
    }

    this.fileColumns = Object.keys(jsonData[0]).map(k => k.trim());

    const validation = this.validateColumns(this.fileColumns);
    if (!validation.isValid) {
      this.validationErrors = validation.errors;
      this.showToast('Column validation failed:\n\n' + validation.errors.join('\n'), 'error');
      this.resetFile();
      return;
    }

    this.fullData = jsonData.map(row => {
      const parsed: ParsedData = {};
      this.fileColumns.forEach(col => {
        parsed[col] = row[col] !== undefined ? String(row[col]).trim() : '';
      });
      return parsed;
    });

    this.previewData = this.fullData.slice(0, 10);

    if (this.fullData.length > 1000) {
      this.showToast(`File contains ${this.fullData.length} records. Maximum allowed is 1000.`, 'error');
      this.resetFile();
      return;
    }

    this.showToast(`File parsed successfully! Found ${this.fullData.length} lead(s). Showing preview of first 10.`, 'success');
    this.isProcessing = false;
  }

  validateColumns(columns: string[]): ValidationResult {
    const errors: string[] = [];
    const lower = columns.map(c => c.toLowerCase().trim());

    const hasName = this.columnMapping.name.some(n => lower.includes(n));
    const hasEmail = this.columnMapping.email.some(e => lower.includes(e));
    const hasPhone = this.columnMapping.phone.some(p => lower.includes(p));

    if (!hasName) errors.push('Missing required column: Name');
    if (!hasEmail) errors.push('Missing required column: Email');
    if (!hasPhone) errors.push('Missing required column: Phone');

    return { isValid: errors.length === 0, errors };
  }

  findColumnValue(row: ParsedData, options: string[]): string {
    const keys = Object.keys(row).map(k => k.toLowerCase().trim());
    for (const opt of options) {
      const idx = keys.indexOf(opt.toLowerCase());
      if (idx !== -1) {
        const key = Object.keys(row)[idx];
        return row[key] || '';
      }
    }
    return '';
  }

  validateRow(row: ParsedData, rowNum: number): { isValid: boolean; error: string } {
    const name = this.findColumnValue(row, this.columnMapping.name);
    const email = this.findColumnValue(row, this.columnMapping.email);
    const phone = this.findColumnValue(row, this.columnMapping.phone);

    if (!name) return { isValid: false, error: `Row ${rowNum}: Name is required` };
    if (!email) return { isValid: false, error: `Row ${rowNum}: Email is required` };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { isValid: false, error: `Row ${rowNum}: Invalid email (${email})` };

    if (!phone) return { isValid: false, error: `Row ${rowNum}: Phone is required` };
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return { isValid: false, error: `Row ${rowNum}: Phone needs at least 10 digits` };

    return { isValid: true, error: '' };
  }

  mapRowToLead(row: ParsedData): CreateLead | null {
    const name = this.findColumnValue(row, this.columnMapping.name);
    const email = this.findColumnValue(row, this.columnMapping.email);
    const phone = this.findColumnValue(row, this.columnMapping.phone);
    const company = this.findColumnValue(row, this.columnMapping.company);
    const sourceValue = this.findColumnValue(row, this.columnMapping.source);
    const notes = this.findColumnValue(row, this.columnMapping.notes);

    let leadSource: CreateLead['leadSource'] = 'Other';
    if (sourceValue) {
      const match = this.leadSources.find(s => s.toLowerCase() === sourceValue.toLowerCase().trim());
      if (match) leadSource = match as CreateLead['leadSource'];
    }

    return {
      fullName: name.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phone.trim(),
      companyName: company ? company.trim() : undefined,
      leadSource,
      assignedTo: '',
      createdBy: this.currentUserId,
      notes: notes ? notes.trim() : undefined
    };
  }

  async importLeads(): Promise<void> {
    if (!this.selectedFile || this.fullData.length === 0 || !this.currentUserId) {
      this.showToast('No data to import or not logged in', 'error');
      return;
    }

    // Toastify Confirmation (replaces native confirm)
    if (typeof Toastify !== 'undefined') {
      const toast = Toastify({
        text: `Ready to import ${this.fullData.length} lead(s)? This will create new leads in the system.`,
        duration: -1,
        close: true,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        style: {
          background: "linear-gradient(to right, #667eea, #764ba2)",
          borderRadius: "12px",
          fontSize: "15px",
          fontWeight: "500",
          textAlign: "center",
          maxWidth: "400px",
          padding: "20px"
        }
      }).showToast();

      // Inject buttons after toast renders
      setTimeout(() => {
        const toastElement = document.querySelector('.toastify') as HTMLElement;
        if (toastElement) {
          const buttonsHTML = `
            <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
              <button id="toast-confirm-import" style="padding: 10px 24px; background: #00b09b; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Confirm Import
              </button>
              <button id="toast-cancel-import" style="padding: 10px 24px; background: #ff5f6d; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Cancel
              </button>
            </div>
          `;
          toastElement.insertAdjacentHTML('beforeend', buttonsHTML);

          document.getElementById('toast-confirm-import')?.addEventListener('click', () => {
            toast.hideToast();
            this.proceedWithImport();
          });

          document.getElementById('toast-cancel-import')?.addEventListener('click', () => {
            toast.hideToast();
            this.showToast('Import cancelled', 'info');
          });
        }
      }, 100);
    } else {
      // Fallback
      if (confirm(`Ready to import ${this.fullData.length} lead(s)? This will create new leads in the system.`)) {
        this.proceedWithImport();
      } else {
        this.showToast('Import cancelled', 'info');
      }
    }
  }

  private proceedWithImport(): void {
    this.showToast(`Starting import of ${this.fullData.length} leads...`, 'info');
    this.isImporting = true;
    const errors: string[] = [];
    const validLeads: CreateLead[] = [];

    this.fullData.forEach((row, i) => {
      const rowNum = i + 2;
      const val = this.validateRow(row, rowNum);
      if (!val.isValid) {
        errors.push(val.error);
        return;
      }
      const lead = this.mapRowToLead(row);
      if (lead) validLeads.push(lead);
    });

    if (validLeads.length === 0) {
      this.showToast('No valid leads found to import', 'error');
      this.isImporting = false;
      return;
    }

    const observables = validLeads.map(lead =>
      this.leadsService.createLead(lead).pipe(
        catchError(err => {
          errors.push(`Failed: ${lead.fullName} - ${err.error?.message || err.message || 'Error'}`);
          return of(null);
        })
      )
    );

    forkJoin(observables).subscribe(results => {
      const successful = results.filter(r => r !== null).length;

      this.importResult = {
        totalRows: this.fullData.length,
        successfulImports: successful,
        failedImports: this.fullData.length - successful,
        errors,
        warnings: []
      };

      this.showImportResult = true;
      this.isImporting = false;

      if (successful > 0) {
        this.showToast(`Successfully imported ${successful} lead(s)!`, 'success');
        (this.leadsService as any).leadsUpdated.next();
      }
      if (errors.length > 0) {
        this.showToast(`${errors.length} lead(s) failed to import`, 'error');
      }
    });
  }

  removeFile(): void {
    this.showToast('File removed', 'info');
    this.selectedFile = null;
    this.fileColumns = [];
    this.previewData = [];
    this.fullData = [];
    this.importResult = null;
    this.showImportResult = false;
    this.validationErrors = [];
  }

  startNewImport(): void {
    this.showToast('Starting new import...', 'info');
    this.removeFile();
  }

  goToLeads(): void {
    this.router.navigate(['/leads']);
  }

  downloadTemplate(): void {
    this.showToast('Template downloaded', 'success');
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Source', 'Notes'];
    const sampleData = [
      ['John Doe', 'john@example.com', '+91 9876543210', 'ABC Corp', 'Website', 'Interested in bulk order'],
      ['Jane Smith', 'jane@company.com', '+91 9876543211', 'XYZ Ltd', 'Reference', 'Looking for demo']
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'lead_import_template.xlsx');
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  exportErrors(): void {
    if (!this.importResult || this.importResult.errors.length === 0) {
      this.showToast('No errors to export', 'info');
      return;
    }

    this.showToast('Exporting error report...', 'info');
    const content = `Import Errors Report\n\nTotal: ${this.importResult.totalRows}\nSuccess: ${this.importResult.successfulImports}\nFailed: ${this.importResult.failedImports}\n\nErrors:\n` +
      this.importResult.errors.map((e, i) => `${i + 1}. ${e}`).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_errors_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (typeof Toastify !== 'undefined') {
      const backgroundColor =
        type === 'success' ? 'linear-gradient(to right, #00b09b, #96c93d)' :
          type === 'error' ? 'linear-gradient(to right, #ff5f6d, #ffc371)' :
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