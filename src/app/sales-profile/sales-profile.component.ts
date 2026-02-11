// src/app/sales-profile/sales-profile.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, User, UpdateProfileDto } from '../services/profile.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sales-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-profile.component.html',
  styleUrls: ['./sales-profile.component.css']
})
export class SalesProfileComponent implements OnInit, OnDestroy {
  // User Data
  user: User = {
    fullName: '',
    email: '',
    phone: '',
    role: 'sales',
    department: 'Sales',
    location: '',
    bio: '',
    profileImage: 'assets/images/logo1.png'
  };

  // Active Tab - Only profile tab remains
  activeTab = 'profile';

  // Loading & Error States
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.loadProfileData();
    
    // Subscribe to loading state
    this.subscriptions.push(
      this.profileService.loading$.subscribe(loading => {
        this.loading = loading;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================
  // LOAD PROFILE DATA FROM BACKEND
  // ============================================
  loadProfileData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.subscriptions.push(
      this.profileService.getProfile().subscribe({
        next: (userData: User) => {
          // ✅ FIX: Properly map all fields including profileImage
          this.user = {
            ...userData,
            phone: userData.phoneNumber || userData.phone || '',
            role: 'sales',
            department: 'Sales',
            // ✅ Use profileImage from backend, fallback to default if not present
            profileImage: userData.profileImage || 'assets/images/logo1.png'
          };
          this.loading = false;
          console.log('✅ Sales profile loaded:', this.user);
          console.log('✅ Profile image URL:', this.user.profileImage);
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.loading = false;
          console.error('❌ Failed to load profile:', error);
        }
      })
    );
  }

  // ============================================
  // PROFILE IMAGE UPLOAD
  // ============================================
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size should not exceed 5MB';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Upload to backend
    this.subscriptions.push(
      this.profileService.uploadAvatar(file).subscribe({
        next: (response) => {
          console.log('✅ Avatar upload response:', response);
          
          // ✅ FIX: Update profile image immediately with backend URL
          if (response.profileImage) {
            this.user.profileImage = response.profileImage;
            console.log('✅ Profile image updated to:', this.user.profileImage);
          }
          
          this.successMessage = 'Profile picture updated successfully!';
          this.loading = false;
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error: Error) => {
          console.error('❌ Avatar upload failed:', error);
          
          // Fallback: Display image locally if backend upload fails
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.user.profileImage = e.target.result;
          };
          reader.readAsDataURL(file);
          
          this.errorMessage = error.message || 'Failed to upload image';
          this.loading = false;
          
          setTimeout(() => {
            this.errorMessage = '';
          }, 3000);
        }
      })
    );
  }

  // ============================================
  // UPDATE PROFILE
  // ============================================
  updateProfile(): void {
    // Validation
    if (!this.user.fullName || !this.user.email || !this.user.phone) {
      this.errorMessage = 'Please fill in all required fields!';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.user.email)) {
      this.errorMessage = 'Please enter a valid email address';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const profileData: UpdateProfileDto = {
      fullName: this.user.fullName,
      email: this.user.email,
      phone: this.user.phone,
      location: this.user.location,
      bio: this.user.bio,
      department: 'Sales'
    };

    this.subscriptions.push(
      this.profileService.updateProfile(profileData).subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Profile updated successfully!';
          this.loading = false;
          
          // ✅ FIX: Update local user data including profileImage
          if (response.user) {
            this.user = {
              ...this.user,
              ...response.user,
              role: 'sales',
              department: 'Sales',
              phone: response.user.phoneNumber || response.user.phone || this.user.phone,
              // ✅ Keep profileImage updated
              profileImage: response.user.profileImage || this.user.profileImage
            };
            console.log('✅ Profile updated with image:', this.user.profileImage);
          }

          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.loading = false;
          
          setTimeout(() => {
            this.errorMessage = '';
          }, 3000);
        }
      })
    );
  }

  // ============================================
  // UTILITY: Clear Messages
  // ============================================
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}