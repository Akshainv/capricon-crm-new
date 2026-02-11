import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeServiceTsComponent } from './theme.service.ts.component';

describe('ThemeServiceTsComponent', () => {
  let component: ThemeServiceTsComponent;
  let fixture: ComponentFixture<ThemeServiceTsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeServiceTsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThemeServiceTsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
