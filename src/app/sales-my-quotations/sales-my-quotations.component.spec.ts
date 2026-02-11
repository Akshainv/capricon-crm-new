import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesMyQuotationsComponent } from './sales-my-quotations.component';

describe('SalesMyQuotationsComponent', () => {
  let component: SalesMyQuotationsComponent;
  let fixture: ComponentFixture<SalesMyQuotationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesMyQuotationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesMyQuotationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
