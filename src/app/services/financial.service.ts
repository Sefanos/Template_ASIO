import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { BillsResponse, FinancialResponse, RevenueOverviewData } from '../models/financial.model';

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get revenue overview data from the backend API
   * @param timeframe The time period to get data for (week, month, quarter, year)
   */
  getRevenueOverview(timeframe: string = 'month'): Observable<RevenueOverviewData> {
    const params = new HttpParams().set('timeframe', timeframe);
    
    return this.http.get<FinancialResponse<RevenueOverviewData>>(
      `${this.apiUrl}/analytics/revenue`, 
      { params }
    ).pipe(
      map(response => {
        // Extract data from response
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch revenue data');
      })
    );
  }

  /**
   * Get bills data from the backend API
   * @param page Page number for pagination
   * @param perPage Number of items per page
   */
  getBills(page: number = 1, perPage: number = 15): Observable<BillsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());
    
    return this.http.get<FinancialResponse<BillsResponse>>(
      `${this.apiUrl}/bills`,
      { params }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch bills data');
      })
    );
  }
}