import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  BillsResponse,
  FinancialResponse,
  MonthlyRevenueData,
  RevenueData,
  WeeklyRevenueData,
  YearlyRevenueData
} from '../models/financial.model';

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get revenue data based on time period from the backend API
   * @param period The time period to get data for (week, month, year)
   */
  getRevenueData(period: string): Observable<RevenueData> {
    return this.http.get<FinancialResponse<RevenueData>>(
      `${this.apiUrl}/analytics/revenue/${period}/current`
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || `Failed to fetch ${period} revenue data`);
      })
    );
  }

  /**
   * Get weekly revenue data
   */
  getWeeklyRevenue(): Observable<WeeklyRevenueData> {
    return this.getRevenueData('week') as Observable<WeeklyRevenueData>;
  }

  /**
   * Get monthly revenue data
   */
  getMonthlyRevenue(): Observable<MonthlyRevenueData> {
    return this.getRevenueData('month') as Observable<MonthlyRevenueData>;
  }

  /**
   * Get yearly revenue data
   */
  getYearlyRevenue(): Observable<YearlyRevenueData> {
    return this.getRevenueData('year') as Observable<YearlyRevenueData>;
  }

  /**
   * Get bills data from the backend API
   * @param page Page number for pagination
   * @param perPage Number of items per page
   * @param startDate Optional start date for filtering (YYYY-MM-DD)
   * @param endDate Optional end date for filtering (YYYY-MM-DD)
   */
  getBills(page: number = 1, perPage: number = 15, startDate?: string, endDate?: string): Observable<BillsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());
      
    // Add date range parameters if provided
    if (startDate) {
      params = params.set('start_date', startDate);
    }
    
    if (endDate) {
      params = params.set('end_date', endDate);
    }
    
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