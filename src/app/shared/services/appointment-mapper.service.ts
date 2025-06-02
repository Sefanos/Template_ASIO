import { Injectable } from '@angular/core';
import { Appointment, ApiAppointmentResponse } from '../../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentMapperService {

  /**
   * Transform API response to frontend Appointment model
   */
  mapApiResponseToAppointment(apiResponse: ApiAppointmentResponse): Appointment {
    const startDate = new Date(apiResponse.appointment_datetime_start);
    const endDate = new Date(apiResponse.appointment_datetime_end);
    
    return {
      id: apiResponse.id,
      date: this.formatDateToString(startDate),
      time: this.formatTimeToString(startDate),
      type: this.mapAppointmentType(apiResponse.type),
      provider: apiResponse.doctor?.name || 'Unknown Doctor',
      reason: apiResponse.reason_for_visit || 'No reason specified',
      status: this.mapApiStatusToFrontendStatus(apiResponse.status),
      notes: this.combineNotes(apiResponse.notes_by_patient, apiResponse.notes_by_staff),
      
      // Additional fields for enhanced functionality
      patientId: apiResponse.patient_user_id,
      doctorId: apiResponse.doctor_user_id,
      patientName: apiResponse.patient?.name,
      doctorName: apiResponse.doctor?.name,
      doctorSpecialty: 'General Medicine', // You can add this to backend later
      startDateTime: startDate,
      endDateTime: endDate,
      duration: this.calculateDurationInMinutes(startDate, endDate)
    };
  }

  /**
   * Transform frontend Appointment to API request format
   */
  mapAppointmentToApiRequest(appointment: Appointment, patientId?: number, doctorId?: number): any {
    const startDateTime = this.combineDateAndTime(appointment.date, appointment.time);
    const endDateTime = new Date(startDateTime.getTime() + (appointment.duration || 30) * 60000);

    return {
      patient_user_id: appointment.patientId || patientId,
      doctor_user_id: appointment.doctorId || doctorId,
      appointment_datetime_start: startDateTime.toISOString(),
      appointment_datetime_end: endDateTime.toISOString(),
      type: appointment.type.toLowerCase(),
      reason_for_visit: appointment.reason,
      status: appointment.status,
      notes_by_staff: appointment.notes
    };
  }

  /**
   * Transform array of API responses to frontend appointments
   */
  mapApiResponseArrayToAppointments(apiResponses: ApiAppointmentResponse[]): Appointment[] {
    return apiResponses.map(response => this.mapApiResponseToAppointment(response));
  }

  // Private helper methods
  private formatDateToString(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private formatTimeToString(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }); // "10:30 AM"
  }

  private mapAppointmentType(apiType: string): string {
    const typeMap: { [key: string]: string } = {
      'emergency': 'Emergency',
      'routine': 'Routine',
      'follow-up': 'Follow-up',
      'consultation': 'Consultation',
      'checkup': 'Check-up'
    };
    return typeMap[apiType.toLowerCase()] || apiType;
  }

  private mapApiStatusToFrontendStatus(apiStatus: string): Appointment['status'] {
    const statusMap: { [key: string]: Appointment['status'] } = {
      'scheduled': 'scheduled',
      'confirmed': 'scheduled', // Map confirmed to scheduled for frontend
      'completed': 'completed',
      'cancelled': 'cancelled',
      'no-show': 'no-show'
    };
    return statusMap[apiStatus.toLowerCase()] || 'scheduled';
  }

  private combineNotes(patientNotes?: string, staffNotes?: string): string {
    const notes = [];
    if (patientNotes) notes.push(`Patient: ${patientNotes}`);
    if (staffNotes) notes.push(`Staff: ${staffNotes}`);
    return notes.join(' | ');
  }

  private calculateDurationInMinutes(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  private combineDateAndTime(dateStr: string, timeStr: string): Date {
    // Parse time string like "10:30 AM"
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period?.toUpperCase() === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period?.toUpperCase() === 'AM' && hours === 12) {
      hour24 = 0;
    }

    const date = new Date(dateStr);
    date.setHours(hour24, minutes, 0, 0);
    return date;
  }
}