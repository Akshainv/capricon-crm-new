// src/app/services/project.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Project {
  _id?: string;
  id?: string;
  projectName: string;
  projectCode: string;
  clientName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  siteAddress: string;
  elevatorType: string;
  numberOfFloors?: number;
  quantity?: number;
  projectValue: number;
  startDate: string;
  expectedCompletionDate: string;
  actualCompletionDate?: string;
  projectManager: string;
  assignedTo: string;
  projectStatus: string;
  currentMilestone: string;
  progressPercentage: number;
  amountPaid?: number;
  amountPending?: number;
  dealId: string;
  sourceType?: string;
  sourceDealId?: string;
  createdFrom?: string;
  createdBy?: string;
  convertedDate?: Date;
  lastProgressUpdate?: Date;
  lastProgressNotes?: string;
  progressHistory?: any[];
  projectDescription?: string;
  technicalSpecifications?: string;
  specialRequirements?: string;
  teamMembers?: string[];
  documents?: string[];
  photos?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:3000/project';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders() {
    return {
      headers: this.authService.getAuthHeaders()
    };
  }

  // ✅ FIXED: Create project from deal - use createdBy ID for assignedTo
  createProjectFromDeal(dealData: any): Observable<Project> {
    const currentUser = this.authService.currentUserValue;

    console.log('Creating project from deal:', dealData);
    console.log('Deal assignedTo:', dealData.assignedTo);
    console.log('Deal createdBy:', dealData.createdBy);

    // ✅ CRITICAL FIX: Use createdBy (employee ID) for assignedTo, not the name
    const assignedToId = dealData.createdBy || dealData.assignedTo || currentUser?.userId || '';

    const projectData = {
      projectName: dealData.title || dealData.dealTitle,
      projectCode: `PRJ-${Date.now()}`,
      clientName: dealData.company || dealData.companyName,
      contactPerson: dealData.contactPerson,
      contactPhone: dealData.phone,
      contactEmail: dealData.email,
      siteAddress: dealData.address || 'Address not provided',
      elevatorType: dealData.elevatorType || dealData.dealDetails,
      numberOfFloors: dealData.floors || 0,
      quantity: dealData.quantity || 1,
      projectValue: dealData.dealAmount || dealData.amount,
      startDate: new Date().toISOString().split('T')[0],
      expectedCompletionDate: this.calculateExpectedCompletion(dealData.expectedCloseDate || dealData.expectedClosingDate),
      projectManager: currentUser?.userId || '',
      assignedTo: assignedToId, // ✅ Use employee ID, not name
      projectStatus: 'planning',
      currentMilestone: 'planning',
      progressPercentage: 0,
      dealId: dealData._id || dealData.id,
      sourceType: 'deal',
      sourceDealId: dealData._id || dealData.id,
      createdFrom: 'Won Deal Conversion',
      createdBy: currentUser?.userId || '',
      projectDescription: dealData.requirements || dealData.requirementNotes || '',
      specialRequirements: dealData.notes || dealData.internalNotes || ''
    };

    console.log('Project data being sent:', projectData);

    return this.http.post<ApiResponse<Project>>(
      this.apiUrl,
      projectData,
      this.getHeaders()
    ).pipe(
      map(response => {
        console.log('Project created successfully:', response.data);
        return response.data;
      })
    );
  }

  private calculateExpectedCompletion(closeDate: string): string {
    const date = new Date(closeDate);
    date.setMonth(date.getMonth() + 6);
    return date.toISOString().split('T')[0];
  }

  // Get all projects
  getAllProjects(): Observable<Project[]> {
    return this.http.get<ApiResponse<Project[]>>(
      this.apiUrl,
      this.getHeaders()
    ).pipe(
      map(response => response.data)
    );
  }

  // Get projects by sales executive
  getProjectsBySalesExecutive(salesExecutiveId: string): Observable<Project[]> {
    console.log('Fetching projects for sales executive:', salesExecutiveId);
    return this.http.get<ApiResponse<Project[]>>(
      `${this.apiUrl}?salesExecutive=${salesExecutiveId}`,
      this.getHeaders()
    ).pipe(
      map(response => {
        console.log('Projects fetched:', response.data);
        return response.data;
      })
    );
  }

  // Get projects by project manager
  getProjectsByProjectManager(projectManagerId: string): Observable<Project[]> {
    return this.http.get<ApiResponse<Project[]>>(
      `${this.apiUrl}?projectManager=${projectManagerId}`,
      this.getHeaders()
    ).pipe(
      map(response => response.data)
    );
  }

  // Get active projects
  getActiveProjects(): Observable<Project[]> {
    return this.http.get<ApiResponse<Project[]>>(
      `${this.apiUrl}/active`,
      this.getHeaders()
    ).pipe(
      map(response => response.data)
    );
  }

  // Get completed projects
  getCompletedProjects(): Observable<Project[]> {
    return this.http.get<ApiResponse<Project[]>>(
      `${this.apiUrl}/completed`,
      this.getHeaders()
    ).pipe(
      map(response => response.data)
    );
  }

  // Get project by ID
  getProjectById(id: string): Observable<Project> {
    return this.http.get<ApiResponse<Project>>(
      `${this.apiUrl}/${id}`,
      this.getHeaders()
    ).pipe(
      map(response => response.data)
    );
  }

  // Create project
  createProject(projectData: Partial<Project>): Observable<Project> {
    return this.http.post<ApiResponse<Project>>(
      this.apiUrl,
      projectData,
      this.getHeaders()
    ).pipe(
      map(response => response.data)
    );
  }

  // Update project
  updateProject(id: string, projectData: Partial<Project>): Observable<Project> {
    return this.http.put<ApiResponse<Project>>(
      `${this.apiUrl}/${id}`,
      projectData,
      this.getHeaders()
    ).pipe(
      map(response => response.data)
    );
  }

  // Update project progress
  updateProjectProgress(id: string, progressData: any): Observable<Project> {
    const currentUser = this.authService.currentUserValue;
    const payload = {
      ...progressData,
      updatedBy: currentUser?.userId || ''
    };

    return this.http.patch<ApiResponse<Project>>(
      `${this.apiUrl}/${id}/progress`,
      payload,
      this.getHeaders()
    ).pipe(
      map(response => response.data)
    );
  }

  // Update project status
  updateProjectStatus(id: string, status: string): Observable<Project> {
    const currentUser = this.authService.currentUserValue;
    return this.http.patch<ApiResponse<Project>>(
      `${this.apiUrl}/${id}/status`,
      { status, updatedBy: currentUser?.userId || '' },
      this.getHeaders()
    ).pipe(
      map(response => response.data)
    );
  }

  // Delete project
  deleteProject(id: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/${id}`,
      this.getHeaders()
    ).pipe(
      map(response => response.data)
    );
  }

  // Get project statistics
  getProjectStatistics(salesExecutiveId?: string, projectManagerId?: string): Observable<any> {
    let url = `${this.apiUrl}/statistics`;
    const params: string[] = [];

    if (salesExecutiveId) {
      params.push(`salesExecutive=${salesExecutiveId}`);
    }
    if (projectManagerId) {
      params.push(`projectManager=${projectManagerId}`);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<ApiResponse<any>>(url, this.getHeaders()).pipe(
      map(response => response.data)
    );
  }

  // Get project progress history
  getProgressHistory(id: string): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/${id}/progress-history`,
      this.getHeaders()
    ).pipe(
      map(response => response.data)
    );
  }
}