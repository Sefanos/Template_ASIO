import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../services/theme.service';

import { DoctorsPlanningComponent } from './doctors-planning.component';

describe('DoctorsPlanningComponent', () => {
  let component: DoctorsPlanningComponent;
  let fixture: ComponentFixture<DoctorsPlanningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      declarations: [DoctorsPlanningComponent],
      providers: [ThemeService]
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
