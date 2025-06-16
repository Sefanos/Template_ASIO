import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ActiveSessionsResponse,
  BillsResponse,
  DoctorRevenueResponse,
  RegistrationResponse,
  RevenueTimeframeResponse,
  RoleStatsResponse,
  ServiceBreakdownResponse,
  UserActivityResponse,
  UserStatsResponse
} from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;
  private billsUrl = `${environment.apiUrl}/bills`;
  
  // Enhanced caching system
  private cache = new Map<string, { data: any; timestamp: number }>();
  private defaultCacheTimeout = 5 * 60 * 1000; // 5 minutes
  private sessionsCacheTimeout = 30 * 1000; // 30 seconds for active sessions
  
  constructor(private http: HttpClient) { }
  
  /**
   * Check if cached data is still valid
   */
  private isCacheValid(key: string, customTimeout?: number): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const timeout = customTimeout || this.defaultCacheTimeout;
    const isValid = (Date.now() - cached.timestamp) < timeout;
    
    if (!isValid) {
      this.cache.delete(key); // Clean up expired cache
    }
    return isValid;
  }

  /**
   * Get cached data
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    return cached?.data || null;
  }

  /**
   * Set cached data
   */
  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Generate cache key with parameters
   */
  private generateCacheKey(base: string, params?: Record<string, any>): string {
    if (!params) return base;
    
    const paramString = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    return paramString ? `${base}-${paramString}` : base;
  }

  /**
   * Clear specific cache or all cache
   */
  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      console.log(`🗑️ Cleared analytics cache for: ${key}`);
    } else {
      this.cache.clear();
      console.log('🗑️ Cleared all analytics cache');
    }
  }

  /**
   * Force refresh specific data type
   */
  public refreshData(dataType: string, params?: any): Observable<any> {
    // Clear relevant cache entries
    const cacheKeys = Array.from(this.cache.keys()).filter(key => key.startsWith(dataType));
    cacheKeys.forEach(key => this.cache.delete(key));
    
    // Refetch data based on type
    switch (dataType) {
      case 'active-sessions':
        return this.getCurrentActiveSessions();
      case 'user-activity':
        return this.getUserActivity(params?.timeframe);
      case 'user-stats':
        return this.getUserStats(params?.timeframe, true);
      case 'role-stats':
        return this.getRoleStats(true);
      case 'registrations':
        return this.getUserRegistrations(params?.timeframe);
      case 'doctor-revenue':
        return this.getDoctorRevenue(params?.fromDate, params?.toDate, true);
      case 'service-breakdown':
        return this.getServiceBreakdown();
      default:
        throw new Error('Invalid data type for refresh');
    }
  }

  /**
   * Handle HTTP errors consistently
   */
  private handleError(error: any, context: string): Observable<never> {
    console.error(`Error in ${context}:`, error);
    
    let errorMessage = `Failed to load ${context}`;
    
    if (error.status === 403) {
      errorMessage = 'Permission denied: analytics:view permission required';
    } else if (error.status === 401) {
      errorMessage = 'Authentication expired';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
  
  /**
   * Get current active user sessions
   * @returns Observable with active sessions data
   */
  getCurrentActiveSessions(): Observable<ActiveSessionsResponse> {
    const cacheKey = 'active-sessions';
    
    // Check cache first (with shorter timeout for real-time data)
    const cachedData = this.getCachedData<ActiveSessionsResponse>(cacheKey);
    if (cachedData && this.isCacheValid(cacheKey, this.sessionsCacheTimeout)) {
      console.log('📦 Using cached active sessions data');
      return of(cachedData);
    }

    console.log('🔄 Loading fresh active sessions data...');
    
    return this.http.get<ActiveSessionsResponse>(`${this.apiUrl}/active-sessions`)
      .pipe(
        map(response => {
          if (response.success) {
            this.setCachedData(cacheKey, response);
            return response;
          }
          throw new Error('Failed to fetch active sessions');
        }),
        catchError(error => this.handleError(error, 'active sessions'))
      );
  }
  
  /**
   * Get user activity data for specified timeframe
   * @param timeframe - The time range (7d, 30d, 90d)
   * @returns Observable with user activity data
   */
  getUserActivity(timeframe: string = '30d'): Observable<UserActivityResponse> {
    const cacheKey = this.generateCacheKey('user-activity', { timeframe });
    
    // Check cache first
    const cachedData = this.getCachedData<UserActivityResponse>(cacheKey);
    if (cachedData && this.isCacheValid(cacheKey)) {
      console.log(`📦 Using cached user activity data for ${timeframe}`);
      return of(cachedData);
    }

    console.log(`🔄 Loading fresh user activity data for ${timeframe}...`);
    
    const params = new HttpParams().set('timeframe', timeframe);
    
    return this.http.get<UserActivityResponse>(`${this.apiUrl}/user-activity`, { params })
      .pipe(
        map(response => {
          if (response.success) {
            this.setCachedData(cacheKey, response);
            return response;
          }
          throw new Error('Failed to fetch user activity data');
        }),
        catchError(error => this.handleError(error, 'user activity'))
      );
  }
  
  /**
   * Get user statistics including counts by status
   * @param timeframe - The time period for statistics (day, week, month, year)
   * @param forceRefresh - Whether to bypass cache and force new data fetch
   * @returns Observable with user statistics data
   */
  getUserStats(timeframe: string = 'month', forceRefresh: boolean = false): Observable<UserStatsResponse> {
    const cacheKey = this.generateCacheKey('user-stats', { timeframe });
    
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedData = this.getCachedData<UserStatsResponse>(cacheKey);
      if (cachedData && this.isCacheValid(cacheKey)) {
        console.log(`📦 Using cached user stats for ${timeframe}`);
        return of(cachedData);
      }
    }

    console.log(`🔄 Loading fresh user stats for ${timeframe}...`);
    
    const params = new HttpParams().set('timeframe', timeframe);
    
    return this.http.get<UserStatsResponse>(`${this.apiUrl}/users`, { params })
      .pipe(
        map(response => {
          if (response.success) {
            this.setCachedData(cacheKey, response);
            return response;
          }
          throw new Error('Failed to fetch user statistics');
        }),
        catchError(error => this.handleError(error, 'user statistics'))
      );
  }
  
  /**
   * Alternative method for user status counts
   */
  getUserStatusCounts(): Observable<UserStatsResponse> {
    const cacheKey = 'user-status-counts';
    
    // Check cache first
    const cachedData = this.getCachedData<UserStatsResponse>(cacheKey);
    if (cachedData && this.isCacheValid(cacheKey)) {
      console.log('📦 Using cached user status counts');
      return of(cachedData);
    }

    console.log('🔄 Loading fresh user status counts...');
    
    return this.http.get<UserStatsResponse>(`${this.apiUrl.replace('/analytics', '')}/users/counts-by-status`)
      .pipe(
        map(response => {
          if (response.success) {
            this.setCachedData(cacheKey, response);
            return response;
          }
          throw new Error('Failed to fetch user status counts');
        }),
        catchError(error => this.handleError(error, 'user status counts'))
      );
  }
  
  /**
   * Get user role statistics
   * @param forceRefresh - Whether to bypass cache and force refresh
   * @returns Observable with role statistics data
   */
  getRoleStats(forceRefresh: boolean = false): Observable<RoleStatsResponse> {
    const cacheKey = 'role-stats';
    
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedData = this.getCachedData<RoleStatsResponse>(cacheKey);
      if (cachedData && this.isCacheValid(cacheKey)) {
        console.log('📦 Using cached role stats');
        return of(cachedData);
      }
    }

    console.log('🔄 Loading fresh role stats...');
    
    return this.http.get<RoleStatsResponse>(`${this.apiUrl}/roles`)
      .pipe(
        map(response => {
          if (response.success) {
            this.setCachedData(cacheKey, response);
            return response;
          }
          throw new Error('Failed to fetch role statistics');
        }),
        catchError(error => this.handleError(error, 'role statistics'))
      );
  }
  
  /**
   * Get user registration statistics
   * @param timeframe - The time range (7d, 30d, 90d)
   * @returns Observable with registration data
   */
  getUserRegistrations(timeframe: string = '30d'): Observable<RegistrationResponse> {
    const cacheKey = this.generateCacheKey('registrations', { timeframe });
    
    // Check cache first
    const cachedData = this.getCachedData<RegistrationResponse>(cacheKey);
    if (cachedData && this.isCacheValid(cacheKey)) {
      console.log(`📦 Using cached registration data for ${timeframe}`);
      return of(cachedData);
    }

    console.log(`🔄 Loading fresh registration data for ${timeframe}...`);
    
    const params = new HttpParams().set('timeframe', timeframe);
    
    return this.http.get<RegistrationResponse>(`${this.apiUrl}/user-registrations`, { params })
      .pipe(
        map(response => {
          if (response.success) {
            this.setCachedData(cacheKey, response);
            return response;
          }
          throw new Error('Failed to fetch registration statistics');
        }),
        catchError(error => this.handleError(error, 'registration statistics'))
      );
  }

  /**
   * Get doctor revenue analytics with date range filtering
   * @param fromDate - Start date for filtering revenue data
   * @param toDate - End date for filtering revenue data
   * @param forceRefresh - Whether to bypass cache and force refresh
   * @returns Observable with doctor revenue data
   */
  getDoctorRevenue(fromDate?: string, toDate?: string, forceRefresh: boolean = false): Observable<DoctorRevenueResponse> {
    const cacheKey = this.generateCacheKey('doctor-revenue', { fromDate, toDate });
    
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedData = this.getCachedData<DoctorRevenueResponse>(cacheKey);
      if (cachedData && this.isCacheValid(cacheKey)) {
        console.log(`📦 Using cached doctor revenue data`);
        return of(cachedData);
      }
    }

    console.log('🔄 Loading fresh doctor revenue data...');
    
    let params = new HttpParams();
    if (fromDate) params = params.set('from_date', fromDate);
    if (toDate) params = params.set('to_date', toDate);
    
    return this.http.get<DoctorRevenueResponse>(`${this.apiUrl}/doctor-revenue`, { params })
      .pipe(
        map(response => {
          if (response.success) {
            this.setCachedData(cacheKey, response);
            return response;
          }
          throw new Error('Failed to fetch doctor revenue data');
        }),
        catchError(error => this.handleError(error, 'doctor revenue'))
      );
  }

  /**
   * Get service breakdown analytics
   * @returns Observable with service breakdown data
   */
  getServiceBreakdown(): Observable<ServiceBreakdownResponse> {
    const cacheKey = 'service-breakdown';
    
    // Check cache first
    const cachedData = this.getCachedData<ServiceBreakdownResponse>(cacheKey);
    if (cachedData && this.isCacheValid(cacheKey)) {
      console.log('📦 Using cached service breakdown data');
      return of(cachedData);
    }

    console.log('🔄 Loading fresh service breakdown data...');
    
    return this.http.get<ServiceBreakdownResponse>(`${this.apiUrl}/services`)
      .pipe(
        map(response => {
          if (response.success) {
            this.setCachedData(cacheKey, response);
            return response;
          }
          throw new Error('Failed to fetch service breakdown data');
        }),
        catchError(error => this.handleError(error, 'service breakdown'))
      );
  }

  /**
   * Get doctor revenue by timeframe (month/year)
   * @param timeframe - The timeframe (month/year)
   * @param period - The period (current/previous)
   * @param doctorId - Optional doctor ID filter
   * @param doctorName - Optional doctor name filter
   * @returns Observable with revenue timeframe data
   */
  getDoctorRevenueByTimeframe(
    timeframe: 'month' | 'year',
    period: 'current' | 'previous' = 'current',
    doctorId?: number,
    doctorName?: string
  ): Observable<RevenueTimeframeResponse> {
    const cacheKey = this.generateCacheKey(`doctor-revenue-${timeframe}-${period}`, { doctorId, doctorName });
    
    // Check cache first
    const cachedData = this.getCachedData<RevenueTimeframeResponse>(cacheKey);
    if (cachedData && this.isCacheValid(cacheKey)) {
      console.log(`📦 Using cached ${timeframe} revenue data for ${period}`);
      return of(cachedData);
    }

    console.log(`🔄 Loading fresh ${timeframe} revenue data for ${period}...`);
    
    let params = new HttpParams();
    if (doctorId) params = params.set('doctor_id', doctorId.toString());
    if (doctorName) params = params.set('doctor_name', doctorName);
    
    return this.http.get<RevenueTimeframeResponse>(
      `${this.apiUrl}/revenue/${timeframe}/${period}`,
      { params }
    ).pipe(
      map(response => {
        if (response.success) {
          this.setCachedData(cacheKey, response);
          return response;
        }
        throw new Error(`Failed to fetch ${timeframe} revenue data`);
      }),
      catchError(error => this.handleError(error, `${timeframe} revenue`))
    );
  }

  /**
   * Get bills by doctor
   * @param doctorId - Doctor ID to filter by
   * @param doctorName - Doctor name to filter by
   * @returns Observable with bills data
   */
  getBillsByDoctor(doctorId?: number, doctorName?: string): Observable<BillsResponse> {
    if (!doctorId && !doctorName) {
      return throwError(() => new Error('Either doctorId or doctorName must be provided'));
    }
    
    const cacheKey = this.generateCacheKey('bills-by-doctor', { doctorId, doctorName });
    
    // Check cache first
    const cachedData = this.getCachedData<BillsResponse>(cacheKey);
    if (cachedData && this.isCacheValid(cacheKey)) {
      console.log('📦 Using cached bills by doctor data');
      return of(cachedData);
    }

    console.log('🔄 Loading fresh bills by doctor data...');
    
    let params = new HttpParams();
    if (doctorId) params = params.set('doctor_id', doctorId.toString());
    if (doctorName) params = params.set('doctor_name', doctorName);
    
    return this.http.get<BillsResponse>(this.billsUrl, { params })
      .pipe(
        map(response => {
          this.setCachedData(cacheKey, response);
          return response;
        }),
        catchError(error => this.handleError(error, 'doctor bills'))
      );
  }
}