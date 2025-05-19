import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

 
import { Bill, PaginatedResponse } from '../domain/models/bill.model';

export interface BillFilters {
  page?: number;
  per_page?: number;
  date_from?: string;
  date_to?: string;
  sort_by?: 'issue_date' | 'amount';
  sort_direction?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root' // Ou fournissez-le dans BillsModule si vous préférez
})
export class BillService {
  private readonly API_BASE_URL = 'http://localhost:8000/api';
  
  constructor(private http: HttpClient) { }

  getPaidBills(patientId: string, filters: BillFilters = {}): Observable<PaginatedResponse<Bill>> {
    const url = `${this.API_BASE_URL}/patients/${patientId}/bills`;
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
    if (filters.date_from) params = params.set('date_from', filters.date_from);
    if (filters.date_to) params = params.set('date_to', filters.date_to);
    if (filters.sort_by) params = params.set('sort_by', filters.sort_by);
    if (filters.sort_direction) params = params.set('sort_direction', filters.sort_direction);

    return this.http.get<PaginatedResponse<Bill>>(url, { params });
  }

  // Si vous avez une route backend pour télécharger directement le PDF
  // getBillPdf(pdfLink: string): Observable<Blob> {
  //   return this.http.get(pdfLink, { responseType: 'blob' });
  // }
}