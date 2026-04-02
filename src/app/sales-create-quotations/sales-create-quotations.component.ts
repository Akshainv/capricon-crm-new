// src/app/sales-create-quotation/sales-create-quotations.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuotationService, CreateQuotationPayload } from '../services/quotation.service';
import { LeadsService, Lead as LeadFromApi } from '../lead.service';
import { ToastrService } from 'ngx-toastr';

declare var Toastify: any;

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
}

interface QuotationItem {
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

@Component({
  selector: 'app-sales-create-quotation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-create-quotations.component.html',
  styleUrls: ['./sales-create-quotations.component.css']
})
export class SalesCreateQuotationComponent implements OnInit {
  selectedLeadId: string = '';
  leads: Lead[] = [];
  loadingLeads: boolean = false;

  leadSearchTerm: string = '';
  filteredLeads: Lead[] = [];
  showLeadDropdown: boolean = false;

  customerName: string = '';
  customerEmail: string = '';
  customerPhone: string = '';
  customerAddress: string = '';
  customerCompany: string = '';

  quoteNumber: string = '';
  quoteDate: string = '';
  validUntil: string = '';
  gstRate: number = 18;

  bankDetails = {
    accountNo: '777 705 751 175',
    ifsc: 'ICIC0006264',
    bank: 'ICICI Bank',
    gstin: '32AAMCC4492R1ZY',
    accountName: 'Capricorn Elevators Pvt Ltd',
    accountType: 'Current Account',
    branch: 'Edappally - Ernakulam, Kerala',
    pan: 'AAMCC4492R'
  };

  paymentTerms = [
    { slNo: 1, description: 'On Order Signing', rate: '30%' },
    { slNo: 2, description: 'On GAD Approval', rate: '20%' },
    { slNo: 3, description: 'Before Dispatch of materials', rate: '40%' },
    { slNo: 4, description: 'After Installation & Commissioning', rate: '10%' }
  ];

  // Elevator Specifications (PDF Page 4)
  model: string = 'Capricorn Grandeur Signature';
  quantity: number = 1;
  noOfStops: number = 2;
  elevatorType: string = 'MRL Gearless - Rope Driven';
  ratedLoad: string = '408 kg / 6 Pax';
  ratedLoadOptions: string[] = [
    '68 kg / 1 Pax',
    '136 kg / 2 Pax',
    '204 kg / 3 Pax',
    '272 kg / 4 Pax',
    '340 kg / 5 Pax',
    '408 kg / 6 Pax',
    '476 kg / 7 Pax',
    '544 kg / 8 Pax',
    'Others'
  ];
  maximumSpeed: string = 'Upto 1 m/s';
  travelHeight: string = '3000 mm';
  driveSystem: string = 'AC VVVF (Variable Voltage Variable Frequency)';
  controlSystem: string = 'Microprocessor-based fully automatic control';
  cabinWalls: string = 'Stainless Steel SS 304 Rose Gold Glossy with 2 Sides of plain toughened glass. Integrated LED strips on the back panel enhance aesthetics and illumination.';
  cabinDoors: string = 'SS 304 Rose Gold Full Vision Tinted Glass';
  doorType: string = 'Automatic, Sliding, Side Opening';
  doorOpening: string = '700 mm x 2000 mm';
  copLopScreen: string = 'With feather Touch Type';
  cabinCeiling: string = 'SS 304 frame false ceiling with Acrylic Lighting & Blower';
  cabinFloor: string = 'Provision for Marble/Granite (by client).';
  handrails: number = 1;

  today: string = new Date().toISOString().split('T')[0];
  defaultValidUntil: string = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  availableProducts: Product[] = [
    { id: '1', name: '8-Floor Passenger Elevator', category: 'Passenger', price: 1500000, unit: 'Unit' },
    { id: '2', name: '5-Floor Home Lift', category: 'Home', price: 750000, unit: 'Unit' },
    { id: '3', name: '12-Floor Goods Elevator', category: 'Goods', price: 2200000, unit: 'Unit' },
    { id: '4', name: '6-Floor Hospital Elevator', category: 'Hospital', price: 1800000, unit: 'Unit' },
    { id: '5', name: 'Installation Service', category: 'Service', price: 150000, unit: 'Service' },
    { id: '6', name: 'Annual Maintenance Contract', category: 'Service', price: 50000, unit: 'Year' },
    { id: '7', name: 'Emergency Repair', category: 'Service', price: 25000, unit: 'Service' }
  ];

  pricingItems = [
    { label: 'Basic Cost', standard: 0, launch: 0, isComplimentary: false, isNA: false },
    { label: 'Installation', standard: 0, launch: 0, isComplimentary: false, isNA: false },
    { label: 'Additional Door Cost', standard: 0, launch: 0, isComplimentary: false, isNA: false },
    { label: 'Extra Travel Height Cost', standard: 0, launch: 0, isComplimentary: false, isNA: false },
    { label: 'Premium Cabin (Glass/Mirror/RAL/Wood Finish)', standard: 0, launch: 0, isComplimentary: true, isNA: false },
    { label: 'Custom Ceiling', standard: 0, launch: 0, isComplimentary: true, isNA: false },
    { label: 'Glass Door', standard: 0, launch: 0, isComplimentary: true, isNA: false },
    { label: 'Premium RAL Colour for Door', standard: 0, launch: 0, isComplimentary: false, isNA: false },
    { label: 'Customised Cabin Size', standard: 0, launch: 0, isComplimentary: true, isNA: false },
    { label: 'Transportation', standard: 0, launch: 0, isComplimentary: true, isNA: false },
    { label: 'LOP - COP', standard: 0, launch: 0, isComplimentary: true, isNA: false }
  ];

  quotationItems: QuotationItem[] = []; // Keep empty or for additional things

  termsAndConditions: string = `1. Payment Terms: 50% advance, 30% on installation, 20% on completion
2. Delivery Time: 60-90 days from order confirmation
3. Warranty: 12 months comprehensive warranty
4. Installation charges included
5. Annual maintenance contract optional`;

  notes: string = '';
  loading: boolean = false;

  constructor(
    private router: Router,
    private quotationService: QuotationService,
    private leadsService: LeadsService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    const restored = this.restoreFormState();
    if (!restored) {
      this.generateQuoteNumber();
      this.quoteDate = this.today;
      this.validUntil = this.defaultValidUntil;
    }
    this.loadLeadsFromAPI();
  }

  loadLeadsFromAPI(): void {
    this.loadingLeads = true;

    this.leadsService.getAllLeads().subscribe({
      next: (apiLeads: LeadFromApi[]) => {
        const assignedLeads = apiLeads.filter(lead =>
          lead.assignedTo && lead.assignedTo.trim() !== ''
        );

        this.leads = assignedLeads.map((apiLead: any) => ({
          id: apiLead._id,
          name: apiLead.fullName,
          email: apiLead.email,
          phone: apiLead.phoneNumber,
          company: apiLead.companyName || '',
          address: apiLead.address || this.extractAddressFromNotes(apiLead.notes || '')
        }));

        this.filteredLeads = [...this.leads];
        this.loadingLeads = false;
      },
      error: (error) => {
        console.error('Error loading leads:', error);
        this.showToast('Failed to load leads. Please try again.', 'error');
        this.loadingLeads = false;
      }
    });
  }

  onLeadSearch(): void {
    const searchTerm = this.leadSearchTerm.toLowerCase().trim();

    if (!searchTerm) {
      this.filteredLeads = [...this.leads];
      this.showLeadDropdown = false;
      return;
    }

    this.filteredLeads = this.leads.filter(lead =>
      lead.name.toLowerCase().includes(searchTerm) ||
      lead.company.toLowerCase().includes(searchTerm) ||
      lead.phone.includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm)
    );

    this.showLeadDropdown = this.filteredLeads.length > 0;
  }

  selectLead(lead: Lead): void {
    this.selectedLeadId = lead.id;
    this.leadSearchTerm = lead.name;
    this.showLeadDropdown = false;

    this.customerName = lead.name;
    this.customerEmail = lead.email;
    this.customerPhone = lead.phone;
    this.customerAddress = lead.address;
    this.customerCompany = lead.company;
  }

  clearLeadSearch(): void {
    this.leadSearchTerm = '';
    this.selectedLeadId = '';
    this.filteredLeads = [...this.leads];
    this.showLeadDropdown = false;

    this.customerName = '';
    this.customerEmail = '';
    this.customerPhone = '';
    this.customerAddress = '';
    this.customerCompany = '';
  }

  onLeadSearchFocus(): void {
    if (this.filteredLeads.length > 0) {
      this.showLeadDropdown = true;
    }
  }

  onLeadSearchBlur(): void {
    setTimeout(() => {
      this.showLeadDropdown = false;
    }, 200);
  }

  extractAddressFromNotes(notes: string): string {
    if (!notes) return '';

    const parts = notes.split(' | ');
    let fullAddress = '';

    parts.forEach(part => {
      const [key, ...valueParts] = part.split(': ');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(': ').trim();
        const cleanKey = key.trim().toLowerCase();

        if (cleanKey === 'address') {
          fullAddress += value;
        } else if (cleanKey === 'city') {
          fullAddress += fullAddress ? ', ' + value : value;
        } else if (cleanKey === 'state') {
          fullAddress += fullAddress ? ', ' + value : value;
        } else if (cleanKey === 'pincode') {
          fullAddress += fullAddress ? ' - ' + value : value;
        }
      }
    });

    return fullAddress;
  }

  generateQuoteNumber(): void {
    const timestamp = Date.now();
    this.quoteNumber = `QT-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`;
  }

  onLeadSelected(): void {
    if (!this.selectedLeadId) {
      this.customerName = '';
      this.customerEmail = '';
      this.customerPhone = '';
      this.customerAddress = '';
      this.customerCompany = '';
      return;
    }

    const selectedLead = this.leads.find(lead => lead.id === this.selectedLeadId);

    if (selectedLead) {
      this.customerName = selectedLead.name;
      this.customerEmail = selectedLead.email;
      this.customerPhone = selectedLead.phone;
      this.customerAddress = selectedLead.address;
      this.customerCompany = selectedLead.company;
    }
  }

  addItem(): void {
    this.quotationItems.push({
      productName: '',
      quantity: 1,
      price: 0,
      total: 0
    });
  }

  removeItem(index: number): void {
    if (this.quotationItems.length > 1) {
      this.quotationItems.splice(index, 1);
    }
  }

  calculateItemTotal(index: number): void {
    const item = this.quotationItems[index];
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    item.total = qty * price;
  }

  get subtotal(): number {
    return this.calculateLaunchTotal();
  }

  calculateStandardTotal(): number {
    return this.pricingItems.reduce((sum, item) => {
      if (item.isNA) return sum;
      return sum + (Number(item.standard) || 0);
    }, 0);
  }

  calculateLaunchTotal(): number {
    return this.pricingItems.reduce((sum, item) => {
      if (item.isComplimentary || item.isNA) return sum;
      return sum + (Number(item.launch) || 0);
    }, 0);
  }

  get totalTax(): number {
    return this.calculateLaunchTotal() * (this.gstRate / 100);
  }

  get grandTotal(): number {
    const launchTotal = this.calculateLaunchTotal();
    const gst = launchTotal * (this.gstRate / 100);
    return launchTotal + gst;
  }

  get launchSubtotal(): number {
    return this.calculateLaunchTotal();
  }

  get standardSubtotal(): number {
    return this.calculateStandardTotal();
  }

  get standardGrandTotal(): number {
    const stdTotal = this.calculateStandardTotal();
    return stdTotal + (stdTotal * 0.18);
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₹0';
    }
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  }

  validateForm(): boolean {
    if (!this.customerName.trim()) {
      this.showToast('Please enter customer name', 'error');
      return false;
    }
    if (!this.customerEmail.trim()) {
      this.showToast('Please enter customer email', 'error');
      return false;
    }
    if (!this.customerPhone.trim()) {
      this.showToast('Please enter customer phone', 'error');
      return false;
    }
    if (!this.customerAddress.trim()) {
      this.showToast('Please enter customer address', 'error');
      return false;
    }
    if (!this.quoteDate) {
      this.showToast('Please select quote date', 'error');
      return false;
    }
    if (!this.validUntil) {
      this.showToast('Please select valid until date', 'error');
      return false;
    }

    const quoteDateObj = new Date(this.quoteDate);
    const validUntilObj = new Date(this.validUntil);

    if (validUntilObj <= quoteDateObj) {
      this.showToast('Valid Until date must be after Quote Date', 'error');
      return false;
    }

    const hasTopLevelModel = this.model && this.model.trim() !== '';
    const hasItemsWithProductName = this.quotationItems.some(item => item.productName && item.productName.trim() !== '');

    if (!hasTopLevelModel && !hasItemsWithProductName) {
      this.showToast('Please enter a Model Name in Specifications or add an item', 'error');
      return false;
    }

    return true;
  }

  addQuotation(): void {
    if (!this.validateForm()) return;

    this.loading = true;
    const formData = this.getFormData();
    const payload = this.quotationService.formatQuotationForBackend(formData);

    // ✅ FIXED: Set status to 'draft' for new quotations to ensure they appear in the "Pending" section
    payload.status = 'draft';

    console.log('📤 Final payload:', payload);

    this.quotationService.createQuotation(payload).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statusCode === 201) {
          this.clearFormState();
          this.showToast('Quotation added successfully!', 'success');
          this.router.navigate(['/quotations']);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Error adding quotation:', error);
        console.error('❌ Error details:', error.error);
        console.error('❌ Validation messages:', error.error?.message);
        this.showToast('Failed to add quotation. Please try again.', 'error');
      }
    });
  }

  preview(): void {
    if (this.validateForm()) {
      this.saveFormState();
      const quotationData = this.getQuotationData();
      localStorage.setItem('quotationPreview', JSON.stringify(quotationData));
      this.router.navigate(['/quotations/preview']);
    }
  }

  private buildCompleteQuotationData(): any {
    const launchSubtotal = this.calculateLaunchTotal();
    const standardSubtotal = this.calculateStandardTotal();

    return {
      quoteNumber: this.quoteNumber,
      quoteDate: this.quoteDate,
      validUntil: this.validUntil,
      customer: {
        name: this.customerName,
        email: this.customerEmail,
        phone: this.customerPhone,
        address: this.customerAddress,
        company: this.customerCompany
      },
      pricingItems: this.pricingItems,
      standardSubtotal,
      launchSubtotal,
      standardTax: standardSubtotal * (this.gstRate / 100),
      launchTax: launchSubtotal * (this.gstRate / 100),
      standardGrandTotal: standardSubtotal * (1 + (this.gstRate / 100)),
      launchGrandTotal: launchSubtotal * (1 + (this.gstRate / 100)),
      subtotal: launchSubtotal,
      grandTotal: launchSubtotal * (1 + (this.gstRate / 100)),
      bankDetails: this.bankDetails,
      paymentTerms: this.paymentTerms,
      gstRate: this.gstRate,
      termsAndConditions: this.termsAndConditions,
      notes: this.notes,
      // Elevator Specs for PDF Page 4
      model: this.model,
      quantity: this.quantity,
      noOfStops: this.noOfStops,
      elevatorType: this.elevatorType,
      ratedLoad: this.ratedLoad,
      maximumSpeed: this.maximumSpeed,
      travelHeight: this.travelHeight,
      driveSystem: this.driveSystem,
      controlSystem: this.controlSystem,
      cabinWalls: this.cabinWalls,
      cabinDoors: this.cabinDoors,
      doorType: this.doorType,
      doorOpening: this.doorOpening,
      copLopScreen: this.copLopScreen,
      cabinCeiling: this.cabinCeiling,
      cabinFloor: this.cabinFloor,
      handrails: this.handrails
    };
  }

  navigateToQuotations(): void {
    this.clearFormState();
    this.router.navigate(['/quotations']);
  }

  cancel(): void {
    if (typeof Toastify !== 'undefined') {
      const container = document.createElement('div');
      container.style.textAlign = 'center';
      container.style.padding = '10px';

      const msgEl = document.createElement('div');
      msgEl.style.fontWeight = '600';
      msgEl.style.marginBottom = '8px';
      msgEl.innerText = 'Cancel Quotation?';
      container.appendChild(msgEl);

      const subMsgEl = document.createElement('div');
      subMsgEl.style.fontSize = '12px';
      subMsgEl.style.marginBottom = '15px';
      subMsgEl.style.opacity = '0.9';
      subMsgEl.innerText = 'All unsaved changes will be lost';
      container.appendChild(subMsgEl);

      const btnContainer = document.createElement('div');
      btnContainer.style.display = 'flex';
      btnContainer.style.gap = '10px';
      btnContainer.style.justifyContent = 'center';

      const toast = Toastify({
        node: container,
        duration: -1,
        close: true,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        style: {
          background: "#ef4444",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: "500",
          textAlign: "center",
          maxWidth: "400px",
          padding: "15px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
        }
      }).showToast();

      const confirmBtn = document.createElement('button');
      confirmBtn.innerText = 'Yes, Cancel';
      confirmBtn.style.padding = '8px 20px';
      confirmBtn.style.background = 'white';
      confirmBtn.style.color = '#ef4444';
      confirmBtn.style.border = 'none';
      confirmBtn.style.borderRadius = '6px';
      confirmBtn.style.cursor = 'pointer';
      confirmBtn.style.fontWeight = '700';
      confirmBtn.style.fontSize = '13px';
      confirmBtn.addEventListener('click', () => {
        toast.hideToast();
        this.clearFormState();
        this.router.navigate(['/quotations']);
      });

      const cancelBtn = document.createElement('button');
      cancelBtn.innerText = 'Keep Editing';
      cancelBtn.style.padding = '8px 20px';
      cancelBtn.style.background = 'rgba(255,255,255,0.2)';
      cancelBtn.style.color = 'white';
      cancelBtn.style.border = 'none';
      cancelBtn.style.borderRadius = '6px';
      cancelBtn.style.cursor = 'pointer';
      cancelBtn.style.fontWeight = '600';
      cancelBtn.style.fontSize = '13px';
      cancelBtn.addEventListener('click', () => toast.hideToast());

      btnContainer.appendChild(confirmBtn);
      btnContainer.appendChild(cancelBtn);
      container.appendChild(btnContainer);
    } else {
      if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        this.clearFormState();
        this.router.navigate(['/quotations']);
      } else {
        this.toastr.info('Action cancelled');
      }
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getFormData(): any {
    return {
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      customerPhone: this.customerPhone,
      customerAddress: this.customerAddress,
      customerCompany: this.customerCompany,
      quoteDate: this.quoteDate,
      validUntil: this.validUntil,
      items: this.quotationItems
        .filter(item => item.productName.trim() !== '')
        .map(item => ({
          productName: item.productName,
          productCategory: 'General',
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
      termsAndConditions: this.termsAndConditions,
      notes: this.notes,
      pricingItems: this.pricingItems,
      // PDF Page 4 fields - ALL 17 fields
      model: this.model,
      quantity: this.quantity,
      noOfStops: this.noOfStops,
      elevatorType: this.elevatorType,
      ratedLoad: this.ratedLoad,
      maximumSpeed: this.maximumSpeed,
      capacity: this.ratedLoad || '408 kg / 6 Pax',
      speed: this.maximumSpeed || 'Upto 1 m/s',
      travelHeight: this.travelHeight,
      driveSystem: this.driveSystem,
      controlSystem: this.controlSystem,
      cabinWalls: this.cabinWalls,
      cabinDoors: this.cabinDoors,
      doorType: this.doorType,
      doorOpening: this.doorOpening,
      copLopScreen: this.copLopScreen,
      cabinCeiling: this.cabinCeiling,
      cabinFloor: this.cabinFloor,
      handrails: this.handrails,
      // Bank & payment
      bankDetails: this.bankDetails,
      paymentTerms: this.paymentTerms,
      gstRate: this.gstRate
    };
  }


  getQuotationData(): any {
    return this.buildCompleteQuotationData();
  }

  removePaymentTerm(index: number) {
    this.paymentTerms.splice(index, 1);
    this.updatePaymentTermsSlNo();
  }

  addPaymentTerm() {
    const nextSlNo = this.paymentTerms.length + 1;
    this.paymentTerms.push({ slNo: nextSlNo, description: '', rate: '' });
  }

  private updatePaymentTermsSlNo() {
    this.paymentTerms.forEach((term, index) => {
      term.slNo = index + 1;
    });
  }

  private saveFormState(): void {
    const state = {
      selectedLeadId: this.selectedLeadId,
      leadSearchTerm: this.leadSearchTerm,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      customerPhone: this.customerPhone,
      customerAddress: this.customerAddress,
      customerCompany: this.customerCompany,
      quoteNumber: this.quoteNumber,
      quoteDate: this.quoteDate,
      validUntil: this.validUntil,
      gstRate: this.gstRate,
      model: this.model,
      quantity: this.quantity,
      noOfStops: this.noOfStops,
      elevatorType: this.elevatorType,
      ratedLoad: this.ratedLoad,
      maximumSpeed: this.maximumSpeed,
      travelHeight: this.travelHeight,
      driveSystem: this.driveSystem,
      controlSystem: this.controlSystem,
      cabinWalls: this.cabinWalls,
      cabinDoors: this.cabinDoors,
      doorType: this.doorType,
      doorOpening: this.doorOpening,
      copLopScreen: this.copLopScreen,
      cabinCeiling: this.cabinCeiling,
      cabinFloor: this.cabinFloor,
      handrails: this.handrails,
      pricingItems: this.pricingItems,
      quotationItems: this.quotationItems,
      termsAndConditions: this.termsAndConditions,
      notes: this.notes,
      bankDetails: this.bankDetails,
      paymentTerms: this.paymentTerms
    };
    try {
      sessionStorage.setItem('createQuotationFormState', JSON.stringify(state));
    } catch (e) {
      console.error('Error saving form state:', e);
    }
  }

  private restoreFormState(): boolean {
    try {
      const saved = sessionStorage.getItem('createQuotationFormState');
      if (!saved) return false;
      const state = JSON.parse(saved);
      this.selectedLeadId = state.selectedLeadId || '';
      this.leadSearchTerm = state.leadSearchTerm || '';
      this.customerName = state.customerName || '';
      this.customerEmail = state.customerEmail || '';
      this.customerPhone = state.customerPhone || '';
      this.customerAddress = state.customerAddress || '';
      this.customerCompany = state.customerCompany || '';
      this.quoteNumber = state.quoteNumber || '';
      this.quoteDate = state.quoteDate || this.today;
      this.validUntil = state.validUntil || this.defaultValidUntil;
      this.gstRate = state.gstRate ?? 18;
      this.model = state.model || '';
      this.quantity = state.quantity ?? 1;
      this.noOfStops = state.noOfStops ?? 2;
      this.elevatorType = state.elevatorType || '';
      this.ratedLoad = state.ratedLoad || '';
      this.maximumSpeed = state.maximumSpeed || '';
      this.travelHeight = state.travelHeight || '';
      this.driveSystem = state.driveSystem || '';
      this.controlSystem = state.controlSystem || '';
      this.cabinWalls = state.cabinWalls || '';
      this.cabinDoors = state.cabinDoors || '';
      this.doorType = state.doorType || '';
      this.doorOpening = state.doorOpening || '';
      this.copLopScreen = state.copLopScreen || '';
      this.cabinCeiling = state.cabinCeiling || '';
      this.cabinFloor = state.cabinFloor || '';
      this.handrails = state.handrails ?? 1;
      if (Array.isArray(state.pricingItems)) this.pricingItems = state.pricingItems;
      if (Array.isArray(state.quotationItems)) this.quotationItems = state.quotationItems;
      if (state.termsAndConditions !== undefined) this.termsAndConditions = state.termsAndConditions;
      if (state.notes !== undefined) this.notes = state.notes;
      if (state.bankDetails) this.bankDetails = state.bankDetails;
      if (Array.isArray(state.paymentTerms)) this.paymentTerms = state.paymentTerms;
      // Clear after restoring so it doesn't persist across fresh visits
      sessionStorage.removeItem('createQuotationFormState');
      return true;
    } catch (e) {
      console.error('Error restoring form state:', e);
      return false;
    }
  }

  private clearFormState(): void {
    sessionStorage.removeItem('createQuotationFormState');
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (typeof Toastify !== 'undefined') {
      let backgroundColor = '#60a5fa';

      if (type === 'success') {
        backgroundColor = '#22c55e';
      } else if (type === 'error') {
        backgroundColor = '#ef4444';
      }

      Toastify({
        text: message,
        duration: 4000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
          background: backgroundColor,
          borderRadius: "8px",
          padding: "12px 20px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }
      }).showToast();
    } else {
      this.toastr.info(message);
    }
  }
}