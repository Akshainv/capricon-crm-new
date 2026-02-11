import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesImportLeadsComponent } from './sales-import-leads.component';

describe('SalesImportLeadsComponent', () => {
  let component: SalesImportLeadsComponent;
  let fixture: ComponentFixture<SalesImportLeadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesImportLeadsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesImportLeadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
