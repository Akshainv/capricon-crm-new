import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

// Interfaces
interface LoginDto {
  email: string;
  password: string;
}

interface SignupDto {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  photo?: File;
}

interface User {
  email: string;
  role: 'admin' | 'employee';
  userId: string;
  fullName?: string;
}

interface LoginResponse {
  access_token: string;
  user: User;
}

interface ApiResponse<T> {
  statusCode?: number;
  message: string;
  data?: T;
  access_token?: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value && !!this.getToken();
  }

  public get isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  public get isEmployee(): boolean {
    return this.currentUserValue?.role === 'employee';
  }

  public getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          if (response.access_token && response.user) {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.setItem('isLoggedIn', 'true');
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  // FIXED: Employee signup with proper FormData handling
  employeeSignup(formData: FormData): Observable<any> {
    // DO NOT set Content-Type header - browser will set it automatically with boundary
    // DO NOT set Authorization header - this is a public registration endpoint
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/employee/register`,
      formData,
      {
        // Empty headers object - let browser handle Content-Type for FormData
        headers: new HttpHeaders()
      }
    ).pipe(map(response => response));
  }

  adminSignup(email: string, password: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/admin`, { email, password })
      .pipe(map(response => response));
  }

  logout(): void {
    const keysToRemove = ['access_token', 'auth_token', 'currentUser', 'currentuser', 'isLoggedIn', 'sales_user'];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/password/forgot-password`, { email })
      .pipe(map(response => response));
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/password/reset-password/${token}`, {
      newPassword
    }).pipe(map(response => response));
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    const userId = this.currentUserValue?.userId;
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/password/change-password/${userId}`, {
      oldPassword,
      newPassword
    }).pipe(map(response => response));
  }

  getAdminProfile(id: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/admin/profile/${id}`)
      .pipe(map(response => response.data));
  }

  getAllAdmins(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/admin`)
      .pipe(map(response => response.data));
  }

  verifyToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    return this.http.post<any>(`${this.apiUrl}/auth/verify-token`, { token })
      .pipe(
        map(response => response.valid || false),
        tap(valid => {
          if (!valid) {
            this.logout();
          }
        })
      );
  }

  autoLogin(): void {
    const token = this.getToken();
    const storedUser = localStorage.getItem('currentUser');

    if (token && storedUser) {
      const user: User = JSON.parse(storedUser);
      this.currentUserSubject.next(user);
    }
  }

  navigateToDashboard(): void {
    const user = this.currentUserValue;
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    if (user.role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else if (user.role === 'employee') {
      this.router.navigate(['/dashboard']);
    }
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}