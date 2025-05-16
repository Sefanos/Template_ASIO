import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserStatusOverviewComponent } from './user-status-overview.component';

describe('UserStatusOverviewComponent', () => {
  let component: UserStatusOverviewComponent;
  let fixture: ComponentFixture<UserStatusOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserStatusOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserStatusOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
