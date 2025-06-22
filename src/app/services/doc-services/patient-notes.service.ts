import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PatientNoteResponse {
  id: number;
  type: string;
  title: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  doctorName: string;
  createdBy: string;
  canEdit: boolean;
}

export interface PatientNotesApiResponse {
  success: boolean;
  message: string;
  data: PatientNoteResponse[];
}

export interface CreatePatientNoteRequest {
  patient_id: number;
  note_type: string;
  title: string;
  content: string;
  is_private?: boolean;
  tags?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PatientNotesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Let the app keep running by returning an empty result.
      return throwError(() => error);
    };
  }
  /**
   * Get patient notes using the new /patient-notes endpoint
   * @param patientId Patient ID
   */
  getPatientNotes(patientId: number): Observable<PatientNoteResponse[]> {
    console.log(`[PatientNotesService] Fetching notes for patient ${patientId}`);
    
    return this.http.get<PatientNotesApiResponse>(`${this.apiUrl}/patient-notes`, {
      headers: this.getHeaders(),
      params: { patient_id: patientId.toString() }
    }).pipe(
      tap(response => {
        console.log(`[PatientNotesService] Received API response:`, response);
      }),      // Extract the data array from the API response
      map((response: PatientNotesApiResponse) => response.data || []),
      tap((notes: PatientNoteResponse[]) => {
        console.log(`[PatientNotesService] Extracted ${notes?.length || 0} notes:`, notes);
      }),
      catchError(this.handleError<PatientNoteResponse[]>('getPatientNotes', []))
    );
  }

  /**
   * Create a new patient note
   * @param noteData Note data to create
   */
  createPatientNote(noteData: CreatePatientNoteRequest): Observable<PatientNoteResponse> {
    console.log('[PatientNotesService] Creating new note:', noteData);
    
    return this.http.post<PatientNoteResponse>(`${this.apiUrl}/patient-notes`, noteData, {
      headers: this.getHeaders()
    }).pipe(
      tap(note => {
        console.log('[PatientNotesService] Note created successfully:', note);
      }),
      catchError(this.handleError<PatientNoteResponse>('createPatientNote'))
    );
  }

  /**
   * Update an existing patient note (if canEdit is true)
   * @param noteId Note ID
   * @param noteData Updated note data
   */
  updatePatientNote(noteId: number, noteData: Partial<CreatePatientNoteRequest>): Observable<PatientNoteResponse> {
    console.log(`[PatientNotesService] Updating note ${noteId}:`, noteData);
    
    return this.http.put<PatientNoteResponse>(`${this.apiUrl}/patient-notes/${noteId}`, noteData, {
      headers: this.getHeaders()
    }).pipe(
      tap(note => {
        console.log('[PatientNotesService] Note updated successfully:', note);
      }),
      catchError(this.handleError<PatientNoteResponse>('updatePatientNote'))
    );
  }

  /**
   * Delete a patient note (if canEdit is true)
   * @param noteId Note ID
   */
  deletePatientNote(noteId: number): Observable<void> {
    console.log(`[PatientNotesService] Deleting note ${noteId}`);
    
    return this.http.delete<void>(`${this.apiUrl}/patient-notes/${noteId}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        console.log('[PatientNotesService] Note deleted successfully');
      }),
      catchError(this.handleError<void>('deletePatientNote'))
    );
  }
}
