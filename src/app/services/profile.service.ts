// src/app/services/profile.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

// ============================================
// INTERFACES & MODELS
// ============================================

export interface User {
  _id?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  role: string;
  department?: string;
  location?: string;
  employeeId?: string;
  joinDate?: string;
  reportingTo?: string;
  bio?: string;
  profileImage?: string;
  status?: string;
  notificationPreferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  leadAssignments?: boolean;
  dealUpdates?: boolean;
  quotationApprovals?: boolean;
  taskReminders?: boolean;
  followUpAlerts?: boolean;
}

export interface UpdateProfileDto {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  department?: string;
  profileImage?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiResponse<T = any> {
  message?: string;
  user?: T;
  data?: T;
  success?: boolean;
  profileImage?: string;
  notificationPreferences?: NotificationPreferences;
}

// ============================================
// PROFILE SERVICE
// ============================================

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  // Direct API URL - Change this to match your backend
  private apiUrl = 'http://localhost:3000/profile-settings';

  // BehaviorSubject to share user data across components
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) { }

  // ============================================
  // HELPER: Get HTTP Headers with JWT Token
  // ============================================
  private getHeaders(): HttpHeaders {
    // Use access_token from AuthService (localStorage)
    const token = localStorage.getItem('access_token');
    const userId = this.getUserIdFromStorage();

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'x-user-id': userId || '' // For backend testing
    });
  }

  // ============================================
  // HELPER: Get User ID from localStorage
  // ============================================
  private getUserIdFromStorage(): string | null {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return null;

    try {
      const user = JSON.parse(currentUser);
      return user.userId || user._id || user.id || null;
    } catch (error) {
      console.error('Error parsing currentUser:', error);
      return null;
    }
  }

  // ============================================
  // GET: Fetch Current User Profile
  // ============================================
  getProfile(): Observable<User> {
    this.loadingSubject.next(true);

    return this.http.get<User>(`${this.apiUrl}/me`, {
      headers: this.getHeaders()
    }).pipe(
      tap((user: User) => {
        this.userSubject.next(user);
        this.loadingSubject.next(false);
        console.log('✅ Profile loaded:', user);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('❌ Error fetching profile:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to load profile'));
      })
    );
  }

  // ============================================
  // PATCH: Update User Profile
  // ============================================
  updateProfile(profileData: UpdateProfileDto): Observable<ApiResponse<User>> {
    this.loadingSubject.next(true);

    return this.http.patch<ApiResponse<User>>(
      `${this.apiUrl}/profile`,
      profileData,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: ApiResponse<User>) => {
        if (response.user) {
          this.userSubject.next(response.user);
        }
        this.loadingSubject.next(false);
        console.log('✅ Profile updated:', response);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('❌ Error updating profile:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to update profile'));
      })
    );
  }

  // ============================================
  // POST: Change Password
  // ============================================
  changePassword(passwordData: ChangePasswordDto): Observable<ApiResponse> {
    this.loadingSubject.next(true);

    return this.http.post<ApiResponse>(
      `${this.apiUrl}/change-password`,
      passwordData,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: ApiResponse) => {
        this.loadingSubject.next(false);
        console.log('✅ Password changed:', response);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('❌ Error changing password:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to change password'));
      })
    );
  }

  // ============================================
  // POST: Upload Profile Avatar
  // ============================================
  uploadAvatar(file: File): Observable<ApiResponse> {
    this.loadingSubject.next(true);

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('access_token');
    const userId = this.getUserIdFromStorage();

    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'x-user-id': userId || ''
    });

    return this.http.post<ApiResponse>(
      `${this.apiUrl}/upload-avatar`,
      formData,
      { headers }
    ).pipe(
      tap((response: ApiResponse) => {
        // Update user's profile image
        const currentUser = this.userSubject.value;
        if (currentUser && response.profileImage) {
          currentUser.profileImage = response.profileImage;
          this.userSubject.next(currentUser);
        }
        this.loadingSubject.next(false);
        console.log('✅ Avatar uploaded:', response);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('❌ Error uploading avatar:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to upload avatar'));
      })
    );
  }

  // ============================================
  // PATCH: Update Notification Preferences
  // ============================================
  updateNotificationSettings(preferences: NotificationPreferences): Observable<ApiResponse> {
    this.loadingSubject.next(true);

    return this.http.patch<ApiResponse>(
      `${this.apiUrl}/notifications`,
      preferences,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: ApiResponse) => {
        this.loadingSubject.next(false);
        console.log('✅ Notification preferences updated:', response);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('❌ Error updating notification settings:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to update notification settings'));
      })
    );
  }

  // ============================================
  // UTILITY: Get Current User from BehaviorSubject
  // ============================================
  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  // ============================================
  // UTILITY: Clear User Data (on logout)
  // ============================================
  clearUserData(): void {
    this.userSubject.next(null);
  }

  // ============================================
  // UTILITY: Get Loading State
  // ============================================
  isLoading(): boolean {
    return this.loadingSubject.value;
  }
}