import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRecordComponent } from './patient-record.component';

describe('PatientRecordComponent', () => {
  let component: PatientRecordComponent;
  let fixture: ComponentFixture<PatientRecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientRecordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientRecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
