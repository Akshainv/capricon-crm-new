import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PdfGenerationService } from '../../../core/services/pdf-generation.service';
import { QuotationService } from '../../../services/quotation.service';

interface QuotationItem {
  product: {
    name: string;
    category: string;
  };
  quantity: number;
  price: number;
  total: number;
  discount?: number;
  tax?: number;
}

interface Customer {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
}

interface QuotationData {
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  customer: Customer;
  items: QuotationItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  termsAndConditions: string;
  notes: string;
  // PDF Page 4 Technical Specs
  model?: string;
  quantity?: number;
  noOfStops?: number;
  elevatorType?: string;
  ratedLoad?: string;
  maximumSpeed?: string;
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

  pricingItems?: any[];
  standardSubtotal?: number;
  launchSubtotal?: number;
  standardTax?: number;
  launchTax?: number;
  standardGrandTotal?: number;
  launchGrandTotal?: number;
  launchGrandTotalInWords?: string;
  // Bank & Payment terms
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

@Component({
  selector: 'app-quotation-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quotation-preview.component.html',
  styleUrls: ['./quotation-preview.component.css']
})
export class QuotationPreviewComponent implements OnInit, OnDestroy {
  quotationData: QuotationData | null = null;
  officialPdfUrl: SafeResourceUrl | null = null;
  isLoadingPdf: boolean = false;
  isAdmin: boolean = false;
  previewMode: 'pdf' | 'html' = 'pdf';
  activePage: 'page1' | 'page4' | 'page9' = 'page1';

  companyInfo = {
    name: 'Capricorn Elevators',
    address: '11th floor, Jomer Symphony, Unit 03, Ponnurunni East, Vyttila, Ernakulam, Kerala 682019',
    phone: '075930 00222',
    website: 'capricornelevators.com',
    gst: 'GST123456789'
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private pdfService: PdfGenerationService,
    private quotationService: QuotationService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit(): Promise<void> {
    this.isAdmin = this.router.url.includes('/admin/');
    await this.loadQuotationData();
    if (this.quotationData) {
      console.log('📄 QuotationPreviewComponent - Quotation Data loaded:', {
        quoteNumber: this.quotationData.quoteNumber,
        customerName: this.quotationData.customer?.name,
        customerAddress: this.quotationData.customer?.address,
        itemsCount: this.quotationData.items?.length,
        grandTotal: this.quotationData.grandTotal
      });
      await this.generatePreviewPdf();
    }
  }

  ngOnDestroy(): void {
    if (this.officialPdfUrl) {
      // Logic to extract URL if possible
    }
  }

  async generatePreviewPdf(): Promise<void> {
    if (!this.quotationData) return;
    this.isLoadingPdf = true;

    try {
      // 1. Capture Page 4 (Specs)
      const page4Img = await this.capturePageById('page4-template');

      // 2. Capture Page 9 (Pricing)
      const page9Img = await this.capturePageById('page9-template');

      // 3. Generate PDF using service
      const pdfBytes = await (this.pdfService as any).generateOfficialPdf(this.quotationData, {
        page4Image: page4Img,
        page9Image: page9Img
      });

      // Create blob URL for iframe
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      this.officialPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

    } catch (error) {
      console.error('Error generating official PDF:', error);
    } finally {
      this.isLoadingPdf = false;
    }
  }

  async downloadOfficialPDF(): Promise<void> {
    if (!this.quotationData) return;

    try {
      // Capture all dynamic pages
      const page4Img = await this.capturePageById('page4-template');
      const page9Img = await this.capturePageById('page9-template');

      const pdfBytes = await (this.pdfService as any).generateOfficialPdf(this.quotationData, {
        page4Image: page4Img,
        page9Image: page9Img
      });

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Capricorn_Quotation_${this.quotationData.quoteNumber || 'Official'}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error downloading official PDF:', error);
      alert('Failed to generate official PDF template. Please ensure the template exists in assets/templates/');
    }
  }

  private async capturePageById(elementId: string): Promise<string | null> {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Template not found for capture: ${elementId}`);
      return null;
    }

    try {
      console.log(`Capturing ${elementId}...`);
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      return canvas.toDataURL('image/png', 1.0);
    } catch (error) {
      console.error(`Error capturing ${elementId}:`, error);
      return null;
    }
  }

  async loadQuotationData(): Promise<void> {
    // 1. Try navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const data = navigation.extras.state['quotationData'];
      if (data) {
        this.quotationData = this.mapQuotationToPreviewData(data);
        return;
      }
    }

    // 2. Try Route ID (Reload support)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const response = await this.quotationService.getQuotationById(id).toPromise();
        if (response && response.data) {
          const formatted = this.quotationService.formatQuotationForFrontend(response.data);
          this.quotationData = this.mapQuotationToPreviewData(formatted);
          return;
        }
      } catch (error) {
        console.error('Error fetching quotation by ID:', error);
      }
    }

    // 3. Fallback to localStorage
    const savedData = localStorage.getItem('quotationPreview');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        this.quotationData = this.mapQuotationToPreviewData(data);
        return;
      } catch (error) {
        console.error('Error loading quotation data:', error);
      }
    }

    alert('No quotation data found');
    this.close();
  }

  public mapQuotationToPreviewData(q: any): QuotationData {
    const items = (q.items || []).map((it: any) => ({
      product: { name: it.product?.name || '', category: it.product?.category || '' },
      quantity: it.quantity || 1,
      price: it.price || 0,
      discount: it.discount || 0,
      tax: it.tax || 0,
      total: it.total || ((it.quantity || 1) * (it.price || 0))
    }));

    const subtotal = items.reduce((s: number, it: any) => s + (it.quantity * it.price), 0);
    const totalDiscount = items.reduce((s: number, it: any) => s + ((it.quantity * it.price) * (it.discount / 100)), 0);
    const totalTax = items.reduce((s: number, it: any) => {
      const taxable = (it.quantity * it.price) - ((it.quantity * it.price) * (it.discount / 100));
      return s + (taxable * (it.tax / 100));
    }, 0);

    // ✅ Calculate standard and launch totals from pricingItems
    const pricingItems = this.getExactPricingItems(q);
    const gstRate = q.gstRate || 18;

    // Calculate Standard Total (sum of all standard prices, excluding NA items)
    const calculatedStandardSubtotal = pricingItems.reduce((sum: number, item: any) => {
      if (item.isNA) return sum;
      return sum + (Number(item.standard) || 0);
    }, 0);

    // Calculate Launch Total (sum of launch prices, excluding complimentary and NA items)
    const calculatedLaunchSubtotal = pricingItems.reduce((sum: number, item: any) => {
      if (item.isComplimentary || item.isNA) return sum;
      return sum + (Number(item.launch) || 0);
    }, 0);

    // Use calculated values, or fallback to passed values, or to 0
    const finalStandardSubtotal = calculatedStandardSubtotal > 0 ? calculatedStandardSubtotal : (q.standardSubtotal || 0);
    const finalLaunchSubtotal = calculatedLaunchSubtotal > 0 ? calculatedLaunchSubtotal : (q.launchSubtotal || 0);

    const finalStandardTax = finalStandardSubtotal * (gstRate / 100);
    const finalLaunchTax = finalLaunchSubtotal * (gstRate / 100);

    const finalStandardGrandTotal = finalStandardSubtotal + finalStandardTax;
    const finalLaunchGrandTotal = finalLaunchSubtotal + finalLaunchTax;

    return {
      quoteNumber: q.quoteNumber || '',
      quoteDate: q.quoteDate || q.createdAt || q.createdDate || '',
      validUntil: q.validUntil || '',
      customer: {
        name: q.customer?.name || q.customerName || '',
        company: q.customer?.company || q.customerCompany || q.companyName || '',
        email: q.customer?.email || q.customerEmail || '',
        phone: q.customer?.phone || q.customerPhone || '',
        address: q.customer?.address || q.customerAddress || q.address || q.companyAddress || ''
      },
      items,
      subtotal: Number(q.launchSubtotal || q.pricing?.subtotal || q.subtotal || subtotal),
      totalDiscount,
      totalTax: Number(q.launchTax || q.pricing?.cgst + q.pricing?.sgst || q.totalTax || totalTax),
      grandTotal: Number(q.launchGrandTotal || q.pricing?.totalAmount || q.totalCost || q.totalAmount || (subtotal + totalTax)),
      termsAndConditions: q.termsAndConditions || q.internalNotes || '',
      notes: q.notes || q.specialRequirements || '',

      // PDF Page 4 Technical Specs
      model: q.model || '',
      quantity: q.quantity || 0,
      noOfStops: q.noOfStops || 0,
      elevatorType: q.elevatorType || '',
      ratedLoad: q.ratedLoad || '',
      maximumSpeed: q.maximumSpeed || '',
      travelHeight: q.travelHeight || '',
      driveSystem: q.driveSystem || '',
      controlSystem: q.controlSystem || '',
      cabinWalls: q.cabinWalls || '',
      cabinDoors: q.cabinDoors || '',
      doorType: q.doorType || '',
      doorOpening: q.doorOpening || '',
      copLopScreen: q.copLopScreen || '',
      cabinCeiling: q.cabinCeiling || '',
      cabinFloor: q.cabinFloor || '',
      handrails: q.handrails || 0,


      pricingItems: pricingItems,
      standardSubtotal: finalStandardSubtotal,
      launchSubtotal: finalLaunchSubtotal,
      standardTax: finalStandardTax,
      launchTax: finalLaunchTax,
      standardGrandTotal: finalStandardGrandTotal,
      launchGrandTotal: finalLaunchGrandTotal,
      launchGrandTotalInWords: this.convertNumberToWords(finalLaunchGrandTotal),

      bankDetails: q.bankDetails || {
        accountNo: '777 705 751 175',
        ifsc: 'ICIC0006264',
        bank: 'ICICI Bank',
        gstin: '32AAMCC4492R1ZY',
        accountName: 'Capricorn Elevators Pvt Ltd',
        accountType: 'Current Account',
        branch: 'Edappally - Ernakulam, Kerala',
        pan: 'AAMCC4492R'
      },
      paymentTerms: q.paymentTerms || [
        { slNo: 1, description: 'On Order Signing', rate: '30%' },
        { slNo: 2, description: 'On GAD Approval', rate: '20%' },
        { slNo: 3, description: 'Before Dispatch of materials', rate: '40%' },
        { slNo: 4, description: 'After Installation & Commissioning', rate: '10%' }
      ],
      gstRate: gstRate,
    };
  }

  private getExactPricingItems(q: any): any[] {
    const items = Array.isArray(q.pricingItems) ? q.pricingItems : [];

    const findItem = (label: string) => {
      const search = label.toLowerCase().trim();
      return items.find((it: any) => {
        const itemLabel = (it.label || it.description || it.itemName || '').toLowerCase().trim();
        return itemLabel === search;
      });
    };

    const labels = [
      'Basic Cost',
      'Installation',
      'Additional Door Cost',
      'Extra Travel Height Cost',
      'Premium Cabin (Glass/Mirror/RAL/Wood Finish)',
      'Custom Ceiling',
      'Glass Door',
      'Premium RAL Colour for Door',
      'Customised Cabin Size',
      'Transportation',
      'LOP - COP'
    ];

    return labels.map(label => {
      const match = findItem(label);
      if (match) {
        return {
          description: match.label || match.description || match.itemName || label,
          standard: Number(match.standard) || 0,
          launch: Number(match.launch) || 0,
          isNA: match.isNA === true,
          isComplimentary: match.isComplimentary === true
        };
      }

      // Fallback/Default for these specific labels
      return {
        description: label,
        standard: 0,
        launch: 0,
        isNA: label.includes('Door Cost') || label.includes('RAL Colour'),
        isComplimentary: label.includes('Cabin') || label.includes('Ceiling') || label.includes('Door') || label.includes('Size') || label.includes('Transportation') || label.includes('LOP')
      };
    });
  }

  private convertNumberToWords(num: number): string {
    if (num === 0) return 'Rupees Zero Only';

    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' : '') + a[n % 10];
      if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
      return '';
    };

    const convert = (n: number): string => {
      let str = '';
      if (n >= 10000000) {
        str += inWords(Math.floor(n / 10000000)) + 'Crore ';
        n %= 10000000;
      }
      if (n >= 100000) {
        str += inWords(Math.floor(n / 100000)) + 'Lakh ';
        n %= 100000;
      }
      if (n >= 1000) {
        str += inWords(Math.floor(n / 1000)) + 'Thousand ';
        n %= 1000;
      }
      if (n > 0) {
        str += inWords(n);
      }
      return str.trim();
    };

    return 'Rupees ' + convert(Math.floor(num)) + ' Only';
  }

  formatCurrency(amount: number | undefined | null): string {
    if (amount === undefined || amount === null || isNaN(amount as number)) {
      return '₹0';
    }
    return `₹${amount.toLocaleString('en-IN')}`;
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

  printQuotation(): void {
    window.print();
  }

  close(): void {
    if (this.router.url.includes('/admin/')) {
      this.router.navigate(['/admin/admin-quotations']);
    } else {
      this.router.navigate(['/quotations']);
    }
  }

  calculateItemSubtotal(item: QuotationItem): number {
    return (item.quantity || 0) * (item.price || 0);
  }

  async generatePDF(): Promise<Blob> {
    const element = document.querySelector('.quotation-document') as HTMLElement;

    if (!element) {
      throw new Error('Quotation document element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  }

  setPreviewMode(mode: 'pdf' | 'html'): void {
    this.previewMode = mode;
    this.cdr.detectChanges();
  }
}