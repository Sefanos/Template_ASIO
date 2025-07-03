import { Component, Input, Output, EventEmitter, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent } from '../../../../models/calendar/calendar-event.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { DoctorAppointmentService } from '../../../../shared/services/doctor-appointment.service';
import { User } from '../../../../models/user.model';
import { RescheduleModalComponent } from '../reschedule-modal/reschedule-modal.component';

@Component({
  selector: 'app-appointment-details-modal',
  standalone: true,
  imports: [CommonModule, RescheduleModalComponent],
  templateUrl: './appointment-details-modal.component.html',
  styleUrls: ['./appointment-details-modal.component.css']
})
export class AppointmentDetailsModalComponent implements OnInit {
  @Input() show: boolean = false;
  @Input() appointment: CalendarEvent | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<CalendarEvent>();
  @Output() appointmentUpdated = new EventEmitter<void>();
  
  private authService = inject(AuthService);
  private appointmentService = inject(DoctorAppointmentService);
  currentDoctor: User | null = null;
  isProcessing = false;
  
  // Reschedule modal properties
  showRescheduleModal = false;
  
  ngOnInit(): void {
    // Get current doctor information from AuthService
    this.authService.getCurrentUser().subscribe(user => {
      this.currentDoctor = user;
    });
  }
  
  closeModal(): void {
    this.close.emit();
  }  editAppointment(): void {
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
  }

  getReason(): string {
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

  // Reschedule Appointment Method
  rescheduleAppointment(): void {
    this.showRescheduleModal = true;
  }

  onRescheduleCancel(): void {
    this.showRescheduleModal = false;
  }

  onRescheduleConfirm(data: {date: string, time: string, reason: string}): void {
    if (!this.appointment?.id) return;

    const appointmentId = Number(this.appointment.id);

    // Format as "YYYY-MM-DD HH:mm:ss" (with a space, not "T")
    const newDatetimeStart = `${data.date} ${data.time}:00`;

    const appointmentDuration = this.getDurationInMinutes();
    const [hours, minutes] = data.time.split(':').map(Number);
    const endDate = new Date(data.date);
    endDate.setHours(hours, minutes + appointmentDuration, 0, 0);

    // Format as "YYYY-MM-DD HH:mm:ss"
    const pad = (n: number) => n.toString().padStart(2, '0');
    const newDatetimeEnd = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())} ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`;

    this.isProcessing = true;
    this.appointmentService.rescheduleAppointment(
      appointmentId,
      newDatetimeStart,
      newDatetimeEnd,
      data.reason || undefined
    ).subscribe({
      next: (updatedAppointment) => {
        console.log('Appointment rescheduled successfully:', updatedAppointment);
        this.showRescheduleModal = false;
        this.isProcessing = false;
        this.appointmentUpdated.emit();
        this.closeModal();
      },
      error: (error) => {
        console.error('Error rescheduling appointment:', error);
        const errorMessage = error?.error?.message || 'Failed to reschedule appointment. Please try again.';
        alert(errorMessage);
        this.isProcessing = false;
        this.showRescheduleModal = false;
      }
    });
  }

  private getDurationInMinutes(): number {
    if (!this.appointment?.start || !this.appointment?.end) return 30;
    const start = new Date(this.appointment.start);
    const end = new Date(this.appointment.end);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  // Helper method to check if appointment can be modified
  canModifyAppointment(): boolean {
    const status = this.getStatus().toLowerCase();
    return status === 'scheduled' || status === 'confirmed';
  }

  // Helper method to check if appointment is in the past
  isAppointmentInPast(): boolean {
    if (!this.appointment?.start) return false;
    const appointmentDate = new Date(this.appointment.start);
    return appointmentDate < new Date();
  }
}
