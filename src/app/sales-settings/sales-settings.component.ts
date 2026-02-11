import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sales-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-settings.component.html',
  styleUrls: ['./sales-settings.component.css']
})
export class SalesSettingsComponent {
  personalInfo = {
    fullName: 'John Doe',
    email: 'john.doe@inspitetech.com',
    phone: '+91 9876543210',
    designation: 'Sales Executive',
    employeeId: 'EMP001',
    joiningDate: '2024-01-15'
  };

  security = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    sessionTimeout: '30',
    twoFactorAuth: false
  };

  // Active Section
  activeSection = 'personal';

  selectSection(section: string) {
    this.activeSection = section;
  }

  savePersonalInfo() {
    console.log('Personal Info Saved:', this.personalInfo);
    alert('Personal information updated successfully!');
  }

  changePassword() {
    if (this.security.newPassword !== this.security.confirmPassword) {
      alert('New password and confirm password do not match!');
      return;
    }
    if (this.security.newPassword.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }
    console.log('Password Changed');
    alert('Password changed successfully!');
    this.security.currentPassword = '';
    this.security.newPassword = '';
    this.security.confirmPassword = '';
  }

  saveSecurity() {
    console.log('Security Settings Saved:', this.security);
    alert('Security settings saved successfully!');
  }

  exportMyData() {
    alert('Exporting your personal data...');
  }
}