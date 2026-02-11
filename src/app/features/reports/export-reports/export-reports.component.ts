// src/app/features/reports/export-reports/export-reports.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  extension: string;
}

interface ReportSummary {
  type: string;
  dateRange: string;
  totalLeads: number;
  totalDeals: number;
  totalRevenue: number;
  conversionRate: number;
}

interface ExportHistory {
  id: string;
  reportName: string;
  format: string;
  exportedAt: Date;
  fileSize: string;
  status: 'completed' | 'processing' | 'failed';
}

@Component({
  selector: 'app-export-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-reports.component.html',
  styleUrls: ['./export-reports.component.css']
})
export class ExportReportsComponent implements OnInit {
  selectedFormat: string = '';
  isExporting: boolean = false;

  exportFormats: ExportFormat[] = [
    {
      id: 'pdf',
      name: 'PDF Document',
      description: 'Professional formatted document with charts',
      icon: 'fa-file-pdf',
      color: '#ef4444',
      extension: '.pdf'
    },
    {
      id: 'excel',
      name: 'Excel Spreadsheet',
      description: 'Editable spreadsheet with raw data',
      icon: 'fa-file-excel',
      color: '#22c55e',
      extension: '.xlsx'
    },
    {
      id: 'csv',
      name: 'CSV File',
      description: 'Simple comma-separated values file',
      icon: 'fa-file-csv',
      color: '#3b82f6',
      extension: '.csv'
    },
    {
      id: 'json',
      name: 'JSON Data',
      description: 'Structured data in JSON format',
      icon: 'fa-file-code',
      color: '#f59e0b',
      extension: '.json'
    }
  ];

  reportSummary: ReportSummary = {
    type: 'Sales Performance Report',
    dateRange: 'Jan 1, 2024 - Oct 31, 2024',
    totalLeads: 248,
    totalDeals: 42,
    totalRevenue: 25000000,
    conversionRate: 28
  };

  exportHistory: ExportHistory[] = [
    {
      id: '1',
      reportName: 'Sales Performance Report - Oct 2024',
      format: 'PDF',
      exportedAt: new Date('2024-10-17T14:30:00'),
      fileSize: '2.4 MB',
      status: 'completed'
    },
    {
      id: '2',
      reportName: 'Leads Analysis - Q3 2024',
      format: 'Excel',
      exportedAt: new Date('2024-10-15T10:15:00'),
      fileSize: '1.8 MB',
      status: 'completed'
    },
    {
      id: '3',
      reportName: 'Deal Pipeline Summary',
      format: 'CSV',
      exportedAt: new Date('2024-10-12T16:45:00'),
      fileSize: '0.5 MB',
      status: 'completed'
    }
  ];

  constructor(private router: Router) {
    // Check if report data was passed from custom report builder
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['reportData']) {
      const reportData = navigation.extras.state['reportData'];
      console.log('Received report data:', reportData);
      // Update reportSummary with passed data if needed
    }
  }

  ngOnInit(): void {}

  selectFormat(formatId: string): void {
    this.selectedFormat = formatId;
  }

  isFormatSelected(formatId: string): boolean {
    return this.selectedFormat === formatId;
  }

  getSelectedFormat(): ExportFormat | undefined {
    return this.exportFormats.find(f => f.id === this.selectedFormat);
  }

  onExport(): void {
    if (!this.selectedFormat) {
      alert('Please select an export format');
      return;
    }

    this.isExporting = true;
    const selectedFormat = this.getSelectedFormat();

    console.log('Exporting report in format:', selectedFormat?.name);

    // Simulate export process
    setTimeout(() => {
      this.isExporting = false;
      this.downloadFile(selectedFormat!);
      
      // Add to export history
      const newExport: ExportHistory = {
        id: (this.exportHistory.length + 1).toString(),
        reportName: `${this.reportSummary.type} - ${new Date().toLocaleDateString()}`,
        format: selectedFormat!.name.split(' ')[0],
        exportedAt: new Date(),
        fileSize: this.getRandomFileSize(),
        status: 'completed'
      };
      this.exportHistory.unshift(newExport);

      alert(`Report exported successfully as ${selectedFormat!.name}!`);
    }, 2000);

    // TODO: Replace with actual export API call
    // this.reportService.exportReport(this.reportSummary, this.selectedFormat).subscribe(...)
  }

  downloadFile(format: ExportFormat): void {
    // Simulate file download
    const fileName = `${this.reportSummary.type.replace(/\s+/g, '_')}_${new Date().getTime()}${format.extension}`;
    console.log('Downloading file:', fileName);
    
    // In production, this would trigger actual file download
    // const blob = new Blob([data], { type: format.mimeType });
    // const url = window.URL.createObjectURL(blob);
    // const link = document.createElement('a');
    // link.href = url;
    // link.download = fileName;
    // link.click();
  }

  onPrint(): void {
    console.log('Printing report...');
    alert('Print dialog would open here');
    // window.print();
  }

  onEmail(): void {
    console.log('Emailing report...');
    alert('Email dialog would open here');
    // Open email modal or navigate to email form
  }

  downloadHistoryItem(item: ExportHistory): void {
    console.log('Re-downloading:', item.reportName);
    alert(`Downloading ${item.reportName}...`);
  }

  deleteHistoryItem(item: ExportHistory): void {
    if (confirm(`Delete ${item.reportName}?`)) {
      const index = this.exportHistory.indexOf(item);
      if (index > -1) {
        this.exportHistory.splice(index, 1);
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }

  createNewReport(): void {
    this.router.navigate(['/reports/custom']);
  }

  formatCurrency(amount: number): string {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  formatDate(date: Date): string {
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRandomFileSize(): string {
    const sizes = ['0.5 MB', '1.2 MB', '1.8 MB', '2.4 MB', '3.1 MB'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'completed': '#22c55e',
      'processing': '#f59e0b',
      'failed': '#ef4444'
    };
    return colors[status] || '#999';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'completed': 'fa-check-circle',
      'processing': 'fa-spinner fa-spin',
      'failed': 'fa-times-circle'
    };
    return icons[status] || 'fa-circle';
  }
}