import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PatientService, BackendResponse } from '../../../../../core/patient/services/patient.service';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { SafeUrl } from '@angular/platform-browser';
import { ImageUtilsService } from '../../../../../shared/patient/helpers/image-utils.service';
import { PersonalInfo } from '../../../../../core/patient/domain/models/personal-info.model';

@Component({
  selector: 'app-profile-edit',
  standalone: false, // Assuming this is part of a module
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.css'
})
export class ProfileEditComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  isSubmitting = false;
  isUploadingImage = false; // Separate flag for image upload
  imagePreview: string | ArrayBuffer | SafeUrl | null = null;
  selectedFile: File | null = null;
  profileUpdateSuccess = false;
  profileUpdateError = false;
  imageUpdateSuccess = false;
  imageUpdateError = false;
  errorMessage = ''; // General error message for form submission
  imageErrorMessage = ''; // Specific error message for image upload

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private router: Router,
    private route: ActivatedRoute,
    private imageUtils: ImageUtilsService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      surname: ['', Validators.required],
      birthdate: ['', Validators.required], // Expects "YYYY-MM-DD"
      gender: [''],
      address: [''],
      emergencyContact: [''],
      maritalStatus: [''],
      bloodType: [''],
      nationality: [''],
      phone: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.patientService.getProfile()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: BackendResponse<PersonalInfo>) => {
          if (response.success && response.data) {
            const data = response.data;
            this.form.patchValue({
              email: data.email || '',
              name: data.name || '',
              surname: data.surname || '',
              birthdate: data.birthdate || '', // Assumes YYYY-MM-DD string
              gender: data.gender || '',
              address: data.address || '',
              emergencyContact: data.emergency_contact || '',
              maritalStatus: data.marital_status || '',
              bloodType: data.blood_type || '',
              nationality: data.nationality || '',
              phone: data.phone || '',
            });

            if (data.profile_image) {
              this.imagePreview = this.imageUtils.sanitizeImageUrl(data.profile_image);
            }
          } else {
            this.errorMessage = response.message || 'Failed to load profile data.';
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading profile data', error);
          this.errorMessage = error.error?.message || 'An unexpected error occurred while loading profile data.';
        }
      });
  }

  onFileChange(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      this.selectedFile = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result; // Show local preview before upload
      };
      reader.readAsDataURL(this.selectedFile);
      this.imageUpdateSuccess = false; // Reset messages if new file is chosen
      this.imageUpdateError = false;
      this.imageErrorMessage = '';
    } else {
      this.selectedFile = null;
      // Optionally revert to server image if user deselects
      // this.loadProfileData(); // Or just clear preview if that's preferred
    }
  }

  uploadImage(): void {
    if (!this.selectedFile) {
      this.imageErrorMessage = "Please choose a file to upload.";
      return;
    }
    this.isUploadingImage = true;
    this.imageUpdateSuccess = false;
    this.imageUpdateError = false;
    this.imageErrorMessage = '';

    const formData = new FormData();
    formData.append('profile_image', this.selectedFile);

    this.patientService.updateProfileImage(formData)
      .pipe(finalize(() => this.isUploadingImage = false))
      .subscribe({
        next: (response: BackendResponse<PersonalInfo>) => {
          if (response.success && response.data) {
            this.imageUpdateSuccess = true;
            if (response.data.profile_image) {
              // Update preview with the URL from server (might be CDN, processed, etc.)
              this.imagePreview = this.imageUtils.sanitizeImageUrl(response.data.profile_image);
            }
            this.selectedFile = null; // Clear selected file after successful upload
            setTimeout(() => this.imageUpdateSuccess = false, 3000);
          } else {
            this.imageUpdateError = true;
            this.imageErrorMessage = response.message || 'Failed to update profile image.';
          }
        },
        error: (error: HttpErrorResponse) => {
          this.imageUpdateError = true;
          this.imageErrorMessage = error.error?.message || 'An unexpected error occurred while uploading image.';
          if (error.error?.errors?.profile_image) {
            this.imageErrorMessage = error.error.errors.profile_image[0];
          }
          setTimeout(() => this.imageUpdateError = false, 3000);
        }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        control.markAsTouched();
      });
      this.errorMessage = "Please correct the errors in the form.";
      return;
    }

    this.isSubmitting = true;
    this.profileUpdateSuccess = false;
    this.profileUpdateError = false;
    this.errorMessage = '';

    const formValue = this.form.value;

    // Map to backend expected keys (snake_case if necessary)
    // Your UpdatePersonalInfoRequest likely expects snake_case
    const payload = {
      name: formValue.name,
      surname: formValue.surname,
      email: formValue.email,
      birthdate: formValue.birthdate, // Ensure this is YYYY-MM-DD
      gender: formValue.gender,
      address: formValue.address,
      // Map camelCase form names to snake_case backend names
      emergency_contact: formValue.emergencyContact,
      marital_status: formValue.maritalStatus,
      blood_type: formValue.bloodType,
      nationality: formValue.nationality,
      phone: formValue.phone,
    };

    this.patientService.updateProfile(payload)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (response: BackendResponse<PersonalInfo>) => {
          if (response.success) {
            this.profileUpdateSuccess = true;
            // Optionally update form with data from response if backend modifies it
            // if (response.data) { this.form.patchValue(this.mapToForm(response.data)); }
            setTimeout(() => {
              this.profileUpdateSuccess = false;
              this.navigateToView();
            }, 1500);
          } else {
            this.profileUpdateError = true;
            this.errorMessage = response.message || 'Failed to update profile.';
            if (response.errors) {
              const firstErrorKey = Object.keys(response.errors)[0];
              if (response.errors[firstErrorKey] && response.errors[firstErrorKey].length > 0) {
                this.errorMessage = response.errors[firstErrorKey][0];
              }
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          this.profileUpdateError = true;
          this.errorMessage = error.error?.message || 'An unexpected error occurred.';
          if (error.error?.errors) {
            const firstErrorKey = Object.keys(error.error.errors)[0];
            if (error.error.errors[firstErrorKey] && error.error.errors[firstErrorKey].length > 0) {
              this.errorMessage = error.error.errors[firstErrorKey][0];
            }
          }
          setTimeout(() => this.profileUpdateError = false, 3000);
        }
      });
  }

  navigateToView(): void {
    this.router.navigate(['../view'], { relativeTo: this.route });
  }
}