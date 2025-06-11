import { Injectable } from '@angular/core';
import { Appointment } from '../../models/appointment.model';
import { Appointment as PatientAppointment } from '../../core/patient/domain/models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class PatientAppointmentAdapter {
  /**
   * Convert shared Appointment model to patient core Appointment model
   */
  toPatientModel(sharedAppointment: Appointment): PatientAppointment {
    return {
      id: sharedAppointment.id,
      // Handle both doctorId and doctor_user_id from backend
      doctorId: sharedAppointment.doctorId || (sharedAppointment as any).doctor_user_id || 0,
      doctorName: sharedAppointment.doctorName || sharedAppointment.provider || 
                  ((sharedAppointment as any).doctor?.name),
      date: sharedAppointment.date,
      time: sharedAppointment.time,
      reason: sharedAppointment.reason,
      status: this.mapStatusToPatientModel(sharedAppointment.status),
      cancelReason: sharedAppointment.notes,
      // Extract specialty from nested doctor object or use existing field
      doctorSpecialty: sharedAppointment.doctorSpecialty || 
                      ((sharedAppointment as any).doctor?.doctor?.specialty),
      location: 'Main Medical Center', // Default location
      notes: sharedAppointment.notes ? [sharedAppointment.notes] : [],
      followUp: false // Default value
    };
  }

  /**
   * Convert patient core Appointment model to shared Appointment model
   */
  toSharedModel(patientAppointment: PatientAppointment): Appointment {
    return {
      id: patientAppointment.id,
      date: typeof patientAppointment.date === 'string' ? patientAppointment.date : patientAppointment.date.toISOString().split('T')[0],
      time: patientAppointment.time,
      type: 'consultation', // Default type
      provider: patientAppointment.doctorName || 'Unknown Doctor',
      reason: patientAppointment.reason || 'General consultation',
      status: this.mapStatusToSharedModel(patientAppointment.status),
      notes: patientAppointment.notes?.join('; '),
      patientId: undefined, // Will be set by service
      doctorId: patientAppointment.doctorId,
      patientName: undefined, // Will be set by service  
      doctorName: patientAppointment.doctorName,
      doctorSpecialty: patientAppointment.doctorSpecialty,
      startDateTime: this.combineDateAndTime(patientAppointment.date, patientAppointment.time),
      endDateTime: undefined, // Will be calculated
      duration: 30 // Default duration
    };
  }

  /**
   * Convert array of shared appointments to patient appointments
   */
  toPatientModelArray(sharedAppointments: Appointment[]): PatientAppointment[] {
    return sharedAppointments.map(appointment => this.toPatientModel(appointment));
  }

  /**
   * Convert array of patient appointments to shared appointments
   */
  toSharedModelArray(patientAppointments: PatientAppointment[]): Appointment[] {
    return patientAppointments.map(appointment => this.toSharedModel(appointment));
  }

  // Private helper methods
  private mapStatusToPatientModel(sharedStatus: string): 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Unknown' {
    switch (sharedStatus?.toLowerCase()) {
      case 'scheduled':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'cancelled':
      case 'cancelled_by_patient':
      case 'cancelled_by_clinic':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  private mapStatusToSharedModel(patientStatus: string): 'scheduled' | 'completed' | 'cancelled' | 'no-show' {
    switch (patientStatus?.toLowerCase()) {
      case 'pending':
        return 'scheduled';
      case 'confirmed':
        return 'scheduled';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'scheduled';
    }
  }

  private combineDateAndTime(date: string | Date, time: string): Date {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const dateTime = new Date(`${dateStr}T${this.convertTo24Hour(time)}`);
    return dateTime;
  }

  private convertTo24Hour(time12h: string): string {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    
    return `${hours}:${minutes}:00`;
  }
}
