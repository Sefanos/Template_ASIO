import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AppointmentService } from './appointment.service';
import { Appointment, AppointmentStatus, AppointmentType } from '../../../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class DoctorAppointmentService {
  // State management with signals
  private _selectedDate = signal<Date>(new Date());
  private _currentView = signal<string>('dayGridDay');
  private _filteredAppointments = signal<Appointment[]>([]);
  
  // Public API
  public selectedDate = this._selectedDate.asReadonly();
  public currentView = this._currentView.asReadonly();
  public filteredAppointments = this._filteredAppointments.asReadonly();

  constructor(private appointmentService: AppointmentService) {}
  
  // Doctor-specific methods
  getDoctorAppointments(params: any = {}): Observable<Appointment[]> {
    const doctorId = this.getCurrentDoctorId();
    const filters = { doctorId, ...params };
    
    return this.appointmentService.getAppointments(filters).pipe(
      tap(appointments => this._filteredAppointments.set(appointments))
    );
  }
  
  getAppointmentsForDay(date: Date): Observable<Appointment[]> {
    this._selectedDate.set(date);
    
    const formattedDate = date.toISOString().split('T')[0];
    const doctorId = this.getCurrentDoctorId();
    
    return this.appointmentService.getAppointments({ 
      doctorId, 
      startDate: formattedDate,
      endDate: formattedDate
    }).pipe(
      tap(appointments => this._filteredAppointments.set(appointments))
    );
  }
  
  completeAppointment(id: number, notes: string[]): Observable<Appointment> {
    return this.appointmentService.completeAppointment(id, notes).pipe(
      tap(updatedAppointment => {
        // Update the local cache
        const currentAppointments = this._filteredAppointments();
        const updatedList = currentAppointments.map(appt => 
          appt.id === id ? updatedAppointment : appt
        );
        this._filteredAppointments.set(updatedList);
      })
    );
  }
  
  markNoShow(id: number): Observable<Appointment> {
    return this.appointmentService.updateAppointment(id, { status: AppointmentStatus.NoShow });
  }
  
  addBlockedTime(blockData: Partial<Appointment>): Observable<Appointment> {
    const doctorId = this.getCurrentDoctorId();
    
    const blockAppointment: Partial<Appointment> = {
      ...blockData,
      doctorId,
      isBlockedTime: true,
      type: AppointmentType.BlockedTime,
      status: AppointmentStatus.Confirmed,
      reason: blockData.reason || 'Time blocked',
      patientId: 0, // No patient for blocked time
      patientName: 'Blocked'
    };
    
    return this.appointmentService.createAppointment(blockAppointment);
  }
  
  cancelDoctorAppointment(id: number, reason: string): Observable<Appointment> {
    return this.appointmentService.cancelAppointment(id, reason, 'doctor');
  }
  
  rescheduleDoctorAppointment(id: number, date: string, time: string): Observable<Appointment> {
    return this.appointmentService.rescheduleAppointment(id, date, time);
  }
  
  // Calendar view methods
  setCurrentView(view: string): void {
    this._currentView.set(view);
  }
  
  setSelectedDate(date: Date): void {
    this._selectedDate.set(date);
    this.getAppointmentsForDay(date).subscribe();
  }
  
  // This would typically come from authentication service
  private getCurrentDoctorId(): number {
    // Replace with actual logic to get the current doctor's ID
    return 201;
  }
}