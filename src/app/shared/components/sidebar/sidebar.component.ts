import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { ThemeService } from '../../../core/services/theme.service';
import { Subject, takeUntil } from 'rxjs';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentLogo: string = 'assets/images/logo-light.png';
  collapsed: boolean = false;
  mobileMenuOpen: boolean = false;
  isMobile: boolean = false;
  private destroy$ = new Subject<void>();

  menuSections: MenuSection[] = [
    {
      title: 'Main',
      items: [
        { icon: 'fa-chart-line', label: 'Dashboard', route: '/admin-dashboard' },
        { icon: 'fa-user-check', label: 'Employee Approvals', route: '/admin/employee-approvals' }
      ]
    },
    {
      title: 'Sales',
      items: [
        { icon: 'fa-users', label: 'Leads', route: '/admin/leads' },
        { icon: 'fa-user-plus', label: 'Assign Leads', route: '/admin/leads/assign' },
        { icon: 'fa-file-invoice', label: 'Quotation', route: '/admin/admin-quotations' },
        { icon: 'fa-handshake', label: 'Deals', route: '/admin/deals' }
      ]
    },
    {
      title: 'Management',
      items: [
        { icon: 'fa-project-diagram', label: 'Projects', route: '/admin/projects' }
      ]
    },
    {
      title: 'Reports',
      items: [
        { icon: 'fa-chart-bar', label: 'Report Dashboard', route: '/admin/reports' }
      ]
    }
  ];

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe((theme: 'dark' | 'light') => {
        if (theme === 'dark') {
          this.currentLogo = 'assets/images/logo1.png';
        } else {
          this.currentLogo = 'assets/images/capricorn.png';
        }
      });

    // Initialize responsive state
    this.checkScreenSize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Clean up body overflow
    document.body.style.overflow = '';
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 1024;

    // If transitioning from mobile to desktop, close mobile menu
    if (wasMobile && !this.isMobile) {
      this.mobileMenuOpen = false;
      document.body.style.overflow = '';
    }

    // If transitioning from desktop to mobile, reset collapsed state
    if (!wasMobile && this.isMobile) {
      this.collapsed = false;
    }
  }

  toggleSidebar(): void {
    // Check screen width directly for reliable DevTools compatibility
    const isTabletOrMobile = window.innerWidth <= 1024;

    if (isTabletOrMobile) {
      // Mobile/Tablet: toggle overlay menu
      this.mobileMenuOpen = !this.mobileMenuOpen;
      this.isMobile = true; // Ensure isMobile is synced

      // Prevent body scroll when menu is open on mobile
      if (this.mobileMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    } else {
      // Desktop: toggle collapse
      this.collapsed = !this.collapsed;
    }
  }

  closeMobileMenu(): void {
    // Check screen width directly for reliable DevTools compatibility
    if (window.innerWidth <= 1024) {
      this.mobileMenuOpen = false;
      document.body.style.overflow = '';
    }
  }

  onMenuItemClick(): void {
    // Close mobile menu when clicking a menu item
    this.closeMobileMenu();
  }

  logout(): void {
    this.authService.logout();
    this.toastr.success('Logged out successfully', 'Logged out');
  }
}