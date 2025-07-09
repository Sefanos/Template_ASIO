import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BillsApiResponse } from '../models/bill.model';

export interface BillFilters {
  patient_id?: number;
  doctor_name?: string;
  payment_method?: string;
  preset_period?: string;
  per_page?: number;
  page?: number;
}

export interface CreateBillItem {
  service_type: string;
  description: string;
  price: number;
}

export interface CreateBillRequest {
  patient_id: number;
  doctor_user_id: number;
  issue_date: string;
  payment_method: string;
  description: string;
  items: CreateBillItem[];
}

export interface CreateBillResponse {
  success: boolean;
  message: string;
  data: any;
}

export interface UpdateBillRequest {
  payment_method?: string;
  description?: string;
  items?: CreateBillItem[];
}

export interface UpdateBillResponse {
  success: boolean;
  message: string;
  data: any;
}

export interface DeleteBillResponse {
  success: boolean;
  message: string;
}

export interface AddItemRequest {
  service_type: string;
  description: string;
  price: number;
}

export interface AddItemResponse {
  success: boolean;
  message: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private apiUrl = `${environment.apiUrl}/bills`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getBills(filters: BillFilters = {}): Observable<BillsApiResponse> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof BillFilters];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<BillsApiResponse>(this.apiUrl, { 
      params,
      headers: this.getHeaders()
    });
  }

  createBill(billData: CreateBillRequest): Observable<CreateBillResponse> {
    return this.http.post<CreateBillResponse>(this.apiUrl, billData, {
      headers: this.getHeaders()
    });
  }

  updateBill(billId: number, billData: UpdateBillRequest): Observable<UpdateBillResponse> {
    return this.http.put<UpdateBillResponse>(`${this.apiUrl}/${billId}`, billData, {
      headers: this.getHeaders()
    });
  }

  deleteBill(billId: number): Observable<DeleteBillResponse> {
    return this.http.delete<DeleteBillResponse>(`${this.apiUrl}/${billId}`, {
      headers: this.getHeaders()
    });
  }

  addItemToBill(billId: number, itemData: AddItemRequest): Observable<AddItemResponse> {
    return this.http.post<AddItemResponse>(`${this.apiUrl}/${billId}/items`, itemData, {
      headers: this.getHeaders()
    });
  }
}