import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface PatientResponse {
  success: boolean;
  message: string;
  data: any[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  }
}

export interface Pagination {
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  // URL mis à jour pour pointer vers le nouveau endpoint
  private apiUrl = 'http://localhost:8000/api/receptionist/client-patients';

  constructor(private http: HttpClient) {}

  getPatients(page: number = 1): Observable<{patients: any[], pagination: Pagination}> {
    return this.http.get<PatientResponse>(`${this.apiUrl}?page=${page}`).pipe(
      map(response => {
        if (response.success) {
          return {
            patients: response.data.map(patient => ({
              id: patient.id,
              name: patient.name,
              email: patient.email,
              phone: patient.phone || 'Non renseigné',
              dob: patient.date_of_birth,
              gender: patient.gender,
              status: patient.status,
              photo: patient.profile_image,
              blood_group: patient.blood_type,
              nationality: patient.nationality,
              marital_status: patient.marital_status,
              address: patient.address,
              emergency_contact: patient.emergency_contact,
              showDetails: false
            })),
            pagination: response.pagination
          };
        } else {
          throw new Error(response.message || 'Erreur lors du chargement des patients');
        }
      })
    );
  }

  addPatient(patientData: FormData): Observable<any> {
    // Adapter les noms de champs au format de l'API ClientPatient
    const formDataAdapted = new FormData();
    
    // Mapper les noms de champs frontend vers ceux du backend
    const fieldMappings: {[key: string]: string} = {
      'name': 'first_name', // On peut splitter name si besoin
      'surname': 'last_name',
      'dob': 'birth_date',
      'blood_group': 'blood_group',
      'marital_status': 'civil_status',
      'photo': 'avatar_image',
      'phone': 'phone_number',
      'address': 'client_address'
    };
    
    // Transfert les données avec les bons noms de champs
    patientData.forEach((value, key) => {
      const newKey = fieldMappings[key] || key;
      formDataAdapted.append(newKey, value);
    });
    
    // Si name contient prénom et nom, on les sépare
    if (patientData.get('name')) {
      const fullName = patientData.get('name') as string;
      const nameParts = fullName.split(' ');
      
      if (nameParts.length > 1) {
        formDataAdapted.set('first_name', nameParts[0]);
        formDataAdapted.set('last_name', nameParts.slice(1).join(' '));
      } else {
        formDataAdapted.set('first_name', fullName);
        formDataAdapted.set('last_name', '');
      }
    }
    
    // Générer un mot de passe aléatoire si pas fourni
    if (!patientData.get('password')) {
      formDataAdapted.append('password', this.generateRandomPassword());
    }
    
    return this.http.post(this.apiUrl, formDataAdapted);
  }

  updatePatient(id: number, patientData: FormData): Observable<any> {
    // Adapter les noms de champs comme pour l'ajout
    const formDataAdapted = new FormData();
    
    const fieldMappings: {[key: string]: string} = {
      'name': 'first_name',
      'surname': 'last_name',
      'dob': 'birth_date',
      'blood_group': 'blood_group',
      'marital_status': 'civil_status',
      'photo': 'avatar_image',
      'phone': 'phone_number',
      'address': 'client_address'
    };
    
    patientData.forEach((value, key) => {
      const newKey = fieldMappings[key] || key;
      formDataAdapted.append(newKey, value);
    });
    
    // Gérer le nom complet si présent
    if (patientData.get('name')) {
      const fullName = patientData.get('name') as string;
      const nameParts = fullName.split(' ');
      
      if (nameParts.length > 1) {
        formDataAdapted.set('first_name', nameParts[0]);
        formDataAdapted.set('last_name', nameParts.slice(1).join(' '));
      } else {
        formDataAdapted.set('first_name', fullName);
        formDataAdapted.set('last_name', '');
      }
    }
    
    // Ajouter la méthode PUT pour Laravel
    formDataAdapted.append('_method', 'PUT');
    
    return this.http.post(`${this.apiUrl}/${id}`, formDataAdapted);
  }

  deletePatient(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}