import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DealService, Deal } from '../../../services/deal.service';
import { ProjectService } from '../../../services/project.service';
import { AuthService } from '../../../services/auth.service';

declare var Toastify: any;  // For Toastify

@Component({
  selector: 'app-deal-pipeline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deal-pipeline.component.html',
  styleUrls: ['./deal-pipeline.component.css']
})
export class DealPipelineComponent implements OnInit {
  allDeals: Deal[] = [];
  loading: boolean = false;

  constructor(
    public router: Router,
    private dealService: DealService,
    private projectService: ProjectService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDeals();
  }

  loadDeals(): void {
    this.loading = true;

    this.dealService.getPendingDeals().subscribe({
      next: (deals) => {
        console.log('Loaded pending deals:', deals);
        this.allDeals = deals;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading deals:', error);
        this.loading = false;
        this.showToast('Failed to load deals. Please try again.', 'error');
      }
    });
  }

  convertToProject(deal: Deal): void {
    if (deal.converted) {
      this.showToast('This deal has already been converted to a project.', 'info');
      return;
    }

    // Toastify Confirmation
    if (typeof Toastify !== 'undefined') {
      const toast = Toastify({
        text: `Convert "${this.getDealTitle(deal)}" to a project? This will create a new project and mark this deal as converted.`,
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
          maxWidth: "420px",
          padding: "20px"
        }
      }).showToast();

      setTimeout(() => {
        const toastElement = document.querySelector('.toastify') as HTMLElement;
        if (toastElement) {
          const buttonsHTML = `
            <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
              <button id="toast-confirm-convert" style="padding: 10px 24px; background: #00b09b; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Yes, Convert
              </button>
              <button id="toast-cancel-convert" style="padding: 10px 24px; background: #ff5f6d; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Cancel
              </button>
            </div>
          `;
          toastElement.insertAdjacentHTML('beforeend', buttonsHTML);

          document.getElementById('toast-confirm-convert')?.addEventListener('click', () => {
            toast.hideToast();
            this.proceedConvertToProject(deal);
          });

          document.getElementById('toast-cancel-convert')?.addEventListener('click', () => {
            toast.hideToast();
            this.showToast('Conversion cancelled', 'info');
          });
        }
      }, 100);
    } else {
      if (confirm(`Convert "${this.getDealTitle(deal)}" to a project?\n\nThis will create a new project and mark this deal as converted.`)) {
        this.proceedConvertToProject(deal);
      }
    }
  }

  private proceedConvertToProject(deal: Deal): void {
    this.loading = true;

    this.projectService.createProjectFromDeal(deal).subscribe({
      next: (project) => {
        console.log('Project created:', project);
        const dealId = deal._id || deal.id || '';
        const projectId = project._id || project.id || '';

        this.dealService.markAsConverted(dealId, projectId).subscribe({
          next: (updatedDeal) => {
            this.loading = false;
            
            this.allDeals = this.allDeals.filter(d => (d._id || d.id) !== dealId);

            this.showToast(`Successfully converted to project!\nProject Code: ${project.projectCode}\nProject Name: ${project.projectName}`, 'success');

            this.router.navigate(['/projects'], { 
              queryParams: { 
                newProject: projectId,
                highlight: 'true'
              }
            });
          },
          error: (error) => {
            this.loading = false;
            console.error('Error marking deal as converted:', error);
            this.showToast('Project created but failed to update deal status. Please refresh.', 'error');
            this.loadDeals();
          }
        });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error converting deal to project:', error);
        this.showToast('Failed to convert deal to project. Please try again.', 'error');
      }
    });
  }

  deleteDeal(deal: Deal, event: Event): void {
    event.stopPropagation();

    if (deal.converted) {
      this.showToast('Cannot delete a converted deal. Please delete the associated project first.', 'info');
      return;
    }

    // Toastify Confirmation for Delete
    if (typeof Toastify !== 'undefined') {
      const toast = Toastify({
        text: `Are you sure you want to delete the deal "${this.getDealTitle(deal)}"? This action cannot be undone.`,
        duration: -1,
        close: true,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        style: {
          background: "linear-gradient(to right, #ff5f6d, #ffc371)",
          borderRadius: "12px",
          fontSize: "15px",
          fontWeight: "500",
          textAlign: "center",
          maxWidth: "420px",
          padding: "20px"
        }
      }).showToast();

      setTimeout(() => {
        const toastElement = document.querySelector('.toastify') as HTMLElement;
        if (toastElement) {
          const buttonsHTML = `
            <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
              <button id="toast-confirm-delete" style="padding: 10px 24px; background: #ff5f6d; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Yes, Delete
              </button>
              <button id="toast-cancel-delete" style="padding: 10px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Cancel
              </button>
            </div>
          `;
          toastElement.insertAdjacentHTML('beforeend', buttonsHTML);

          document.getElementById('toast-confirm-delete')?.addEventListener('click', () => {
            toast.hideToast();
            this.proceedDeleteDeal(deal);
          });

          document.getElementById('toast-cancel-delete')?.addEventListener('click', () => {
            toast.hideToast();
            this.showToast('Delete cancelled', 'info');
          });
        }
      }, 100);
    } else {
      if (confirm(`Are you sure you want to delete the deal "${this.getDealTitle(deal)}"? This action cannot be undone.`)) {
        this.proceedDeleteDeal(deal);
      }
    }
  }

  private proceedDeleteDeal(deal: Deal): void {
    this.loading = true;
    const dealId = deal._id || deal.id || '';

    this.dealService.deleteDeal(dealId).subscribe({
      next: () => {
        this.loading = false;
        
        this.allDeals = this.allDeals.filter(d => (d._id || d.id) !== dealId);
        
        this.showToast('Deal deleted successfully!', 'success');
      },
      error: (error) => {
        this.loading = false;
        console.error('Error deleting deal:', error);
        this.showToast('Failed to delete deal. Please try again.', 'error');
      }
    });
  }

  viewDealDetails(deal: Deal): void {
    const dealId = deal._id || deal.id;
    console.log('Viewing deal:', dealId);
    this.router.navigate(['/deals', dealId]);
  }

  getTotalValue(): number {
    return this.allDeals.reduce((sum, deal) => sum + deal.dealAmount, 0);
  }

  getPendingDealsCount(): number {
    return this.allDeals.length;
  }

  getConvertedDealsCount(): number {
    return 0;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  getStatusBadgeClass(deal: Deal): string {
    if (deal.converted) return 'status-converted';
    if (deal.DealStatus === 'won') return 'status-won';
    if (deal.DealStatus === 'pending') return 'status-pending';
    return 'status-default';
  }

  getStatusText(deal: Deal): string {
    if (deal.converted) return 'Converted';
    if (deal.DealStatus === 'won') return 'Won';
    if (deal.DealStatus === 'pending') return 'Pending';
    return deal.DealStatus || 'Unknown';
  }

  getDealTitle(deal: Deal): string {
    return deal.title || deal.dealTitle || 'Untitled Deal';
  }

  getDealCompany(deal: Deal): string {
    return deal.company || deal.companyName || 'N/A';
  }

  getDealElevatorType(deal: Deal): string {
    return deal.elevatorType || deal.dealDetails || 'N/A';
  }

  getDealExpectedCloseDate(deal: Deal): string {
    return deal.expectedCloseDate || deal.expectedClosingDate || '';
  }

  getAssignedToName(deal: Deal): string {
    return deal.assignedToName || 'Sales Executive';
  }

  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    if (typeof Toastify !== 'undefined') {
      const backgroundColor = 
        type === 'success' ? 'linear-gradient(to right, #00b09b, #96c93d)' :
        type === 'error' ? 'linear-gradient(to right, #ff5f6d, #ffc371)' :
        type === 'warning' ? 'linear-gradient(to right, #f39c12, #e67e22)' :
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