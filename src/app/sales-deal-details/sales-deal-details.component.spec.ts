import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesDealDetailsComponent } from './sales-deal-details.component';

describe('SalesDealDetailsComponent', () => {
  let component: SalesDealDetailsComponent;
  let fixture: ComponentFixture<SalesDealDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesDealDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesDealDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
