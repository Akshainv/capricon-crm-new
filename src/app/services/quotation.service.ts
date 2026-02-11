// src/app/services/quotation.service.ts (FRONTEND) - COMPLETE FILE WITH FIX
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface QuotationItem {
  product: {
    name: string;
    category: string;
  };
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface CreateQuotationPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  address?: string;
  // PDF Page 4 fields
  model?: string;
  quantity?: number;
  noOfStops?: number;
  elevatorType?: string;
  ratedLoad?: string;
  maximumSpeed?: string;
  capacity?: string;
  speed?: string;
  travelHeight?: string;
  driveSystem?: string;
  controlSystem?: string;
  cabinWalls?: string;
  cabinDoors?: string;
  doorType?: string;
  doorOpening?: string;
  copLopScreen?: string;
  cabinCeiling?: string;
  cabinFloor?: string;
  handrails?: number;
  // Legacy required fields for backend validation
  elevationType?: string;
  numberOfFloors?: number;
  doorConfiguration?: string;
  numberOfElevators?: number;
  driveType?: string;
  // Legacy optional compatibility fields
  includeInstallation?: boolean;
  includeAMC?: boolean;
  amcYears?: number;
  specialRequirements?: string;
  internalNotes?: string;
  baseCost: number;
  installationCost?: number;
  amcCost?: number;
  cgst?: number;
  sgst?: number;
  totalCost: number;
  items?: QuotationItem[];
  termsAndConditions?: string;
  notes?: string;
  status?: string;
  pricingItems?: any[];
  bankDetails?: {
    accountNo: string;
    ifsc: string;
    bank: string;
    gstin: string;
    accountName: string;
    accountType: string;
    branch: string;
    pan: string;
  };
  paymentTerms?: {
    slNo: number;
    description: string;
    rate: string;
  }[];
  gstRate?: number;
}

export interface Quotation {
  _id?: string;
  id?: string;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  companyName?: string;
  address?: string;
  quoteDate: string;
  validUntil: string;
  // PDF Page 4 fields
  model?: string;
  quantity?: number;
  noOfStops?: number;
  elevatorType?: string;
  ratedLoad?: string;
  maximumSpeed?: string;
  capacity?: string;
  speed?: string;
  travelHeight?: string;
  driveSystem?: string;
  controlSystem?: string;
  cabinWalls?: string;
  cabinDoors?: string;
  doorType?: string;
  doorOpening?: string;
  copLopScreen?: string;
  cabinCeiling?: string;
  cabinFloor?: string;
  handrails?: number;
  // Legacy/costs fields
  baseCost: number;
  installationCost: number;
  amcCost: number;
  totalCost: number;
  totalAmount: number;
  status: string;
  createdAt?: Date;
  createdDate?: Date;
  createdBy?: string;
  items?: QuotationItem[];
  termsAndConditions?: string;
  notes?: string;
  internalNotes?: string;
  specialRequirements?: string;
  pricingItems?: any[];
  bankDetails?: any;
  paymentTerms?: any[];
  gstRate?: number;
  // Additional fields for preview mapping
  subtotal?: number;
  totalTax?: number;
}

export interface QuotationResponse {
  statusCode: number;
  message: string;
  data: Quotation | Quotation[];
}

export interface QuotationStats {
  draft: { count: number; totalValue: number };
  sent: { count: number; totalValue: number };
  approved: { count: number; totalValue: number };
  rejected: { count: number; totalValue: number };
  overallTotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuotationService {
  private apiUrl = 'http://localhost:3000/api/quotation';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeadersWithUser(): HttpHeaders {
    const currentUser = this.authService.currentUserValue;
    const userId = currentUser?.userId || '';
    const userRole = currentUser?.role || '';

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-role': userRole
    });
  }

  createQuotation(quotationData: CreateQuotationPayload): Observable<QuotationResponse> {
    const headers = this.getHeadersWithUser();
    console.log('📤 Creating quotation with payload:', quotationData);
    console.log('🏗️ elevatorType being sent:', quotationData.elevatorType);
    return this.http.post<QuotationResponse>(this.apiUrl, quotationData, { headers });
  }

  getAllQuotations(status?: string, search?: string): Observable<QuotationResponse> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    if (search) {
      params = params.set('search', search);
    }

    const headers = this.getHeadersWithUser();
    return this.http.get<QuotationResponse>(this.apiUrl, { params, headers });
  }

  getQuotationById(id: string): Observable<QuotationResponse> {
    return this.http.get<QuotationResponse>(`${this.apiUrl}/${id}`);
  }

  updateQuotation(id: string, quotationData: Partial<CreateQuotationPayload>): Observable<QuotationResponse> {
    return this.http.put<QuotationResponse>(`${this.apiUrl}/${id}`, quotationData);
  }

  updateQuotationStatus(id: string, status: string): Observable<QuotationResponse> {
    return this.http.patch<QuotationResponse>(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteQuotation(id: string): Observable<QuotationResponse> {
    return this.http.delete<QuotationResponse>(`${this.apiUrl}/${id}`);
  }

  getStatsSummary(): Observable<{ statusCode: number; message: string; data: QuotationStats }> {
    return this.http.get<{ statusCode: number; message: string; data: QuotationStats }>(
      `${this.apiUrl}/stats/summary`
    );
  }

  // NEW METHOD: Send quotation with PDF generation
  sendQuotationWithPDF(quotationId: string, email: string, quotationData: any): Observable<any> {
    const headers = this.getHeadersWithUser();
    const payload = {
      email: email,
      quotationData: quotationData
    };
    return this.http.post(`${this.apiUrl}/${quotationId}/send-pdf`, payload, { headers });
  }

  convertToDeal(quotationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${quotationId}/convert-to-deal`, {});
  }

  formatQuotationForBackend(formData: any): CreateQuotationPayload {
    const items = formData.items || [];

    let baseCost = 0;
    let totalTax = 0;
    let totalCost = 0;

    if (formData.pricingItems && formData.pricingItems.length > 0) {
      // Use pricingItems (prioritize Launch Offer for total cost)
      const launchSubtotal = formData.pricingItems.reduce((sum: number, item: any) => {
        if (item.isComplimentary || item.isNA) return sum;
        return sum + (Number(item.launch) || 0);
      }, 0);

      const gstRate = (formData.gstRate || 18) / 100;
      baseCost = launchSubtotal;
      totalTax = launchSubtotal * gstRate;
      totalCost = launchSubtotal * (1 + gstRate);
    } else {
      // Fallback to old items logic
      baseCost = items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.price);
      }, 0);

      const totalDiscount = items.reduce((sum: number, item: any) => {
        const itemSubtotal = item.quantity * item.price;
        const discount = item.discount || 0;
        return sum + (itemSubtotal * (discount / 100));
      }, 0);

      const taxableAmount = baseCost - totalDiscount;

      totalTax = items.reduce((sum: number, item: any) => {
        const itemSubtotal = item.quantity * item.price;
        const discount = item.discount || 0;
        const tax = item.tax || 0;
        const discountAmount = itemSubtotal * (discount / 100);
        const itemTaxable = itemSubtotal - discountAmount;
        return sum + (itemTaxable * (tax / 100));
      }, 0);

      totalCost = taxableAmount + totalTax;
    }

    return {
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      companyName: formData.customerCompany || '',
      address: formData.customerAddress || '',
      // PDF Page 4 fields
      model: formData.model || '',
      quantity: Number(formData.quantity) || 1,
      noOfStops: Number(formData.noOfStops) || 2,
      elevatorType: formData.elevatorType || '',
      ratedLoad: formData.ratedLoad || '',
      maximumSpeed: formData.maximumSpeed || '',
      // Backend schema expects `capacity` and `speed` fields (required). Map from
      // existing frontend fields `ratedLoad` and `maximumSpeed` for compatibility.
      capacity: formData.capacity || formData.ratedLoad || '408 kg / 6 Pax',
      speed: formData.speed || formData.maximumSpeed || 'Upto 1 m/s',
      travelHeight: formData.travelHeight || '',
      driveSystem: formData.driveSystem || '',
      controlSystem: formData.controlSystem || 'Microprocessor-based fully automatic control',
      cabinWalls: formData.cabinWalls || '',
      cabinDoors: formData.cabinDoors || '',
      doorType: formData.doorType || '',
      doorOpening: formData.doorOpening || '',
      copLopScreen: formData.copLopScreen || '',
      cabinCeiling: formData.cabinCeiling || '',
      cabinFloor: formData.cabinFloor || '',
      handrails: Number(formData.handrails) || 0,
      // ⚠️ LEGACY REQUIRED FIELDS - Backend still validates these
      elevationType: this.mapCategoryToElevationType(items[0]?.productCategory || items[0]?.product?.category),
      numberOfFloors: Number(formData.noOfStops) || 2,
      doorConfiguration: '1 door',
      numberOfElevators: Number(formData.quantity) || 1,
      driveType: 'gearless drive',
      // Legacy optional fields for compatibility
      includeInstallation: formData.includeInstallation || false,
      includeAMC: formData.includeAMC || false,
      amcYears: Number(formData.amcYears) || 1,
      specialRequirements: formData.notes || '',
      internalNotes: formData.termsAndConditions || '',
      baseCost: Number(baseCost),
      installationCost: Number(formData.installationCost) || 0,
      amcCost: Number(formData.amcCost) || 0,
      cgst: Number(totalTax / 2),
      sgst: Number(totalTax / 2),
      totalCost: Number(totalCost),
      items: items.map((item: any) => ({
        product: item.product || {
          name: item.productName || 'Unknown Product',
          category: item.productCategory || 'General'
        },
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        discount: Number(item.discount) || 0,
        tax: Number(item.tax) || 0,
        total: Number(item.total) || 0
      })),
      termsAndConditions: formData.termsAndConditions,
      notes: formData.notes,
      pricingItems: formData.pricingItems,
      bankDetails: formData.bankDetails,
      paymentTerms: (formData.paymentTerms || []).map((term: any) => ({
        slNo: Number(term.slNo),
        description: term.description,
        rate: term.rate
      })),
      gstRate: Number(formData.gstRate) || 18
    };
  }

  formatQuotationForFrontend(backendData: any): Quotation {
    return {
      id: backendData._id || backendData.id,
      _id: backendData._id,
      quoteNumber: backendData.quoteNumber,
      customerName: backendData.customerName,
      customerEmail: backendData.customerEmail,
      customerPhone: backendData.customerPhone,
      customerCompany: backendData.companyName,
      companyName: backendData.companyName,
      address: backendData.address,
      quoteDate: backendData.createdAt || new Date().toISOString(),
      validUntil: backendData.validUntil,
      // PDF Page 4 fields
      model: backendData.model,
      quantity: backendData.quantity,
      noOfStops: backendData.noOfStops,
      elevatorType: backendData.elevatorType,
      ratedLoad: backendData.ratedLoad || backendData.capacity,
      maximumSpeed: backendData.maximumSpeed || backendData.speed,
      // Provide compatibility fields expected by PDF generator and other views
      capacity: backendData.capacity || backendData.ratedLoad,
      speed: backendData.speed || backendData.maximumSpeed,
      travelHeight: backendData.travelHeight,
      driveSystem: backendData.driveSystem,
      controlSystem: backendData.controlSystem,
      cabinWalls: backendData.cabinWalls,
      cabinDoors: backendData.cabinDoors,
      doorType: backendData.doorType,
      doorOpening: backendData.doorOpening,
      copLopScreen: backendData.copLopScreen,
      cabinCeiling: backendData.cabinCeiling,
      cabinFloor: backendData.cabinFloor,
      handrails: backendData.handrails,
      // Legacy/costs
      baseCost: backendData.baseCost,
      installationCost: backendData.installationCost || 0,
      amcCost: backendData.amcCost || 0,
      totalCost: backendData.totalCost,
      totalAmount: backendData.totalCost,
      status: backendData.status,
      createdAt: backendData.createdAt,
      createdDate: backendData.createdAt ? new Date(backendData.createdAt) : new Date(),
      createdBy: backendData.createdBy,
      items: backendData.items,
      termsAndConditions: backendData.internalNotes,
      notes: backendData.specialRequirements,
      pricingItems: backendData.pricingItems,
      bankDetails: backendData.bankDetails,
      paymentTerms: backendData.paymentTerms,
      gstRate: backendData.gstRate
    };
  }

  // ✅ FIXED: Returns values matching backend enum exactly
  private mapCategoryToElevationType(category: string | undefined): any {
    if (!category) return 'passenger';

    const cat = category.toLowerCase().trim();

    // Map to exact values allowed by backend QuotationSchema enum
    if (cat.includes('home')) return 'home lift';
    if (cat.includes('hospital')) return 'hospital';
    if (cat.includes('passenger')) return 'passenger';
    if (cat.includes('goods')) return 'goods';
    if (cat.includes('service')) return 'service';
    if (cat.includes('shaft')) return 'elevator with shaft';
    if (cat.includes('commercial')) return 'commercial elevator';

    return 'passenger';
  }
}