import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


import { DashboardHeaderComponent } from '../../../components/doc_components/dashboard/dashboard-header/dashboard-header.component';
import { StatCardComponent } from '../../../components/doc_components/dashboard/stat-card/stat-card.component';
import { PatientDemographicsComponent } from '../../../components/doc_components/dashboard/patient-demographics/patient-demographics.component';
import { AgeDistributionComponent } from '../../../components/doc_components/dashboard/age-distribution/age-distribution.component';
import { NewPatientsComponent } from '../../../components/doc_components/dashboard/new-patients/new-patients.component';
import { UpcomingAppointmentsComponent } from '../../../components/doc_components/dashboard/upcoming-appointments/upcoming-appointments.component';
import { NotificationsComponent } from '../../../components/doc_components/dashboard/notifications/notifications.component';
import { SimpleWeeklyOverviewComponent } from '../../../components/doc_components/dashboard/simple-weekly-overview/simple-weekly-overview.component';
import { AiAssistantComponent } from '../../../components/doc_components/dashboard/ai-assistant/ai-assistant.component';

// Import Dashboard Service
import { DoctorDashboardService, DashboardStats } from '../../../services/doc-services/doctor-dashboard.service';

// Import the StatItem interface from the StatCardComponent to ensure type compatibility
interface StatItem {
  label: string;
  value: string | number;
  status?: 'normal' | 'warning' | 'urgent' | 'info';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,  imports: [
    CommonModule,
    RouterModule,
    DashboardHeaderComponent,
    StatCardComponent,
    PatientDemographicsComponent,
    AgeDistributionComponent,
    NewPatientsComponent,
    UpcomingAppointmentsComponent,
    NotificationsComponent,
    SimpleWeeklyOverviewComponent,
    AiAssistantComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentDate = new Date();
  
  // Loading and error states
  isLoading = false;
  error: string | null = null;
  
  // Real data from API
  dashboardStats: DashboardStats | null = null;  
  // Computed properties for stat cards
  get appointmentStats(): StatItem[] {
    if (!this.dashboardStats?.todayAppointments) {
      return [{ label: 'Loading...', value: 0 }];
    }
    
    return [
      { 
        label: 'Today\'s Total', 
        value: this.dashboardStats.todayAppointments.count 
      },
      { 
        label: 'This Week', 
        value: this.dashboardStats.appointmentStats?.week || 0, 
        status: 'info' 
      }
    ];
  }  
  get queueStats(): StatItem[] {
    if (!this.dashboardStats?.totalPatients) {
      return [{ label: 'Loading...', value: 0 }];
    }
    
    return [
      { 
        label: 'Total Patients', 
        value: this.dashboardStats.totalPatients.count 
      },
      { 
        label: 'Critical Alerts', 
        value: this.dashboardStats.totalPatients.criticalAlerts, 
        status: this.dashboardStats.totalPatients.criticalAlerts > 0 ? 'urgent' : 'normal'
      }
    ];
  }  
  get taskStats(): StatItem[] {
    if (!this.dashboardStats?.appointmentStats) {
      return [{ label: 'Loading...', value: 0 }];
    }
    
    return [
      { 
        label: 'Completion Rate', 
        value: `${this.dashboardStats.appointmentStats.completion_rate}%` 
      },
      { 
        label: 'New Patients', 
        value: this.dashboardStats.totalPatients?.newThisWeek || 0, 
        status: 'info' 
      }
    ];
  }  
  // Computed badges
  get appointmentBadge(): string {
    return this.dashboardStats?.todayAppointments.count 
      ? `${this.dashboardStats.todayAppointments.count} Today`
      : 'Loading...';
  }
  
  get queueBadge(): string {
    const alerts = this.dashboardStats?.totalPatients.criticalAlerts;
    return alerts !== undefined 
      ? `${alerts} Critical`
      : 'Loading...';
  }
  
  get taskBadge(): string {
    const rate = this.dashboardStats?.appointmentStats.completion_rate;
    return rate !== undefined 
      ? `${rate}% Rate`
      : 'Loading...';
  }
  
  get queueBadgeType(): 'primary' | 'warning' | 'urgent' | 'info' {
    const alerts = this.dashboardStats?.totalPatients.criticalAlerts || 0;
    return alerts > 0 ? 'urgent' : 'primary';
  }
  
  get taskBadgeType(): 'primary' | 'warning' | 'urgent' | 'info' {
    const rate = this.dashboardStats?.appointmentStats.completion_rate || 0;
    if (rate >= 90) return 'primary';
    if (rate >= 75) return 'info';
    if (rate >= 50) return 'warning';
    return 'urgent';
  }
  constructor(private dashboardService: DoctorDashboardService) {
    console.log('🚀 Dashboard Component Constructor Called');
  }
  ngOnInit(): void {
    console.log('✅ Dashboard Component ngOnInit Called');
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    console.log('🎨 Dashboard Component ngAfterViewInit Called');
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  // Load dashboard data from API
  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;
    
    console.log('🔄 Loading dashboard data from API...');
    
    this.dashboardService.getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          console.log('✅ Dashboard data loaded successfully:', stats);
          this.dashboardStats = stats;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Dashboard data loading failed:', error);
          this.error = error.message || 'Failed to load dashboard data';
          this.isLoading = false;        }
      });
  }

  /**
   * Handle refresh event from dashboard header
   */
  onRefreshDashboard(): void {
    console.log('🔄 Refreshing dashboard from header...');
    this.loadDashboardData(); // Reload dashboard data
  }
}
