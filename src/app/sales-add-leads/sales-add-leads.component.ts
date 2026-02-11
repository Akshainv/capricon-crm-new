import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LeadsService, CreateLead } from '../lead.service';
import { AuthService } from '../services/auth.service';

declare var Toastify: any;

interface LeadDraft {
  name: string;
  email: string;
  phone: string;
  source: string;
  priority: string;
}

@Component({
  selector: 'app-sales-add-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-add-leads.component.html',
  styleUrls: ['./sales-add-leads.component.css']
})
export class SalesAddLeadComponent implements OnInit {
  isEditMode: boolean = false;
  leadId: string | null = null;
  isSaving: boolean = false;
  lastSaved: Date | null = null;

  leadDraft: LeadDraft = {
    name: '',
    email: '',
    phone: '',
    source: '',
    priority: 'medium'
  };

  errors: any = {};

  sourceOptions = ['Website', 'Walk-in', 'Reference', 'Phone Call', 'Email', 'Social Media', 'Other'];
  priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private leadsService: LeadsService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.leadId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.leadId;

    if (this.isEditMode) {
      this.loadLeadData(this.leadId!);
    } else {
      this.loadDraft();
    }

    setInterval(() => {
      this.autoSaveDraft();
    }, 30000);
  }

  loadLeadData(id: string): void {
    this.leadsService.getLeadById(id).subscribe({
      next: (lead) => {
        let priority = 'medium';
        if (lead.notes) {
          const priorityMatch = lead.notes.match(/Priority: (low|medium|high)/i);
          if (priorityMatch) {
            priority = priorityMatch[1].toLowerCase();
          }
        }

        this.leadDraft = {
          name: lead.fullName,
          email: lead.email,
          phone: lead.phoneNumber,
          source: lead.leadSource,
          priority: priority
        };
      },
      error: (error) => {
        console.error('Error loading lead:', error);
        this.showToast('Failed to load lead data', 'error');
        this.router.navigate(['/leads']);
      }
    });
  }

  loadDraft(): void {
    const draft = localStorage.getItem('lead_draft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        if (parsedDraft.basicInfo) {
          this.leadDraft = {
            name: parsedDraft.basicInfo.name || '',
            email: parsedDraft.contactDetails?.email || '',
            phone: parsedDraft.contactDetails?.phone || '',
            source: parsedDraft.basicInfo.source || '',
            priority: parsedDraft.basicInfo.priority || 'medium'
          };
        } else {
          this.leadDraft = parsedDraft;
        }

        const savedTime = localStorage.getItem('lead_draft_time');
        if (savedTime) {
          this.lastSaved = new Date(savedTime);
        }
      } catch (error) {
        localStorage.removeItem('lead_draft');
        localStorage.removeItem('lead_draft_time');
      }
    }
  }

  autoSaveDraft(): void {
    if (!this.isEditMode && this.hasAnyData()) {
      localStorage.setItem('lead_draft', JSON.stringify(this.leadDraft));
      localStorage.setItem('lead_draft_time', new Date().toISOString());
      this.lastSaved = new Date();
    }
  }

  hasAnyData(): boolean {
    return this.leadDraft.name !== '' ||
      this.leadDraft.email !== '' ||
      this.leadDraft.phone !== '';
  }

  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    if (!this.leadDraft.name.trim()) {
      this.errors.name = 'Name is required';
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.leadDraft.email.trim()) {
      this.errors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(this.leadDraft.email)) {
      this.errors.email = 'Invalid email format';
      isValid = false;
    }

    const phoneRegex = /^[+]?[\d\s-]{10,}$/;
    if (!this.leadDraft.phone.trim()) {
      this.errors.phone = 'Phone number is required';
      isValid = false;
    } else if (!phoneRegex.test(this.leadDraft.phone)) {
      this.errors.phone = 'Invalid phone number';
      isValid = false;
    }

    if (!this.leadDraft.source) {
      this.errors.source = 'Lead source is required';
      isValid = false;
    }

    return isValid;
  }

  saveLead(): void {
    if (!this.validateForm()) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    this.isSaving = true;
    const currentUser = this.authService.currentUserValue;
    const userId = currentUser?.userId || '';

    if (!userId) {
      this.showToast('User identification failed. Please log in again.', 'error');
      this.isSaving = false;
      return;
    }

    const rawSource = (this.leadDraft.source || 'Other').toString();
    const allowedSources: Array<'Walk-in' | 'Website' | 'Reference' | 'Phone Call' | 'Email' | 'Social Media' | 'Other'> =
      ['Walk-in', 'Website', 'Reference', 'Phone Call', 'Email', 'Social Media', 'Other'];
    const normalizedSource = allowedSources.includes(rawSource as any) ? rawSource : 'Other';

    const notesArray = [];
    if (this.leadDraft.priority) {
      notesArray.push(`Priority: ${this.leadDraft.priority}`);
    }

    const payload: CreateLead = {
      fullName: this.leadDraft.name.trim(),
      email: this.leadDraft.email.trim().toLowerCase(),
      phoneNumber: this.leadDraft.phone.trim(),
      companyName: '',
      leadSource: normalizedSource as CreateLead['leadSource'],
      assignedTo: '',
      createdBy: userId,
      notes: notesArray.join(' | '),
      priority: this.leadDraft.priority as CreateLead['priority']
    };

    const action = this.isEditMode
      ? this.leadsService.updateLead(this.leadId!, payload)
      : this.leadsService.createLead(payload);

    action.subscribe({
      next: () => {
        localStorage.removeItem('lead_draft');
        localStorage.removeItem('lead_draft_time');
        this.isSaving = false;
        this.leadsService.leadsUpdated.next();
        this.showToast(this.isEditMode ? 'Lead updated successfully!' : 'Lead created successfully!', 'success');
        this.router.navigate(['/leads']);
      },
      error: (err: any) => {
        this.isSaving = false;
        this.showToast(err?.message || 'Failed to save lead', 'error');
      }
    });
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      if (!this.isEditMode) {
        localStorage.removeItem('lead_draft');
        localStorage.removeItem('lead_draft_time');
      }
      this.router.navigate(['/leads']);
    }
  }

  clearDraft(): void {
    if (confirm('Are you sure you want to clear the draft?')) {
      localStorage.removeItem('lead_draft');
      localStorage.removeItem('lead_draft_time');
      this.lastSaved = null;
      this.leadDraft = {
        name: '',
        email: '',
        phone: '',
        source: '',
        priority: 'medium'
      };
      this.showToast('Draft cleared', 'info');
    }
  }

  goBack(): void {
    this.router.navigate(['/leads']);
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (typeof Toastify !== 'undefined') {
      const backgroundColor =
        type === 'success' ? 'linear-gradient(to right, #00b09b, #96c93d)' :
          type === 'error' ? 'linear-gradient(to right, #ff5f6d, #ffc371)' :
            'linear-gradient(to right, #667eea, #764ba2)';

      Toastify({
        text: message,
        duration: 3000,
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
    }
  }
}