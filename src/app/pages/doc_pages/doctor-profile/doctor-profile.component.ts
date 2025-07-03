import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { DoctorProfileService, DoctorProfile, Specialty, UpdateDoctorProfileRequest } from '../../../services/doc-services/doctor-profile.service';
import { ToastService } from '../../../shared/services/toast.service';
import { environment } from '../../../../environments/environment';

interface WorkingDay {
  enabled: boolean;
  start: string;
  end: string;
}

interface WorkingHours {
  [key: string]: WorkingDay;
}

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './doctor-profile.component.html',
  styleUrls: ['./doctor-profile.component.css']
})
export class DoctorProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State
  profile: DoctorProfile | null = null;
  specialties: Specialty[] = [];
  isLoading = false;
  isEditMode = false;
  isSaving = false;
  isUploadingImage = false;
  
  // Active tab
  activeTab: 'basic' | 'professional' | 'contact' | 'settings' = 'basic';

  // Forms - initialize with empty form groups to satisfy TypeScript
  basicInfoForm!: FormGroup;
  professionalForm!: FormGroup;
  contactForm!: FormGroup;
  settingsForm!: FormGroup;
  
  // Profile image
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  // Working hours
  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  workingHours: WorkingHours = {
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '13:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' }
  };

  constructor(
    private fb: FormBuilder,
    private doctorProfileService: DoctorProfileService,
    private toastService: ToastService
  ) {
    // Initialize forms immediately to avoid "Property has no initializer" errors
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadProfileData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.basicInfoForm = this.fb.group({
      bio: [''],
      education: [''],
      languages_spoken: [''],
      certifications: ['']
    });

    this.professionalForm = this.fb.group({
      specialty: [''], // Store specialty name directly
      license_number: ['', [Validators.required]],
      years_of_experience: [0, [Validators.min(0)]],
      consultation_fee: [0, [Validators.min(0)]]
    });

    this.contactForm = this.fb.group({
      phone: [''],
      emergency_contact: [''],
      office_address: [''],
      working_hours: ['']
    });

    this.settingsForm = this.fb.group({
      availability_status: ['available', [Validators.required]]
    });
  }

  private loadProfileData(): void {
    this.isLoading = true;
    
    combineLatest([
      this.doctorProfileService.getProfile(),
      this.doctorProfileService.getSpecialties()
    ])
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: ([profile, specialties]) => {
        this.profile = profile;
        this.specialties = specialties;
        this.populateForms();
      },
      error: (error) => {
        console.error('Error loading profile data:', error);
        this.toastService.error('Failed to load profile data', error.message);
      }
    });
  }

  // Public method for retry button
  public retryLoadProfile(): void {
    this.loadProfileData();
  }

  private populateForms(): void {
    if (!this.profile) return;

    this.basicInfoForm.patchValue({
      bio: this.profile.bio || '',
      education: this.profile.education || '',
      languages_spoken: this.profile.languages_spoken || '',
      certifications: this.profile.certifications || ''
    });

    this.professionalForm.patchValue({
      specialty: this.profile.specialty || '',
      license_number: this.profile.license_number || '',
      years_of_experience: this.profile.years_of_experience || this.profile.experience_years || 0,
      consultation_fee: this.profile.consultation_fee ? parseFloat(this.profile.consultation_fee) : 0
    });

    this.contactForm.patchValue({
      phone: this.profile.phone || '',
      emergency_contact: this.profile.emergency_contact || '',
      office_address: this.profile.office_address || '',
      working_hours: this.profile.working_hours || ''
    });

    // Handle availability status - convert is_available boolean to legacy format
    let availabilityStatus = 'available';
    if (this.profile.is_available !== undefined) {
      availabilityStatus = this.profile.is_available ? 'available' : 'unavailable';
    } else if (this.profile.availability_status) {
      availabilityStatus = this.profile.availability_status;
    }

    this.settingsForm.patchValue({
      availability_status: availabilityStatus
    });

    // Parse working hours for the UI
    if (this.profile.working_hours) {
      this.parseWorkingHoursFromStorage(this.profile.working_hours);
    }
  }

  setActiveTab(tab: 'basic' | 'professional' | 'contact' | 'settings'): void {
    this.activeTab = tab;
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      // Reset forms to original values when cancelling edit
      this.populateForms();
      this.selectedImageFile = null;
      this.imagePreview = null;
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImageFile = input.files[0];
      console.log('Image selected:', {
        name: this.selectedImageFile.name,
        size: this.selectedImageFile.size,
        type: this.selectedImageFile.type
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

  async saveProfile(): Promise<void> {
    if (!this.areFormsValid()) {
      this.toastService.error('Please fix form errors before saving');
      return;
    }

    this.isSaving = true;

    try {
      // Update working hours format before saving
      this.updateWorkingHoursForm();

      // First, update profile image if selected
      if (this.selectedImageFile) {
        await this.uploadProfileImage();
      }

      // Then update profile data
      const updateData = this.buildUpdateRequest();
      
      this.doctorProfileService.updateProfile(updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedProfile) => {
            this.profile = updatedProfile;
            this.populateForms();
            this.isEditMode = false;
            this.selectedImageFile = null;
            this.imagePreview = null;
            this.toastService.success('Profile updated successfully');
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error saving profile:', error);
            this.toastService.error('Failed to save profile', error.message);
            this.isSaving = false;
          }
        });
    } catch (error: any) {
      console.error('Error in saveProfile:', error);
      this.toastService.error('Failed to save profile', error.message);
      this.isSaving = false;
    }
  }

  private async uploadProfileImage(): Promise<void> {
    if (!this.selectedImageFile) return;

    this.isUploadingImage = true;
    
    return new Promise((resolve, reject) => {
      this.doctorProfileService.updateProfileImage(this.selectedImageFile!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedProfile) => {
            this.profile = updatedProfile;
            this.imagePreview = null; // Clear preview to show the actual uploaded image
            this.selectedImageFile = null; // Clear selected file
            this.isUploadingImage = false;
            resolve();
          },
          error: (error) => {
            console.error('Image upload failed:', error);
            this.isUploadingImage = false;
            reject(error);
          }
        });
    });
  }

  private buildUpdateRequest(): UpdateDoctorProfileRequest {
    return {
      ...this.basicInfoForm.value,
      ...this.professionalForm.value,
      ...this.contactForm.value,
      ...this.settingsForm.value
    };
  }

  areFormsValid(): boolean {
    return this.basicInfoForm.valid && 
           this.professionalForm.valid && 
           this.contactForm.valid && 
           this.settingsForm.valid;
  }

  getFormErrors(): string[] {
    const errors: string[] = [];
    
    if (this.professionalForm.get('license_number')?.errors?.['required']) {
      errors.push('License number is required');
    }
    
    if (this.professionalForm.get('years_of_experience')?.errors?.['min']) {
      errors.push('Years of experience cannot be negative');
    }
    
    if (this.professionalForm.get('consultation_fee')?.errors?.['min']) {
      errors.push('Consultation fee cannot be negative');
    }

    return errors;
  }

  getProfileImageUrl(): string {
    if (this.imagePreview) {
      return this.imagePreview;
    }
    if (this.profile?.profile_image) {
      // Get the base URL without /api
      const baseUrl = environment.apiUrl.replace('/api', '');
      
      // If the image URL is relative (starts with /), convert it to absolute
      if (this.profile.profile_image.startsWith('/')) {
        const fullUrl = `${baseUrl}${this.profile.profile_image}`;
        console.log('Profile image URL constructed:', fullUrl);
        return fullUrl;
      }
      
      // If it's already a full URL, use it as is
      if (this.profile.profile_image.startsWith('http')) {
        return this.profile.profile_image;
      }
      
      // If it's a relative path without leading slash
      const fullUrl = `${baseUrl}/${this.profile.profile_image}`;
      console.log('Profile image URL constructed (relative):', fullUrl);
      return fullUrl;
    }
    console.log('No profile image, using default');
    return '/assets/images/doctors/default-doctor.png'; // Default doctor image
  }

  getSpecialtyName(specialtyId?: number | undefined | null): string {
    // Use the specialty string directly from profile (new API structure)
    if (this.profile?.specialty && typeof this.profile.specialty === 'string') {
      return this.profile.specialty;
    }
    
    // If profile has a specialty object with name, use that
    if (this.profile?.specialty_obj?.name) {
      return this.profile.specialty_obj.name;
    }
    
    // Legacy: try to find by ID in specialties array
    if (specialtyId && this.specialties.length > 0) {
      const specialty = this.specialties.find(s => s.id === Number(specialtyId));
      if (specialty) {
        return specialty.name;
      }
    }
    
    return 'Not specified';
  }

  getAvailabilityStatusDisplay(status?: string | undefined): string {
    // Handle new API structure with is_available boolean
    if (this.profile?.is_available !== undefined) {
      return this.profile.is_available ? 'Available' : 'Unavailable';
    }
    
    // Handle legacy availability_status
    switch (status) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'Busy';
      case 'unavailable':
        return 'Unavailable';
      default:
        return 'Not Set';
    }
  }

  getAvailabilityStatusDescription(status?: string | undefined): string {
    // Handle new API structure with is_available boolean
    if (this.profile?.is_available !== undefined) {
      return this.profile.is_available 
        ? 'Accepting new patients and appointments'
        : 'Not currently accepting new patients';
    }
    
    // Handle legacy availability_status
    switch (status) {
      case 'available':
        return 'Accepting new patients and appointments';
      case 'busy':
        return 'Limited availability for new appointments';
      case 'unavailable':
        return 'Not currently accepting new patients';
      default:
        return 'Please set your availability status';
    }
  }

  toggleWorkingDay(day: string, event: any): void {
    this.workingHours[day].enabled = event.target.checked;
    this.updateWorkingHoursForm();
  }

  private updateWorkingHoursForm(): void {
    const hoursText = this.formatWorkingHoursForStorage();
    this.contactForm.patchValue({ working_hours: hoursText });
  }

  private formatWorkingHoursForStorage(): string {
    const lines: string[] = [];
    this.weekDays.forEach(day => {
      const dayKey = day.toLowerCase();
      const dayData = this.workingHours[dayKey];
      if (dayData.enabled) {
        lines.push(`${day}: ${dayData.start} - ${dayData.end}`);
      } else {
        lines.push(`${day}: Closed`);
      }
    });
    return lines.join('\n');
  }

  getWorkingHoursDisplay(): { day: string; hours: string }[] | null {
    const workingHoursText = this.contactForm.get('working_hours')?.value;
    if (!workingHoursText) return null;

    const lines = workingHoursText.split('\n').filter((line: string) => line.trim());
    return lines.map((line: string) => {
      const [day, hours] = line.split(':').map(part => part.trim());
      return { day, hours: hours || 'Closed' };
    });
  }

  private parseWorkingHoursFromStorage(hoursData: any): void {
    if (!hoursData) return;

    try {
      // Handle new API structure: object with day keys and time arrays
      if (typeof hoursData === 'object' && !Array.isArray(hoursData)) {
        Object.keys(hoursData).forEach(day => {
          const dayKey = day.toLowerCase();
          const timeData = hoursData[day];
          
          if (this.workingHours[dayKey]) {
            if (timeData === null || !timeData) {
              this.workingHours[dayKey].enabled = false;
            } else if (Array.isArray(timeData) && timeData.length === 2) {
              this.workingHours[dayKey].enabled = true;
              this.workingHours[dayKey].start = timeData[0];
              this.workingHours[dayKey].end = timeData[1];
            }
          }
        });
        return;
      }

      // Handle legacy string format
      if (typeof hoursData === 'string') {
        const lines = hoursData.split('\n').filter(line => line.trim());
        lines.forEach(line => {
          const [day, hours] = line.split(':').map(part => part.trim());
          const dayKey = day.toLowerCase();
          
          if (this.workingHours[dayKey]) {
            if (hours === 'Closed' || !hours) {
              this.workingHours[dayKey].enabled = false;
            } else {
              const timeParts = hours.split('-').map(part => part.trim());
              if (timeParts.length === 2) {
                this.workingHours[dayKey].enabled = true;
                this.workingHours[dayKey].start = this.convertTo24Hour(timeParts[0]);
                this.workingHours[dayKey].end = this.convertTo24Hour(timeParts[1]);
              }
            }
          }
        });
        return;
      }

      console.warn('Working hours format not recognized:', typeof hoursData, hoursData);
    } catch (error) {
      console.error('Error parsing working hours:', error);
    }
  }

  private convertTo24Hour(time: string): string {
    // Convert 12-hour format to 24-hour format if needed
    if (time.includes('AM') || time.includes('PM')) {
      const [timePart, period] = time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return time;
  }

  getAvailabilityBadgeClass(status?: string | undefined): string {
    // Handle new API structure with is_available boolean
    if (this.profile?.is_available !== undefined) {
      return this.profile.is_available 
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800';
    }
    
    // Handle legacy availability_status
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getAvailabilityDotClass(status?: string | undefined): string {
    // Handle new API structure with is_available boolean
    if (this.profile?.is_available !== undefined) {
      return this.profile.is_available ? 'bg-green-400' : 'bg-red-400';
    }
    
    // Handle legacy availability_status
    switch (status) {
      case 'available':
        return 'bg-green-400';
      case 'busy':
        return 'bg-yellow-400';
      case 'unavailable':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  }

  getDoctorName(): string {
    // Use the name directly from profile (new API structure)
    if (this.profile?.name) {
      return this.profile.name;
    }
    // Fallback to user object (legacy structure)
    if (this.profile?.user?.name) {
      return this.profile.user.name;
    }
    if (this.profile?.email) {
      // Extract name from email if no other name is available
      const emailName = this.profile.email.split('@')[0];
      return emailName.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return 'Doctor';
  }

  getDoctorEmail(): string {
    return this.profile?.email || this.profile?.user?.email || 'No email provided';
  }
}
