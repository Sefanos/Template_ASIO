import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlanningService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  // 1. Voir les créneaux disponibles
  getAvailableSlots(doctor_id: number, date: string): Observable<any> {
    const params = new HttpParams().set('doctor_id', doctor_id).set('date', date);
    return this.http.get(`${this.baseUrl}/patient/appointments/doctors/available`, { params });
  }

  // 2. Créer un rendez-vous
  createAppointment(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/appointments`, payload);
  }

  // 3. Lister les rendez-vous
  getAppointments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/appointments`);
  }

  // 4. Voir un rendez-vous spécifique
  getAppointment(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/appointments/${id}`);
  }

  // 5. Mettre à jour un rendez-vous
  updateAppointment(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/appointments/${id}`, payload);
  }

  // 6. Confirmer un rendez-vous
  confirmAppointment(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/appointments/${id}/confirm`, {});
  }

  // 7. Reprogrammer un rendez-vous
  rescheduleAppointment(id: number, payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/appointments/${id}/reschedule`, payload);
  }

  // 8. Terminer un rendez-vous
  completeAppointment(id: number, notes: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/appointments/${id}/complete`, { notes });
  }

  // 9. Annuler un rendez-vous
  cancelAppointment(id: number, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/appointments/${id}/cancel`, { reason });
  }

  // 10. Supprimer un rendez-vous
  deleteAppointment(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/appointments/${id}`);
  }

  // 11. Obtenir les docteurs disponibles
  getAvailableDoctors(): Observable<any> {
    return this.http.get(`${this.baseUrl}/patient/appointments/doctors/available`);
  }

  // 12. Récupérer tous les patients
  getPatients(): Observable<any> {
    return this.http.get(`${this.baseUrl}/receptionist/patients`);
  }
}
