import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Import all dashboard components
import { DashboardHeaderComponent } from '../../../components/doc_components/dashboard/dashboard-header/dashboard-header.component';
import { StatCardComponent } from '../../../components/doc_components/dashboard/stat-card/stat-card.component';
import { PatientDemographicsComponent } from '../../../components/doc_components/dashboard/patient-demographics/patient-demographics.component';
import { AgeDistributionComponent } from '../../../components/doc_components/dashboard/age-distribution/age-distribution.component';
import { NewPatientsComponent } from '../../../components/doc_components/dashboard/new-patients/new-patients.component';
import { UpcomingAppointmentsComponent } from '../../../components/doc_components/dashboard/upcoming-appointments/upcoming-appointments.component';
import { NotificationsComponent } from '../../../components/doc_components/dashboard/notifications/notifications.component';
import { WeeklyOverviewComponent } from '../../../components/doc_components/dashboard/weekly-overview/weekly-overview.component';
import { AiAssistantComponent } from '../../../components/doc_components/dashboard/ai-assistant/ai-assistant.component';

// Import the StatItem interface from the StatCardComponent to ensure type compatibility
interface StatItem {
  label: string;
  value: string | number;
  status?: 'normal' | 'warning' | 'urgent' | 'info';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DashboardHeaderComponent,
    StatCardComponent,
    PatientDemographicsComponent,
    AgeDistributionComponent,
    NewPatientsComponent,
    UpcomingAppointmentsComponent,
    NotificationsComponent,
    WeeklyOverviewComponent,
    AiAssistantComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  currentDate = new Date();
  
  // Stats for appointment card
  appointmentStats: StatItem[] = [
    { label: 'Regular checkups', value: '6' },
    { label: 'Urgent cases', value: '2', status: 'urgent' }
  ];
  
  // Stats for patient queue card
  queueStats: StatItem[] = [
    { label: 'Waiting', value: '3' },
    { label: 'Next patient', value: 'Marie L.', status: 'info' }
  ];
  
  // Stats for pending tasks card
  taskStats: StatItem[] = [
    { label: 'Lab Reviews', value: '5' },
    { label: 'Patient Messages', value: '2' }
  ];
}
