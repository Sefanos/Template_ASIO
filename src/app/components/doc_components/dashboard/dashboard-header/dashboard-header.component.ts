import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DoctorDashboardService, UserInfo } from '../../../../services/doc-services/doctor-dashboard.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.css']
})
export class DashboardHeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
    @Input() title: string = 'DOCTOR DASHBOARD';
  @Input() date: Date = new Date();
  
  // Events
  @Output() refresh = new EventEmitter<void>();
  
  // User data
  user: UserInfo | null = null;
  isLoading = false;
  error: string | null = null;
  
  // Refresh state
  isRefreshing = false;
  
  constructor(private dashboardService: DoctorDashboardService) {}
  
  ngOnInit(): void {
    this.loadUserInfo();
    
    // Update the date every minute
    this.updateDate();
    setInterval(() => this.updateDate(), 60000);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private updateDate(): void {
    this.date = new Date();
  }
  
  private loadUserInfo(): void {
    this.isLoading = true;
    this.error = null;
    
    this.dashboardService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.user = user;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading user info:', error);
          this.error = error.message || 'Failed to load user information';
          this.isLoading = false;        }
      });
  }
    /**
   * Refresh all dashboard data
   */
  refreshDashboard(): void {
    if (this.isRefreshing) return; // Prevent multiple clicks
    
    this.isRefreshing = true;
    
    this.dashboardService.refreshDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Dashboard refreshed successfully');
          this.isRefreshing = false;
          this.refresh.emit(); // Emit event to parent component
        },
        error: (error) => {
          console.error('❌ Error refreshing dashboard:', error);
          this.isRefreshing = false;
          this.error = 'Failed to refresh dashboard data';
        }
      });
  }
}
