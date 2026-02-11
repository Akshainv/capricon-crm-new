import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesMyProjectsComponent } from './sales-my-projects.component';

describe('SalesMyProjectsComponent', () => {
  let component: SalesMyProjectsComponent;
  let fixture: ComponentFixture<SalesMyProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesMyProjectsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesMyProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
