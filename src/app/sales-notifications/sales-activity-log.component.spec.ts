import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesActivityLogComponent } from './sales-activity-log.component';

describe('SalesActivityLogComponent', () => {
  let component: SalesActivityLogComponent;
  let fixture: ComponentFixture<SalesActivityLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesActivityLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesActivityLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
