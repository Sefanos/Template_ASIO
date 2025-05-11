import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolePageComponent } from './role-page.component';

describe('RolePageComponent', () => {
  let component: RolePageComponent;
  let fixture: ComponentFixture<RolePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RolePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
