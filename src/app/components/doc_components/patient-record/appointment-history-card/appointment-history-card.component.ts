import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-appointment-history-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-history-card.component.html',
})
export class AppointmentHistoryCardComponent implements OnChanges, OnDestroy {
  @Input() appointments: any[] = [];

  
  private currentUser: any = null;
  private userSubscription: Subscription | null = null;
    constructor(

    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {
    // Subscribe to current user changes
    this.userSubscription = this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appointments']) {
      console.log('Appointments updated:', this.appointments?.length || 0);
      if (this.appointments?.length > 0) {
        console.log('Appointment card - first appointment data:', this.appointments[0]);
        console.log('Appointment card - available fields:', Object.keys(this.appointments[0]));
      }
      
      // Debug current user info
      console.log('🔍 Current logged-in user:', this.currentUser);
      console.log('🔍 Available user fields:', this.currentUser ? Object.keys(this.currentUser) : 'No user');
      
    }
  }
    /**
   * Returns only the 3 most recent appointments sorted by date
   */
  get recentAppointments(): any[] {
    if (!this.appointments || this.appointments.length === 0) {
      return [];
    }
    
    return [...this.appointments]
      .sort((a, b) => {
        const dateA = this.getAppointmentDate(a);
        const dateB = this.getAppointmentDate(b);
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, 3);
  }// Helper methods for appointment data
  getAppointmentDate(appointment: any): string {
    // Handle both date formats: simple dates and ISO timestamps
    const dateValue = appointment.date || appointment.appointmentDate || appointment.scheduled_date || appointment.appointment_datetime_start;
    if (!dateValue) return '';
    
    // If it's an ISO string, extract just the date part
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      return dateValue.split('T')[0];
    }
    
    return dateValue;
  }
  
  getAppointmentTime(appointment: any): string {
    // First check for explicit time field
    if (appointment.time) {
      return appointment.time;
    }
    
    // If no time field, try to extract from datetime
    const dateTimeValue = appointment.appointment_datetime_start || appointment.appointmentTime || appointment.scheduled_time;
    if (dateTimeValue && typeof dateTimeValue === 'string' && dateTimeValue.includes('T')) {
      try {
        const date = new Date(dateTimeValue);
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      } catch {
        return '';
      }
    }
    
    return dateTimeValue || '';
  }
  
  getAppointmentType(appointment: any): string {
    return appointment.type || appointment.appointmentType || appointment.reason || 'General Consultation';
  }
  
  getAppointmentStatus(appointment: any): string {
    return appointment.status || 'scheduled';
  }
  
  getDoctorName(appointment: any): string {
    // First try to get doctor from appointment data (if it exists and is valid)
    if (appointment.doctor && typeof appointment.doctor === 'object') {
      const doctorName = appointment.doctor.name || 
                        appointment.doctor.full_name || 
                        `Dr. ${appointment.doctor.last_name}`;
      if (doctorName && doctorName !== 'Dr. undefined') {
        return doctorName;
      }
    }
    
    // Check appointment direct fields (skip hardcoded sample data)
    if (appointment.provider && !appointment.provider.includes('Dr. Sefanos')) {
      return appointment.provider;
    }
    if (appointment.doctor_name) {
      return appointment.doctor_name;
    }
    if (appointment.physician_name) {
      return appointment.physician_name;
    }
    
    // Fallback to current logged-in doctor
    if (this.currentUser) {
      const doctorName = this.currentUser.full_name || 
                        this.currentUser.name || 
                        (this.currentUser.first_name && this.currentUser.last_name ? 
                          `Dr. ${this.currentUser.first_name} ${this.currentUser.last_name}` : null) ||
                        (this.currentUser.last_name ? `Dr. ${this.currentUser.last_name}` : null) ||
                        this.currentUser.username;
      
      if (doctorName && doctorName !== 'Dr. undefined') {
        return doctorName;
      }
    }
    
    // Final fallback
    return 'Doctor';
  }

  getOrderedBy(appointment: any): string {
    // Try to get from appointment data first
    if (appointment.ordered_by) {
      return appointment.ordered_by;
    }
    
    // Fallback to current doctor
    if (this.currentUser) {
      return this.currentUser.full_name || 
             this.currentUser.name || 
             (this.currentUser.first_name && this.currentUser.last_name ? 
               `Dr. ${this.currentUser.first_name} ${this.currentUser.last_name}` : null) ||
             'Current Doctor';
    }
    
    return 'Doctor';
  }

  getNotes(appointment: any): string {
    return appointment.notes || 
           appointment.description || 
           appointment.reason || 
           appointment.notes_by_patient || 
           appointment.notes_by_staff || 
           '';
  }
    getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
      case 'canceled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no-show':
      case 'missed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'rescheduled':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }  isUpcoming(appointment: any): boolean {
    try {
      const appointmentDateStr = this.getAppointmentDate(appointment);
      if (!appointmentDateStr) return false;
      
      const appointmentDate = new Date(appointmentDateStr);
      const today = new Date();
      
      // Set today to start of day for accurate comparison
      today.setHours(0, 0, 0, 0);
      appointmentDate.setHours(0, 0, 0, 0);
      
      return appointmentDate >= today;
    } catch {
      return false;
    }
  }
  
  formatDate(date: string): string {
    if (!date) return '';
    
    try {
      const parsedDate = new Date(date);
      return parsedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  }
}