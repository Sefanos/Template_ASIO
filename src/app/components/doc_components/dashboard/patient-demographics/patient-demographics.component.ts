import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DoctorDashboardService, GenderDemographics } from '../../../../services/doc-services/doctor-dashboard.service';

@Component({
  selector: 'app-patient-demographics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-demographics.component.html',
  styleUrls: ['./patient-demographics.component.css']
})
export class PatientDemographicsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  
  isLoading = true;
  error: string | null = null;
  genderData: GenderDemographics | null = null;
  
  constructor(private dashboardService: DoctorDashboardService) {}

  ngOnInit(): void {
    this.loadGenderDemographics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadGenderDemographics(): void {
    this.isLoading = true;
    this.error = null;
    
    this.dashboardService.getGenderDemographics()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error loading gender demographics:', error);
          this.error = 'Failed to load patient demographics';
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe({
        next: (data) => {
          console.log('Gender data received:', data);
          this.genderData = data;
          this.isLoading = false;
        }
      });
  }

  getConicGradient(): string {
    if (!this.genderData || this.genderData.total_patients === 0) {
      return 'conic-gradient(#e5e7eb 0deg 360deg)';
    }

    const segments: string[] = [];
    let currentDegree = 0;

    // Male (Blue)
    if (this.genderData.male > 0) {
      const percentage = (this.genderData.percentages?.male || 0);
      const degrees = (percentage / 100) * 360;
      segments.push(`#3B82F6 ${currentDegree}deg ${currentDegree + degrees}deg`);
      currentDegree += degrees;
    }

    // Female (Pink)
    if (this.genderData.female > 0) {
      const percentage = (this.genderData.percentages?.female || 0);
      const degrees = (percentage / 100) * 360;
      segments.push(`#EC4899 ${currentDegree}deg ${currentDegree + degrees}deg`);
      currentDegree += degrees;
    }

    // Other (Green)
    if (this.genderData.other > 0) {
      const percentage = (this.genderData.percentages?.other || 0);
      const degrees = (percentage / 100) * 360;
      segments.push(`#10B981 ${currentDegree}deg ${currentDegree + degrees}deg`);
      currentDegree += degrees;
    }

    // Not Specified (Gray)
    if (this.genderData.not_specified > 0) {
      const percentage = (this.genderData.percentages?.not_specified || 0);
      const degrees = (percentage / 100) * 360;
      segments.push(`#6B7280 ${currentDegree}deg ${currentDegree + degrees}deg`);
      currentDegree += degrees;
    }

    return `conic-gradient(${segments.join(', ')})`;
  }

  refreshData(): void {
    this.loadGenderDemographics();
  }
}