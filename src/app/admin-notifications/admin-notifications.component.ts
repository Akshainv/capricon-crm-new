// src/app/features/notifications/admin-notifications/admin-notifications.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NotificationService, Notification } from '../services/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-notifications.component.html',
  styleUrls: ['./admin-notifications.component.css']
})
export class AdminNotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  activeFilter: 'all' | 'unread' | 'read' = 'all';
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private toastr: ToastrService,
    public notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
        this.applyFilter();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilter(): void {
    switch (this.activeFilter) {
      case 'unread':
        this.filteredNotifications = this.notifications.filter(n => !n.isRead);
        break;
      case 'read':
        this.filteredNotifications = this.notifications.filter(n => n.isRead);
        break;
      default:
        this.filteredNotifications = [...this.notifications];
    }
  }

  setFilter(filter: 'all' | 'unread' | 'read'): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.toastr.success('Marked as read');
      },
      error: (err) => {
        console.error('Error marking as read:', err);
        this.toastr.error('Failed to mark as read');
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.toastr.success('All notifications marked as read');
      },
      error: (err) => {
        console.error('Error marking all as read:', err);
        this.toastr.error('Failed to mark all as read');
      }
    });
  }

  deleteNotification(id: string, event: Event): void {
    event.stopPropagation();
    // Delete is not implemented in the service yet, but we can simulate or add it later.
    // For now, let's just mark it as read as a compromise or assume success.
    this.toastr.info('Permanent deletion not yet available');
  }

  handleNotificationClick(notification: Notification): void {
    this.notificationService.markAsRead(notification._id).subscribe();
    if (notification.actionLink) {
      this.router.navigate([notification.actionLink]);
    }
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  getReadCount(): number {
    return this.notifications.filter(n => n.isRead).length;
  }

  getAllCount(): number {
    return this.notifications.length;
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }
}