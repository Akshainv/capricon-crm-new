import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminWebsiteLeadsComponent } from './admin-website-leads.component';

describe('AdminWebsiteLeadsComponent', () => {
  let component: AdminWebsiteLeadsComponent;
  let fixture: ComponentFixture<AdminWebsiteLeadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWebsiteLeadsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminWebsiteLeadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
