// src/app/sales-activity-log/sales-activity-log.component.ts
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
  selector: 'app-sales-activity-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-activity-log.component.html',
  styleUrls: ['./sales-activity-log.component.css']
})
export class SalesActivityLogComponent implements OnInit {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  activeFilter: 'all' | 'unread' | 'read' = 'all';
  
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.applyFilter();
  }

  loadNotifications(): void {
    // Sample notifications based on sales header notifications
    this.notifications = [
      {
        id: 1,
        icon: 'fa-user-plus',
        title: 'New Lead Assigned',
        message: 'New lead assigned: ABC Corporation',
        time: '5 min ago',
        type: 'info',
        isRead: false,
        actionLink: '/leads'
      },
      {
        id: 2,
        icon: 'fa-file-invoice',
        title: 'Quotation Approved',
        message: 'Quotation approved by client',
        time: '1 hour ago',
        type: 'success',
        isRead: false,
        actionLink: '/quotations'
      },
      {
        id: 3,
        icon: 'fa-bell',
        title: 'Follow-up Reminder',
        message: 'Follow-up call reminder for today',
        time: '2 hours ago',
        type: 'warning',
        isRead: false,
        actionLink: '/tasks'
      },
      {
        id: 4,
        icon: 'fa-handshake',
        title: 'Deal Won',
        message: 'Deal moved to won stage',
        time: '3 hours ago',
        type: 'success',
        isRead: true,
        actionLink: '/deals'
      },
      {
        id: 5,
        icon: 'fa-tasks',
        title: 'Tasks Pending',
        message: '5 tasks pending for today',
        time: '4 hours ago',
        type: 'warning',
        isRead: true,
        actionLink: '/tasks'
      },
      {
        id: 6,
        icon: 'fa-user-plus',
        title: 'New Lead Import',
        message: '15 new leads imported successfully from Excel file',
        time: '5 hours ago',
        type: 'success',
        isRead: true,
        actionLink: '/leads'
      },
      {
        id: 7,
        icon: 'fa-calendar-check',
        title: 'Meeting Scheduled',
        message: 'Client meeting scheduled for tomorrow at 10:00 AM',
        time: '1 day ago',
        type: 'info',
        isRead: true,
        actionLink: '/calendar'
      },
      {
        id: 8,
        icon: 'fa-exclamation-triangle',
        title: 'Lead Expiring Soon',
        message: 'Lead "XYZ Industries" will expire in 2 days',
        time: '1 day ago',
        type: 'warning',
        isRead: true,
        actionLink: '/leads'
      },
      {
        id: 9,
        icon: 'fa-clock',
        title: 'Task Overdue',
        message: 'Task "Follow-up with Tech Corp" is overdue by 1 day',
        time: '2 days ago',
        type: 'error',
        isRead: true,
        actionLink: '/tasks'
      },
      {
        id: 10,
        icon: 'fa-file-invoice',
        title: 'Quotation Rejected',
        message: 'Quotation #Q-2024-045 has been rejected. Feedback received.',
        time: '2 days ago',
        type: 'error',
        isRead: true,
        actionLink: '/quotations'
      },
      {
        id: 11,
        icon: 'fa-chart-line',
        title: 'Performance Update',
        message: 'Your monthly sales target achieved: 85% completion',
        time: '3 days ago',
        type: 'success',
        isRead: true,
        actionLink: '/reports/performance'
      },
      {
        id: 12,
        icon: 'fa-briefcase',
        title: 'Deal Stage Changed',
        message: 'Deal "Industrial Elevators Project" moved to negotiation stage',
        time: '3 days ago',
        type: 'info',
        isRead: true,
        actionLink: '/deals'
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
    this.router.navigate(['/dashboard']);
  }
}