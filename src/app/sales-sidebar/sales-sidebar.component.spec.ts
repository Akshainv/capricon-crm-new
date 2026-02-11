import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesSidebarComponent } from './sales-sidebar.component';

describe('SalesSidebarComponent', () => {
  let component: SalesSidebarComponent;
  let fixture: ComponentFixture<SalesSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
