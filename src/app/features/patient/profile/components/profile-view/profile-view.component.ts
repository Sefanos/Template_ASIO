import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService } from '../../../../../core/patient/services/patient.service';
import { SafeUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { ImageUtilsService } from '../../../../../shared/patient/helpers/image-utils.service';

@Component({
  selector: 'app-profile-view',
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css'],
  standalone: false
})
export class ProfileViewComponent implements OnInit {
  isLoading = false;
  profileData: any = {};

  constructor(
    private patientService: PatientService,
    private router: Router,
    private imageUtils: ImageUtilsService
  ) { }

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
            this.profileData = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading profile data:', error);
        }
      });
  }

  // Use the shared service method
  sanitizeImageUrl(url: string): SafeUrl {
    return this.imageUtils.sanitizeImageUrl(url);
  }

  navigateToEdit(): void {
    // Use relative navigation to avoid potential path issues
    this.router.navigate(['../edit'], { relativeTo: this.router.routerState.root.firstChild });
  }
}
