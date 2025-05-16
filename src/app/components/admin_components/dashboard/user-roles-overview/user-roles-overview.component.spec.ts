import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRolesOverviewComponent } from './user-roles-overview.component';

describe('UserRolesOverviewComponent', () => {
  let component: UserRolesOverviewComponent;
  let fixture: ComponentFixture<UserRolesOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRolesOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRolesOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
