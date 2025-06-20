import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../../models/appointment.model'; 

@Component({
  selector: 'app-appointment-history-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-history-card.component.html',
})
export class AppointmentHistoryCardComponent implements OnChanges {
  @Input() appointments: any[] = []; // Accept both old and new format
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appointments']) {
      console.log('Appointments updated:', this.appointments?.length || 0);
      // Force change detection when appointments change
      setTimeout(() => this.cdr.detectChanges(), 0);
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
      .sort((a, b) => new Date(this.getAppointmentDate(b)).getTime() - new Date(this.getAppointmentDate(a)).getTime())
      .slice(0, 3);
  }
  
  // Helper methods for appointment data
  getAppointmentDate(appointment: any): string {
    return appointment.appointmentDate || appointment.date || appointment.scheduled_date || '';
  }
  
  getAppointmentTime(appointment: any): string {
    return appointment.appointmentTime || appointment.time || appointment.scheduled_time || '';
  }
  
  getAppointmentType(appointment: any): string {
    return appointment.appointmentType || appointment.type || 'General Consultation';
  }
  
  getAppointmentStatus(appointment: any): string {
    return appointment.status || 'Scheduled';
  }
  
  getDoctorName(appointment: any): string {
    return appointment.doctorName || appointment.doctor || 'Dr. Unknown';
  }
  
  getNotes(appointment: any): string {
    return appointment.notes || appointment.description || '';
  }
  
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-orange-100 text-orange-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
    isUpcoming(appointment: any): boolean {
    const appointmentDate = new Date(this.getAppointmentDate(appointment));
    return appointmentDate > new Date();
  }
}