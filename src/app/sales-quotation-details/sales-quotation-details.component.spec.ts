import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesQuotationDetailsComponent } from './sales-quotation-details.component';

describe('SalesQuotationDetailsComponent', () => {
  let component: SalesQuotationDetailsComponent;
  let fixture: ComponentFixture<SalesQuotationDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesQuotationDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesQuotationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
