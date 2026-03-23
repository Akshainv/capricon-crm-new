// src/app/lead.service.ts (Frontend) - RESTORED VERSION
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, Subject, forkJoin, of } from 'rxjs';
import { catchError, map, tap, delay, switchMap } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';

export interface Lead {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  leadSource: 'Walk-in' | 'Website' | 'Reference' | 'Phone Call' | 'Email' | 'Social Media' | 'Other';
  status: 'New Lead' | 'Seeded Lead' | 'Qualified' | 'Meeting Fixed' | 'Meeting Completed' | 'CS Executive Assigned' | 'CS Executed' | 'Lost' | 'Junk Lead' | 'Overdue';
  priority?: 'low' | 'medium' | 'high';
  assignedTo: string;
  createdBy: string;
  createdBySalesName?: string;
  notes?: string;
  statusNote?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  isConverted?: boolean;
  isFacebookLead?: boolean;
  facebookLeadId?: string;
  facebookFormId?: string;
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
  status?: 'New Lead' | 'Seeded Lead' | 'Qualified' | 'Meeting Fixed' | 'Meeting Completed' | 'CS Executive Assigned' | 'CS Executed' | 'Lost' | 'Junk Lead' | 'Overdue';
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
  private apiUrl = `${environment.apiBaseUrl}/lead`;
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
    if (!currentUser) {
      console.error('User not logged in');
      return throwError(() => new Error('User not logged in'));
    }

    const userId = (currentUser.userId || (currentUser as any)._id || '').toString();
    const userEmail = currentUser.email || '';
    console.log('🔍 Fetching leads CREATED by (direct API):', { userId, userEmail });

    return this.http.get<ApiResponse<Lead[]>>(`${this.apiUrl}/created-by/${userId}`, this.getHeaders()).pipe(
      map(response => response.data || []),
      tap(leads => console.log('✅ Received CREATED leads:', leads.length)),
      catchError(this.handleError)
    );
  }

  /**
   * ✅ CRITICAL FIX: Get leads assigned to current user by admin (for "Assigned Leads" dropdown)
   * Enhanced string comparison with normalization and case-insensitivity
   */
  getLeadsAssignedToMe(): Observable<Lead[]> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      console.error('User not logged in');
      return throwError(() => new Error('User not logged in'));
    }

    const userId = (currentUser.userId || (currentUser as any)._id || '').toString();
    const userEmail = currentUser.email || '';
    console.log('🔍 Fetching leads ASSIGNED to (Merged Strategy):', { userId, userEmail });

    // Fetch from BOTH specialized API and local filter to ensure no leads are missed
    return forkJoin({
      apiLeads: this.http.get<ApiResponse<Lead[]>>(`${this.apiUrl}/assigned-to/${userId}`, this.getHeaders()).pipe(
        map(response => response.data || []),
        catchError(err => {
          console.error('❌ API assigned-to error:', err);
          return of([]);
        })
      ),
      localLeads: this.getAllLeads().pipe(
        map(allLeads => allLeads.filter(lead => {
          const isMatch = this.compareIds(lead.assignedTo, userId);
          const notConverted = !lead.isConverted;
          return isMatch && notConverted;
        })),
        catchError(err => {
          console.error('❌ Local filtering error:', err);
          return of([]);
        })
      )
    }).pipe(
      map(({ apiLeads, localLeads }) => {
        // combine and de-duplicate by _id
        const combined = [...apiLeads, ...localLeads];
        const uniqueLeadsMap = new Map<string, Lead>();

        combined.forEach(lead => {
          if (lead && lead._id) {
            uniqueLeadsMap.set(lead._id.toString(), lead);
          }
        });

        const finalLeads = Array.from(uniqueLeadsMap.values());
        console.log(`✅ Final Merged ASSIGNED leads count: ${finalLeads.length} (API: ${apiLeads.length}, Local: ${localLeads.length})`);
        return finalLeads;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * ✅ NEW: Flexible ID comparison helper
   * Handles ObjectId string differences and various formats
   */
  private compareIds(id1: any, id2: any): boolean {
    if (!id1 || !id2) return false;

    // Handle cases where ID might be a MongoDB object with _id
    const cid1 = typeof id1 === 'object' ? (id1._id || id1.toString()) : id1;
    const cid2 = typeof id2 === 'object' ? (id2._id || id2.toString()) : id2;

    if (!cid1 || !cid2) return false;

    // Normalize both IDs
    const norm1 = String(cid1).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const norm2 = String(cid2).trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // Direct equality check
    if (norm1 === norm2) return true;

    // Check if either contains the other (for partial ObjectId matches or hex strings)
    if (norm1.length >= 20 && norm2.length >= 20) {
      // Both look like ObjectIds - compare last 12 chars (the unique part)
      const end1 = norm1.slice(-12);
      const end2 = norm2.slice(-12);
      return end1 === end2;
    }

    return false;
  }

  /**
   * Get unassigned and unconverted leads for admin assignment page
   */
  getUnassignedAndUnconvertedLeads(): Observable<Lead[]> {
    return this.getAllLeads().pipe(
      map(leads => leads.filter(lead =>
        !lead.isConverted &&
        lead.status === 'New Lead' &&
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
  updateLeadStatus(id: string, newStatus: string, note?: string): Observable<Lead> {
    console.log('📤 Updating lead status (PATCH):', id, '→', newStatus, 'note:', note);

    const body: any = { status: newStatus };
    if (note !== undefined) {
      body.note = note;
    }

    return this.http.patch<ApiResponse<Lead>>(`${this.apiUrl}/${id}/status`, body, this.getHeaders()).pipe(
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

  assignWebsiteLead(leadId: string, employeeId: string): Observable<any> {
    const url = `${this.apiUrl}/website-assign/${leadId}`;
    return this.http.post<any>(url, { employeeId }, this.getHeaders()).pipe(
      tap(() => this.leadsUpdated.next()),
      catchError(this.handleError)
    );
  }

  assignMetLead(leadId: string, employeeId: string): Observable<any> {
    const url = `${environment.apiBaseUrl}/met-leads/assign/${leadId}`;
    return this.http.post<any>(url, { employeeId }, this.getHeaders()).pipe(
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
    return this.getLeadsByStatus('New Lead' as any);
  }

  getUnassignedLeads(): Observable<Lead[]> {
    return this.getAllLeads().pipe(
      map(leads => leads.filter(lead =>
        lead.status === 'New Lead' && (!lead.assignedTo || lead.assignedTo === '')
      ))
    );
  }

  getMetaLeads(): Observable<Lead[]> {
    const metLeadsUrl = `${environment.apiBaseUrl}/met-leads`;

    return forkJoin({
      standardLeads: this.getAllLeads(),
      specialMetLeads: this.http.get<ApiResponse<any[]>>(metLeadsUrl, this.getHeaders()).pipe(
        map(response => response.data || []),
        catchError(err => {
          console.error('❌ Failed to fetch special metleads:', err);
          return of([]);
        })
      )
    }).pipe(
      map(({ standardLeads, specialMetLeads }) => {
        // 1. Filter standard leads
        const metaFromStandard = standardLeads.filter(lead =>
          lead.leadSource === 'Social Media' ||
          lead.isFacebookLead === true ||
          (lead.notes && (
            lead.notes.includes('Meta Leadgen ID') ||
            lead.notes.includes('Platform: Facebook') ||
            lead.notes.includes('Platform: Instagram')
          ))
        );

        // 2. Map and normalize special metleads
        const mappedMetLeads: Lead[] = specialMetLeads.map(ml => ({
          _id: ml._id,
          fullName: ml.name || 'Meta Lead',
          email: ml.email || 'N/A',
          phoneNumber: ml.phone || 'N/A',
          leadSource: 'Social Media',
          status: (ml.status === 'New' ? 'New Lead' : ml.status) as any,
          companyName: ml.companyName || 'Meta Lead Ad',
          notes: ml.notes || `Source: ${ml.source || 'Meta Collection'}`,
          createdAt: ml.createdAt,
          updatedAt: ml.updatedAt,
          createdBy: 'system',
          assignedTo: ml.assignedTo || ''
        }));

        const merged = [...metaFromStandard, ...mappedMetLeads];

        // 3. De-duplicate by _id
        const uniqueMap = new Map<string, Lead>();
        merged.forEach(l => {
          if (l && l._id) uniqueMap.set(l._id.toString(), l);
        });

        const finalResults = Array.from(uniqueMap.values());
        return finalResults;
      })
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