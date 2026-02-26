import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadsService } from '../services/lead.service';

@Component({
  selector: 'app-admin-website-leads',
  templateUrl: './admin-website-leads.component.html',
  styleUrls: ['./admin-website-leads.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AdminWebsiteLeadsComponent implements OnInit {
  websiteLeads: any[] = [];
  filteredLeads: any[] = [];
  isLoading = true;
  searchTerm = '';

  constructor(private leadService: LeadsService) { }

  ngOnInit(): void {
    this.fetchWebsiteLeads();
  }

  fetchWebsiteLeads() {
    this.isLoading = true;
    this.leadService.getWebsiteLeads().subscribe({
      next: (response: any) => {
        if (response.statusCode === 200) {
          this.websiteLeads = response.data;
          this.filteredLeads = [...this.websiteLeads];
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching website leads:', err);
        this.isLoading = false;
      }
    });
  }

  onSearch() {
    if (!this.searchTerm.trim()) {
      this.filteredLeads = [...this.websiteLeads];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredLeads = this.websiteLeads.filter(lead =>
      (lead.name && lead.name.toLowerCase().includes(term)) ||
      (lead.email && lead.email.toLowerCase().includes(term)) ||
      (lead.phone && lead.phone.includes(term))
    );
  }
}
