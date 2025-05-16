import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientInfoHeaderComponent } from './patient-info-header.component';

describe('PatientInfoHeaderComponent', () => {
  let component: PatientInfoHeaderComponent;
  let fixture: ComponentFixture<PatientInfoHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientInfoHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientInfoHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
