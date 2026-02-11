import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesSettingsComponent } from './sales-settings.component';

describe('SalesSettingsComponent', () => {
  let component: SalesSettingsComponent;
  let fixture: ComponentFixture<SalesSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
