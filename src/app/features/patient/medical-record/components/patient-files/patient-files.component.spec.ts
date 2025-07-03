import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatientFilesComponent } from './patient-files.component';

 

describe('PatientFilesComponent', () => {
  let component: PatientFilesComponent;
  let fixture: ComponentFixture<PatientFilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatientFilesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
