import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesMyTasksComponent } from './sales-my-tasks.component';

describe('SalesMyTasksComponent', () => {
  let component: SalesMyTasksComponent;
  let fixture: ComponentFixture<SalesMyTasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesMyTasksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesMyTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
