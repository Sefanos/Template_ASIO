import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { 
  Notification, 
  NotificationResponse, 
  UnreadCountResponse, 
  NotificationActionResponse,
  UpcomingReminder,
  UpcomingRemindersResponse
} from '../../../models/notification.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl; // Adjust to your backend URL
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);

  // Public observables
  unreadCount$ = this.unreadCountSubject.asObservable();
  notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUnreadCount();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Adjust based on your auth implementation
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  /**
   * Get user's notifications with pagination
   */
  getNotifications(page: number = 1, perPage: number = 10): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(
      `${this.apiUrl}/notifications?page=${page}&per_page=${perPage}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        this.notificationsSubject.next(response.data);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(
      `${this.apiUrl}/notifications/unread-count`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        this.unreadCountSubject.next(response.unread_count);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get upcoming reminders for the user
   */
  getUpcomingReminders(page: number = 1, perPage: number = 10): Observable<UpcomingRemindersResponse> {
    return this.http.get<UpcomingRemindersResponse>(
      `${this.apiUrl}/notifications/upcoming-reminders?page=${page}&per_page=${perPage}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Mark specific notification as read
   */
  markAsRead(notificationId: string): Observable<NotificationActionResponse> {
    return this.http.put<NotificationActionResponse>(
      `${this.apiUrl}/notifications/${notificationId}/read`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        this.refreshNotifications();
        this.loadUnreadCount();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<NotificationActionResponse> {
    return this.http.put<NotificationActionResponse>(
      `${this.apiUrl}/notifications/mark-all-read`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        this.refreshNotifications();
        this.unreadCountSubject.next(0);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete specific notification
   */
  deleteNotification(notificationId: string): Observable<NotificationActionResponse> {
    return this.http.delete<NotificationActionResponse>(
      `${this.apiUrl}/notifications/${notificationId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        this.refreshNotifications();
        this.loadUnreadCount();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Clear all read notifications
   */
  clearReadNotifications(): Observable<NotificationActionResponse> {
    return this.http.delete<NotificationActionResponse>(
      `${this.apiUrl}/notifications/clear-read`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        this.refreshNotifications();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Refresh notifications and unread count
   */
  refreshNotifications(): void {
    this.getNotifications().subscribe();
    this.loadUnreadCount();
  }

  /**
   * Load unread count (private method)
   */
  private loadUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('NotificationService Error:', error);
    return throwError(() => new Error(error.message || 'An error occurred'));
  }

  /**
   * Get notification type icon
   */
  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'reminder': 'bell',
      'appointment': 'calendar',
      'prescription': 'pill',
      'lab_result': 'flask',
      'system': 'info',
      'urgent': 'alert-triangle'
    };
    return iconMap[type] || 'bell';
  }

  /**
   * Get notification type color class
   */
  getNotificationColorClass(type: string): string {
    const colorMap: { [key: string]: string } = {
      'reminder': 'text-blue-500',
      'appointment': 'text-green-500',
      'prescription': 'text-purple-500',
      'lab_result': 'text-orange-500',
      'system': 'text-gray-500',
      'urgent': 'text-red-500'
    };
    return colorMap[type] || 'text-blue-500';
  }
}
