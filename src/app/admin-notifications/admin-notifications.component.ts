// src/app/features/notifications/admin-notifications/admin-notifications.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Notification {
  id: number;
  icon: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  actionLink?: string;
}

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-notifications.component.html',
  styleUrls: ['./admin-notifications.component.css']
})
export class AdminNotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  activeFilter: 'all' | 'unread' | 'read' = 'all';

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadNotifications();
    this.applyFilter();
  }

  loadNotifications(): void {
    // Sample notifications - replace with actual API call
    this.notifications = [
      {
        id: 1,
        icon: 'fa-user-plus',
        title: 'New Lead Assigned',
        message: 'You have been assigned a new lead: ABC Corporation',
        time: '5 minutes ago',
        type: 'info',
        isRead: false,
        actionLink: '/admin/leads/123'
      },
      {
        id: 2,
        icon: 'fa-file-invoice',
        title: 'Quotation Approved',
        message: 'Your quotation #Q-2024-001 has been approved by the client',
        time: '1 hour ago',
        type: 'success',
        isRead: false,
        actionLink: '/admin/quotations/1'
      },
      {
        id: 3,
        icon: 'fa-bell',
        title: 'Follow-up Reminder',
        message: 'Follow-up call scheduled with XYZ Ltd. at 3:00 PM today',
        time: '2 hours ago',
        type: 'warning',
        isRead: false,
        actionLink: '/admin/tasks'
      },
      {
        id: 4,
        icon: 'fa-handshake',
        title: 'Deal Won',
        message: 'Congratulations! Deal #D-2024-045 has been closed successfully',
        time: '3 hours ago',
        type: 'success',
        isRead: true,
        actionLink: '/admin/deals/45'
      },
      {
        id: 5,
        icon: 'fa-calendar-check',
        title: 'Task Completed',
        message: 'Task "Prepare proposal for Client ABC" marked as complete',
        time: '5 hours ago',
        type: 'success',
        isRead: true
      },
      {
        id: 6,
        icon: 'fa-exclamation-triangle',
        title: 'Lead Expiring Soon',
        message: 'Lead "Tech Solutions Inc." will expire in 2 days',
        time: '1 day ago',
        type: 'warning',
        isRead: true,
        actionLink: '/admin/leads/456'
      },
      {
        id: 7,
        icon: 'fa-user-check',
        title: 'New Employee Approved',
        message: 'Employee "John Smith" has been approved and added to the system',
        time: '1 day ago',
        type: 'info',
        isRead: true,
        actionLink: '/admin/employee-approvals'
      },
      {
        id: 8,
        icon: 'fa-chart-line',
        title: 'Monthly Report Ready',
        message: 'Your monthly sales report for November is now available',
        time: '2 days ago',
        type: 'info',
        isRead: true,
        actionLink: '/admin/reports'
      },
      {
        id: 9,
        icon: 'fa-clock',
        title: 'Task Overdue',
        message: 'Task "Client presentation" is overdue by 1 day',
        time: '2 days ago',
        type: 'error',
        isRead: true,
        actionLink: '/admin/tasks'
      },
      {
        id: 10,
        icon: 'fa-project-diagram',
        title: 'Project Milestone Reached',
        message: 'Project "Website Redesign" has reached 75% completion',
        time: '3 days ago',
        type: 'success',
        isRead: true,
        actionLink: '/admin/projects/789'
      }
    ];
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

  markAsRead(notification: Notification): void {
    notification.isRead = true;
    this.applyFilter();
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
    this.applyFilter();
  }

  deleteNotification(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this notification?')) {
      this.notifications = this.notifications.filter(n => n.id !== id);
      this.applyFilter();
    }
  }

  handleNotificationClick(notification: Notification): void {
    this.markAsRead(notification);
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