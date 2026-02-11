// src/app/lead.service.ts (Frontend) - RESTORED VERSION
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, map, tap, delay, switchMap } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

export interface Lead {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  leadSource: 'Walk-in' | 'Website' | 'Reference' | 'Phone Call' | 'Email' | 'Social Media' | 'Other';
  status: 'Seeded Lead' | 'Qualified' | 'Meeting Fixed' | 'Meeting Completed' | 'CS Executive Assigned' | 'CS Executed' | 'Junk Lead';
  priority?: 'low' | 'medium' | 'high';
  assignedTo: string;
  createdBy: string;
  createdBySalesName?: string;
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
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateLead {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  companyName?: string;
  leadSource?: 'Walk-in' | 'Website' | 'Reference' | 'Phone Call' | 'Email' | 'Social Media' | 'Other';
  status?: 'Seeded Lead' | 'Qualified' | 'Meeting Fixed' | 'Meeting Completed' | 'CS Executive Assigned' | 'CS Executed' | 'Junk Lead';
  assignedTo?: string;
  createdBy?: string;
  notes?: string;
  isConverted?: boolean;
  priority?: 'low' | 'medium' | 'high';
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
  private apiUrl = 'http://localhost:3000/lead';  // ✅ CORRECT
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

  /**
   * ✅ FIXED: Get leads created by current user (for "Created Leads" dropdown)
   * Shows ALL leads created by the user, regardless of assignment status
   * Only excludes leads that have been converted to deals
   */
  getLeadsCreatedByMe(): Observable<Lead[]> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.userId) {
      console.error('User not logged in or userId not found');
      return throwError(() => new Error('User not logged in'));
    }

    const userId = String(currentUser.userId).trim().toLowerCase();
    console.log('==============================================');
    console.log('🔍 Fetching leads CREATED by userId:', userId);
    console.log('==============================================');

    return this.getAllLeads().pipe(
      map(allLeads => {
        console.log('📦 Total leads from backend:', allLeads.length);

        const createdLeads = allLeads.filter(lead => {
          const leadCreatedBy = String(lead.createdBy || '').trim().toLowerCase();
          const leadAssignedTo = String(lead.assignedTo || '').trim().toLowerCase();

          const isCreatedByMe = leadCreatedBy === userId;
          const notConverted = !lead.isConverted;

          console.log('─────────────────────────────────────────────');
          console.log(`📝 Lead: ${lead.fullName}`);
          console.log(`   createdBy: "${leadCreatedBy}"`);
          console.log(`   userId: "${userId}"`);
          console.log(`   assignedTo: "${leadAssignedTo}"`);
          console.log(`   status: ${lead.status}`);
          console.log(`   isConverted: ${lead.isConverted}`);
          console.log(`   ✅ isCreatedByMe: ${isCreatedByMe}`);
          console.log(`   ✅ notConverted: ${notConverted}`);
          console.log(`   🎯 Will show in Created Leads: ${isCreatedByMe && notConverted}`);

          return isCreatedByMe && notConverted;
        });

        console.log('==============================================');
        console.log('✅ Filtered CREATED leads:', createdLeads.length);
        console.log('Created leads:', createdLeads);
        console.log('==============================================');

        return createdLeads;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * ✅ CRITICAL FIX: Get leads assigned to current user by admin (for "Assigned Leads" dropdown)
   * Enhanced string comparison with normalization and case-insensitivity
   */
  getLeadsAssignedToMe(): Observable<Lead[]> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.userId) {
      console.error('User not logged in or userId not found');
      return throwError(() => new Error('User not logged in'));
    }

    // ✅ CRITICAL FIX: Normalize userId - trim, lowercase, remove any special characters
    const userId = String(currentUser.userId).trim().toLowerCase().replace(/[\s\u200B-\u200D\uFEFF]/g, '');
    console.log('==============================================');
    console.log('🔍 Fetching leads ASSIGNED to userId:', userId);
    console.log('User ID type:', typeof userId);
    console.log('User ID length:', userId.length);
    console.log('User ID char codes:', Array.from(userId).map(c => c.charCodeAt(0)));
    console.log('==============================================');

    return this.getAllLeads().pipe(
      map(allLeads => {
        console.log('📦 Total leads from backend:', allLeads.length);

        const assignedLeads = allLeads.filter(lead => {
          // ✅ CRITICAL FIX: Normalize both IDs the same way for comparison
          const leadAssignedTo = String(lead.assignedTo || '').trim().toLowerCase().replace(/[\s\u200B-\u200D\uFEFF]/g, '');
          const leadCreatedBy = String(lead.createdBy || '').trim().toLowerCase().replace(/[\s\u200B-\u200D\uFEFF]/g, '');

          // ✅ ENHANCED: Multiple comparison methods
          const isAssignedToMe =
            leadAssignedTo === userId || // Exact match
            leadAssignedTo.includes(userId) || // Contains match
            userId.includes(leadAssignedTo) || // Reverse contains
            this.compareIds(leadAssignedTo, userId); // Flexible comparison

          const notConverted = !lead.isConverted;
          const hasAssignedTo = leadAssignedTo && leadAssignedTo.length > 0;

          console.log('─────────────────────────────────────────────');
          console.log(`📝 Lead: ${lead.fullName}`);
          console.log(`   Raw assignedTo: "${lead.assignedTo}" (type: ${typeof lead.assignedTo})`);
          console.log(`   Normalized assignedTo: "${leadAssignedTo}" (length: ${leadAssignedTo.length})`);
          console.log(`   assignedTo char codes:`, Array.from(leadAssignedTo).map(c => c.charCodeAt(0)));
          console.log(`   Raw createdBy: "${lead.createdBy}"`);
          console.log(`   Normalized createdBy: "${leadCreatedBy}"`);
          console.log(`   Normalized userId: "${userId}" (length: ${userId.length})`);
          console.log(`   status: ${lead.status}`);
          console.log(`   isConverted: ${lead.isConverted}`);
          console.log(`   ✅ hasAssignedTo: ${hasAssignedTo}`);
          console.log(`   ✅ isAssignedToMe (exact): ${leadAssignedTo === userId}`);
          console.log(`   ✅ isAssignedToMe (contains): ${leadAssignedTo.includes(userId)}`);
          console.log(`   ✅ isAssignedToMe (flexible): ${this.compareIds(leadAssignedTo, userId)}`);
          console.log(`   ✅ isAssignedToMe (final): ${isAssignedToMe}`);
          console.log(`   ✅ notConverted: ${notConverted}`);
          console.log(`   🎯 Will show in Assigned Leads: ${isAssignedToMe && notConverted && hasAssignedTo}`);

          return isAssignedToMe && notConverted && hasAssignedTo;
        });

        console.log('==============================================');
        console.log('✅ Filtered ASSIGNED leads (by admin):', assignedLeads.length);
        console.log('Assigned leads:', assignedLeads);
        console.log('==============================================');

        return assignedLeads;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * ✅ NEW: Flexible ID comparison helper
   * Handles ObjectId string differences and various formats
   */
  private compareIds(id1: string, id2: string): boolean {
    if (!id1 || !id2) return false;

    // Normalize both IDs
    const norm1 = id1.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const norm2 = id2.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if either contains the other (for partial ObjectId matches)
    if (norm1.length >= 20 && norm2.length >= 20) {
      // Both look like ObjectIds - compare last 12 chars (the unique part)
      const end1 = norm1.slice(-12);
      const end2 = norm2.slice(-12);
      return end1 === end2;
    }

    return norm1 === norm2;
  }

  /**
   * Get unassigned and unconverted leads for admin assignment page
   */
  getUnassignedAndUnconvertedLeads(): Observable<Lead[]> {
    return this.getAllLeads().pipe(
      map(leads => leads.filter(lead =>
        !lead.isConverted &&
        lead.status === 'Seeded Lead' &&
        (!lead.assignedTo || lead.assignedTo === '')
      ))
    );
  }

  /**
   * ✅ FIXED: Use PUT for updates (backend doesn't support PATCH)
   * Sends the full update object as required by the API
   */
  updateLead(id: string, lead: UpdateLead): Observable<Lead> {
    console.log('📤 Sending PUT request to update lead:', id, lead);
    return this.http.put<ApiResponse<Lead>>(`${this.apiUrl}/${id}`, lead, this.getHeaders()).pipe(
      tap(response => console.log('📥 Backend response:', response)),
      map(response => response.data!),
      tap(() => {
        console.log('✅ Lead updated, notifying subscribers...');
        this.leadsUpdated.next();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * ✅ DEDICATED STATUS UPDATE: Use PATCH for efficient status-only updates
   * Fulfils the requirement for a dedicated status update API
   */
  updateLeadStatus(id: string, newStatus: string): Observable<Lead> {
    console.log('📤 Updating lead status (PATCH):', id, '→', newStatus);

    return this.http.patch<ApiResponse<Lead>>(`${this.apiUrl}/${id}/status`, { status: newStatus }, this.getHeaders()).pipe(
      tap(response => console.log('📥 Status update response:', response)),
      map(response => response.data!),
      tap(() => {
        console.log('✅ Status updated via PATCH, notifying all components...');
        this.leadsUpdated.next();
      }),
      catchError(this.handleError)
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

  getLeadsByStatus(status: 'Seeded Lead' | 'Meeting Fixed' | 'Meeting Completed' | 'CS Executed'): Observable<Lead[]> {
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
    return this.getLeadsByStatus('Seeded Lead');
  }

  getUnassignedLeads(): Observable<Lead[]> {
    return this.getAllLeads().pipe(
      map(leads => leads.filter(lead =>
        lead.status === 'Seeded Lead' && (!lead.assignedTo || lead.assignedTo === '')
      ))
    );
  }

  getMyLeads(): Observable<Lead[]> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.userId) {
      console.error('User not logged in or userId not found');
      return throwError(() => new Error('User not logged in'));
    }

    const userId = currentUser.userId;

    return this.getAllLeads().pipe(
      map(leads => {
        const myLeads = leads.filter(lead => lead.assignedTo === userId && lead.createdBy !== userId);
        return myLeads;
      })
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

  getLeadStats(): Observable<{
    total: number;
    seeded: number;
    fixed: number;
    completed: number;
    executed: number;
  }> {
    return this.getAllLeads().pipe(
      map(leads => ({
        total: leads.length,
        seeded: leads.filter(l => l.status === 'Seeded Lead').length,
        fixed: leads.filter(l => l.status === 'Meeting Fixed').length,
        completed: leads.filter(l => l.status === 'Meeting Completed').length,
        executed: leads.filter(l => l.status === 'CS Executed').length
      }))
    );
  }

  bulkUpdateStatus(leadIds: string[], status: 'Seeded Lead' | 'Meeting Fixed' | 'Meeting Completed' | 'CS Executed'): Observable<Lead[]> {
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