import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService, Project } from '../../../services/project.service';
import { AuthService } from '../../../services/auth.service';
import { interval, Subscription } from 'rxjs';

declare var Toastify: any;  // For Toastify

interface Milestone {
  id: string;
  key: string;
  title: string;
  status: 'completed' | 'in-progress' | 'pending';
  completedDate?: Date;
  expectedDate: Date;
  icon: string;
}

@Component({
  selector: 'app-project-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-tracking.component.html',
  styleUrls: ['./project-tracking.component.css']
})
export class ProjectTrackingComponent implements OnInit, OnDestroy {
  projectId: string | null = null;
  project: Project | null = null;
  loading: boolean = true;
  currentUserId: string = '';
  isSalesExecutive: boolean = false;
  
  Math = Math;
  
  milestones: Milestone[] = [];
  
  private refreshSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentUserId = currentUser.userId || '';
    }

    this.projectId = this.route.snapshot.paramMap.get('id');
    if (this.projectId) {
      this.loadProjectData(this.projectId);
      
      this.refreshSubscription = interval(30000).subscribe(() => {
        if (this.projectId) {
          this.loadProjectData(this.projectId, true);
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadProjectData(id: string, silent: boolean = false): void {
    if (!silent) {
      this.loading = true;
    }
    
    this.projectService.getProjectById(id).subscribe({
      next: (project) => {
        this.project = project;
        this.isSalesExecutive = this.currentUserId === project.assignedTo;
        this.generateMilestones(project);
        
        if (!silent) {
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading project:', error);
        if (!silent) {
          this.loading = false;
          this.showToast('Failed to load project details. Please try again.', 'error');
        }
      }
    });
  }

  generateMilestones(project: Project): void {
    const milestoneConfig = [
      { key: 'planning', title: 'Planning & Design', icon: 'fa-clipboard-list' },
      { key: 'site_preparation', title: 'Site Preparation', icon: 'fa-hard-hat' },
      { key: 'installation', title: 'Installation & Setup', icon: 'fa-tools' },
      { key: 'testing', title: 'Testing & Commissioning', icon: 'fa-clipboard-check' },
      { key: 'handover', title: 'Final Handover', icon: 'fa-handshake' },
      { key: 'completed', title: 'Project Completed', icon: 'fa-check-circle' }
    ];

    const currentMilestoneKey = project.currentMilestone || 'planning';

    const completedMilestonesSet = new Set<string>();
    if (project.progressHistory && project.progressHistory.length > 0) {
      project.progressHistory.forEach((history: any) => {
        const normalizedStatus = String(history.milestoneStatus || '').trim().toLowerCase();
        if (normalizedStatus === 'completed') {
          const normalizedMilestone = String(history.milestone || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_');
          completedMilestonesSet.add(normalizedMilestone);
        }
      });
    }

    const startDate = new Date(project.startDate);
    const endDate = new Date(project.expectedCompletionDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPerMilestone = Math.ceil(totalDays / milestoneConfig.length);

    this.milestones = milestoneConfig.map((config, index) => {
      const expectedDate = new Date(startDate);
      expectedDate.setDate(startDate.getDate() + (daysPerMilestone * (index + 1)));

      let status: 'completed' | 'in-progress' | 'pending' = 'pending';
      let completedDate: Date | undefined;

      if (completedMilestonesSet.has(config.key)) {
        status = 'completed';
        const historyEntry = project.progressHistory?.find(
          (h: any) => h.milestone === config.key && h.milestoneStatus === 'completed'
        );
        if (historyEntry) {
          completedDate = new Date(historyEntry.updatedAt);
        }
      } else if (config.key === currentMilestoneKey) {
        status = 'in-progress';
      }

      return {
        id: String(index + 1),
        key: config.key,
        title: config.title,
        status,
        completedDate,
        expectedDate,
        icon: config.icon
      };
    });
  }

  onMilestoneClick(milestone: Milestone): void {
    if (!this.isSalesExecutive) {
      this.showToast('Only the assigned sales executive can update milestones.', 'error');
      return;
    }

    if (!this.project) return;

    if (this.project.projectStatus === 'completed') {
      this.showToast('This project is already completed. No further updates allowed.', 'info');
      return;
    }

    if (milestone.status === 'completed') {
      this.showToast('This milestone is already completed.', 'info');
      return;
    }

    // Clean Toastify Confirmation (same as Import Leads)
    if (typeof Toastify !== 'undefined') {
      const toast = Toastify({
        text: `Mark "${milestone.title}" as completed? This will update project progress.`,
        duration: -1,
        close: true,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        style: {
          background: "linear-gradient(to right, #667eea, #764ba2)",
          borderRadius: "12px",
          fontSize: "15px",
          fontWeight: "500",
          textAlign: "center",
          maxWidth: "400px",
          padding: "20px"
        }
      }).showToast();

      setTimeout(() => {
        const toastElement = document.querySelector('.toastify') as HTMLElement;
        if (toastElement) {
          const buttonsHTML = `
            <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
              <button id="toast-confirm-btn" style="padding: 10px 24px; background: #00b09b; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Yes, Complete
              </button>
              <button id="toast-cancel-btn" style="padding: 10px 24px; background: #ff5f6d; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Cancel
              </button>
            </div>
          `;
          toastElement.insertAdjacentHTML('beforeend', buttonsHTML);

          document.getElementById('toast-confirm-btn')?.addEventListener('click', () => {
            toast.hideToast();
            this.completeMilestone(milestone);
          });

          document.getElementById('toast-cancel-btn')?.addEventListener('click', () => {
            toast.hideToast();
            this.showToast('Action cancelled', 'info');
          });
        }
      }, 100);
    } else {
      if (confirm(`Mark "${milestone.title}" as completed?`)) {
        this.completeMilestone(milestone);
      }
    }
  }

  completeMilestone(milestone: Milestone): void {
    if (!this.project) return;

    this.loading = true;

    const currentIndex = this.milestones.findIndex(m => m.key === milestone.key);
    const totalMilestones = this.milestones.length;
    const newProgress = Math.round(((currentIndex + 1) / totalMilestones) * 100);
    const nextMilestone = currentIndex < this.milestones.length - 1 
      ? this.milestones[currentIndex + 1] 
      : null;

    const isHandoverMilestone = milestone.key === 'handover';
    const finalProgress = isHandoverMilestone ? 100 : newProgress;
    const finalCurrentMilestone = isHandoverMilestone ? 'completed' : (nextMilestone ? nextMilestone.key : 'completed');

    const progressData = {
      completedMilestone: milestone.key,
      currentMilestone: finalCurrentMilestone,
      progressPercentage: finalProgress,
      progressNotes: isHandoverMilestone 
        ? `${milestone.title} completed - Project finished successfully!` 
        : `${milestone.title} completed`,
      issuesEncountered: '',
      nextSteps: isHandoverMilestone 
        ? 'Project completed successfully' 
        : (nextMilestone ? `Starting ${nextMilestone.title}` : 'Project completed'),
      updatedBy: this.currentUserId,
      milestoneStatus: 'completed',
      milestoneTitle: milestone.title
    };

    const projectId = this.project._id || this.project.id || '';

    this.projectService.updateProjectProgress(projectId, progressData).subscribe({
      next: (updatedProject) => {
        this.project = updatedProject;
        this.generateMilestones(updatedProject);
        this.milestones = this.milestones.map(m => ({...m}));
        this.loading = false;

        if (isHandoverMilestone || updatedProject.projectStatus === 'completed') {
          this.showToast(`🎉 ${milestone.title} completed! Project is now 100% complete and marked as COMPLETED!`, 'success');
        } else {
          this.showToast(`✅ ${milestone.title} marked as completed!`, 'success');
        }
      },
      error: (error) => {
        this.loading = false;
        this.showToast('Failed to update milestone. Please try again.', 'error');
        this.loadProjectData(projectId);
      }
    });
  }

  refreshProject(): void {
    if (this.projectId) {
      this.showToast('Refreshing project data...', 'info');
      this.loadProjectData(this.projectId);
    }
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'planning': '#60a5fa',
      'not_started': '#60a5fa',
      'in_progress': '#f59e0b',
      'on_hold': '#ec4899',
      'completed': '#22c55e',
      'cancelled': '#ef4444'
    };
    return colors[status] || '#999';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'planning': 'fa-clipboard-list',
      'not_started': 'fa-clipboard-list',
      'in_progress': 'fa-spinner',
      'on_hold': 'fa-pause-circle',
      'completed': 'fa-check-circle',
      'cancelled': 'fa-times-circle'
    };
    return icons[status] || 'fa-circle';
  }

  getMilestoneIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'completed': 'fa-check-circle',
      'in-progress': 'fa-sync',
      'pending': 'fa-clock'
    };
    return icons[status] || 'fa-circle';
  }

  getMilestoneStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'completed': '#22c55e',
      'in-progress': '#f59e0b',
      'pending': '#6b7280'
    };
    return colors[status] || '#999';
  }

  getCompletedMilestones(): number {
    return this.milestones.filter(m => m.status === 'completed').length;
  }

  getTotalMilestones(): number {
    return this.milestones.length;
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getDaysRemaining(): number {
    if (!this.project) return 0;
    const today = new Date();
    const completion = new Date(this.project.expectedCompletionDate);
    const diff = completion.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getProgressColor(): string {
    if (!this.project) return '#999';
    if (this.project.progressPercentage >= 80) return '#22c55e';
    if (this.project.progressPercentage >= 50) return '#f59e0b';
    return '#ef4444';
  }

  teamMembers = [
    { name: 'Project Manager', role: 'Manager' },
    { name: 'Lead Technician', role: 'Installation' },
    { name: 'Quality Inspector', role: 'QA' }
  ];

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (typeof Toastify !== 'undefined') {
      const backgroundColor = 
        type === 'success' ? 'linear-gradient(to right, #00b09b, #96c93d)' :
        type === 'error' ? 'linear-gradient(to right, #ff5f6d, #ffc371)' :
        'linear-gradient(to right, #667eea, #764ba2)';

      Toastify({
        text: message,
        duration: 4000,
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
    } else {
      alert(message);
    }
  }
}