import { Component, Input, Output, EventEmitter, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent } from '../../../../models/calendar/calendar-event.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-appointment-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-details-modal.component.html',
  styleUrls: ['./appointment-details-modal.component.css']
})
export class AppointmentDetailsModalComponent implements OnInit {
  @Input() show: boolean = false;
  @Input() appointment: CalendarEvent | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<CalendarEvent>();
  
  private authService = inject(AuthService);
  currentDoctor: User | null = null;
  ngOnInit(): void {
    // Get current doctor information from AuthService
    this.authService.getCurrentUser().subscribe(user => {
      this.currentDoctor = user;
    });
  }
  
  closeModal(): void {
    this.close.emit();
  }
  editAppointment(): void {
    if (this.appointment) {
      // Ensure we preserve all appointment data for the edit form
      const appointmentForEdit: CalendarEvent = {
        ...this.appointment,
        extendedProps: {
          ...this.appointment.extendedProps,
          // Make sure we're marking this as an appointment for the form
          isAppointment: true,
          // Ensure patient information is preserved
          patientName: this.getPatientName(),
          // Add the current doctor information
          doctorName: this.getCurrentDoctorName(),
          doctorId: this.currentDoctor?.id
        }
      };
      
      // Close the modal smoothly first, then emit the edit event
      this.close.emit();
      
      // Use a small delay to allow the modal to close before triggering the edit
      setTimeout(() => {
        this.edit.emit(appointmentForEdit);
      }, 150);
    }
  }
    // Get current doctor name from AuthService
  getCurrentDoctorName(): string {
    return this.currentDoctor?.name || 'Current Doctor';
  }

  // Helper methods to format appointment data
  getPatientName(): string {
    const extendedProps = this.appointment?.extendedProps || {};
    const originalAppointment = extendedProps['originalAppointment'] || {};
    return extendedProps['patientName'] || originalAppointment['patientName'] || 'Unknown Patient';
  }

  getAppointmentType(): string {
    const extendedProps = this.appointment?.extendedProps || {};
    const originalAppointment = extendedProps['originalAppointment'] || {};
    return extendedProps['appointmentType'] || originalAppointment['type'] || 'General';
  }

  getStatus(): string {
    const extendedProps = this.appointment?.extendedProps || {};
    const originalAppointment = extendedProps['originalAppointment'] || {};
    return extendedProps['status'] || originalAppointment['status'] || 'scheduled';
  }

  getStatusColor(): string {
    const status = this.getStatus().toLowerCase();
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }  getReason(): string {
    const extendedProps = this.appointment?.extendedProps || {};
    const originalAppointment = extendedProps['originalAppointment'] || {};
    return originalAppointment['reason'] || this.appointment?.title || 'No reason specified';
  }

  getNotes(): string {
    const extendedProps = this.appointment?.extendedProps || {};
    const originalAppointment = extendedProps['originalAppointment'] || {};
    return extendedProps['notes'] || originalAppointment['notes'] || '';
  }
  getDuration(): number {
    const extendedProps = this.appointment?.extendedProps || {};
    const originalAppointment = extendedProps['originalAppointment'] || {};
    
    if (originalAppointment['duration']) {
      return originalAppointment['duration'];
    }
    
    // Calculate duration from start/end times
    if (this.appointment?.start && this.appointment?.end) {
      const start = new Date(this.appointment.start);
      const end = new Date(this.appointment.end);
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
    }
    
    return 30; // default
  }

  formatDateTime(dateInput: string | Date): string {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(dateInput: string | Date): string {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
