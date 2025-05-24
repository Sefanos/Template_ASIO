import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
    ActiveSessionsResponse,
    UserActivityResponse
} from '../models/analytics.model';

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