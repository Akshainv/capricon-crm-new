import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeServiceComponent } from './theme-service.component';

describe('ThemeServiceComponent', () => {
  let component: ThemeServiceComponent;
  let fixture: ComponentFixture<ThemeServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeServiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThemeServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
