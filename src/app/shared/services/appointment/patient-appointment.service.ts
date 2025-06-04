import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppointmentService } from './appointment.service';
import { Appointment, AppointmentStatus } from '../../../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class PatientAppointmentService {
  constructor(private appointmentService: AppointmentService) {}
  
  // Patient-specific methods
  getMyAppointments(): Observable<Appointment[]> {
    // In a real app, you would get the current patient ID from an auth service
    const patientId = this.getCurrentPatientId();
    return this.appointmentService.getAppointments({ patientId });
  }
  
  getAppointmentHistory(): Observable<Appointment[]> {
    const patientId = this.getCurrentPatientId();
    return this.appointmentService.getAppointments({ patientId }).pipe(
      map(appointments => appointments.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ))
    );
  }
  
  getUpcomingAppointments(): Observable<Appointment[]> {
    const patientId = this.getCurrentPatientId();
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    return this.appointmentService.getAppointments({ 
      patientId,
      startDate: formattedDate
    }).pipe(
      map(appointments => appointments.filter(app => 
        app.status === AppointmentStatus.Confirmed || 
        app.status === AppointmentStatus.Pending
      ))
    );
  }
  
  bookAppointment(appointmentData: Partial<Appointment>): Observable<Appointment> {
    // Add patient ID to the appointment data
    const patientId = this.getCurrentPatientId();
    const appointment = {
      ...appointmentData,
      patientId,
      status: AppointmentStatus.Pending
    };
    
    return this.appointmentService.createAppointment(appointment);
  }
  
  cancelMyAppointment(id: number, reason: string): Observable<Appointment> {
    return this.appointmentService.cancelAppointment(id, reason, 'patient');
  }
  
  rescheduleMyAppointment(id: number, date: string, time: string): Observable<Appointment> {
    return this.appointmentService.rescheduleAppointment(id, date, time);
  }
  
  getAppointmentDetails(id: number): Observable<Appointment> {
    return this.appointmentService.getAppointment(id);
  }
  
  // Patient-specific helper methods
  canReschedule(appointment: Appointment): boolean {
    // Patients can reschedule appointments that are confirmed or pending
    // and not in the past
    return [AppointmentStatus.Confirmed, AppointmentStatus.Pending].includes(appointment.status as AppointmentStatus) && 
           !this.isAppointmentInPast(appointment);
  }
  
  canCancel(appointment: Appointment): boolean {
    // Patients can cancel appointments that are confirmed or pending
    // and not in the past
    return [AppointmentStatus.Confirmed, AppointmentStatus.Pending].includes(appointment.status as AppointmentStatus) && 
           !this.isAppointmentInPast(appointment);
  }
  
  isAppointmentInPast(appointment: Appointment): boolean {
    if (!appointment.date) return false;
    
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return appointmentDate < today;
  }
  
  // This would typically come from authentication service
  private getCurrentPatientId(): number {
    // For now, hardcode a patient ID (you would get this from an auth service)
    return 101; // Replace with actual logic to get the current patient's ID
  }
}