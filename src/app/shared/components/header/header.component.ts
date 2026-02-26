import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { Subject, takeUntil } from 'rxjs';

import { NotificationService, Notification } from '../../../services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentTheme: 'dark' | 'light' = 'dark';
  showNotifications = false;
  private destroy$ = new Subject<void>();

  constructor(
    public themeService: ThemeService,
    public notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.themeService.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.currentTheme = theme;
      });

    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        console.log('🔔 HeaderComponent: Unread count updated:', count);
      });

    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        console.log('🔔 HeaderComponent: Notifications list updated:', notifications.length);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getThemeIcon(): string {
    return this.currentTheme === 'dark' ? 'fa-sun' : 'fa-moon';
  }

  getThemeLabel(): string {
    return this.currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
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
}