// src/app/layouts/main-layout/main-layout.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { SalesSidebarComponent } from '../../sales-sidebar/sales-sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SalesHeaderComponent } from '../../sales-header/sales-header.component';
import { ThemeService } from '../../core/services/theme.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    SalesSidebarComponent,
    HeaderComponent,
    SalesHeaderComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  isAdminRoute: boolean = false;

  constructor(
    public themeService: ThemeService,
    private router: Router
  ) {
    console.log('✅ Main Layout: Constructor');
  }

  ngOnInit(): void {
    console.log('✅ Main Layout: Initialized with theme:', this.themeService.getCurrentTheme());

    // Check initial route
    this.checkRoute();

    // Keep track of previous URL so we can maintain admin layout for related navigations
    let previousUrl = this.router.url || '';

    // Listen to route events to (1) redirect non-admin navigations back to admin equivalents
    // when the user came from an admin route, and (2) update the admin-route flag on NavigationEnd.
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        const target = (event.url || '').split('?')[0].split('#')[0];

        // If we're coming from an admin route and target is not admin-prefixed,
        // try to redirect to the admin equivalent (prefix with /admin).
        if (previousUrl.startsWith('/admin') && !target.startsWith('/admin') && target !== '/login') {
          const adminTarget = target === '/' ? '/admin-dashboard' : (target.startsWith('/') ? '/admin' + target : '/admin/' + target);
          console.log('↩ Redirecting navigation to admin equivalent:', target, '→', adminTarget);
          // Cancel current navigation by navigating to adminTarget instead.
          this.router.navigateByUrl(adminTarget);
        }
      }

      if (event instanceof NavigationEnd) {
        // Update previousUrl after navigation finishes
        previousUrl = event.urlAfterRedirects || event.url;
        this.checkRoute();
      }
    });
  }

  private checkRoute(): void {
    const url = this.router.url;
    // Show admin sidebar/header for admin-related routes.
    // Support both `/admin/...` prefix and legacy `/admin-dashboard` route.
    this.isAdminRoute = url.startsWith('/admin') || url.startsWith('/admin-dashboard');
    console.log('🔍 Route Check:', url, '| Is Admin Route:', this.isAdminRoute);
  }
}