import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DoctorProfileComponent } from './doctor-profile.component';
import { DoctorProfileService } from '../../../services/doc-services/doctor-profile.service';
import { ToastService } from '../../../shared/services/toast.service';
import { of, throwError } from 'rxjs';

describe('DoctorProfileComponent', () => {
  let component: DoctorProfileComponent;
  let fixture: ComponentFixture<DoctorProfileComponent>;
  let doctorProfileService: jasmine.SpyObj<DoctorProfileService>;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    const doctorProfileServiceSpy = jasmine.createSpyObj('DoctorProfileService', 
      ['getProfile', 'getSpecialties', 'updateProfile', 'updateProfileImage', 'testConnection']);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: DoctorProfileService, useValue: doctorProfileServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    }).compileComponents();

    doctorProfileService = TestBed.inject(DoctorProfileService) as jasmine.SpyObj<DoctorProfileService>;
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    // Setup mock responses
    doctorProfileService.getProfile.and.returnValue(of({
      id: 1,
      user_id: 1,
      specialty_id: 1,
      license_number: 'MED123456',
      years_of_experience: 5,
      consultation_fee: 150,
      user: {
        id: 1,
        name: 'Dr. John Doe',
        email: 'john.doe@example.com'
      },
      specialty: {
        id: 1,
        name: 'Cardiology'
      }
    }));

    doctorProfileService.getSpecialties.and.returnValue(of([
      { id: 1, name: 'Cardiology' },
      { id: 2, name: 'Neurology' },
      { id: 3, name: 'Pediatrics' }
    ]));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DoctorProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load profile data on initialization', () => {
    expect(doctorProfileService.getProfile).toHaveBeenCalled();
    expect(doctorProfileService.getSpecialties).toHaveBeenCalled();
    expect(component.profile).toBeTruthy();
    expect(component.specialties.length).toBe(3);
  });

  it('should toggle edit mode', () => {
    expect(component.isEditMode).toBeFalse();
    component.toggleEditMode();
    expect(component.isEditMode).toBeTrue();
    component.toggleEditMode();
    expect(component.isEditMode).toBeFalse();
  });

  it('should change active tab', () => {
    expect(component.activeTab).toBe('basic');
    component.setActiveTab('professional');
    expect(component.activeTab).toBe('professional');
    component.setActiveTab('contact');
    expect(component.activeTab).toBe('contact');
    component.setActiveTab('settings');
    expect(component.activeTab).toBe('settings');
  });

  it('should handle form validation', () => {
    // Professional form has a required field, so should be invalid when empty
    component.professionalForm.get('license_number')?.setValue('');
    expect(component.areFormsValid()).toBeFalse();
    
    // Set a valid value
    component.professionalForm.get('license_number')?.setValue('MED123456');
    expect(component.areFormsValid()).toBeTrue();
  });

  it('should show correct specialty name', () => {
    expect(component.getSpecialtyName(1)).toBe('Cardiology');
    expect(component.getSpecialtyName(2)).toBe('Neurology');
    expect(component.getSpecialtyName(undefined)).toBe('Not specified');
    expect(component.getSpecialtyName(999)).toBe('Unknown');
  });

  it('should format availability status correctly', () => {
    expect(component.getAvailabilityStatusDisplay('available')).toBe('Available');
    expect(component.getAvailabilityStatusDisplay('busy')).toBe('Busy');
    expect(component.getAvailabilityStatusDisplay('unavailable')).toBe('Unavailable');
    expect(component.getAvailabilityStatusDisplay(undefined)).toBe('Unknown');
  });

  it('should return correct CSS class for availability status', () => {
    expect(component.getAvailabilityStatusClass('available')).toBe('badge-success');
    expect(component.getAvailabilityStatusClass('busy')).toBe('badge-warning');
    expect(component.getAvailabilityStatusClass('unavailable')).toBe('badge-danger');
    expect(component.getAvailabilityStatusClass(undefined)).toBe('badge-secondary');
  });

  it('should handle profile update success', () => {
    doctorProfileService.updateProfile.and.returnValue(of({
      id: 1,
      user_id: 1,
      specialty_id: 2,
      license_number: 'MED123456',
      years_of_experience: 6
    }));

    // Make some form changes
    component.toggleEditMode();
    component.professionalForm.get('specialty_id')?.setValue(2);
    component.professionalForm.get('years_of_experience')?.setValue(6);

    component.saveProfile();

    expect(doctorProfileService.updateProfile).toHaveBeenCalled();
    expect(toastService.success).toHaveBeenCalledWith('Profile updated successfully');
  });

  it('should handle profile update error', () => {
    doctorProfileService.updateProfile.and.returnValue(throwError(() => new Error('Update failed')));

    component.toggleEditMode();
    component.professionalForm.get('license_number')?.setValue('MED123456'); // Ensure valid

    component.saveProfile();

    expect(doctorProfileService.updateProfile).toHaveBeenCalled();
    expect(toastService.error).toHaveBeenCalledWith('Failed to save profile', 'Update failed');
  });
});
