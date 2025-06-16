import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DoctorDashboardService } from '../../../../services/doc-services/doctor-dashboard.service';

interface AppointmentData {
  id: number;
  patient_user_id: number;
  doctor_user_id: number;
  appointment_datetime_start: string;
  appointment_datetime_end: string;
  type: string;
  reason_for_visit: string;
  status: string;
  patient: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
}

@Component({
  selector: 'app-upcoming-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './upcoming-appointments.component.html',
  styleUrls: ['./upcoming-appointments.component.css']
})
export class UpcomingAppointmentsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly dashboardService = inject(DoctorDashboardService);

  // Today's date for the template
  today = new Date();
  
  appointments: AppointmentData[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadUpcomingAppointments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private loadUpcomingAppointments(): void {
    this.isLoading = true;
    this.error = null;

    console.log('🔄 Starting to load upcoming appointments...');

    this.dashboardService.getUpcomingAppointments()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('❌ Failed to load appointments:', error);
          this.error = 'Failed to load appointments. Please try again.';
          return of([]);
        })
      )
      .subscribe({        next: (appointments: any[]) => {
          this.appointments = appointments || [];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error in subscription:', error);
          this.error = 'Failed to load appointments. Please try again.';
          this.isLoading = false;
        }
      });
  }
  formatTime(datetimeString: string): string {
    if (!datetimeString) return '';
    
    try {
      const date = new Date(datetimeString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  }
  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      confirmed: 'text-green-600 bg-green-100',
      scheduled: 'text-blue-600 bg-blue-100',
      pending: 'text-yellow-600 bg-yellow-100',
      cancelled: 'text-red-600 bg-red-100'
    };

    return statusClasses[status?.toLowerCase()] || 'text-gray-600 bg-gray-100';
  }  getInitials(appointment: AppointmentData): string {
    const name = appointment?.patient?.name;
    if (!name || name.trim() === '') return '??';
    
    return name
      .trim()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getAvatarGradient(appointment: AppointmentData): string {
    const name = appointment?.patient?.name;
    if (!name) return 'from-gray-400 to-gray-500';
    
    const gradients = [
      'from-blue-400 to-purple-500',
      'from-green-400 to-blue-500', 
      'from-purple-400 to-pink-500',
      'from-yellow-400 to-orange-500',
      'from-red-400 to-pink-500',
      'from-indigo-400 to-purple-500'
    ];
    
    return gradients[name.length % gradients.length];
  }

  retryLoad(): void {
    this.loadUpcomingAppointments();
  }
}