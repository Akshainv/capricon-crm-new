import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterHereComponent } from './register-here.component';

describe('RegisterHereComponent', () => {
  let component: RegisterHereComponent;
  let fixture: ComponentFixture<RegisterHereComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterHereComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterHereComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
