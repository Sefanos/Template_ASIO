import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PatientFile {
  id: number;
  type: 'document' | 'image';
  category: string;
  originalFilename: string;
  description: string | null;
  fileSize: number;
  fileSizeFormatted: string;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  isVisibleToPatient: boolean;
  downloadUrl: string;
  categoryLabel: string;
  typeIcon: string;
}

export interface PatientFilesResponse {
  success: boolean;
  message: string;
  data: PatientFile[];
}

export interface FileCategoriesResponse {
  success: boolean;
  message: string;
  data: { [key: string]: string };
}

export interface UploadFileRequest {
  patient_id: number;
  category: string;
  description?: string;
  file_type: 'document' | 'image';
  file: File;
}

@Injectable({
  providedIn: 'root'
})
export class PatientFilesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private getUploadHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
      // Don't set Content-Type for file uploads - let browser set it
    });
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return throwError(() => error);
    };
  }

  /**
   * Get all files for a patient
   * @param patientId Patient ID
   */
  getPatientFiles(patientId: number): Observable<PatientFile[]> {
    console.log(`[PatientFilesService] Fetching files for patient ${patientId}`);
    
    return this.http.get<PatientFilesResponse>(`${this.apiUrl}/patient-files`, {
      headers: this.getHeaders(),
      params: { patient_id: patientId.toString() }
    }).pipe(
      map(response => {
        console.log(`[PatientFilesService] Raw API response:`, response);
        return response.data || [];
      }),
      tap(files => {
        console.log(`[PatientFilesService] Received ${files?.length || 0} files:`, files);
      }),
      catchError(this.handleError<PatientFile[]>('getPatientFiles', []))
    );
  }

  /**
   * Get patient files filtered by type
   * @param patientId Patient ID
   * @param fileType Filter by file type ('document' or 'image')
   */
  getPatientFilesByType(patientId: number, fileType: 'document' | 'image'): Observable<PatientFile[]> {
    return this.getPatientFiles(patientId).pipe(
      map(files => files.filter(file => file.type === fileType))
    );
  }

  /**
   * Get patient files filtered by category
   * @param patientId Patient ID
   * @param category Filter by category
   */
  getPatientFilesByCategory(patientId: number, category: string): Observable<PatientFile[]> {
    return this.getPatientFiles(patientId).pipe(
      map(files => files.filter(file => file.category === category))
    );
  }

  /**
   * Get available file categories
   */
  getFileCategories(): Observable<{ [key: string]: string }> {
    console.log('[PatientFilesService] Fetching file categories');
    
    return this.http.get<FileCategoriesResponse>(`${this.apiUrl}/patient-files-categories`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('[PatientFilesService] Categories response:', response);
        return response.data || {};
      }),
      tap(categories => {
        console.log('[PatientFilesService] Available categories:', categories);
      }),
      catchError(this.handleError<{ [key: string]: string }>('getFileCategories', {}))
    );
  }
  /**
   * Upload a file for a patient
   * @param uploadData Upload request data
   */
  uploadPatientFile(uploadData: UploadFileRequest): Observable<PatientFile> {
    console.log('[PatientFilesService] Uploading file:', {
      patient_id: uploadData.patient_id,
      category: uploadData.category,
      file_type: uploadData.file_type,
      filename: uploadData.file.name,
      size: uploadData.file.size,
      mimeType: uploadData.file.type
    });

    const formData = new FormData();
    formData.append('patient_id', uploadData.patient_id.toString());
    formData.append('category', uploadData.category);
    formData.append('file_type', uploadData.file_type);
    formData.append('file', uploadData.file, uploadData.file.name);
    
    if (uploadData.description && uploadData.description.trim()) {
      formData.append('description', uploadData.description.trim());
    }

    // Log the FormData contents for debugging
    console.log('[PatientFilesService] FormData contents:');
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
      } else {
        console.log(`${key}: ${value}`);
      }
    });

    return this.http.post<any>(`${this.apiUrl}/patient-files`, formData, {
      headers: this.getUploadHeaders()
    }).pipe(
      map(response => {
        // Handle both direct file response and wrapped response
        console.log('[PatientFilesService] Upload response:', response);
        if (response.data) {
          return response.data; // Wrapped response
        }
        return response; // Direct file response
      }),
      tap(file => {
        console.log('[PatientFilesService] File uploaded successfully:', file);
      }),
      catchError((error) => {
        console.error('[PatientFilesService] Upload error details:', error);
        if (error.error && error.error.message) {
          console.error('Error message:', error.error.message);
        }
        if (error.error && error.error.errors) {
          console.error('Validation errors:', error.error.errors);
        }
        return this.handleError<PatientFile>('uploadPatientFile')(error);
      })
    );
  }

  /**
   * Download a patient file
   * @param fileId File ID
   */
  downloadPatientFile(fileId: number): Observable<Blob> {
    console.log(`[PatientFilesService] Downloading file ${fileId}`);
    
    return this.http.get(`${this.apiUrl}/patient-files/${fileId}/download`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      tap(() => {
        console.log('[PatientFilesService] File downloaded successfully');
      }),
      catchError(this.handleError<Blob>('downloadPatientFile'))
    );
  }

  /**
   * Delete a patient file
   * @param fileId File ID
   */
  deletePatientFile(fileId: number): Observable<void> {
    console.log(`[PatientFilesService] Deleting file ${fileId}`);
    
    return this.http.delete<void>(`${this.apiUrl}/patient-files/${fileId}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        console.log('[PatientFilesService] File deleted successfully');
      }),
      catchError(this.handleError<void>('deletePatientFile'))
    );
  }

  /**
   * Update file metadata
   * @param fileId File ID
   * @param metadata Updated metadata
   */
  updatePatientFile(fileId: number, metadata: { description?: string; category?: string }): Observable<PatientFile> {
    console.log(`[PatientFilesService] Updating file ${fileId}:`, metadata);
    
    return this.http.put<PatientFile>(`${this.apiUrl}/patient-files/${fileId}`, metadata, {
      headers: this.getHeaders()
    }).pipe(
      tap(file => {
        console.log('[PatientFilesService] File updated successfully:', file);
      }),
      catchError(this.handleError<PatientFile>('updatePatientFile'))
    );
  }

  /**
   * Get file type icon
   * @param file Patient file
   */
  getFileTypeIcon(file: PatientFile): string {
    if (file.typeIcon) {
      return file.typeIcon;
    }

    // Fallback logic based on mime type or category
    if (file.type === 'image') {
      return 'image';
    }

    if (file.mimeType?.includes('pdf')) {
      return 'file-pdf';
    }

    if (file.mimeType?.includes('word') || file.mimeType?.includes('document')) {
      return 'file-word';
    }

    if (file.mimeType?.includes('excel') || file.mimeType?.includes('spreadsheet')) {
      return 'file-excel';
    }

    return 'file';
  }

  /**
   * Format file size
   * @param bytes File size in bytes
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
