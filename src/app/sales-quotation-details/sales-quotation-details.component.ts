// src/app/sales-quotation-details/sales-quotation-details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

interface QuotationItem {
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

interface Customer {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
}

interface QuotationData {
  id: string;
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
}

@Component({
  selector: 'app-sales-quotation-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-quotation-details.component.html',
  styleUrls: ['./sales-quotation-details.component.css']
})
export class SalesQuotationDetailsComponent implements OnInit {
  quotationData: QuotationData | null = null;

  companyInfo = {
    name: 'Capricorn Elevators',
    address: '11th floor, Jomer Symphony, Unit 03, Ponnurunni East, Vyttila, Ernakulam, Kerala 682019',
    phone: '075930 00222',
    website: 'capricornelevators.com',
    gst: 'GST123456789'
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadQuotationData();
  }

  loadQuotationData(): void {
    // Get quotation ID from route params
    const quotationId = this.route.snapshot.paramMap.get('id');
    
    if (quotationId) {
      // Load from localStorage based on ID
      this.loadFromStorage(quotationId);
    }

    // Also check navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const data = navigation.extras.state['quotationData'];
      if (data) {
        this.quotationData = data;
      }
    }

    // If still no data, redirect back
    if (!this.quotationData) {
      alert('Quotation not found');
      this.router.navigate(['/quotations']);
    }
  }

  loadFromStorage(id: string): void {
    try {
      const stored = localStorage.getItem('sales_quotations');
      if (stored) {
        const quotations = JSON.parse(stored);
        const quotation = quotations.find((q: any) => q.id === id);
        if (quotation) {
          this.quotationData = quotation;
        }
      }
    } catch (error) {
      console.error('Error loading quotation:', error);
    }
  }

  formatCurrency(amount: number): string {
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

  goBack(): void {
    this.router.navigate(['/quotations']);
  }
}