// src/app/sales-deal-details/sales-deal-details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

interface StageHistory {
  stage: string;
  date: string;
  duration: string;
}

interface Quotation {
  id: string;
  quoteNumber: string;
  amount: number;
  status: string;
  date: string;
}

interface TimelineEvent {
  type: string;
  title: string;
  description: string;
  date: string;
  icon: string;
  color: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedDate: string;
}

interface DealDetails {
  id: string;
  title: string;
  company: string;
  amount: number;
  elevatorType: string;
  probability: number;
  closeDate: string;
  status: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  stageHistory: StageHistory[];
  quotations: Quotation[];
  timeline: TimelineEvent[];
  documents: Document[];
  nextActions: string[];
}

@Component({
  selector: 'app-sales-deal-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-deal-details.component.html',
  styleUrls: ['./sales-deal-details.component.css']
})
export class SalesDealDetailsComponent implements OnInit {
  dealDetails: DealDetails = {
    id: '1',
    title: 'Luxury Apartment Complex',
    company: 'Prestige Group',
    amount: 2500000,
    elevatorType: 'Passenger Elevator',
    probability: 75,
    closeDate: '2024-12-15',
    status: 'Meeting Completed',
    contactPerson: 'Raj Kumar',
    phone: '+91 9876543210',
    email: 'raj@prestige.com',
    address: 'Whitefield, Bangalore, Karnataka - 560066',
    stageHistory: [
      { stage: 'Seeded Lead', date: '2024-10-01', duration: '5 days' },
      { stage: 'Meeting Fixed', date: '2024-10-06', duration: '8 days' },
      { stage: 'Meeting Completed', date: '2024-10-14', duration: 'Current' }
    ],
    quotations: [
      {
        id: 'Q1',
        quoteNumber: 'QT-2024-089',
        amount: 2500000,
        status: 'sent',
        date: '2024-10-15'
      },
      {
        id: 'Q2',
        quoteNumber: 'QT-2024-075',
        amount: 2300000,
        status: 'draft',
        date: '2024-10-12'
      }
    ],
    timeline: [
      {
        type: 'quotation',
        title: 'Quotation Sent',
        description: 'Sent quotation QT-2024-089 worth ₹25,00,000',
        date: '2024-10-15',
        icon: 'fa-file-invoice',
        color: '#3b82f6'
      },
      {
        type: 'meeting',
        title: 'Site Visit Completed',
        description: 'Met with Raj Kumar at the site location',
        date: '2024-10-10',
        icon: 'fa-handshake',
        color: '#8b5cf6'
      },
      {
        type: 'call',
        title: 'Follow-up Call',
        description: 'Discussed technical specifications and timeline',
        date: '2024-10-08',
        icon: 'fa-phone',
        color: '#f59e0b'
      },
      {
        type: 'email',
        title: 'Requirements Received',
        description: 'Received detailed requirements via email',
        date: '2024-10-06',
        icon: 'fa-envelope',
        color: '#ec4899'
      }
    ],
    documents: [
      {
        id: 'D1',
        name: 'Site Plan.pdf',
        type: 'PDF',
        size: '2.4 MB',
        uploadedBy: 'Raj Kumar',
        uploadedDate: '2024-10-12'
      },
      {
        id: 'D2',
        name: 'Technical Specifications.docx',
        type: 'DOCX',
        size: '1.8 MB',
        uploadedBy: 'You',
        uploadedDate: '2024-10-10'
      },
      {
        id: 'D3',
        name: 'Quotation_Final.pdf',
        type: 'PDF',
        size: '856 KB',
        uploadedBy: 'You',
        uploadedDate: '2024-10-15'
      }
    ],
    nextActions: [
      'Follow up on quotation approval by 2024-10-20',
      'Schedule technical discussion meeting',
      'Prepare revised quotation if needed',
      'Send product brochures and case studies'
    ]
  };

  activeTab: string = 'overview';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadDealDetails();
  }

  loadDealDetails(): void {
    const dealId = this.route.snapshot.paramMap.get('id');
    if (dealId) {
      // TODO: Load from service
      console.log('Loading deal with ID:', dealId);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  goBack(): void {
    this.router.navigate(['/deals']);
  }

  editDeal(): void {
    this.router.navigate(['/deals/edit', this.dealDetails.id]);
  }

  createQuotation(): void {
    this.router.navigate(['/quotations/create'], {
      state: {
        deal: this.dealDetails
      }
    });
  }

  viewQuotation(quotation: Quotation): void {
    this.router.navigate(['/quotations/details', quotation.id]);
  }

  downloadDocument(doc: Document): void {
    console.log('Downloading:', doc.name);
    alert(`Downloading ${doc.name}...`);
  }

  updateStage(newStage: string): void {
    const confirmUpdate = confirm(`Move deal to ${newStage} stage?`);
    if (confirmUpdate) {
      this.dealDetails.status = newStage;
      alert('Deal stage updated successfully!');
    }
  }

  convertToProject(): void {
    const confirmConvert = confirm('Convert this deal to a project?');
    if (confirmConvert) {
      this.router.navigate(['/projects/create'], {
        state: {
          deal: this.dealDetails
        }
      });
    }
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'Seeded Lead': 'Seeded Lead',
      'Meeting Fixed': 'Meeting Fixed',
      'Meeting Completed': 'Meeting Completed',
      'CS Executed': 'CS Executed'
    };
    return labels[status] || status;
  }
}