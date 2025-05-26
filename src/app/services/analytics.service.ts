import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ActiveSessionsResponse,
  RoleStatsResponse,
  UserActivityResponse,
  UserStatsResponse
} from '../models/analytics.model';

export interface RegistrationMetrics {
  total_registrations: number;
  growth_rate: number;
  average_daily: number;
  peak_day: string;
}

export interface RegistrationData {
  dates: string[];
  counts: number[];
  metrics: RegistrationMetrics;
  timeframe: string;
}

export interface RegistrationResponse {
  success: boolean;
  data: RegistrationData;
  message?: string;
  errors?: {[key: string]: string[]};
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;
  private cacheTime = 300000; // 5 minutes in milliseconds
  
  constructor(private http: HttpClient) { }
  
  /**
   * Get current active user sessions
   * @returns Observable with active sessions data
   */
  getCurrentActiveSessions(): Observable<ActiveSessionsResponse> {
    const cacheKey = 'active-sessions';
    const cachedData = this.getCachedData<ActiveSessionsResponse>(cacheKey);
    
    // Return cached data if available and not expired (30 seconds cache)
    if (cachedData && !this.isCacheExpired(cacheKey, 30000)) {
      return of(cachedData);
    }
    
    return this.http.get<ActiveSessionsResponse>(`${this.apiUrl}/active-sessions`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.cacheData(cacheKey, response);
          }
        }),
        catchError(error => {
          console.error('Error fetching current active sessions:', error);
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Get user activity data for specified timeframe
   * @param timeframe - The time range (7d, 30d, 90d)
   * @returns Observable with user activity data
   */
  getUserActivity(timeframe: string = '30d'): Observable<UserActivityResponse> {
    const params = new HttpParams().set('timeframe', timeframe);
    const cacheKey = `user-activity-${timeframe}`;
    const cachedData = this.getCachedData<UserActivityResponse>(cacheKey);
    
    // Return cached data if available and not expired
    if (cachedData && !this.isCacheExpired(cacheKey, this.cacheTime)) {
      return of(cachedData);
    }
    
    return this.http.get<UserActivityResponse>(`${this.apiUrl}/user-activity`, { params })
      .pipe(
        tap(response => {
          if (response.success) {
            this.cacheData(cacheKey, response);
          }
        }),
        catchError(error => {
          console.error('Error fetching user activity data:', error);
          
          // Handle different error types
          if (error.status === 403) {
            return throwError(() => new Error('Permission denied: analytics:view permission required'));
          } else if (error.status === 401) {
            // Could integrate with auth service to refresh token here
            return throwError(() => new Error('Authentication expired'));
          }
          
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Get user statistics including counts by status
   * @param timeframe - The time period for statistics (day, week, month, year)
   * @param forceRefresh - Whether to bypass cache and force new data fetch
   * @returns Observable with user statistics data
   */
  getUserStats(timeframe: string = 'month', forceRefresh: boolean = false): Observable<UserStatsResponse> {
    const cacheKey = `user-stats-${timeframe}`;
    const cachedData = this.getCachedData<UserStatsResponse>(cacheKey);
    
    // Return cached data if available and not expired or refresh not forced
    if (!forceRefresh && cachedData && !this.isCacheExpired(cacheKey)) {
      return of(cachedData);
    }
    
    const params = new HttpParams().set('timeframe', timeframe);
    
    return this.http.get<UserStatsResponse>(`${this.apiUrl}/users`, { params })
      .pipe(
        tap(response => {
          if (response.success) {
            this.cacheData(cacheKey, response);
          }
        }),
        catchError(error => {
          console.error('Error fetching user statistics:', error);
          
          if (error.status === 403) {
            return throwError(() => new Error('Permission denied: analytics:view permission required'));
          } else if (error.status === 401) {
            return throwError(() => new Error('Authentication expired'));
          }
          
          return throwError(() => new Error('Failed to load user statistics'));
        })
      );
  }
  
  /**
   * Alternative method if you prefer the more specific endpoint
   */
  getUserStatusCounts(): Observable<UserStatsResponse> {
    const cacheKey = 'user-status-counts';
    const cachedData = this.getCachedData<UserStatsResponse>(cacheKey);
    
    // Return cached data if available and not expired
    if (cachedData && !this.isCacheExpired(cacheKey)) {
      return of(cachedData);
    }
    
    return this.http.get<UserStatsResponse>(`${this.apiUrl.replace('/analytics', '')}/users/counts-by-status`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.cacheData(cacheKey, response);
          }
        }),
        catchError(error => {
          console.error('Error fetching user status counts:', error);
          return throwError(() => new Error('Failed to load user status counts'));
        })
      );
  }
  
  /**
   * Get user role statistics
   * @param forceRefresh - Whether to bypass cache and force refresh
   * @returns Observable with role statistics data
   */
  getRoleStats(forceRefresh: boolean = false): Observable<RoleStatsResponse> {
    const cacheKey = 'role-stats';
    const cachedData = this.getCachedData<RoleStatsResponse>(cacheKey);
    
    // Return cached data if available and not expired or refresh not forced
    if (!forceRefresh && cachedData && !this.isCacheExpired(cacheKey)) {
      return of(cachedData);
    }
    
    return this.http.get<RoleStatsResponse>(`${this.apiUrl}/roles`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.cacheData(cacheKey, response);
          }
        }),
        catchError(error => {
          console.error('Error fetching role statistics:', error);
          
          if (error.status === 403) {
            return throwError(() => new Error('Permission denied: analytics:view permission required'));
          } else if (error.status === 401) {
            return throwError(() => new Error('Authentication expired'));
          }
          
          return throwError(() => new Error('Failed to load role statistics'));
        })
      );
  }
  
  /**
   * Get user registration statistics
   * @param timeframe - The time range (7d, 30d, 90d)
   * @returns Observable with registration data
   */
  getUserRegistrations(timeframe: string = '30d'): Observable<RegistrationResponse> {
    const cacheKey = `registrations-${timeframe}`;
    
    // If you have a caching mechanism, use it
    if (this.getCachedData && !this.isCacheExpired) {
      const cachedData = this.getCachedData<RegistrationResponse>(cacheKey);
      if (cachedData && !this.isCacheExpired(cacheKey)) {
        return of(cachedData);
      }
    }
    
    const params = new HttpParams().set('timeframe', timeframe);
    
    return this.http.get<RegistrationResponse>(`${this.apiUrl}/user-registrations`, { params })
      .pipe(
        tap(response => {
          // If you have a caching mechanism, use it
          if (response.success && this.cacheData) {
            this.cacheData(cacheKey, response);
          }
        }),
        catchError((error: any) => {
          console.error('Error fetching user registration data:', error);
          
          if (error.status === 403) {
            return throwError(() => new Error('Permission denied: analytics:view permission required'));
          } else if (error.status === 401) {
            return throwError(() => new Error('Authentication expired'));
          }
          
          return throwError(() => new Error('Failed to load registration statistics'));
        })
      );
  }
  
  /**
   * Store data in localStorage with timestamp
   */
  private cacheData<T>(key: string, data: T): void {
    const cacheItem = {
      data,
      timestamp: new Date().getTime()
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  }
  
  /**
   * Retrieve cached data from localStorage
   */
  private getCachedData<T>(key: string): T | null {
    const cacheItem = localStorage.getItem(key);
    if (!cacheItem) return null;
    
    try {
      return JSON.parse(cacheItem).data;
    } catch (e) {
      console.warn('Error parsing cached data', e);
      return null;
    }
  }
  
  /**
   * Check if cached data has expired
   */
  private isCacheExpired(key: string, maxAgeMs: number = this.cacheTime): boolean {
    const cacheItem = localStorage.getItem(key);
    if (!cacheItem) return true;
    
    try {
      const { timestamp } = JSON.parse(cacheItem);
      return (new Date().getTime() - timestamp) > maxAgeMs;
    } catch (e) {
      return true;
    }
  }
}