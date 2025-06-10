import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { NotificationService } from '../../../core/patient/services/notification.service';
import { Notification, UpcomingReminder } from '../../../models/notification.model';

@Component({
  selector: 'app-reminders',
  standalone: false,
  templateUrl: './reminders.component.html',
  styleUrl: './reminders.component.css'
})
export class RemindersComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  upcomingReminders: UpcomingReminder[] = [];
  unreadCount: number = 0;
  isLoading: boolean = false;
  isLoadingReminders: boolean = false;
  selectedTab: 'notifications' | 'reminders' = 'notifications';
  currentPage: number = 1;
  totalPages: number = 1;
  reminderCurrentPage: number = 1;
  reminderTotalPages: number = 1;
  
  // Modal state
  showConfirmModal: boolean = false;
  confirmAction: 'delete' | 'clearRead' = 'delete';
  confirmMessage: string = '';
  confirmTitle: string = '';
  pendingNotificationId: string | null = null;
  
  private subscriptions: Subscription = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUpcomingReminders();
    this.setupRealtimeUpdates();
    
    // Subscribe to unread count updates
    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );

    // Subscribe to notifications updates
    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load notifications from API
   */
  loadNotifications(page: number = 1): void {
    this.isLoading = true;
    this.currentPage = page;
    
    this.subscriptions.add(
      this.notificationService.getNotifications(page).subscribe({
        next: (response) => {
          this.notifications = response.data;
          this.totalPages = response.last_page;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.isLoading = false;
        }
      })
    );
  }

  /**
   * Load upcoming reminders from API
   */
  loadUpcomingReminders(page: number = 1): void {
    this.isLoadingReminders = true;
    this.reminderCurrentPage = page;
    
    this.subscriptions.add(
      this.notificationService.getUpcomingReminders(page).subscribe({
        next: (response) => {
          this.upcomingReminders = response.data;
          this.reminderTotalPages = response.last_page;
          this.isLoadingReminders = false;
        },
        error: (error) => {
          console.error('Error loading upcoming reminders:', error);
          this.isLoadingReminders = false;
        }
      })
    );
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    this.subscriptions.add(
      this.notificationService.markAsRead(notificationId).subscribe({
        next: () => {
          // Update local state
          const notification = this.notifications.find(n => n.id === notificationId);
          if (notification) {
            notification.read_at = new Date().toISOString();
          }
        },
        error: (error) => console.error('Error marking as read:', error)
      })
    );
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): void {
    this.showDeleteConfirmModal(notificationId);
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.subscriptions.add(
      this.notificationService.markAllAsRead().subscribe({
        next: () => {
          // Update local state
          this.notifications.forEach(notification => {
            notification.read_at = new Date().toISOString();
          });
        },
        error: (error) => console.error('Error marking all as read:', error)
      })
    );
  }

  /**
   * Clear all read notifications
   */
  clearReadNotifications(): void {
    this.showClearReadConfirmModal();
  }

  /**
   * Switch between tabs
   */
  switchTab(tab: 'notifications' | 'reminders'): void {
    this.selectedTab = tab;
    if (tab === 'reminders' && this.upcomingReminders.length === 0) {
      this.loadUpcomingReminders();
    }
  }

  /**
   * Get notification icon
   */
  getNotificationIcon(notification: Notification): string {
    return this.notificationService.getNotificationIcon(notification.type);
  }

  /**
   * Get notification color class
   */
  getNotificationColorClass(notification: Notification): string {
    return this.notificationService.getNotificationColorClass(notification.type);
  }

  /**
   * Check if notification is unread
   */
  isUnread(notification: Notification): boolean {
    return !notification.read_at;
  }

  /**
   * Format time ago
   */
  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Get unread notifications count
   */
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read_at);
  }

  /**
   * Setup real-time updates (poll every 30 seconds)
   */
  private setupRealtimeUpdates(): void {
    this.subscriptions.add(
      interval(30000).subscribe(() => {
        this.notificationService.refreshNotifications();
      })
    );
  }

  /**
   * Refresh notifications manually
   */
  refresh(): void {
    if (this.selectedTab === 'notifications') {
      this.loadNotifications(this.currentPage);
    } else {
      this.loadUpcomingReminders(this.reminderCurrentPage);
    }
  }

  /**
   * Load next page
   */
  nextPage(): void {
    if (this.selectedTab === 'notifications') {
      if (this.currentPage < this.totalPages) {
        this.loadNotifications(this.currentPage + 1);
      }
    } else {
      if (this.reminderCurrentPage < this.reminderTotalPages) {
        this.loadUpcomingReminders(this.reminderCurrentPage + 1);
      }
    }
  }

  /**
   * Load previous page
   */
  previousPage(): void {
    if (this.selectedTab === 'notifications') {
      if (this.currentPage > 1) {
        this.loadNotifications(this.currentPage - 1);
      }
    } else {
      if (this.reminderCurrentPage > 1) {
        this.loadUpcomingReminders(this.reminderCurrentPage - 1);
      }
    }
  }

  /**
   * Show delete confirmation modal
   */
  showDeleteConfirmModal(notificationId: string): void {
    this.pendingNotificationId = notificationId;
    this.confirmAction = 'delete';
    this.confirmTitle = 'Delete Notification';
    this.confirmMessage = 'Are you sure you want to delete this notification? This action cannot be undone.';
    this.showConfirmModal = true;
  }

  /**
   * Show clear read confirmation modal
   */
  showClearReadConfirmModal(): void {
    this.confirmAction = 'clearRead';
    this.confirmTitle = 'Clear Read Notifications';
    this.confirmMessage = 'Are you sure you want to clear all read notifications? This action cannot be undone.';
    this.showConfirmModal = true;
  }

  /**
   * Handle modal confirmation
   */
  handleConfirmAction(): void {
    if (this.confirmAction === 'delete' && this.pendingNotificationId) {
      this.executeDeleteNotification(this.pendingNotificationId);
    } else if (this.confirmAction === 'clearRead') {
      this.executeClearReadNotifications();
    }
    this.closeConfirmModal();
  }

  /**
   * Close confirmation modal
   */
  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.pendingNotificationId = null;
    this.confirmMessage = '';
    this.confirmTitle = '';
  }

  /**
   * Execute delete notification
   */
  private executeDeleteNotification(notificationId: string): void {
    this.subscriptions.add(
      this.notificationService.deleteNotification(notificationId).subscribe({
        next: () => {
          // Remove from local state
          this.notifications = this.notifications.filter(n => n.id !== notificationId);
        },
        error: (error) => console.error('Error deleting notification:', error)
      })
    );
  }

  /**
   * Execute clear read notifications
   */
  private executeClearReadNotifications(): void {
    this.subscriptions.add(
      this.notificationService.clearReadNotifications().subscribe({
        next: () => {
          // Remove read notifications from local state
          this.notifications = this.notifications.filter(n => !n.read_at);
        },
        error: (error) => console.error('Error clearing notifications:', error)
      })
    );
  }

  /**
   * Format upcoming reminder date
   */
  formatReminderDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get reminder type icon
   */
  getReminderIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'appointment_reminder': 'calendar',
      'medication_reminder': 'pill',
      'follow_up_reminder': 'user-check',
      'lab_test_reminder': 'flask',
      'payment_reminder': 'credit-card'
    };
    return iconMap[type] || 'bell';
  }

  /**
   * Get reminder type color
   */
  getReminderColorClass(type: string): string {
    const colorMap: { [key: string]: string } = {
      'appointment_reminder': 'text-blue-500',
      'medication_reminder': 'text-purple-500',
      'follow_up_reminder': 'text-green-500',
      'lab_test_reminder': 'text-orange-500',
      'payment_reminder': 'text-red-500'
    };
    return colorMap[type] || 'text-blue-500';
  }

  /**
   * Check if reminder is due soon (within 24 hours)
   */
  isReminderDueSoon(scheduledFor: string): boolean {
    const now = new Date();
    const reminderDate = new Date(scheduledFor);
    const timeDiff = reminderDate.getTime() - now.getTime();
    const hoursUntil = timeDiff / (1000 * 60 * 60);
    return hoursUntil <= 24 && hoursUntil > 0;
  }
}
