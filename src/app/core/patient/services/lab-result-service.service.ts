import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MedicalRecordItem } from '../../../features/patient/medical-record/medical-record.component'; // Ajustez le chemin si nécessaire

@Injectable({
  providedIn: 'root'
})
export class LabResultService { // Nom de classe simplifié de LabResultServiceService à LabResultService

  // Remplacer par votre URL d'API backend complète si elle n'est pas servie sur le même domaine/port
  // ou utiliser un chemin relatif si le frontend est servi par le même serveur que le backend (par exemple, avec un proxy)
  private apiUrl = 'http://localhost:8000/api/lab-results'; // Exemple d'URL de développement local

  constructor(private http: HttpClient) { }

  getLabResults(patientId: number): Observable<MedicalRecordItem[]> {
    // patientId n'est pas utilisé dans l'URL pour l'instant car le backend utilise un ID codé en dur.
    // Adaptez si le backend prend patientId en paramètre ou via JWT.
    // Exemple si vous deviez passer patientId en query param:
    // return this.http.get<{ data: MedicalRecordItem[] }>(`${this.apiUrl}?patient_id=${patientId}`).pipe(
    return this.http.get<{ data: MedicalRecordItem[] }>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }
}