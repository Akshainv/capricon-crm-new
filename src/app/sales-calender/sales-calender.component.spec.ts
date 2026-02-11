import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesCalenderComponent } from './sales-calender.component';

describe('SalesCalenderComponent', () => {
  let component: SalesCalenderComponent;
  let fixture: ComponentFixture<SalesCalenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesCalenderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesCalenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
