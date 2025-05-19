import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientService } from '../../../../../core/patient/services/patient.service';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { SafeUrl } from '@angular/platform-browser';
import { ImageUtilsService } from '../../../../../shared/patient/helpers/image-utils.service';

@Component({
  selector: 'app-profile-edit',
  standalone: false,
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.css'
})
export class ProfileEditComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  isSubmitting = false;
  imagePreview: string | ArrayBuffer | SafeUrl | null = null;
  selectedFile: File | null = null;
  profileUpdateSuccess = false;
  profileUpdateError = false;
  imageUpdateSuccess = false;
  imageUpdateError = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private router: Router,
    private imageUtils: ImageUtilsService
  ) {
    this.form = this.fb.group({
      photo: [null],
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      surname: ['', Validators.required],
      birthdate: ['', Validators.required],
      gender: [''],
      address: [''],
      emergencyContact: [''],
      maritalStatus: [''],
      bloodType: [''],
      nationality: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    this.isLoading = true;
    this.patientService.getProfile()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response && response.status === 'success' && response.data) {
            const data = response.data;
            this.form.patchValue({
              email: data.email || '',
              name: data.name || '',
              surname: data.surname || '',
              birthdate: data.birthdate ? new Date(data.birthdate) : '',
              gender: data.gender || '',
              address: data.address || '',
              emergencyContact: data.emergencyContact || '',
              maritalStatus: data.maritalStatus || '',
              bloodType: data.bloodType || '',
              nationality: data.nationality || ''
            });

            if (data.profile_image) {
              // Use the shared image utils service
              this.imagePreview = this.imageUtils.sanitizeImageUrl(data.profile_image);
            }
          }
        },
        error: (error) => {
          console.error('Error loading profile data', error);
          this.errorMessage = 'Failed to load profile data. Please try again later.';
        }
      });
  }

  onFileChange(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    
    if (fileInput.files && fileInput.files[0]) {
      this.selectedFile = fileInput.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  uploadImage(): void {
    if (!this.selectedFile) {
      return;
    }

    this.isSubmitting = true;
    this.imageUpdateSuccess = false;
    this.imageUpdateError = false;

    const formData = new FormData();
    formData.append('profile_image', this.selectedFile);

    this.patientService.updateProfileImage(formData)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (response) => {
          if (response && response.status === 'success') {
            this.imageUpdateSuccess = true;
            if (response.data && response.data.profile_image) {
              // Use the shared image utils service
              this.imagePreview = this.imageUtils.sanitizeImageUrl(response.data.profile_image);
            }
            setTimeout(() => {
              this.imageUpdateSuccess = false;
            }, 3000);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.imageUpdateError = true;
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Failed to update profile image. Please try again.';
          }
          setTimeout(() => {
            this.imageUpdateError = false;
          }, 3000);
        }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(field => {
        const control = this.form.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      return;
    }

    this.isSubmitting = true;
    this.profileUpdateSuccess = false;
    this.profileUpdateError = false;

    const formData = this.form.value;
    
    // Format birthdate as ISO string if it's a Date object
    if (formData.birthdate instanceof Date) {
      formData.birthdate = formData.birthdate.toISOString().split('T')[0];
    }

    this.patientService.updateProfile(formData)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (response) => {
          if (response && response.status === 'success') {
            this.profileUpdateSuccess = true;
            setTimeout(() => {
              this.profileUpdateSuccess = false;
              // Navigate back to view after successful update
              this.navigateToView();
            }, 1500);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.profileUpdateError = true;
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Failed to update profile. Please try again.';
          }
          setTimeout(() => {
            this.profileUpdateError = false;
          }, 3000);
        }
      });
  }

  navigateToView(): void {
    // Use relative navigation to avoid potential path issues
    this.router.navigate(['../view'], { relativeTo: this.router.routerState.root.firstChild });
  }
}
