// src/app/services/deal.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Deal {
  _id?: string;
  id?: string;
  // Backend schema fields
  dealTitle: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  dealAmount: number;
  dealDetails: string; // elevatorType in backend
  NumberOFloors?: number;
  quantity?: number;
  DealStatus: string;
  Probability: number;
  expectedClosingDate: string;
  assignedTo: string;
  assignedToName?: string; // ✅ NEW: For displaying employee name
  leadSource: string;
  address?: string;
  requirementNotes?: string;
  internalNotes?: string;
  converted?: boolean;
  quoteNumber?: string;
  quotationId?: string;
  convertedProjectId?: string;
  convertedDate?: Date;
  convertedBy?: string;
  createdFrom?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;

  // Frontend compatibility aliases
  title?: string;
  company?: string;
  elevatorType?: string;
  expectedCloseDate?: string;
  floors?: number;
  requirements?: string;
  notes?: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class DealService {
  private apiUrl = 'http://localhost:3000/deal';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders() {
    return {
      headers: this.authService.getAuthHeaders()
    };
  }

  // ✅ FIXED: Create deal from quotation with proper user ID extraction
  createDealFromQuotation(quotationData: any): Observable<Deal> {
    const currentUser = this.authService.currentUserValue;

    // ✅ FIX: Extract userId from the User object, casting to any to access additional properties
    const userId = currentUser?.userId || (currentUser as any)?.sub || (currentUser as any)?.id;

    if (!currentUser || !userId) {
      console.error('Authentication error - currentUser:', currentUser);
      throw new Error('User not authenticated');
    }

    console.log('Current user:', currentUser);
    console.log('Extracted user ID:', userId);

    // Ensure quotation data has the fields backend expects
    const payload = {
      quotationData: {
        _id: quotationData._id || quotationData.id,
        quoteNumber: quotationData.quoteNumber || 'N/A',
        customerName: quotationData.customerName || 'Unknown',
        customerCompany: quotationData.customerCompany || quotationData.companyName || 'N/A',
        customerEmail: quotationData.customerEmail || 'contact@example.com',
        customerPhone: quotationData.customerPhone || '+91 0000000000',
        totalAmount: quotationData.totalAmount || quotationData.totalCost || 0,
        elevationType: quotationData.elevationType || 'Home Lift',
        customerAddress: quotationData.customerAddress || '',
        termsAndConditions: quotationData.termsAndConditions || quotationData.internalNotes || '',
        notes: quotationData.notes || '',
        specialRequirements: quotationData.specialRequirements || ''
      },
      createdBy: userId  // ✅ Use the extracted userId
    };

    console.log('Sending quotation to deal conversion:', payload);
    console.log('User ID being sent:', userId);

    return this.http.post<ApiResponse<Deal>>(
      `${this.apiUrl}/from-quotation`,
      payload,
      this.getHeaders()
    ).pipe(
      map(response => {
        console.log('Deal created successfully:', response);
        return this.mapDealFromBackend(response.data);
      }),
      catchError(error => {
        console.error('Full error details:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        if (error.error) {
          console.error('Backend error:', error.error);
        }
        throw error;
      })
    );
  }

  // ✅ UPDATED: Helper method to map backend deal to frontend format
  private mapDealFromBackend(deal: any): Deal {
    return {
      ...deal,
      // Map backend fields to frontend aliases for compatibility
      title: deal.dealTitle,
      company: deal.companyName,
      elevatorType: deal.dealDetails,
      expectedCloseDate: deal.expectedClosingDate,
      floors: deal.NumberOFloors,
      requirements: deal.requirementNotes,
      notes: deal.internalNotes
      // assignedToName is already included from backend enrichment
    };
  }

  // Get all deals with proper mapping
  getAllDeals(): Observable<Deal[]> {
    return this.http.get<ApiResponse<Deal[]>>(this.apiUrl, this.getHeaders()).pipe(
      map(response => response.data.map(deal => this.mapDealFromBackend(deal)))
    );
  }

  // Get deals by sales executive
  getDealsBySalesExecutive(salesExecutiveId: string): Observable<Deal[]> {
    return this.http.get<ApiResponse<Deal[]>>(
      `${this.apiUrl}?salesExecutive=${salesExecutiveId}`,
      this.getHeaders()
    ).pipe(
      map(response => response.data.map(deal => this.mapDealFromBackend(deal)))
    );
  }

  // Get pending deals (unconverted)
  getPendingDeals(): Observable<Deal[]> {
    return this.http.get<ApiResponse<Deal[]>>(
      `${this.apiUrl}/pending`,
      this.getHeaders()
    ).pipe(
      map(response => response.data.map(deal => this.mapDealFromBackend(deal)))
    );
  }

  // Get converted deals
  getConvertedDeals(): Observable<Deal[]> {
    return this.http.get<ApiResponse<Deal[]>>(
      `${this.apiUrl}/converted`,
      this.getHeaders()
    ).pipe(
      map(response => response.data.map(deal => this.mapDealFromBackend(deal)))
    );
  }

  // Get deal by ID
  getDealById(id: string): Observable<Deal> {
    return this.http.get<ApiResponse<Deal>>(
      `${this.apiUrl}/${id}`,
      this.getHeaders()
    ).pipe(
      map(response => this.mapDealFromBackend(response.data))
    );
  }

  // Create deal
  createDeal(dealData: Partial<Deal>): Observable<Deal> {
    return this.http.post<ApiResponse<Deal>>(
      this.apiUrl,
      dealData,
      this.getHeaders()
    ).pipe(
      map(response => this.mapDealFromBackend(response.data))
    );
  }

  // Update deal
  updateDeal(id: string, dealData: Partial<Deal>): Observable<Deal> {
    return this.http.put<ApiResponse<Deal>>(
      `${this.apiUrl}/${id}`,
      dealData,
      this.getHeaders()
    ).pipe(
      map(response => this.mapDealFromBackend(response.data))
    );
  }

  // Update deal status
  updateDealStatus(id: string, status: string): Observable<Deal> {
    const currentUser = this.authService.currentUserValue;
    const userId = currentUser?.userId || (currentUser as any)?.sub || (currentUser as any)?.id || '';

    return this.http.patch<ApiResponse<Deal>>(
      `${this.apiUrl}/${id}/status`,
      { status, updatedBy: userId },
      this.getHeaders()
    ).pipe(
      map(response => this.mapDealFromBackend(response.data))
    );
  }

  // Mark deal as converted to project
  markAsConverted(dealId: string, projectId: string): Observable<Deal> {
    const currentUser = this.authService.currentUserValue;
    const userId = currentUser?.userId || (currentUser as any)?.sub || (currentUser as any)?.id || '';

    return this.http.patch<ApiResponse<Deal>>(
      `${this.apiUrl}/${dealId}/convert`,
      { projectId, convertedBy: userId },
      this.getHeaders()
    ).pipe(
      map(response => this.mapDealFromBackend(response.data))
    );
  }

  // Delete deal
  deleteDeal(id: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/${id}`,
      this.getHeaders()
    ).pipe(
      map(response => response.data)
    );
  }

  // Get deal statistics
  getDealStatistics(salesExecutiveId?: string): Observable<any> {
    const url = salesExecutiveId
      ? `${this.apiUrl}/statistics?salesExecutive=${salesExecutiveId}`
      : `${this.apiUrl}/statistics`;

    return this.http.get<ApiResponse<any>>(url, this.getHeaders()).pipe(
      map(response => response.data)
    );
  }
}