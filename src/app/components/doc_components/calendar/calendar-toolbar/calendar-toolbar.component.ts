import { Component, inject, OnInit, Input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarContainerComponent } from '../calendar-container/calendar-container.component';

interface ViewOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-calendar-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-toolbar.component.html',
  styleUrls: ['./calendar-toolbar.component.css']
})
export class CalendarToolbarComponent implements OnInit {
  @Input() currentView: string = 'timeGridWeek';
  @Input() currentDate: Date = new Date();
  
  private calendarContainer = inject(CalendarContainerComponent, { optional: true });
  
  // Reactive state
  private _currentView = signal<string>('timeGridWeek');
  private _currentDate = signal<Date>(new Date());
  
  // Available views
  views: ViewOption[] = [
    { value: 'dayGridMonth', label: 'Month' },
    { value: 'timeGridWeek', label: 'Week' },
    { value: 'timeGridDay', label: 'Day' }
  ];
  
  constructor() {
    // Set up effects to watch for changes from container - MOVED TO CONSTRUCTOR
    if (this.calendarContainer) {
      effect(() => {
        const view = this.calendarContainer!.getCurrentView();
        this._currentView.set(view);
      });
      
      effect(() => {
        const date = this.calendarContainer!.getCurrentDate();
        this._currentDate.set(date);
      });
    }
  }
  
  ngOnInit(): void {
    // Initialize with current state from container
    if (this.calendarContainer) {
      this._currentView.set(this.calendarContainer.getCurrentView());
      this._currentDate.set(this.calendarContainer.getCurrentDate());
    } else {
      // Fallback to input values
      this._currentView.set(this.currentView);
      this._currentDate.set(this.currentDate);
    }
  }
  
  // Get current view as signal
  getCurrentViewSignal() {
    return this._currentView;
  }
  
  // Get current date as signal
  getCurrentDateSignal() {
    return this._currentDate;
  }
  
  // Navigation methods
  today(): void {
    const todayDate = new Date();
    this._currentDate.set(todayDate);
    if (this.calendarContainer) {
      this.calendarContainer.setCurrentDate(todayDate);
    }
  }
  
  prev(): void {
    const prevDate = this.getPreviousDate();
    this._currentDate.set(prevDate);
    if (this.calendarContainer) {
      this.calendarContainer.setCurrentDate(prevDate);
    }
  }
  
  next(): void {
    const nextDate = this.getNextDate();
    this._currentDate.set(nextDate);
    if (this.calendarContainer) {
      this.calendarContainer.setCurrentDate(nextDate);
    }
  }
  
  // View change method
  setView(view: string): void {
    this._currentView.set(view);
    if (this.calendarContainer) {
      this.calendarContainer.setCurrentView(view);
    }
  }
  
  // New appointment button
  createNewAppointment(): void {
    if (this.calendarContainer) {
      this.calendarContainer.createNewAppointment();
    }
  }
  
  // Format current date for display
  formatDate(): string {
    const date = this._currentDate();
    const view = this._currentView();
    
    switch (view) {
      case 'dayGridMonth':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        });
      case 'timeGridWeek':
        // Show week range
        const weekStart = this.getWeekStart(date);
        const weekEnd = this.getWeekEnd(date);
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.toLocaleDateString('en-US', { month: 'long' })} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
        } else {
          return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${weekStart.getFullYear()}`;
        }
      case 'timeGridDay':
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      default:
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
    }
  }
  
  // Get today formatted for the today button
  getTodayFormatted(): string {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Helper methods for date navigation
  private getPreviousDate(): Date {
    const date = new Date(this._currentDate());
    const view = this._currentView();
    
    switch (view) {
      case 'dayGridMonth':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'timeGridWeek':
        date.setDate(date.getDate() - 7);
        break;
      case 'timeGridDay':
        date.setDate(date.getDate() - 1);
        break;
    }
    return date;
  }
  
  private getNextDate(): Date {
    const date = new Date(this._currentDate());
    const view = this._currentView();
    
    switch (view) {
      case 'dayGridMonth':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'timeGridWeek':
        date.setDate(date.getDate() + 7);
        break;
      case 'timeGridDay':
        date.setDate(date.getDate() + 1);
        break;
    }
    return date;
  }
  
  private getWeekStart(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    return start;
  }
  
  private getWeekEnd(date: Date): Date {
    const end = this.getWeekStart(date);
    end.setDate(end.getDate() + 6);
    return end;
  }
}