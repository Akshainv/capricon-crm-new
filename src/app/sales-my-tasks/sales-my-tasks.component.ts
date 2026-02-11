import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  leadId?: string;
  leadName?: string;
  dealId?: string;
  dealName?: string;
  category: 'follow-up' | 'meeting' | 'quotation' | 'site-visit' | 'other';
  createdAt: Date;
}

@Component({
  selector: 'app-sales-my-tasks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-my-tasks.component.html',
  styleUrls: ['./sales-my-tasks.component.css']
})
export class SalesMyTasksComponent implements OnInit {
  filterStatus: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed' = 'all';
  selectedCategory: string = 'all';

  // Mock data - Replace with actual service
  currentUser = 'Rajesh Kumar'; 

  tasks: Task[] = [
    {
      id: '1',
      title: 'Follow-up call - ABC Corporation',
      description: 'Discuss quotation details and answer technical questions about VFD drive system',
      dueDate: new Date('2024-12-02T15:00:00'),
      priority: 'high',
      status: 'pending',
      leadId: 'LD-2024-001',
      leadName: 'ABC Corporation - John Smith',
      category: 'follow-up',
      createdAt: new Date('2024-11-30')
    },
    {
      id: '2',
      title: 'Send revised quotation',
      description: 'Update pricing based on customer requirements for 8-floor elevator',
      dueDate: new Date('2024-12-02T17:00:00'),
      priority: 'high',
      status: 'pending',
      leadId: 'LD-2024-002',
      leadName: 'XYZ Developers - Sarah Johnson',
      category: 'quotation',
      createdAt: new Date('2024-12-01')
    },
    {
      id: '3',
      title: 'Site visit - Tech Park',
      description: 'Conduct site survey and measurements for new commercial building',
      dueDate: new Date('2024-12-03T10:00:00'),
      priority: 'high',
      status: 'pending',
      leadId: 'LD-2024-003',
      leadName: 'Tech Park Ltd - Michael Brown',
      category: 'site-visit',
      createdAt: new Date('2024-11-30')
    },
    {
      id: '4',
      title: 'Client meeting - Budget discussion',
      description: 'Meet with procurement team to discuss pricing options',
      dueDate: new Date('2024-12-04T14:00:00'),
      priority: 'medium',
      status: 'pending',
      leadId: 'LD-2024-004',
      leadName: 'Green Heights - Emily Davis',
      category: 'meeting',
      createdAt: new Date('2024-12-01')
    },
    {
      id: '5',
      title: 'Email product brochure',
      description: 'Send elevator specifications and features brochure',
      dueDate: new Date('2024-12-01T12:00:00'),
      priority: 'low',
      status: 'completed',
      leadId: 'LD-2024-005',
      leadName: 'Metro Mall - David Wilson',
      category: 'follow-up',
      createdAt: new Date('2024-11-28')
    },
    {
      id: '6',
      title: 'Prepare installation proposal',
      description: 'Create detailed proposal with timeline and costing',
      dueDate: new Date('2024-11-30T16:00:00'),
      priority: 'high',
      status: 'pending',
      dealId: 'DL-2024-001',
      dealName: 'ABC Corp Deal - ₹45L',
      category: 'other',
      createdAt: new Date('2024-11-28')
    },
    {
      id: '7',
      title: 'Schedule demo for customer',
      description: 'Arrange product demonstration at showroom',
      dueDate: new Date('2024-12-05T11:00:00'),
      priority: 'medium',
      status: 'pending',
      leadId: 'LD-2024-006',
      leadName: 'Star Apartments - Jessica Martinez',
      category: 'meeting',
      createdAt: new Date('2024-12-01')
    }
  ];

  filteredTasks: Task[] = [];

  taskCategories = [
    { value: 'follow-up', label: 'Follow-up', icon: 'fa-phone' },
    { value: 'meeting', label: 'Meeting', icon: 'fa-users' },
    { value: 'quotation', label: 'Quotation', icon: 'fa-file-invoice' },
    { value: 'site-visit', label: 'Site Visit', icon: 'fa-map-marker-alt' },
    { value: 'other', label: 'Other', icon: 'fa-tasks' }
  ];

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
    this.filterTasks();
  }

  filterTasks(): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.filteredTasks = this.tasks.filter(task => {
      // Filter by status
      let statusMatch = false;
      if (this.filterStatus === 'all') {
        statusMatch = task.status === 'pending';
      } else if (this.filterStatus === 'today') {
        statusMatch = task.status === 'pending' && 
               task.dueDate >= today && 
               task.dueDate < tomorrow;
      } else if (this.filterStatus === 'upcoming') {
        statusMatch = task.status === 'pending' && task.dueDate >= tomorrow;
      } else if (this.filterStatus === 'overdue') {
        statusMatch = task.status === 'pending' && task.dueDate < today;
      } else if (this.filterStatus === 'completed') {
        statusMatch = task.status === 'completed';
      }

      // Filter by category
      const categoryMatch = this.selectedCategory === 'all' || task.category === this.selectedCategory;

      return statusMatch && categoryMatch;
    });

    // Sort by due date (earliest first)
    this.filteredTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  setFilter(status: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed'): void {
    this.filterStatus = status;
    this.filterTasks();
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.filterTasks();
  }

  toggleTaskStatus(taskId: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = task.status === 'pending' ? 'completed' : 'pending';
      this.filterTasks();
    }
  }

  deleteTask(taskId: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && confirm(`Are you sure you want to delete the task "${task.title}"?`)) {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.filterTasks();
      console.log(`Task ${taskId} deleted successfully`);
    }
  }

  viewLead(leadId: string): void {
    this.router.navigate(['/leads', leadId]);
  }

  viewDeal(dealId: string): void {
    this.router.navigate(['/deals', dealId]);
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'follow-up': 'fa-phone',
      'meeting': 'fa-users',
      'quotation': 'fa-file-invoice',
      'site-visit': 'fa-map-marker-alt',
      'other': 'fa-tasks'
    };
    return icons[category] || 'fa-tasks';
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'follow-up': '#60a5fa',
      'meeting': '#fb923c',
      'quotation': '#c084fc',
      'site-visit': '#4ade80',
      'other': '#d4b347'
    };
    return colors[category] || '#d4b347';
  }

  isOverdue(task: Task): boolean {
    const now = new Date();
    return task.status === 'pending' && task.dueDate < now;
  }

  isDueToday(task: Task): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return task.dueDate >= today && task.dueDate < tomorrow;
  }

  formatDueDate(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date < today) {
      const daysOverdue = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`;
    } else if (date >= today && date < tomorrow) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date >= tomorrow && date < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  getTaskCounts() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      today: this.tasks.filter(t => 
        t.status === 'pending' && 
        t.dueDate >= today && 
        t.dueDate < tomorrow
      ).length,
      upcoming: this.tasks.filter(t => 
        t.status === 'pending' && 
        t.dueDate >= tomorrow
      ).length,
      overdue: this.tasks.filter(t => 
        t.status === 'pending' && 
        t.dueDate < today
      ).length,
      completed: this.tasks.filter(t => t.status === 'completed').length
    };
  }
}