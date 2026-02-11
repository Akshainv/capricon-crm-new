// src/app/features/leads/lead-detail/lead-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  title: string;
  description: string;
  timestamp: Date;
  user: string;
  duration?: string;
  attachment?: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: 'new' | 'qualified' | 'quoted' | 'won' | 'lost';
  assignedTo: string;
  createdAt: Date;
  notes?: string;
}

@Component({
  selector: 'app-lead-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lead-detail.component.html',
  styleUrls: ['./lead-detail.component.css']
})
export class LeadDetailComponent implements OnInit {
  leadId: string | null = null;
  lead: Lead | null = null;

  activities: Activity[] = [
    {
      id: '1',
      type: 'call',
      title: 'Phone Call - Follow-up',
      description: 'Discussed technical specifications for the elevator. Customer interested in 8-floor passenger elevator with VFD drive.',
      timestamp: new Date('2024-10-10T14:30:00'),
      user: 'Rajesh Kumar',
      duration: '15 mins'
    },
    {
      id: '2',
      type: 'email',
      title: 'Email Sent - Quotation',
      description: 'Sent detailed quotation for 8-floor elevator with specifications and pricing breakdown.',
      timestamp: new Date('2024-10-09T11:00:00'),
      user: 'Rajesh Kumar',
      attachment: 'Quote_ABC_001.pdf'
    },
    {
      id: '3',
      type: 'meeting',
      title: 'Site Visit',
      description: 'Conducted site survey at ABC Corporation office. Measured shaft dimensions and discussed installation timeline.',
      timestamp: new Date('2024-10-08T10:00:00'),
      user: 'Rajesh Kumar',
      duration: '2 hours'
    },
    {
      id: '4',
      type: 'call',
      title: 'Incoming Call',
      description: 'Customer called to inquire about elevator options. Scheduled site visit.',
      timestamp: new Date('2024-10-07T15:30:00'),
      user: 'Rajesh Kumar',
      duration: '10 mins'
    },
    {
      id: '5',
      type: 'note',
      title: 'Lead Created',
      description: 'Lead captured from website form submission.',
      timestamp: new Date('2024-10-05T09:15:00'),
      user: 'System'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.leadId = this.route.snapshot.paramMap.get('id');
    if (this.leadId) {
      this.loadLeadData(this.leadId);
    }
  }

  loadLeadData(id: string): void {
    // Simulate loading data - replace with actual service call
    this.lead = {
      id: 'LD-2024-001',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '+91 9876543210',
      company: 'ABC Corporation',
      source: 'Website',
      status: 'qualified',
      assignedTo: 'Rajesh Kumar',
      createdAt: new Date('2024-10-05'),
      notes: 'Interested in 8-floor passenger elevator for new office building.'
    };
  }

  editLead(): void {
    this.router.navigate(['/leads/edit', this.leadId]);
  }

  deleteLead(): void {
    if (confirm('Are you sure you want to delete this lead?')) {
      console.log('Deleting lead:', this.leadId);
      this.router.navigate(['/leads']);
    }
  }

  goBack(): void {
    this.router.navigate(['/leads']);
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'new': 'status-new',
      'qualified': 'status-qualified',
      'quoted': 'status-quoted',
      'won': 'status-won',
      'lost': 'status-lost'
    };
    return statusClasses[status] || 'status-new';
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'call': 'fa-phone',
      'email': 'fa-envelope',
      'meeting': 'fa-users',
      'note': 'fa-sticky-note'
    };
    return icons[type] || 'fa-circle';
  }

  getActivityColor(type: string): string {
    const colors: { [key: string]: string } = {
      'call': '#60a5fa',
      'email': '#c084fc',
      'meeting': '#fb923c',
      'note': '#4ade80'
    };
    return colors[type] || '#d4b347';
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} minutes ago`;
      }
      return `${hours} hours ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  addActivity(): void {
    console.log('Add new activity');
    // Implement add activity logic
  }
}