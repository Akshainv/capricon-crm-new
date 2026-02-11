// src/app/services/lead.service.ts (Frontend) - COMPLETE FIXED VERSION
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

// ✅ All possible status values
export type LeadStatus =
  | 'Seeded Lead'
  | 'Meeting Fixed'
  | 'Meeting Completed'
  | 'CS Executed'
  | 'New'
  | 'Contacted'
  | 'Visit Scheduled'
  | 'Visit Completed'
  | 'Qualified'
  | 'Quoted'
  | 'Won'
  | 'Lost'
  | 'Pending'
  | 'Follow-Up'
  | 'Junk Lead';

export interface Lead {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  leadSource: 'Walk-in' | 'Website' | 'Reference' | 'Phone Call' | 'Email' | 'Social Media' | 'Other';
  status: LeadStatus;
  assignedTo: string;
  createdBy: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isConverted?: boolean;
}

export interface CreateLead {
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  leadSource: 'Walk-in' | 'Website' | 'Reference' | 'Phone Call' | 'Email' | 'Social Media' | 'Other';
  assignedTo: string;
  createdBy: string;
  notes?: string;
}

export interface UpdateLead {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  companyName?: string;
  leadSource?: 'Walk-in' | 'Website' | 'Reference' | 'Phone Call' | 'Email' | 'Social Media' | 'Other';
  status?: LeadStatus;
  assignedTo?: string;
  createdBy?: string;
  notes?: string;
  isConverted?: boolean;
}

export interface AssignLead {
  _id: string;
  leadIds: string[];
  assignedSales: string;
  leadCount: number;
  notes?: string;
}

export interface CreateAssignLead {
  leadIds: string[];
  assignedSales: string;
  notes?: string;
}

export interface ApiResponse<T> {
  statusCode?: number;
  message: string;
  data?: T;
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeadsService {
  private apiUrl = 'http://localhost:3000/lead';
  public leadsUpdated = new Subject<void>();
  public leadsUpdated$ = this.leadsUpdated.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders() {
    return {
      headers: this.authService.getAuthHeaders()
    };
  }

  createLead(lead: CreateLead): Observable<Lead> {
    return this.http.post<ApiResponse<Lead>>(this.apiUrl, lead, this.getHeaders()).pipe(
      map(response => response.data!),
      tap(() => this.leadsUpdated.next()),
      catchError(this.handleError)
    );
  }

  getAllLeads(): Observable<Lead[]> {
    return this.http.get<ApiResponse<Lead[]>>(this.apiUrl, this.getHeaders()).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getLeadById(id: string): Observable<Lead> {
    return this.http.get<ApiResponse<Lead>>(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getLeadsCreatedByMe(): Observable<Lead[]> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.userId) {
      console.error('User not logged in or userId not found');
      return throwError(() => new Error('User not logged in'));
    }

    const userId = String(currentUser.userId).trim().toLowerCase();

    return this.getAllLeads().pipe(
      map(allLeads => {
        const createdLeads = allLeads.filter(lead => {
          const leadCreatedBy = String(lead.createdBy || '').trim().toLowerCase();
          const isCreatedByMe = leadCreatedBy === userId;
          const notConverted = !lead.isConverted;
          return isCreatedByMe && notConverted;
        });

        return createdLeads;
      }),
      catchError(this.handleError)
    );
  }

  getLeadsAssignedToMe(): Observable<Lead[]> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.userId) {
      console.error('User not logged in or userId not found');
      return throwError(() => new Error('User not logged in'));
    }

    const userId = String(currentUser.userId).trim().toLowerCase().replace(/[\s\u200B-\u200D\uFEFF]/g, '');

    return this.getAllLeads().pipe(
      map(allLeads => {
        const assignedLeads = allLeads.filter(lead => {
          const leadAssignedTo = String(lead.assignedTo || '').trim().toLowerCase().replace(/[\s\u200B-\u200D\uFEFF]/g, '');
          const isAssignedToMe =
            leadAssignedTo === userId ||
            leadAssignedTo.includes(userId) ||
            userId.includes(leadAssignedTo) ||
            this.compareIds(leadAssignedTo, userId);

          const notConverted = !lead.isConverted;
          const hasAssignedTo = leadAssignedTo && leadAssignedTo.length > 0;

          return isAssignedToMe && notConverted && hasAssignedTo;
        });

        return assignedLeads;
      }),
      catchError(this.handleError)
    );
  }

  private compareIds(id1: string, id2: string): boolean {
    if (!id1 || !id2) return false;

    const norm1 = id1.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const norm2 = id2.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    if (norm1.length >= 20 && norm2.length >= 20) {
      const end1 = norm1.slice(-12);
      const end2 = norm2.slice(-12);
      return end1 === end2;
    }

    return norm1 === norm2;
  }

  getUnassignedAndUnconvertedLeads(): Observable<Lead[]> {
    return this.getAllLeads().pipe(
      map(leads => leads.filter(lead =>
        !lead.isConverted &&
        (lead.status === 'Seeded Lead' || lead.status === 'New') &&
        (!lead.assignedTo || lead.assignedTo === '')
      ))
    );
  }

  updateLead(id: string, lead: UpdateLead): Observable<Lead> {
    console.log('Frontend: Sending update request for lead:', id);

    return this.http.put<ApiResponse<Lead>>(`${this.apiUrl}/${id}`, lead, this.getHeaders()).pipe(
      map(response => {
        console.log('Frontend: Received update response:', response.data);
        return response.data!;
      }),
      tap(() => this.leadsUpdated.next()),
      catchError(this.handleError)
    );
  }

  // ✅ CRITICAL: Dedicated status update method using PATCH
  updateLeadStatus(leadId: string, newStatus: string): Observable<Lead> {
    console.log('==============================================');
    console.log('🔄 LeadService: Updating status via PATCH');
    console.log('Lead ID:', leadId);
    console.log('New Status:', newStatus);
    console.log('API URL:', `${this.apiUrl}/${leadId}/status`);
    console.log('==============================================');

    return this.http.patch<ApiResponse<Lead>>(
      `${this.apiUrl}/${leadId}/status`,
      { status: newStatus },
      this.getHeaders()
    ).pipe(
      map(response => {
        console.log('==============================================');
        console.log('✅ Status update SUCCESS');
        console.log('Response:', response);
        console.log('Updated status:', response.data?.status);
        console.log('==============================================');
        return response.data!;
      }),
      tap(() => {
        console.log('🔔 Triggering leadsUpdated event');
        this.leadsUpdated.next();
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('==============================================');
        console.error('❌ Status update FAILED');
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error body:', error.error);
        console.error('==============================================');
        return this.handleError(error);
      })
    );
  }

  deleteLead(id: string): Observable<Lead> {
    return this.http.delete<ApiResponse<Lead>>(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
      map(response => response.data!),
      tap(() => this.leadsUpdated.next()),
      catchError(this.handleError)
    );
  }

  assignLeads(assignData: CreateAssignLead): Observable<AssignLead> {
    return this.http.post<ApiResponse<AssignLead>>(`${this.apiUrl}/assign`, assignData, this.getHeaders()).pipe(
      map(response => response.data!),
      tap(() => this.leadsUpdated.next()),
      catchError(this.handleError)
    );
  }

  getAllAssignments(): Observable<AssignLead[]> {
    return this.http.get<ApiResponse<AssignLead[]>>(`${this.apiUrl}/assign`, this.getHeaders()).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getAssignmentByLeadId(id: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/assign/${id}`, this.getHeaders()).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getLeadsByAssignedTo(salesPersonId: string): Observable<Lead[]> {
    return this.getAllLeads().pipe(
      map(leads => leads.filter(lead => lead.assignedTo === salesPersonId))
    );
  }

  getLeadsByStatus(status: LeadStatus): Observable<Lead[]> {
    return this.getAllLeads().pipe(
      map(leads => leads.filter(lead => lead.status === status))
    );
  }

  getLeadsBySource(source: string): Observable<Lead[]> {
    return this.getAllLeads().pipe(
      map(leads => leads.filter(lead => lead.leadSource === source))
    );
  }

  getNewLeads(): Observable<Lead[]> {
    return this.getAllLeads().pipe(
      map(leads => leads.filter(lead =>
        lead.status === 'Seeded Lead' || lead.status === 'New'
      ))
    );
  }

  getUnassignedLeads(): Observable<Lead[]> {
    return this.getAllLeads().pipe(
      map(leads => leads.filter(lead =>
        (lead.status === 'Seeded Lead' || lead.status === 'New') &&
        (!lead.assignedTo || lead.assignedTo === '')
      ))
    );
  }

  getMyLeads(): Observable<Lead[]> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.userId) {
      return throwError(() => new Error('User not logged in'));
    }

    const userId = currentUser.userId;

    return this.getAllLeads().pipe(
      map(leads => leads.filter(lead =>
        lead.assignedTo === userId && lead.createdBy !== userId
      ))
    );
  }

  searchLeads(searchTerm: string): Observable<Lead[]> {
    const term = searchTerm.toLowerCase().trim();
    return this.getAllLeads().pipe(
      map(leads => leads.filter(lead =>
        lead.fullName.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        lead.phoneNumber.includes(term) ||
        (lead.companyName && lead.companyName.toLowerCase().includes(term))
      ))
    );
  }

  getLeadStats(): Observable<any> {
    return this.getAllLeads().pipe(
      map(leads => ({
        total: leads.length,
        seededLead: leads.filter(l => l.status === 'Seeded Lead').length,
        meetingFixed: leads.filter(l => l.status === 'Meeting Fixed').length,
        meetingCompleted: leads.filter(l => l.status === 'Meeting Completed').length,
        csExecuted: leads.filter(l => l.status === 'CS Executed').length,
        new: leads.filter(l => l.status === 'New').length,
        contacted: leads.filter(l => l.status === 'Contacted').length,
        qualified: leads.filter(l => l.status === 'Qualified').length,
        won: leads.filter(l => l.status === 'Won').length,
        lost: leads.filter(l => l.status === 'Lost').length
      }))
    );
  }

  bulkUpdateStatus(leadIds: string[], status: LeadStatus): Observable<Lead[]> {
    const updates = leadIds.map(id =>
      this.updateLead(id, { status }).toPromise()
    );

    return new Observable(observer => {
      Promise.all(updates)
        .then(results => {
          observer.next(results as Lead[]);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }

    console.error('Lead Service Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}