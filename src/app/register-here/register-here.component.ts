// src/app/features/auth/register-here/register-here.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

declare var AOS: any;
declare var Toastify: any;

@Component({
  selector: 'app-register-here',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './register-here.component.html',
  styleUrls: ['./register-here.component.css']
})
export class RegisterHereComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Form fields
  fullName: string = '';
  email: string = '';
  phoneNumber: string = '';
  password: string = '';
  confirmPassword: string = '';
  agreedToTerms: boolean = false;
  
  // Password visibility toggles
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  
  // Photo upload
  photoPreview: string | null = null;
  selectedFile: File | null = null;

  // Loading state
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Initialize AOS animations with delay to ensure library is loaded
    setTimeout(() => {
      if (typeof AOS !== 'undefined') {
        AOS.init({
          duration: 1000,
          once: true,
          easing: 'ease-out-cubic'
        });
      }
    }, 100);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('File size should not exceed 5MB', 'error');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showToast('Please select a valid image file', 'error');
        return;
      }

      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
      
      this.showToast('Photo selected successfully!', 'success');
    }
  }

  removePhoto() {
    this.photoPreview = null;
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.showToast('Photo removed', 'info');
  }

  onSubmit() {
    // Validate photo upload (REQUIRED)
    if (!this.selectedFile) {
      this.showToast('Please upload your photo', 'error');
      return;
    }

    // Validate all fields
    if (!this.fullName || !this.email || !this.phoneNumber || !this.password || !this.confirmPassword) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.showToast('Please enter a valid email address', 'error');
      return;
    }

    // Validate phone number
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(this.phoneNumber)) {
      this.showToast('Please enter a valid phone number', 'error');
      return;
    }

    // Validate password length
    if (this.password.length < 6) {
      this.showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    // Validate password match
    if (this.password !== this.confirmPassword) {
      this.showToast('Passwords do not match', 'error');
      return;
    }

    // Validate terms agreement
    if (!this.agreedToTerms) {
      this.showToast('Please agree to the Terms & Conditions', 'error');
      return;
    }

    // Start loading
    this.isLoading = true;

    // Prepare FormData
    const formData = new FormData();
    // Backend expects 'fullName' field as per CreateEmployeeDto
    formData.append('fullName', this.fullName);
    formData.append('email', this.email);
    formData.append('phoneNumber', this.phoneNumber);
    formData.append('password', this.password);
    formData.append('photo', this.selectedFile);

    // Call authentication service for employee registration
    this.authService.employeeSignup(formData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.isLoading = false;
        
        this.showToast('Registration successful! Your account is pending admin approval.', 'success');
        
        // Clear form
        this.resetForm();

        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login'], { 
            queryParams: { registered: 'true' } 
          });
        }, 2000);
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.isLoading = false;

        // Handle different error scenarios
        let errorMsg = 'An error occurred during registration. Please try again.';
        
        if (error.status === 400) {
          errorMsg = error.error?.message || 'Email already in use or invalid data';
        } else if (error.status === 0) {
          errorMsg = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }
        
        this.showToast(errorMsg, 'error');
      }
    });
  }

  resetForm() {
    this.fullName = '';
    this.email = '';
    this.phoneNumber = '';
    this.password = '';
    this.confirmPassword = '';
    this.agreedToTerms = false;
    this.removePhoto();
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  // Toastify notification method
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