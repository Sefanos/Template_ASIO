import { Component, inject, OnInit, Input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarContainerComponent } from '../calendar-container/calendar-container.component';

interface CalendarDay {
  date: Date;
  currentMonth: boolean;
  hasEvents: boolean;
  hasUrgentEvents: boolean;
}

@Component({
  selector: 'app-mini-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mini-calendar.component.html',
  styleUrls: ['./mini-calendar.component.css']
})
export class MiniCalendarComponent implements OnInit {
  @Input() currentDate: Date = new Date();
  
  private calendarContainer = inject(CalendarContainerComponent, { optional: true });
  
  // Calendar data
  calendarDays: CalendarDay[] = [];
  currentMonthName: string = '';
  currentYear: number = new Date().getFullYear();
  dayNames: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Reactive state
  selectedDate = signal<Date>(new Date());
  
  constructor() {
    // Set up effect to watch for date changes from parent - MOVED TO CONSTRUCTOR
    if (this.calendarContainer) {
      effect(() => {
        const date = this.calendarContainer!.getCurrentDate();
        this.currentDate = date;
        this.selectedDate.set(date);
        this.generateCalendar();
      });
    }
  }
  
  ngOnInit(): void {
    // Initialize with current state
    if (this.calendarContainer) {
      this.currentDate = this.calendarContainer.getCurrentDate();
    }
    this.selectedDate.set(this.currentDate);
    this.generateCalendar();
  }
  
  selectDate(date: Date): void {
    this.selectedDate.set(date);
    this.currentDate = date;
    if (this.calendarContainer) {
      // Set the date AND switch to day view when clicking a day
      this.calendarContainer.setCurrentDate(date);
      this.calendarContainer.setCurrentView('timeGridDay');
    }
  }
  
  prevMonth(): void {
    const prevMonth = new Date(this.currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    this.currentDate = prevMonth;
    this.selectedDate.set(prevMonth);
    if (this.calendarContainer) {
      this.calendarContainer.setCurrentDate(prevMonth);
    }
    this.generateCalendar();
  }
  
  nextMonth(): void {
    const nextMonth = new Date(this.currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    this.currentDate = nextMonth;
    this.selectedDate.set(nextMonth);
    if (this.calendarContainer) {
      this.calendarContainer.setCurrentDate(nextMonth);
    }
    this.generateCalendar();
  }
  
  goToToday(): void {
    const today = new Date();
    this.currentDate = today;
    this.selectedDate.set(today);
    if (this.calendarContainer) {
      this.calendarContainer.setCurrentDate(today);
      // Also switch to day view when clicking "Today"
      this.calendarContainer.setCurrentView('timeGridDay');
    }
    this.generateCalendar();
  }
  
  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
  
  isSelectedDate(date: Date): boolean {
    return date.toDateString() === this.selectedDate().toDateString();
  }
  
  private generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    this.currentMonthName = this.currentDate.toLocaleDateString('en-US', {
      month: 'long'
    });
    this.currentYear = year;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    this.calendarDays = [];
    
    // Add days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      this.calendarDays.push({
        date,
        currentMonth: false,
        hasEvents: this.hasEventsOnDate(date),
        hasUrgentEvents: this.hasUrgentEventsOnDate(date)
      });
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      this.calendarDays.push({
        date,
        currentMonth: true,
        hasEvents: this.hasEventsOnDate(date),
        hasUrgentEvents: this.hasUrgentEventsOnDate(date)
      });
    }
    
    // Add days from next month to complete the grid (42 days = 6 weeks)
    const totalCells = 42;
    const remainingCells = totalCells - this.calendarDays.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      this.calendarDays.push({
        date,
        currentMonth: false,
        hasEvents: this.hasEventsOnDate(date),
        hasUrgentEvents: this.hasUrgentEventsOnDate(date)
      });
    }
  }
  
  private hasEventsOnDate(date: Date): boolean {
    if (this.calendarContainer) {
      const appointments = this.calendarContainer.doctorAppointments();
      const dateString = date.toISOString().split('T')[0];
      
      return appointments.some(appointment => 
        appointment.date === dateString
      );
    }
    
    return false;
  }
  
  private hasUrgentEventsOnDate(date: Date): boolean {
    if (this.calendarContainer) {
      const appointments = this.calendarContainer.doctorAppointments();
      const dateString = date.toISOString().split('T')[0];
      
      return appointments.some(appointment => 
        appointment.date === dateString && 
        // Fixed: Use proper Appointment model properties
        (appointment.type === 'emergency' || appointment.reason?.toLowerCase().includes('urgent'))
      );
    }
    
    return false;
  }
}