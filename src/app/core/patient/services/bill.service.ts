// filepath: c:\Users\Microsoft\Documents\portail\Template_ASIO\src\app\core\patient\services\bill.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Bill, FrontendPaginatedResponse, PaginatedBillResponse } from '../domain/models/bill.model';


// Define new filters based on backend capabilities for /patient/bills
// The backend controller for getMyBills only shows: 'date_from', 'date_to', 'sort_by', 'sort_direction'
export interface BillFilters {
  page?: number;
  per_page?: number;
  date_from?: string;
  date_to?: string;
  sort_by?: 'issue_date' | 'amount' | 'doctor_name' | 'bill_number'; // Adjusted sortable fields
  sort_direction?: 'asc' | 'desc';
  // status?: string; // Status filter removed as per new API
}

interface BackendResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private readonly API_BASE_URL = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  getBills(filters: BillFilters = {}): Observable<FrontendPaginatedResponse<Bill>> {
    const url = `${this.API_BASE_URL}/patient/bills`; // Updated endpoint
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
    if (filters.date_from) params = params.set('date_from', filters.date_from);
    if (filters.date_to) params = params.set('date_to', filters.date_to);
    if (filters.sort_by) params = params.set('sort_by', filters.sort_by);
    if (filters.sort_direction) params = params.set('sort_direction', filters.sort_direction);
    // if (filters.status) params = params.set('status', filters.status); // Status filter removed

    return this.http.get<BackendResponse<PaginatedBillResponse>>(url, { params }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to retrieve bills');
        }
        // Transform backend response to the structure frontend components expect
        return {
          data: response.data.items.map(bill => ({
            ...bill,
            amount: parseFloat(bill.amount as any) // Ensure amount is a number
          })),
          current_page: response.data.pagination.current_page,
          from: response.data.pagination.from,
          last_page: response.data.pagination.last_page,
          next_page_url: response.data.pagination.next_page_url || null,
          path: response.data.pagination.path,
          per_page: response.data.pagination.per_page,
          prev_page_url: response.data.pagination.prev_page_url || null,
          to: response.data.pagination.to,
          total: response.data.pagination.total,
          first_page_url: response.data.pagination.first_page_url,
          last_page_url: response.data.pagination.last_page_url,
          links: response.data.pagination.links
        };
      })
    );
  }

  getBillDetails(billId: number): Observable<Bill> {
    const url = `${this.API_BASE_URL}/patient/bills/${billId}`;
    return this.http.get<BackendResponse<Bill>>(url).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || `Failed to retrieve bill details for ID ${billId}`);
        }
        // Ensure amount and item prices/totals are numbers
        const billData = response.data;
        return {
          ...billData,
          amount: parseFloat(billData.amount as any),
          items: billData.items.map(item => ({
            ...item,
            price: parseFloat(item.price as any),
            total: parseFloat(item.total as any),
          }))
        };
      })
    );
  }

  /**
   * Downloads the PDF receipt for a specific bill for the authenticated patient.
   * Uses the new dedicated patient receipt endpoint.
   */
  downloadPatientBillReceipt(billId: number): Observable<Blob> {
    const url = `${this.API_BASE_URL}/patient/bills/${billId}/receipt`; // Corrected endpoint for patient receipt
    return this.http.get(url, { responseType: 'blob' });
  }


   /**
   * @deprecated Use downloadPatientBillReceipt for patient-specific downloads.
   * This method might be for admin/staff if the /bills/{bill_id}/download-pdf endpoint is still used by them.
   */
  downloadBillPdf(billId: number): Observable<Blob> {
    // This endpoint /bills/{bill_id}/download-pdf is likely for staff/admin.
    // For patients, use downloadPatientBillReceipt.
    // If this is indeed intended for other roles, it can remain.
    // Otherwise, it should be updated or removed if patients only use the /receipt endpoint.
    const url = `${this.API_BASE_URL}/bills/${billId}/download-pdf`; // Original endpoint
    console.warn("downloadBillPdf is called. For patient receipts, consider using downloadPatientBillReceipt.");
    return this.http.get(url, { responseType: 'blob' });
  }

}