import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PatientService, BackendResponse } from '../../../../../core/patient/services/patient.service';
import { SafeUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { ImageUtilsService } from '../../../../../shared/patient/helpers/image-utils.service';
import { PersonalInfo } from '../../../../../core/patient/domain/models/personal-info.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile-view',
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css'],
  standalone: false // Assuming this is part of a module
})
export class ProfileViewComponent implements OnInit {
  isLoading = false;
  profileData: PersonalInfo | null = null;
  errorMessage: string | null = null;

  constructor(
    private patientService: PatientService,
    private router: Router,
    private route: ActivatedRoute,
    private imageUtils: ImageUtilsService // Corrected: imageUtilsService to imageUtils
  ) { }

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.patientService.getProfile()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: BackendResponse<any>) => { // Use 'any' for raw response data before mapping
          if (response.success && response.data) {
            // Map snake_case from API to camelCase for PersonalInfo model
            const apiData = response.data;
            this.profileData = {
              id: apiData.id,
              userId: apiData.user_id, // Assuming user_id might come from API
              patientId: apiData.patient_id,
              name: apiData.name,
               surname: apiData.surname,
              email: apiData.email,
              birthdate: apiData.birthdate,
              gender: apiData.gender,
              address: apiData.address,
              emergency_contact: apiData.emergency_contact, // Map emergency_contact to emergencyContact
              marital_status: apiData.marital_status,       // Map marital_status to maritalStatus
              blood_type: apiData.blood_type,             // Map blood_type to bloodType
              nationality: apiData.nationality,
              profile_image: apiData.profile_image,        // This one is already snake_case in your model
              createdAt: apiData.created_at,
              updatedAt: apiData.updated_at
              // Add any other fields from your PersonalInfo model that need mapping
            };
          } else {
            this.profileData = null;
            this.errorMessage = response.message || 'Could not load profile information.';
          }
        },
        error: (error: HttpErrorResponse) => {
          this.profileData = null;
          console.error('Error loading profile data:', error);
          this.errorMessage = error.error?.message || 'An unexpected error occurred while fetching profile data.';
        }
      });
  } 

  getSanitizedImageUrl(url: string | null): SafeUrl | null {
    if (url === null) {
      return null;
    }
    return this.imageUtils.sanitizeImageUrl(url);
  }

  navigateToEdit(): void {
    this.router.navigate(['../edit'], { relativeTo: this.route });
  }
}