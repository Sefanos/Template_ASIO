import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Note } from '../domain/models/note.model';
import { environment } from '../../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class NoteService { 
  private apiUrl = environment.apiUrl + '/patient/medical/notes';

  constructor(private http: HttpClient) {}

  getPatientNotes(): Observable<Note[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => response.data as Note[])
    );
  }
}
