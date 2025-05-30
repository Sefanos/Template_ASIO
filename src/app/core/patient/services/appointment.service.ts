import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { delay } from 'rxjs/operators';
export interface Appointment {
  id: number;
  date: string;     
  time: string;    
  reason: string;
  status: string;
  doctorName: string;
  doctorSpecialty?: string;
  cancelReason?: string;
  location?: string;
  followUp?: boolean;
  notes?: string[];
}
@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:8000/api';  
private mockAppointments: Appointment[] = [
    {
      id: 1,
      date: '2025-06-10',
      time: '09:30 AM',
      reason: 'Annual check-up',
      status: 'Confirmed',
      doctorName: 'Dr. Sarah Johnson',
      doctorSpecialty: 'General Medicine',
      location: 'Main Medical Center, Room 304'
    },
        {
      id: 2,
      date: '2025-05-15',
      time: '10:45 AM',
      reason: 'Headache and fatigue follow-up',
      status: 'Completed',
      doctorName: 'Dr. Sarah Johnson',
      doctorSpecialty: 'General Medicine',
      location: 'Main Medical Center, Room 304',
      notes: ['Patient reports improvement with prescribed medication', 'Advised to continue current treatment for 2 more weeks']
    },
     {
      id: 3,
      date: '2025-05-01',
      time: '02:00 PM',
      reason: 'Flu symptoms',
      status: 'Cancelled',
      doctorName: 'Dr. Michael Chen',
      doctorSpecialty: 'Internal Medicine',
      location: 'Downtown Clinic',
      cancelReason: 'Cancelled by patient - feeling better'
    },
        {
      id: 4,
      date: '2025-07-20',
      time: '11:15 AM',
      reason: 'Blood pressure monitoring',
      status: 'Pending',
      doctorName: 'Dr. Sarah Johnson',
      doctorSpecialty: 'General Medicine'
    },
        {
      id: 5,
      date: '2025-04-05',
      time: '03:30 PM',
      reason: 'Joint pain consultation',
      status: 'Completed',
      doctorName: 'Dr. Emily Rodriguez',
      doctorSpecialty: 'Rheumatology',
      location: 'Specialty Care Center, Floor 2',
      followUp: true,
      notes: ['Discussed treatment options', 'Prescribed anti-inflammatory medication']
    },
        {
      id: 6,
      date: '2025-06-25',
      time: '01:00 PM',
      reason: 'Dermatology consultation',
      status: 'Confirmed',
      doctorName: 'Dr. James Wilson',
      doctorSpecialty: 'Dermatology',
      location: 'Dermatology Clinic'
    },
        {
      id: 7,
      date: '2025-07-12',
      time: '09:00 AM',
      reason: 'Follow-up after medication change',
      status: 'Pending',
      doctorName: 'Dr. Sarah Johnson',
      doctorSpecialty: 'General Medicine',
      followUp: true
    }
  ];
  constructor(private http: HttpClient) {}

 getAppointmentHistory(): Observable<Appointment[]> {
  
    // Plus besoin de passer un patientId - le backend utilise le premier patient
    // return this.http.get<Appointment[]>(`${this.apiUrl}/appointments/history`)
    //   .pipe(
    //     map(response => response || [])
    //   );

    // Simuler un délai de réseau pour montrer le chargement
    return of([...this.mockAppointments]).pipe(delay(1000));
  }

   
  getAppointments(): Observable<Appointment[]> {
    // return this.http.get<Appointment[]>(`${this.apiUrl}/appointments`)
    //   .pipe(
    //     map(response => response || [])
    //   );

    return of([...this.mockAppointments]).pipe(delay(800));
  }


getAppointment(id: number): Observable<Appointment | undefined> {
  // getAppointment(id: number): Observable<any> {
    // return this.http.get<any>(`${this.apiUrl}/appointments/${id}`);  
     const appointment = this.mockAppointments.find(a => a.id === id);
    return of(appointment).pipe(delay(500));
  }

  cancelAppointment(id: number, reason?: string): Observable<any> {
    // return this.http.post<any>(`${this.apiUrl}/appointments/${id}/cancel`, { reason });
  
      // Simuler l'annulation en modifiant les données locales
    const index = this.mockAppointments.findIndex(a => a.id === id);
    if (index !== -1) {
      this.mockAppointments[index].status = 'Cancelled';
      this.mockAppointments[index].cancelReason = reason;
    }
    return of({ success: true }).pipe(delay(800));
  }
  
  rescheduleAppointment(id: number, newDate: string, newTimeSlotId: number): Observable<any> {
    // return this.http.post<any>(`${this.apiUrl}/appointments/${id}/reschedule`, {
    //   date: newDate,
    //   time_slot_id: newTimeSlotId
    // });

     // Simuler la reprogrammation
    const index = this.mockAppointments.findIndex(a => a.id === id);
    if (index !== -1) {
      this.mockAppointments[index].date = newDate;
      // Simuler un changement d'heure basé sur newTimeSlotId
      const times = ['09:00 AM', '10:30 AM', '01:00 PM', '03:30 PM', '05:00 PM'];
      this.mockAppointments[index].time = times[newTimeSlotId % times.length];
    }
    return of({ success: true }).pipe(delay(800));
  }



  getAppointmentDetails(id: number): Observable<Partial<Appointment>> {
    // return this.http.get<Partial<Appointment>>(`${this.apiUrl}/appointments/${id}`)
    //   .pipe(
    //     map(response => response || {})
    //   );

     // Simuler la récupération de détails supplémentaires
    const appointment = this.mockAppointments.find(a => a.id === id);
    
    // Ajouter des détails supplémentaires qui seraient normalement chargés séparément
    const additionalDetails: Partial<Appointment> = appointment ? {
      doctorSpecialty: appointment.doctorSpecialty || 'General Practice',
      location: appointment.location || 'Main Medical Center',
      notes: appointment.notes || ['No additional notes available'],
      followUp: appointment.followUp !== undefined ? appointment.followUp : false
    } : {};
    
    return of(additionalDetails).pipe(delay(800));
  
  }
}
