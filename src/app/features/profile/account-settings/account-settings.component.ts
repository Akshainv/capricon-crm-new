// src/app/account-settings/account-settings.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.css']
})
export class AccountSettingsComponent {
  constructor(private toastr: ToastrService) { }
  // General Settings only
  settings = {
    companyName: 'Inspite Tech',
    companyEmail: 'info@inspitetech.com',
    companyPhone: '+91 8714158735',
    companyAddress: 'Infopark, Kochi, Kerala',
    website: 'www.inspitetech.com',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    language: 'English'
  };

  // Active Section (only 'general' remains)
  activeSection = 'general';

  selectSection(section: string) {
    this.activeSection = section;
  }

  saveGeneralSettings() {
    console.log('General Settings Saved:', this.settings);
    this.toastr.success('General settings saved successfully!');
  }
}