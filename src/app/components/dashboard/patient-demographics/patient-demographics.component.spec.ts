import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientDemographicsComponent } from './patient-demographics.component';

describe('PatientDemographicsComponent', () => {
  let component: PatientDemographicsComponent;
  let fixture: ComponentFixture<PatientDemographicsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientDemographicsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientDemographicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
