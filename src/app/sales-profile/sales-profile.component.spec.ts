import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesProfileComponent } from './sales-profile.component';

describe('SalesProfileComponent', () => {
  let component: SalesProfileComponent;
  let fixture: ComponentFixture<SalesProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
