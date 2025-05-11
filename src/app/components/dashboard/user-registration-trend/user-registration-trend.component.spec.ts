import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRegistrationTrendComponent } from './user-registration-trend.component';

describe('UserRegistrationTrendComponent', () => {
  let component: UserRegistrationTrendComponent;
  let fixture: ComponentFixture<UserRegistrationTrendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRegistrationTrendComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRegistrationTrendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
