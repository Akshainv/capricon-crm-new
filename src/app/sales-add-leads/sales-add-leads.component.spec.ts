import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesAddLeadComponent } from './sales-add-leads.component';

describe('SalesAddLeadComponent', () => {
  let component: SalesAddLeadComponent;
  let fixture: ComponentFixture<SalesAddLeadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesAddLeadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesAddLeadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
