import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DoctorDashboardService } from '../../../../services/doc-services/doctor-dashboard.service';

@Component({
  selector: 'app-new-patients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './new-patients.component.html',
  styleUrls: ['./new-patients.component.css']
})
export class NewPatientsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // View mode
  currentView: 'personal' | 'platform' = 'personal';
  
  // Loading state
  isLoading = false;
  error: string | null = null;
  
  // Patient data
  newPatientsCount = 0;
  currentPatientCount = 0;
  growthPercentage = 0;
  
  // Chart data
  chartData: { month: string; count: number; isCurrent?: boolean }[] = [];
  
  constructor(private dashboardService: DoctorDashboardService) {}
  
  ngOnInit(): void {
    this.loadPatientData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  setViewMode(mode: 'personal' | 'platform'): void {
    if (this.currentView !== mode) {
      this.currentView = mode;
      this.loadPatientData();
    }
  }
  
  private loadPatientData(): void {
    this.isLoading = true;
    this.error = null;
    
    this.dashboardService.getMyPatients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (patients) => {
          this.processPatientData(patients);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading patient data:', error);
          this.error = error.message || 'Failed to load patient data';
          this.isLoading = false;
        }
      });
  }
    private processPatientData(patientsResponse: any): void {
    // Handle different response formats
    let patients: any[] = [];
    
    if (Array.isArray(patientsResponse)) {
      patients = patientsResponse;
    } else if (patientsResponse && Array.isArray(patientsResponse.data)) {
      patients = patientsResponse.data;
    } else if (patientsResponse && typeof patientsResponse === 'object') {
      // If it's an object, try to find an array property
      const possibleArrays = Object.values(patientsResponse).filter(value => Array.isArray(value));
      if (possibleArrays.length > 0) {
        patients = possibleArrays[0] as any[];
      }
    }
    
    console.log('Processed patients data:', patients);
    
    if (!Array.isArray(patients)) {
      console.warn('Patients data is not an array:', patientsResponse);
      this.newPatientsCount = 0;
      this.currentPatientCount = 0;
      this.growthPercentage = 0;
      this.chartData = [];
      return;
    }
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    
    // Calculate new patients this month
    const newPatientsThisMonth = patients.filter(patient => {
      const regDate = new Date(patient.registration_date);
      return regDate.getMonth() === currentMonth && regDate.getFullYear() === now.getFullYear();
    }).length;
    
    // Calculate new patients last month
    const newPatientsLastMonth = patients.filter(patient => {
      const regDate = new Date(patient.registration_date);
      const year = currentMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return regDate.getMonth() === previousMonth && regDate.getFullYear() === year;
    }).length;
    
    // Calculate percentage increase
    let growth = 0;
    if (newPatientsLastMonth > 0) {
      growth = Math.round(((newPatientsThisMonth - newPatientsLastMonth) / newPatientsLastMonth) * 100);
    } else if (newPatientsThisMonth > 0) {
      growth = 100; // If last month was 0 and this month is positive, show 100% growth
    }
    
    this.newPatientsCount = newPatientsThisMonth;
    this.currentPatientCount = patients.length;
    this.growthPercentage = growth;
    
    // Generate chart data for the last 6 months
    this.generateChartData(patients);
  }
  
  private generateChartData(patients: any[]): void {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const now = new Date();
    const currentMonth = now.getMonth();
    
    // Generate data for the last 6 months
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = now.getFullYear() - (currentMonth < i ? 1 : 0);
      
      // Count patients registered in this month
      const count = patients.filter(patient => {
        const regDate = new Date(patient.registration_date);
        return regDate.getMonth() === monthIndex && regDate.getFullYear() === year;
      }).length;
      
      chartData.push({
        month: months[monthIndex],
        count: count,
        isCurrent: i === 0
      });
    }
    
    this.chartData = chartData;
  }
  
  // Calculate bar height based on max value
  getBarHeight(count: number): number {
    const maxCount = Math.max(...this.chartData.map(data => data.count));
    const maxHeight = 80; // Maximum height in pixels
    
    if (maxCount === 0) return 0;
    return Math.max((count / maxCount) * maxHeight, 2); // Minimum 2px height for visibility
  }
}
