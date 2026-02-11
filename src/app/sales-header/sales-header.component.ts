import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { ThemeService } from '../core/services/theme.service';
import { NotificationService, Notification } from '../services/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sales-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-header.component.html',
  styleUrls: ['./sales-header.component.css']
})
export class SalesHeaderComponent implements OnInit, OnDestroy {
  showProfile = false;
  showNotifications = false;
  currentTheme: 'dark' | 'light' = 'dark';
  private destroy$ = new Subject<void>();

  userName: string = 'Sales Executive';
  userEmail: string = 'sales@inspitetech.com';
  userRole: string = 'Sales Team';
  userInitials: string = 'SE';

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService,
    public notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadUserInfo();

    this.themeService.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.currentTheme = theme as 'dark' | 'light';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserInfo(): void {
    const storedUser = localStorage.getItem('sales_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.userName = user.name || 'Sales Executive';
      this.userEmail = user.email || 'sales@inspitetech.com';
      this.userRole = user.role || 'Sales Team';
      this.userInitials = this.getInitials(this.userName);
    }
  }

  private getInitials(name: string): string {
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0] + (names[0][1] || '');
  }

  toggleProfile(): void {
    this.showProfile = !this.showProfile;
    this.showNotifications = false;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showProfile = false;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.showProfile = false;
  }

  getThemeIcon(): string {
    return this.currentTheme === 'dark' ? 'fa-sun' : 'fa-moon';
  }

  getThemeLabel(): string {
    return this.currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.showProfile = false;
    this.showNotifications = false;
  }

  markAsRead(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(id).subscribe();
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe();
  }

  handleNotificationClick(notification: Notification): void {
    this.notificationService.markAsRead(notification._id).subscribe();
    this.showNotifications = false;
    if (notification.actionLink) {
      this.router.navigate([notification.actionLink]);
    }
  }

  formatTime(time: string): string {
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + date.toLocaleDateString();
  }

  logout(): void {
    this.authService.logout();
    this.toastr.success('Logged out successfully', 'Logged out');
  }
}