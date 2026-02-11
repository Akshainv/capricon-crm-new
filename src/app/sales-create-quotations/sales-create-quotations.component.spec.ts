// src/app/sales-create-quotations/sales-create-quotations.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesCreateQuotationComponent } from './sales-create-quotations.component';

describe('SalesCreateQuotationComponent', () => {
  let component: SalesCreateQuotationComponent;
  let fixture: ComponentFixture<SalesCreateQuotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesCreateQuotationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesCreateQuotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});