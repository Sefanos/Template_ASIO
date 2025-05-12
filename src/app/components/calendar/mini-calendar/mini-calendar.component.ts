import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from '../../../services/calendar/calendar.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-mini-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mini-calendar.component.html',
  styleUrls: ['./mini-calendar.component.css']
})
export class MiniCalendarComponent implements OnInit {
  private calendarService = inject(CalendarService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  // Calendar data
  currentDate: Date = new Date();
  today: Date = new Date();
  calendarDays: Array<{
    date: Date;
    currentMonth: boolean;
    hasEvents: boolean;
    hasUrgentEvents: boolean;
    firstInRow: boolean;
  }> = [];
  dayNames: string[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  // Track if we need to prevent circular updates
  private updatingFromClick = false;
  
  constructor() {
    // React to date changes from main calendar
    effect(() => {
      if (!this.updatingFromClick) {
        const newDate = this.calendarService.currentDate();
        if (!this.isSameMonth(this.currentDate, newDate)) {
          this.currentDate = new Date(newDate);
          this.generateCalendarDays();
        }
      }
    });
  }
  
  ngOnInit(): void {
    // Initialize with today's date
    this.currentDate = new Date(this.calendarService.currentDate());
    this.today = new Date(); // Today's date for highlighting
    this.generateCalendarDays();
  }
  
  get currentMonthName(): string {
    return this.currentDate.toLocaleDateString('default', { month: 'long' });
  }
  
  get currentYear(): number {
    return this.currentDate.getFullYear();
  }
  
  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendarDays();
  }
  
  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendarDays();
  }
  
  selectDate(date: Date): void {
    this.updatingFromClick = true;
    
    // Set the current date in the calendar service
    this.calendarService.setCurrentDate(date);
    
    // Set the view to day view when a date is selected
    this.calendarService.setCurrentView('timeGridDay');
    
    // Reset the flag after a short delay to allow the effect to complete
    setTimeout(() => {
      this.updatingFromClick = false;
    }, 50);
  }
  
  isSelectedDate(date: Date): boolean {
    const selectedDate = this.calendarService.currentDate();
    return this.isSameDay(date, selectedDate);
  }
  
  private generateCalendarDays(): void {
    this.calendarDays = [];
    
    // Get the first day of the month
    const firstDayOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    
    // Get the last day of the month
    const lastDayOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    
    // Get the day of the week of the first day (0-6, where 0 is Sunday)
    const firstDayWeekday = firstDayOfMonth.getDay();
    
    // Calculate the number of days from the previous month to show
    const daysFromPrevMonth = firstDayWeekday;
    
    // Get the first day to display (might be from the previous month)
    const firstDayToShow = new Date(firstDayOfMonth);
    firstDayToShow.setDate(firstDayToShow.getDate() - daysFromPrevMonth);
    
    // Generate 6 rows of 7 days each (42 days)
    // Or just enough rows to show the current month
    const totalDaysToShow = this.getDaysNeeded(firstDayOfMonth, lastDayOfMonth);
    
    let currentDay = new Date(firstDayToShow);
    
    for (let i = 0; i < totalDaysToShow; i++) {
      // Check if this date is in the current month
      const isCurrentMonth = currentDay.getMonth() === this.currentDate.getMonth();
      
      // Check if this date has events (mock data for now)
      const hasEvents = this.hasEvents(currentDay);
      const hasUrgentEvents = this.hasUrgentEvents(currentDay);
      
      // Check if this is the first day in its row
      const firstInRow = i % 7 === 0;
      
      // Add the day to the calendar
      this.calendarDays.push({
        date: new Date(currentDay),
        currentMonth: isCurrentMonth,
        hasEvents: hasEvents,
        hasUrgentEvents: hasUrgentEvents,
        firstInRow: firstInRow
      });
      
      // Move to the next day
      currentDay.setDate(currentDay.getDate() + 1);
    }
  }
  
  private getDaysNeeded(firstDayOfMonth: Date, lastDayOfMonth: Date): number {
    // Calculate how many days we need to show
    const firstDayWeekday = firstDayOfMonth.getDay();
    const totalDaysInMonth = lastDayOfMonth.getDate();
    const lastDayWeekday = lastDayOfMonth.getDay();
    
    // Days from previous month + days in current month + days from next month
    return firstDayWeekday + totalDaysInMonth + (6 - lastDayWeekday);
  }
  
  // Mock data for events - you'd replace this with actual data from your service
  private hasEvents(date: Date): boolean {
    // For demo purposes, show events on some random dates 
    // You should replace this with actual event data
    const events = this.calendarService.events();
    
    return events.some(event => this.isSameDay(new Date(event.start), date));
  }
  
  private hasUrgentEvents(date: Date): boolean {
    // For demo purposes, show urgent events on May 12, 2025 (from the screenshot)
    const targetDate = new Date(2025, 4, 12); // May 12, 2025
    
    return this.isSameDay(date, targetDate);
  }
  
  // Helper to check if two dates are the same day
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() && 
           date1.getMonth() === date2.getMonth() && 
           date1.getFullYear() === date2.getFullYear();
  }
  
  // Helper to check if two dates are in the same month
  private isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getMonth() === date2.getMonth() && 
           date1.getFullYear() === date2.getFullYear();
  }
}