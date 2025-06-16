import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  BillsResponse,
  FinancialResponse,
  MonthlyRevenueData,
  RevenueData,
  RevenueTimelineData,
  WeeklyRevenueData,
  YearlyRevenueData
} from '../models/financial.model';

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private apiUrl = environment.apiUrl;
  
  // Caching system
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 3 * 60 * 1000; // 3 minutes for financial data (shorter than dashboard)

  constructor(private http: HttpClient) { }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const isValid = (Date.now() - cached.timestamp) < this.cacheTimeout;
    if (!isValid) {
      this.cache.delete(key); // Clean up expired cache
    }
    return isValid;
  }

  /**
   * Get cached data
   */
  private getCachedData<T>(key: string): T | null {
    if (this.isCacheValid(key)) {
      const cached = this.cache.get(key);
      return cached?.data || null;
    }
    return null;
  }

  /**
   * Set cached data
   */
  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Generate cache key for bills with parameters
   */
  private generateBillsCacheKey(page: number, perPage: number, startDate?: string, endDate?: string): string {
    const params = [
      `page=${page}`,
      `perPage=${perPage}`,
      startDate ? `start=${startDate}` : '',
      endDate ? `end=${endDate}` : ''
    ].filter(Boolean).join('&');
    
    return `bills-${params}`;
  }

  /**
   * Generate cache key for timeline with parameters
   */
  private generateTimelineCacheKey(timeframe: string, fromDate?: string, toDate?: string): string {
    const params = [
      `timeframe=${timeframe}`,
      fromDate ? `from=${fromDate}` : '',
      toDate ? `to=${toDate}` : ''
    ].filter(Boolean).join('&');
    
    return `timeline-${params}`;
  }

  /**
   * Clear specific cache or all cache
   */
  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      console.log(`🗑️ Cleared financial cache for: ${key}`);
    } else {
      this.cache.clear();
      console.log('🗑️ Cleared all financial cache');
    }
  }

  /**
   * Force refresh specific data type
   */
  public refreshData(dataType: 'revenue' | 'bills' | 'timeline', params?: any): Observable<any> {
    switch (dataType) {
      case 'revenue':
        const period = params?.period || 'month';
        this.clearCache(`revenue-${period}-current`);
        return this.getRevenueData(period);
      case 'bills':
        const billsKey = this.generateBillsCacheKey(
          params?.page || 1,
          params?.perPage || 15,
          params?.startDate,
          params?.endDate
        );
        this.clearCache(billsKey);
        return this.getBills(params?.page, params?.perPage, params?.startDate, params?.endDate);
      case 'timeline':
        const timelineKey = this.generateTimelineCacheKey(
          params?.timeframe || 'monthly',
          params?.fromDate,
          params?.toDate
        );
        this.clearCache(timelineKey);
        return this.getRevenueTimeline(params?.timeframe, params?.fromDate, params?.toDate);
      default:
        throw new Error('Invalid data type for refresh');
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('Financial API Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.errors) {
      errorMessage = Object.values(error.error.errors).flat().join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Get revenue data based on time period from the backend API
   * @param period The time period to get data for (week, month, year)
   */
  getRevenueData(period: string): Observable<RevenueData> {
    const cacheKey = `revenue-${period}-current`;
    
    // Check cache first
    const cachedData = this.getCachedData<RevenueData>(cacheKey);
    if (cachedData) {
      console.log(`📦 Using cached ${period} revenue data`);
      return of(cachedData);
    }

    console.log(`🔄 Loading fresh ${period} revenue data...`);
    
    return this.http.get<FinancialResponse<RevenueData>>(
      `${this.apiUrl}/analytics/revenue/${period}/current`
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          this.setCachedData(cacheKey, response.data); // Cache the result
          return response.data;
        }
        throw new Error(response.message || `Failed to fetch ${period} revenue data`);
      }),
      catchError(this.handleError)
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
    const cacheKey = this.generateBillsCacheKey(page, perPage, startDate, endDate);
    
    // Check cache first
    const cachedData = this.getCachedData<BillsResponse>(cacheKey);
    if (cachedData) {
      console.log(`📦 Using cached bills data for ${cacheKey}`);
      return of(cachedData);
    }

    console.log(`🔄 Loading fresh bills data for ${cacheKey}...`);
    
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
          this.setCachedData(cacheKey, response.data); // Cache the result
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch bills data');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get revenue timeline data from the backend API
   */
  getRevenueTimeline(timeframe: string = 'monthly', fromDate?: string, toDate?: string): Observable<any> {
    const cacheKey = this.generateTimelineCacheKey(timeframe, fromDate, toDate);
    
    // Check cache first
    const cachedData = this.getCachedData<any>(cacheKey);
    if (cachedData) {
      console.log(`📦 Using cached timeline data for ${cacheKey}`);
      return of(cachedData);
    }

    console.log(`🔄 Loading fresh timeline data for ${cacheKey}...`);
    
    let params = new HttpParams()
      .set('timeframe', timeframe)
      .set('groupby', 'month');
    
    if (fromDate) {
      params = params.set('from_date', fromDate);
    }
    
    if (toDate) {
      params = params.set('to_date', toDate);
    }
    
    return this.http.get<any>(`${this.apiUrl}/analytics/revenue`, { params })
      .pipe(
        map(response => {
          console.log('Revenue API response:', response);
          if (response.success) {
            this.setCachedData(cacheKey, response.data); // Cache the result
            return response.data;
          }
          throw new Error('Failed to fetch revenue data');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get weekly timeline data
   */
  getWeeklyTimeline(): Observable<RevenueTimelineData> {
    return this.getRevenueTimeline('weekly');
  }

  /**
   * Get monthly timeline data
   */
  getMonthlyTimeline(): Observable<RevenueTimelineData> {
    return this.getRevenueTimeline('monthly');
  }

  /**
   * Get yearly timeline data
   */
  getYearlyTimeline(): Observable<RevenueTimelineData> {
    return this.getRevenueTimeline('yearly');
  }
}