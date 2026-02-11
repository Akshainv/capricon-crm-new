// src/app/features/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

declare var AOS: any;
declare var Toastify: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showPassword: boolean = false;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check if user is already logged in
    if (this.authService.isLoggedIn) {
      this.authService.navigateToDashboard();
      return;
    }

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

    // Check for successful registration
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
      setTimeout(() => {
        this.showToast('Registration successful! Please login to continue.', 'success');
      }, 500);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    // Validate inputs
    if (!this.email || !this.password) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.showToast('Please enter a valid email address', 'error');
      return;
    }

    // Validate password length
    if (this.password.length < 6) {
      this.showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    // Start loading
    this.isLoading = true;

    // Call authentication service
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        
        // Handle "Remember Me" functionality
        if (this.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('rememberedEmail', this.email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('rememberedEmail');
        }

        this.isLoading = false;
        
        // Show success toast
        this.showToast('Login successful! Redirecting...', 'success');

        // Navigate to appropriate dashboard after short delay
        setTimeout(() => {
          this.authService.navigateToDashboard();
        }, 1000);
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isLoading = false;

        // Handle different error scenarios with appropriate messages
        let errorMsg = 'An error occurred. Please try again.';
        
        if (error.status === 401) {
          errorMsg = 'Invalid email or password. Please try again.';
        } else if (error.status === 403) {
          errorMsg = error.error?.message || 'Your account is pending admin approval.';
        } else if (error.status === 404) {
          errorMsg = 'Account not found. Please register first.';
        } else if (error.status === 0) {
          errorMsg = 'Unable to connect to server. Please check your connection.';
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }
        
        this.showToast(errorMsg, 'error');
      }
    });
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