import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ApiResponse,
  Bill,
  BillCreatePayload,
  BillItem,
  BillItemCreatePayload,
  BillItemUpdatePayload,
  BillListParams,
  Doctor,
  PaginatedResponse,
  Patient
} from '../models/bill-management.model';

@Injectable({
  providedIn: 'root'
})
export class BillManagementService {
  private apiUrl = `${environment.apiUrl}/bills`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new bill.
   * Note: The API response for POST /api/bills in the example looks like a GET list response.
   * Assuming a more typical create response where `data` directly contains the created Bill.
   */
  createBill(payload: BillCreatePayload): Observable<Bill> {
    return this.http.post<ApiResponse<Bill>>(`${this.apiUrl}`, payload).pipe(
      map(response => {
        if (response.success && response.data) {
          // If API still returns the paginated structure for a create, adjust here:
          // e.g., return (response.data as any).items[0] if data is { items: [bill], pagination: ... }
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to create bill');
        }
      })
    );
  }

  /**
   * Get a list of bills with optional filters and pagination.
   */
  getBills(params?: BillListParams): Observable<PaginatedResponse<Bill>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            httpParams = httpParams.set(key, value.join(','));
          } else {
            httpParams = httpParams.set(key, String(value));
          }
        }
      });
    }
    return this.http.get<ApiResponse<PaginatedResponse<Bill>>>(this.apiUrl, { params: httpParams }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to retrieve bills');
        }
      })
    );
  }

  /**
   * Get a single bill by its ID.
   */
  getBillById(billId: number): Observable<Bill> {
    return this.http.get<ApiResponse<Bill>>(`${this.apiUrl}/${billId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || `Failed to retrieve bill ${billId}`);
        }
      })
    );
  }

  /**
   * Get items for a specific bill.
   */
  getBillItems(billId: number): Observable<BillItem[]> {
    return this.http.get<ApiResponse<BillItem[]>>(`${this.apiUrl}/${billId}/items`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || `Failed to retrieve items for bill ${billId}`);
        }
      })
    );
  }

  /**
   * Add an item to a specific bill.
   */
  addBillItem(billId: number, itemPayload: BillItemCreatePayload): Observable<BillItem> {
    return this.http.post<ApiResponse<BillItem>>(`${this.apiUrl}/${billId}/items`, itemPayload).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || `Failed to add item to bill ${billId}`);
        }
      })
    );
  }

  /**
   * Update an item in a specific bill.
   */
  updateBillItem(billId: number, itemId: number, itemPayload: BillItemUpdatePayload): Observable<BillItem> {
    return this.http.put<ApiResponse<BillItem>>(`${this.apiUrl}/${billId}/items/${itemId}`, itemPayload).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || `Failed to update item ${itemId} for bill ${billId}`);
        }
      })
    );
  }

  /**
   * Update a bill.
   */
  updateBill(billId: number, payload: Partial<BillCreatePayload>): Observable<Bill> {
    return this.http.put<ApiResponse<Bill>>(`${this.apiUrl}/${billId}`, payload).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || `Failed to update bill ${billId}`);
        }
      })
    );
  }

  /**
   * Delete a bill.
   */
  deleteBill(billId: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${billId}`).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || `Failed to delete bill ${billId}`);
        }
      })
    );
  }

  /**
   * Delete a bill item.
   */
  deleteBillItem(billId: number, itemId: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${billId}/items/${itemId}`).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || `Failed to delete item ${itemId} from bill ${billId}`);
        }
      })
    );
  }

  /**
   * Download bill PDF.
   */
  downloadBillPdf(billId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${billId}/pdf`, {
      responseType: 'blob'
    });
  }

  /**
   * Generate PDF for a bill.
   */
  generateBillPdf(billId: number): Observable<ApiResponse<Bill>> {
    return this.http.post<ApiResponse<Bill>>(`${this.apiUrl}/${billId}/generate-pdf`, {}).pipe(
      map(response => {
        if (response.success) {
          return response;
        } else {
          throw new Error(response.message || `Failed to generate PDF for bill ${billId}`);
        }
      })
    );
  }

  /**
   * Get a list of doctors.
   */
  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctors`);
  }

  /**
   * Get a patient by ID.
   */
  getPatientById(patientId: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/patients/${patientId}`);
  }

  /**
   * Get a list of patients with optional search query.
   */
  getPatients(searchQuery?: string): Observable<Patient[]> {
    let httpParams = new HttpParams();
    if (searchQuery) {
      httpParams = httpParams.set('search', searchQuery);
    }
    return this.http.get<ApiResponse<Patient[]>>(`${environment.apiUrl}/patients`, { params: httpParams }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to retrieve patients');
        }
      })
    );
  }
}