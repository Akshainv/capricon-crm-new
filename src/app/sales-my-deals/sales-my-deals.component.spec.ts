import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesMyDealsComponent } from './sales-my-deals.component';

describe('SalesMyDealsComponent', () => {
  let component: SalesMyDealsComponent;
  let fixture: ComponentFixture<SalesMyDealsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesMyDealsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesMyDealsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
