import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Appointment } from '../domain/models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:8000/api';  

  constructor(private http: HttpClient) {}

  getAppointmentHistory(patientId: number): Observable<Appointment[]> {
    // For now, return mock data instead of calling the API
    return of([
      {
        id: 1,
        date: '2025-05-15',
        time: '09:30',
        reason: 'Annual checkup',
        status: 'Completed',
        doctor: { id: 101, name: 'Dr. Sarah Johnson', specialty: 'General Practitioner' }
      },
      {
        id: 2,
        date: '2025-05-28',
        time: '14:00',
        reason: 'Follow-up consultation',
        status: 'Scheduled',
        doctor: { id: 102, name: 'Dr. Michael Chen', specialty: 'Cardiologist' }
      },
      {
        id: 3,
        date: '2025-04-10',
        time: '11:15',
        reason: 'Flu symptoms',
        status: 'Cancelled',
        doctor: { id: 101, name: 'Dr. Sarah Johnson', specialty: 'General Practitioner' }
      }
    ]);
  }

  bookAppointment(appointment: Appointment): Observable<Appointment> {
    // For now, return the same appointment with an ID
    return of({
      ...appointment,
      id: Math.floor(Math.random() * 1000) + 10, // Random ID for demo
      status: 'Scheduled'
    });
  }
   
  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/appointments`);  
  }

  getAppointment(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/appointments/${id}`);  
  }

  cancelAppointment(id: number): Observable<any> {
    // For now, return a success response
    return of({ status: 'success', message: 'Appointment cancelled successfully' });
  }
}
