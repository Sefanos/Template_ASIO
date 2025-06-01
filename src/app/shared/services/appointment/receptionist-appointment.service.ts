import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { AppointmentService } from './appointment.service';
import { Appointment, AppointmentStatus } from '../../../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class ReceptionistAppointmentService {
  private _refreshSubject = new BehaviorSubject<boolean>(true);
  
  constructor(private appointmentService: AppointmentService) {}
  
  // Receptionist-specific methods
  getAllAppointments(params: any = {}): Observable<Appointment[]> {
    return this._refreshSubject.pipe(
      switchMap(() => this.appointmentService.getAppointments(params))
    );
  }
  
  getAppointmentsByDoctor(doctorId: number, date?: string): Observable<Appointment[]> {
    const params = { doctorId, ...(date ? { startDate: date, endDate: date } : {}) };
    return this.appointmentService.getAppointments(params);
  }
  
  searchAppointments(searchParams: any): Observable<Appointment[]> {
    return this.appointmentService.getAppointments(searchParams);
  }
  
  scheduleAppointment(appointmentData: Partial<Appointment>): Observable<Appointment> {
    const appointment = {
      ...appointmentData,
      status: AppointmentStatus.Confirmed // Receptionists typically confirm directly
    };
    
    return this.appointmentService.createAppointment(appointment).pipe(
      tap(() => this._refreshSubject.next(true))
    );
  }
  
  confirmAppointment(id: number): Observable<Appointment> {
    return this.appointmentService.confirmAppointment(id).pipe(
      tap(() => this._refreshSubject.next(true))
    );
  }
  
  cancelAppointmentByReceptionist(id: number, reason: string): Observable<Appointment> {
    return this.appointmentService.cancelAppointment(id, reason, 'receptionist').pipe(
      tap(() => this._refreshSubject.next(true))
    );
  }
  
  updateAppointmentDetails(id: number, details: Partial<Appointment>): Observable<Appointment> {
    return this.appointmentService.updateAppointment(id, details).pipe(
      tap(() => this._refreshSubject.next(true))
    );
  }
  
  // Receptionist can view appointment details
  getAppointmentDetails(id: number): Observable<Appointment> {
    return this.appointmentService.getAppointment(id);
  }
  
  // Helper to trigger a refresh of the appointments list
  refreshAppointments(): void {
    this._refreshSubject.next(true);
  }
}