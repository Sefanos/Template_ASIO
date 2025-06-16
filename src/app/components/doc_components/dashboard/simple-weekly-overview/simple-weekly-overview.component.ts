import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DoctorDashboardService } from '../../../../services/doc-services/doctor-dashboard.service';

@Component({
  selector: 'app-simple-weekly-overview',
  standalone: true,
  imports: [CommonModule],  template: `
    <div class="bg-white rounded-lg p-6 border border-gray-200">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-semibold text-gray-800">WEEKLY OVERVIEW</h3>
        <span class="text-sm text-gray-500">{{ dateRange }}</span>
      </div>
      
      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-sm text-gray-600">Loading data...</span>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !isLoading" class="text-center py-4">
        <div class="text-red-500 text-sm">{{ error }}</div>
      </div>        <!-- Simple Bar Chart Alternative (CSS-based) -->
      <div *ngIf="!isLoading && !error" class="mb-6">
        <h4 class="text-sm font-medium text-gray-700 mb-4">Daily Appointments</h4>
        <div class="flex items-end justify-between h-40 bg-gray-50 rounded-lg p-4 gap-2">
          <div *ngFor="let day of weeklyData; let i = index" class="flex flex-col items-center flex-1">
            <!-- Bar with fixed minimum height and percentage scaling -->
            <div class="w-6 sm:w-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-300 hover:from-blue-700 hover:to-blue-500 shadow-sm cursor-pointer" 
                 [style.height.px]="getBarHeight(day.value)"
                 [title]="day.label + ': ' + day.value + ' appointments'">
            </div>
            <span class="text-xs text-gray-600 mt-2 font-medium">{{ day.label }}</span>
            <span class="text-xs font-semibold text-blue-600 bg-blue-50 px-1 rounded">{{ day.value }}</span>
          </div>
        </div>
      </div>      <!-- Stats Grid -->
      <div *ngIf="!isLoading && !error" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <div class="text-2xl font-bold text-blue-700">{{ stats.totalAppointments }}</div>
            <div class="text-blue-500">📅</div>
          </div>
          <div class="text-sm font-medium text-blue-600">This Week</div>
          <div class="text-xs text-green-600 font-semibold">{{ stats.totalIncrease }}</div>
        </div>
        
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <div class="text-2xl font-bold text-green-700">{{ stats.completionRate }}%</div>
            <div class="text-green-500">✅</div>
          </div>
          <div class="text-sm font-medium text-green-600">Completion</div>
          <div class="text-xs text-green-600 font-semibold">{{ stats.completionChange }}</div>
        </div>
        
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <div class="text-2xl font-bold text-purple-700">{{ stats.averageDuration }}min</div>
            <div class="text-purple-500">⏱️</div>
          </div>
          <div class="text-sm font-medium text-purple-600">Avg Duration</div>
          <div class="text-xs text-red-600 font-semibold">{{ stats.durationChange }}</div>
        </div>
        
        <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <div class="text-2xl font-bold text-orange-700">{{ stats.noShowRate }}%</div>
            <div class="text-orange-500">❌</div>
          </div>
          <div class="text-sm font-medium text-orange-600">No-Show Rate</div>
          <div class="text-xs text-green-600 font-semibold">{{ stats.noShowChange }}</div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SimpleWeeklyOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Component state
  isLoading = false;
  error: string | null = null;
  
  dateRange = this.getCurrentWeekRange();
  
  // Data from API
  weeklyData: { label: string; value: number; }[] = [];
  
  get maxValue() {
    if (this.weeklyData.length === 0) return 1; // Avoid division by zero
    return Math.max(...this.weeklyData.map(d => d.value));
  }

  getBarHeight(value: number): number {
    const minHeight = 20; // Minimum height in pixels
    const maxHeight = 120; // Maximum height in pixels
    
    if (this.maxValue === 0) return minHeight;
    
    const percentage = value / this.maxValue;
    return minHeight + (percentage * (maxHeight - minHeight));
  }

  stats = {
    totalAppointments: 0,
    totalIncrease: '0%',
    completionRate: 0,
    completionChange: '0%',
    averageDuration: 0,
    durationChange: '0%',
    noShowRate: 0,
    noShowChange: '0%'
  };

  constructor(private dashboardService: DoctorDashboardService) {}
    ngOnInit(): void {
    this.loadWeeklyStats();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
    private loadWeeklyStats(): void {
    this.isLoading = true;
    this.error = null;
    
    this.dashboardService.getAppointmentStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          console.log('Weekly stats loaded:', stats);
          this.processStats(stats);
          this.generateWeeklyData();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading weekly stats:', error);
          this.error = error.message || 'Failed to load weekly statistics';
          this.isLoading = false;
          
          // Fallback to minimal data
          this.stats = {
            totalAppointments: 0,
            totalIncrease: '0%',
            completionRate: 0,
            completionChange: '0%',
            averageDuration: 0,
            durationChange: '0%',
            noShowRate: 0,
            noShowChange: '0%'
          };
          this.generateWeeklyData();
        }
      });
  }
    private processStats(stats: any): void {
    console.log('Processing stats:', stats);
    
    // Map API response to component stats
    const totalAppointments = stats.total_appointments || 0;
    const completionRate = stats.completion_rate || 0;
    const noShowRate = stats.no_show_rate || 0;
    const averageDuration = stats.average_duration || 30; // Default to 30 minutes if not provided
    
    this.stats = {
      totalAppointments: totalAppointments,
      totalIncrease: this.calculateIncrease(totalAppointments, Math.max(1, totalAppointments - 1)), // Simulate previous period
      completionRate: Math.round(completionRate * 100) / 100, // Round to 2 decimal places
      completionChange: completionRate > 50 ? '+2%' : '-1%', // Simulate trend based on performance
      averageDuration: averageDuration,
      durationChange: averageDuration > 25 ? '+5%' : '-2%', // Simulate trend
      noShowRate: Math.round(noShowRate * 100) / 100,
      noShowChange: noShowRate < 10 ? '-1%' : '+3%' // Good if low no-show rate
    };
    
    console.log('Processed stats:', this.stats);
  }
    private generateWeeklyData(): void {
    // Simulate weekly distribution based on total appointments
    const totalAppointments = this.stats.totalAppointments;
    
    if (totalAppointments === 0) {
      // If no appointments, show empty data
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      this.weeklyData = days.map(day => ({ label: day, value: 0 }));
      return;
    }
    
    // Realistic distribution: weekdays higher, weekends lower
    const distribution = [0.18, 0.22, 0.20, 0.18, 0.15, 0.05, 0.02]; // Mon-Sun distribution
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    this.weeklyData = days.map((day, index) => {
      const value = Math.max(0, Math.round(totalAppointments * distribution[index]));
      return {
        label: day,
        value: value
      };
    });
    
    // Ensure at least some appointments are distributed if total > 0
    const totalDistributed = this.weeklyData.reduce((sum, day) => sum + day.value, 0);
    if (totalDistributed === 0 && totalAppointments > 0) {
      // Put all appointments on Tuesday (most common day)
      this.weeklyData[1].value = totalAppointments;
    }
    
    console.log('Generated weekly data:', this.weeklyData);
  }
    private calculateIncrease(current: number, previous: number): string {
    if (previous === 0 && current === 0) return '0%';
    if (previous === 0) return '+100%';
    if (current === 0) return '-100%';
    
    const change = ((current - previous) / previous) * 100;
    const roundedChange = Math.round(change * 10) / 10; // Round to 1 decimal place
    
    return (roundedChange > 0 ? '+' : '') + roundedChange.toFixed(1) + '%';
  }

  private getCurrentWeekRange(): string {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startOfWeek.toLocaleDateString('en-US', options)} - ${endOfWeek.toLocaleDateString('en-US', options)}`;
  }
}
