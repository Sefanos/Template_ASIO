import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DoctorDashboardService, AgeDemographics } from '../../../../services/doc-services/doctor-dashboard.service';

@Component({
  selector: 'app-age-distribution',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './age-distribution.component.html',
  styleUrls: ['./age-distribution.component.css']
})
export class AgeDistributionComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  
  isLoading = true;
  error: string | null = null;
  ageData: AgeDemographics | null = null;
  currentDate: string = new Date().toLocaleDateString();
  
  // Expose Math to template
  Math = Math;
  
  constructor(private dashboardService: DoctorDashboardService) {}

  ngOnInit(): void {
    this.loadAgeDemographics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAgeDemographics(): void {
    this.isLoading = true;
    this.error = null;
    this.currentDate = new Date().toLocaleDateString(); // Update timestamp when refreshing
    
    this.dashboardService.getAgeDemographics()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error loading age demographics:', error);
          this.error = 'Failed to load age distribution data';
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe({
        next: (data) => {
          console.log('Age data received:', data);
          this.ageData = data;
          this.isLoading = false;
        }
      });
  }

  getAgeGroups(): Array<{label: string, value: number, percentage: number, color: string}> {
    if (!this.ageData || !this.ageData.age_groups) {
      return [];
    }

    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#6B7280'  // Gray
    ];

    const total = this.ageData.total_patients || 0;
    const groups = Object.entries(this.ageData.age_groups).map(([label, value], index) => ({
      label,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      color: colors[index % colors.length]
    }));

    return groups;
  }

  getMaxValue(): number {
    const groups = this.getAgeGroups();
    return groups.length > 0 ? Math.max(...groups.map(g => g.value)) : 0;
  }

  // TrackBy function for ngFor performance
  trackByLabel(index: number, item: {label: string, value: number, percentage: number, color: string}): string {
    return item.label;
  }

  // Helper methods for template calculations
  getYAxisLabel(multiplier: number): number {
    return Math.round(this.getMaxValue() * multiplier);
  }

  refreshData(): void {
    this.loadAgeDemographics();
  }
}