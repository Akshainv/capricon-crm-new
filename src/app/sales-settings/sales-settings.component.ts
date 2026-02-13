import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

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

  constructor(private toastr: ToastrService) { }

  selectSection(section: string) {
    this.activeSection = section;
  }

  savePersonalInfo() {
    console.log('Personal Info Saved:', this.personalInfo);
    this.toastr.success('Personal information updated successfully!');
  }

  changePassword() {
    if (this.security.newPassword !== this.security.confirmPassword) {
      this.toastr.error('New password and confirm password do not match!');
      return;
    }
    if (this.security.newPassword.length < 8) {
      this.toastr.error('Password must be at least 8 characters long!');
      return;
    }
    console.log('Password Changed');
    this.toastr.success('Password changed successfully!');
    this.security.currentPassword = '';
    this.security.newPassword = '';
    this.security.confirmPassword = '';
  }

  saveSecurity() {
    console.log('Security Settings Saved:', this.security);
    this.toastr.success('Security settings saved successfully!');
  }

  exportMyData() {
    this.toastr.info('Exporting your personal data...');
  }
}