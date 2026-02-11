import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesMyPerfomanceComponent } from './sales-my-perfomance.component';

describe('SalesMyPerfomanceComponent', () => {
  let component: SalesMyPerfomanceComponent;
  let fixture: ComponentFixture<SalesMyPerfomanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesMyPerfomanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesMyPerfomanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
