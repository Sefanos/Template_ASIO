import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorsPlanningComponent } from './doctors-planning.component';

describe('DoctorsPlanningComponent', () => {
  let component: DoctorsPlanningComponent;
  let fixture: ComponentFixture<DoctorsPlanningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DoctorsPlanningComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorsPlanningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
