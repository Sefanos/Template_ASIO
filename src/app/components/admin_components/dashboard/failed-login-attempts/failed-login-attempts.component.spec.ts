import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FailedLoginAttemptsComponent } from './failed-login-attempts.component';

describe('FailedLoginAttemptsComponent', () => {
  let component: FailedLoginAttemptsComponent;
  let fixture: ComponentFixture<FailedLoginAttemptsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FailedLoginAttemptsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FailedLoginAttemptsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
