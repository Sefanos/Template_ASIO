import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent } from '../../../../models/calendar/calendar-event.model';

@Component({
  selector: 'app-blocked-time-delete-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Modal Backdrop -->
    <div *ngIf="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="onBackdropClick($event)">
      <!-- Modal Content -->
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold text-gray-900">Delete Blocked Time</h3>
        </div>

        <!-- Body -->
        <div class="px-6 py-4">
          <p class="text-gray-600 mb-4">
            Are you sure you want to delete this blocked time slot?
          </p>

          <div *ngIf="blockedTime" class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 mb-2">{{ blockedTime.title }}</h4>
            <div class="text-sm text-gray-600">
              <div class="flex items-center mb-1">
                <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M3 7h18M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7H5z" />
                </svg>
                {{ formatDateTime(blockedTime.start) }} - {{ formatTime(blockedTime.end) }}
              </div>
              <div *ngIf="blockedTime.extendedProps?.notes" class="flex items-start mt-2">
                <svg class="h-4 w-4 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="text-gray-500">{{ blockedTime.extendedProps!.notes }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            (click)="cancel()"
            [disabled]="isDeleting"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="confirmDelete()"
            [disabled]="isDeleting"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <svg *ngIf="isDeleting" class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class BlockedTimeDeleteModalComponent {
  @Input() show = false;
  @Input() blockedTime: CalendarEvent | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() delete = new EventEmitter<string>();

  isDeleting = false;

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  cancel(): void {
    if (!this.isDeleting) {
      this.close.emit();
    }
  }

  confirmDelete(): void {
    if (this.blockedTime && !this.isDeleting) {
      this.isDeleting = true;
      this.delete.emit(this.blockedTime.id);
    }
  }

  resetLoadingState(): void {
    this.isDeleting = false;
  }

  formatDateTime(dateTime: string | Date): string {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(dateTime: string | Date): string {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
