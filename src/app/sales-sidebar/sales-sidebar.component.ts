import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../core/services/theme.service';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sales-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sales-sidebar.component.html',
  styleUrls: ['./sales-sidebar.component.css']
})
export class SalesSidebarComponent implements OnInit, OnDestroy {
  currentLogo: string = 'assets/images/logo-light.png';
  collapsed: boolean = false;
  mobileMenuOpen: boolean = false;
  private resizeHandler = () => this.handleResize();
  private destroy$ = new Subject<void>();

  // Sales user info
  userName: string = 'Sales Executive';
  userRole: string = 'Sales Team';

  menuSections: MenuSection[] = [
    {
      title: 'Dashboard',
      items: [
        { icon: 'fa-chart-line', label: 'Sales Dashboard', route: '/dashboard' }
      ]
    },
    {
      title: 'Lead Management',
      items: [
        { icon: 'fa-users', label: 'My Leads', route: '/leads' },
        { icon: 'fa-file-import', label: 'Import Leads', route: '/leads/import' }
      ]
    },
    {
      title: 'Quotations',
      items: [
        { icon: 'fa-file-invoice', label: 'My Quotations', route: '/quotations' }
      ]
    },
    {
      title: 'Project',
      items: [
        { icon: 'fa-project-diagram', label: 'My Projects', route: '/projects' }
      ]
    },
    {
      title: 'Reports',
      items: [
        { icon: 'fa-chart-pie', label: 'Report Dashboard', route: '/reports' }
      ]
    },
    {
      title: 'Settings',
      items: [
        { icon: 'fa-user-circle', label: 'My Profile', route: '/profile' }
      ]
    }
  ];

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    console.log('Sales Sidebar: Constructor called');
  }

  ngOnInit(): void {
    console.log('Sales Sidebar: ngOnInit called');

    const storedUser = localStorage.getItem('sales_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.userName = user.name || 'Sales Executive';
      this.userRole = user.role || 'Sales Team';
    }

    this.themeService.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe((theme: 'dark' | 'light') => {
        console.log('Sales Sidebar - Theme changed to:', theme);

        if (theme === 'dark') {
          this.currentLogo = 'assets/images/logo1.png';
          console.log('   → Using logo1.png');
        } else {
          this.currentLogo = 'assets/images/capricorn.png';
          console.log('   → Using capricorn.png');
        }
      });
    this.handleResize();
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.resizeHandler);
  }

  logout(): void {
    this.authService.logout();
    this.toastr.success('Logged out successfully', 'Logged out');
  }

  toggleCollapse(): void {
    const isMobile = window.innerWidth <= 1024;

    if (isMobile) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      if (this.mobileMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    } else {
      this.collapsed = !this.collapsed;
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  onMenuItemClick(): void {
    if (window.innerWidth <= 1024) {
      this.closeMobileMenu();
    }
  }

  private handleResize(): void {
    const isMobile = window.innerWidth <= 1024;

    if (!isMobile) {
      this.mobileMenuOpen = false;
      document.body.style.overflow = '';
    } else {
      this.collapsed = false;
    }
  }
}