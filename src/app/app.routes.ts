// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterHereComponent } from './register-here/register-here.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

// Dashboard Imports
import { DashboardHomeComponent } from './features/dashboard/dashboard-home/dashboard-home.component';
import { SalesDashboardComponent } from './sales-dashboard/sales-dashboard.component';

// Employee Management Imports
import { EmployeeApprovalsComponent } from './employee-approvals/employee-approvals.component';

// Profile & Settings Imports
import { UserProfileComponent } from './features/profile/user-profile/user-profile.component';
import { SalesProfileComponent } from './sales-profile/sales-profile.component';
import { AccountSettingsComponent } from './features/profile/account-settings/account-settings.component';
import { SalesSettingsComponent } from './sales-settings/sales-settings.component';

// Lead Management Imports
import { LeadsListComponent } from './features/leads/leads-list/leads-list.component';
import { SalesLeadsComponent } from './sales-leads/sales-leads.component';
import { LeadFormComponent } from './features/leads/lead-form/lead-form.component';
import { LeadDetailComponent } from './features/leads/lead-detail/lead-detail.component';
import { LeadAssignmentComponent } from './features/leads/lead-assignment/lead-assignment.component';
import { ImportLeadsComponent } from './features/leads/import-leads/import-leads.component';
import { SalesImportLeadsComponent } from './sales-import-leads/sales-import-leads.component';
import { SalesAddLeadComponent } from './sales-add-leads/sales-add-leads.component';

// Communication Imports
import { SalesActivityLogComponent } from './sales-notifications/sales-activity-log.component';
import { TaskDashboardComponent } from './features/communication/task-dashboard/task-dashboard.component';
import { SalesMyTasksComponent } from './sales-my-tasks/sales-my-tasks.component';
import { SalesCalendarComponent } from './sales-calender/sales-calender.component';

// Notification Imports
import { AdminNotificationsComponent } from './admin-notifications/admin-notifications.component';

// Quotation Imports
import { QuotationListComponent } from './features/quotations/quotation-list/quotation-list.component';
import { QuotationBuilderComponent } from './features/quotations/quotation-builder/quotation-builder.component';
import { QuotationPreviewComponent } from './features/quotations/quotation-preview/quotation-preview.component';
import { SalesMyQuotationsComponent } from './sales-my-quotations/sales-my-quotations.component';
import { SalesCreateQuotationComponent } from './sales-create-quotations/sales-create-quotations.component';
import { SalesQuotationDetailsComponent } from './sales-quotation-details/sales-quotation-details.component';

// Deal Management Imports
import { DealPipelineComponent } from './features/deals/deal-pipeline/deal-pipeline.component';
import { DealFormComponent } from './features/deals/deal-form/deal-form.component';
import { DealDetailComponent } from './features/deals/deal-detail/deal-detail.component';
import { SalesMyDealsComponent } from './sales-my-deals/sales-my-deals.component';
import { SalesDealDetailsComponent } from './sales-deal-details/sales-deal-details.component';

// Project Management Imports
import { ProjectsListComponent } from './features/projects/projects-list/projects-list.component';
import { ProjectConversionComponent } from './features/projects/project-conversion/project-conversion.component';
import { ProjectTrackingComponent } from './features/projects/project-tracking/project-tracking.component';
import { SalesMyProjectsComponent } from './sales-my-projects/sales-my-projects.component';

// Report Management Imports 
import { ReportsDashboardComponent } from './features/reports/reports-dashboard/reports-dashboard.component';
import { CustomReportBuilderComponent } from './features/reports/custom-report-builder/custom-report-builder.component';
import { ExportReportsComponent } from './features/reports/export-reports/export-reports.component';
import { SalesMyPerformanceComponent } from './sales-my-perfomance/sales-my-perfomance.component';
import { SalesReportsComponent } from './sales-reports/sales-reports.component';
import { AdminQuotationComponent } from './admin-quotation/admin-quotation.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterHereComponent },

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      // ========================================
      // 👨‍💼 SALES EXECUTIVE ROUTES
      // ========================================

      // Dashboard
      { path: 'dashboard', component: SalesDashboardComponent },

      // Profile & Settings
      { path: 'profile', component: SalesProfileComponent },
      { path: 'settings', component: SalesSettingsComponent },

      // Notifications (Sales Executive)
      { path: 'notifications', component: AdminNotificationsComponent },

      // Lead Management (Sales Executive View)
      { path: 'leads', component: SalesLeadsComponent },
      { path: 'leads/add', component: SalesAddLeadComponent },
      { path: 'leads/import', component: SalesImportLeadsComponent },
      { path: 'leads/edit/:id', component: SalesAddLeadComponent },
      { path: 'leads/:id', component: LeadDetailComponent },

      // Communication & Follow-up (Sales Executive)
      { path: 'activities', component: SalesActivityLogComponent },
      { path: 'tasks', component: SalesMyTasksComponent },
      { path: 'calendar', component: SalesCalendarComponent },

      // Quotation Management (Sales Executive)
      { path: 'quotations', component: SalesMyQuotationsComponent },
      { path: 'quotations/create', component: SalesCreateQuotationComponent },
      { path: 'quotations/details/:id', component: SalesQuotationDetailsComponent },
      { path: 'quotations/edit/:id', component: SalesCreateQuotationComponent },
      { path: 'quotations/preview', component: QuotationPreviewComponent },
      { path: 'quotations/preview/:id', component: QuotationPreviewComponent },
      { path: 'quotations/:id', component: SalesQuotationDetailsComponent },

      // Deal Management (Sales Executive)
      { path: 'deals', component: SalesMyDealsComponent },
      { path: 'deals/create', component: DealFormComponent },
      { path: 'deals/edit/:id', component: DealFormComponent },
      { path: 'deals/:id', component: SalesDealDetailsComponent },

      // Project Management (Sales Executive - View Only)
      { path: 'projects', component: SalesMyProjectsComponent },
      { path: 'projects/:id', component: ProjectTrackingComponent },

      // Reports (Sales Executive - Personal Performance)
      { path: 'reports', component: SalesReportsComponent },
      { path: 'reports/performance', component: SalesMyPerformanceComponent },
      { path: 'reports/sales', component: SalesReportsComponent },

      // ========================================
      // 🧑‍💼 ADMIN ROUTES (with /admin prefix)
      // ========================================

      // Admin Dashboard
      { path: 'admin-dashboard', component: DashboardHomeComponent },
      { path: 'admin/dashboard', component: DashboardHomeComponent },

      // Admin Notifications
      { path: 'admin/notifications', component: AdminNotificationsComponent },

      // Admin Employee Management
      { path: 'admin/employee-approvals', component: EmployeeApprovalsComponent },

      // Admin Lead Management
      { path: 'admin/leads', component: LeadsListComponent },
      { path: 'admin/leads/add', component: LeadFormComponent },
      { path: 'admin/leads/import', component: ImportLeadsComponent },
      { path: 'admin/leads/assign', component: LeadAssignmentComponent },
      { path: 'admin/leads/edit/:id', component: LeadFormComponent },
      { path: 'admin/leads/:id', component: LeadDetailComponent },

      // Admin Communication (Tasks only - Activities removed)
      { path: 'admin/tasks', component: TaskDashboardComponent },
      { path: 'admin/calendar', component: SalesCalendarComponent },

      // Admin Quotations
      { path: 'admin/quotations', redirectTo: 'admin/admin-quotations', pathMatch: 'full' },
      { path: 'admin/admin-quotations', component: AdminQuotationComponent }, // NEW ROUTE
      { path: 'admin/quotations/create', component: QuotationBuilderComponent },
      { path: 'admin/quotations/preview', component: QuotationPreviewComponent },
      { path: 'admin/quotations/edit/:id', component: QuotationBuilderComponent },
      { path: 'admin/quotations/preview/:id', component: QuotationPreviewComponent },
      { path: 'admin/quotations/:id', component: QuotationPreviewComponent },

      // Admin Deals & Projects (Full Control)
      { path: 'admin/deals', component: DealPipelineComponent },
      { path: 'admin/deals/create', component: DealFormComponent },
      { path: 'admin/deals/edit/:id', component: DealFormComponent },
      { path: 'admin/deals/:id', component: DealDetailComponent },

      { path: 'admin/projects', component: ProjectsListComponent },
      { path: 'admin/projects/create', component: ProjectConversionComponent },
      { path: 'admin/projects/edit/:id', component: ProjectConversionComponent },
      { path: 'admin/projects/:id', component: ProjectTrackingComponent },

      // Admin Reports (Full Analytics & Exports)
      { path: 'admin/reports', component: ReportsDashboardComponent },
      { path: 'admin/reports/performance', component: ReportsDashboardComponent },
      { path: 'admin/reports/custom', component: CustomReportBuilderComponent },
      { path: 'admin/reports/export', component: ExportReportsComponent },

      // Admin Profile & Settings
      { path: 'admin/profile', component: UserProfileComponent },
      { path: 'admin/settings', component: AccountSettingsComponent },
    ]
  }
];