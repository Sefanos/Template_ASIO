import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MedicalHistoryData } from '../../../features/patient/medical-record/components/medical-history/medical-history.component'; // Ajustez le chemin si nécessaire
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Importer map

@Injectable({
  providedIn: 'root'
})
export class MedicalHistoryService {
  private apiUrl = 'http://127.0.0.1:8000/api/patients'; // Assurez-vous que c'est la bonne URL de base de l'API

  constructor(private http: HttpClient) { }

  getMedicalHistory(patientId: number): Observable<MedicalHistoryData> {
    return this.http.get<{ data: MedicalHistoryData }>(`${this.apiUrl}/${patientId}/medical-history`)
      .pipe(
        map(response => response.data) // Extraire les données de la clé "data"
      );
  }
}