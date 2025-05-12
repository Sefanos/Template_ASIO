import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from '../../../services/calendar/calendar.service';

@Component({
  selector: 'app-calendar-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-toolbar.component.html',
  styleUrls: ['./calendar-toolbar.component.css']
})
export class CalendarToolbarComponent {
  private calendarService = inject(CalendarService);
  
  // Get reactive state from service
  currentView = this.calendarService.currentView;
  currentDate = this.calendarService.currentDate;
  
  // Event emitter to notify parent component to open the new appointment modal
  @Output() createAppointment = new EventEmitter<void>();
  
  // View options
  views = [
    { label: 'Month', value: 'dayGridMonth' },
    { label: 'Week', value: 'timeGridWeek' },
    { label: 'Day', value: 'timeGridDay' },
    { label: 'Resources', value: 'resourceTimeGridDay' },
    { label: 'List', value: 'listWeek' }
  ];
  
  // Set calendar view
  setView(view: string): void {
    this.calendarService.setCurrentView(view);
  }
  
  // Navigate to today
  today(): void {
    this.calendarService.setCurrentDate(new Date());
  }
  
  // Create new appointment
  createNewAppointment(): void {
    this.createAppointment.emit();
  }
  
  // Format today's date for the button (May 12)
  getTodayFormatted(): string {
    const today = new Date();
    return today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // Navigate to previous period
  prev(): void {
    const date = new Date(this.currentDate());
    const view = this.currentView();
    
    if (view === 'dayGridMonth') {
      date.setMonth(date.getMonth() - 1);
    } else if (view === 'timeGridWeek' || view === 'listWeek') {
      date.setDate(date.getDate() - 7);
    } else if (view === 'timeGridDay') {
      date.setDate(date.getDate() - 1);
    }
    
    this.calendarService.setCurrentDate(date);
  }
  
  // Navigate to next period
  next(): void {
    const date = new Date(this.currentDate());
    const view = this.currentView();
    
    if (view === 'dayGridMonth') {
      date.setMonth(date.getMonth() + 1);
    } else if (view === 'timeGridWeek' || view === 'listWeek') {
      date.setDate(date.getDate() + 7);
    } else if (view === 'timeGridDay') {
      date.setDate(date.getDate() + 1);
    }
    
    this.calendarService.setCurrentDate(date);
  }
  
  // Format date heading based on current view
  formatDate(): string {
    const date = this.currentDate();
    const view = this.currentView();
    
    if (view === 'dayGridMonth') {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (view === 'timeGridWeek' || view === 'listWeek') {
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 6);
      
      const startMonth = date.toLocaleDateString('en-US', { month: 'short' });
      const startDay = date.getDate();
      const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
      const endDay = endDate.getDate();
      const year = endDate.getFullYear();
      
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    } else if (view === 'timeGridDay') {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    
    return date.toLocaleDateString();
  }
}