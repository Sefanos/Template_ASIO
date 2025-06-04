import { Injectable, signal, inject } from '@angular/core';
import { CalendarEvent } from '../../../models/calendar/calendar-event.model';
import { CalendarResource } from '../../../models/calendar/calendar-resource.model';
import { Observable, of, BehaviorSubject, catchError, map, tap } from 'rxjs';
import { DoctorAppointmentService } from '../../../shared/services/doctor-appointment.service';
import { AppointmentMapperService } from '../../../shared/services/appointment-mapper.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {  // Signal-based state for reactive UI updates
  private _events = signal<CalendarEvent[]>([]);
  private _resources = signal<CalendarResource[]>([]);
  private _currentView = signal<string>('dayGridMonth');
  private _currentDate = signal<Date>(new Date());
  private _selectedEvent = signal<CalendarEvent | null>(null);
  private _filteredDoctorIds = signal<string[]>([]);
  private _searchQuery = signal<string>('');
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  
  // New signals for default date/time for new appointments
  private _defaultStartDateTime = signal<Date | null>(null);
  private _defaultEndDateTime = signal<Date | null>(null);

  // Public API for consuming components
  public events = this._events.asReadonly();
  public resources = this._resources.asReadonly();
  public currentView = this._currentView.asReadonly();
  public currentDate = this._currentDate.asReadonly();
  public selectedEvent = this._selectedEvent.asReadonly();
  public filteredDoctorIds = this._filteredDoctorIds.asReadonly();
  public searchQuery = this._searchQuery.asReadonly();
  public loading = this._loading.asReadonly();
  public error = this._error.asReadonly();
  
  // Public API for default date/time
  public defaultStartDateTime = this._defaultStartDateTime.asReadonly();
  public defaultEndDateTime = this._defaultEndDateTime.asReadonly();

  private doctorAppointmentService = inject(DoctorAppointmentService);
  private appointmentMapper = inject(AppointmentMapperService);  constructor() {
    // Initialize empty - data will be loaded by components when ready
  }

  // Methods to update state
  setCurrentView(view: string): void {
    this._currentView.set(view);
  }

  setCurrentDate(date: Date): void {
    this._currentDate.set(date);
  }

  setSelectedEvent(event: CalendarEvent | null): void {
    this._selectedEvent.set(event);
  }

  setFilteredDoctorIds(doctorIds: string[]): void {
    this._filteredDoctorIds.set(doctorIds);
  }
  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }  // Data loading methods
  loadInitialData(): void {
    // Subscribe to the Observable to actually trigger the HTTP request
    this.loadAppointments().subscribe();
  }

  loadAppointments(date?: string): Observable<CalendarEvent[]> {
    this._loading.set(true);
    this._error.set(null);
    
    return this.doctorAppointmentService.getMyAppointments(date).pipe(
      map(appointments => this.appointmentMapper.mapAppointmentsToCalendarEvents(appointments)),
      tap(calendarEvents => {
        this._events.set(calendarEvents);
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Failed to load appointments:', error);
        this._error.set('Failed to load appointments. Please try again.');
        this._loading.set(false);
        return of([]);
      })
    );
  }
  loadAppointmentsByDateRange(startDate: string, endDate: string): Observable<CalendarEvent[]> {
    console.log('CalendarService: Starting to load appointments for date range:', { startDate, endDate });
    this._loading.set(true);
    this._error.set(null);
    
    return this.doctorAppointmentService.getAppointmentsByDateRange(startDate, endDate).pipe(
      tap(appointments => console.log('CalendarService: Received appointments:', appointments)),
      map(appointments => this.appointmentMapper.mapAppointmentsToCalendarEvents(appointments)),
      tap(calendarEvents => {
        console.log('CalendarService: Mapped to calendar events:', calendarEvents);
        this._events.set(calendarEvents);
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('CalendarService: Failed to load appointments by date range:', error);
        this._error.set('Failed to load appointments. Please try again.');
        this._loading.set(false);
        return of([]);
      })
    );
  }

  refreshData(): void {
    this.loadAppointments();
  }

  // Data operations
  getEvents(): Observable<CalendarEvent[]> {
    return of(this._events());
  }
  getResources(): Observable<CalendarResource[]> {
    return of(this._resources());
  }
  addEvent(event: CalendarEvent): Observable<CalendarEvent> {
    // If this is a real appointment, use the appointment service
    if (event.extendedProps?.['isAppointment'] || !event.extendedProps?.['isBlockedTime']) {
      // Convert CalendarEvent back to appointment data format for API
      const appointmentData = {
        patient_user_id: event.extendedProps?.patientId,
        appointment_datetime_start: event.start instanceof Date ? 
          event.start.toISOString() : 
          new Date(event.start).toISOString(),
        appointment_datetime_end: event.end instanceof Date ? 
          event.end.toISOString() : 
          new Date(event.end!).toISOString(),
        type: event.extendedProps?.appointmentType || 'consultation',
        reason_for_visit: event.title,
        status: event.extendedProps?.status || 'scheduled'
      };
      
      return this.doctorAppointmentService.createAppointment(appointmentData).pipe(
        map(appointment => this.appointmentMapper.mapAppointmentToCalendarEvent(appointment)),
        tap(calendarEvent => {
          this._events.update(events => [...events, calendarEvent]);
        }),
        catchError(error => {
          console.error('Failed to create appointment:', error);
          this._error.set('Failed to create appointment. Please try again.');
          return of(event); // Return original event as fallback
        })
      );
    }
    
    // For other events (like manual calendar events), just update local state
    this._events.update(events => [...events, event]);
    return of(event);
  }

  updateEvent(updatedEvent: CalendarEvent): Observable<CalendarEvent> {
    // If this is an appointment update, use the appointment service
    if (updatedEvent.extendedProps?.['originalAppointment']) {
      const appointment = updatedEvent.extendedProps['originalAppointment'];
      
      // For notes updates
      if (appointment.notes !== updatedEvent.extendedProps.notes) {
        return this.doctorAppointmentService.updateAppointmentNotes(
          parseInt(updatedEvent.id),
          updatedEvent.extendedProps.notes || ''
        ).pipe(
          map(updatedAppointment => {
            const calendarEvent = this.appointmentMapper.mapAppointmentToCalendarEvent(updatedAppointment);
            this._events.update(events => 
              events.map(event => event.id === updatedEvent.id ? calendarEvent : event)
            );
            return calendarEvent;
          }),
          catchError(error => {
            console.error('Failed to update appointment:', error);
            this._error.set('Failed to update appointment. Please try again.');
            return of(updatedEvent);
          })
        );
      }
    }
    
    // For other updates, just update local state
    this._events.update(events => 
      events.map(event => event.id === updatedEvent.id ? updatedEvent : event)
    );
    return of(updatedEvent);
  }
  deleteEvent(eventId: string): Observable<boolean> {
    // For real implementation, you would call appointment cancellation service
    // For now, just update local state
    this._events.update(events => events.filter(event => event.id !== eventId));
    return of(true);
  }

  // Time blocking specific methods
  addBlockedTime(blockedTime: CalendarEvent): Observable<any> {
    if (!blockedTime.extendedProps) {
      blockedTime.extendedProps = {};
    }
    blockedTime.extendedProps.isBlockedTime = true;
    
    // Convert CalendarEvent to time slot format
    const startTime = blockedTime.start instanceof Date ? 
      blockedTime.start.toISOString() : 
      new Date(blockedTime.start).toISOString();
    const endTime = blockedTime.end instanceof Date ? 
      blockedTime.end.toISOString() : 
      new Date(blockedTime.end!).toISOString();
    
    return this.doctorAppointmentService.blockTimeSlot(
      startTime,
      endTime,
      blockedTime.title
    ).pipe(
      tap(() => {
        this._events.update(events => [...events, blockedTime]);
      }),
      catchError(error => {
        console.error('Failed to block time slot:', error);
        this._error.set('Failed to block time slot. Please try again.');
        return of(null);
      })
    );
  }
  updateBlockedTime(blockedTime: CalendarEvent): Observable<CalendarEvent> {
    return this.updateEvent(blockedTime);
  }
  deleteBlockedTime(blockedTimeId: string): Observable<boolean> {
    return this.deleteEvent(blockedTimeId);
  }

  // Helper methods
  getFilteredEvents(): CalendarEvent[] {
    const events = this._events();
    const filteredDoctorIds = this._filteredDoctorIds();
    const searchQuery = this._searchQuery().toLowerCase();
    
    return events.filter(event => {
      // Filter by doctor if any doctors are selected
      if (filteredDoctorIds.length > 0 && event.resourceId) {
        if (!filteredDoctorIds.includes(event.resourceId)) {
          return false;
        }
      }
      
      // Filter by search query
      if (searchQuery) {
        const matchesTitle = event.title.toLowerCase().includes(searchQuery);
        const matchesPatient = event.extendedProps?.patientName?.toLowerCase().includes(searchQuery);
        const matchesDoctor = event.extendedProps?.doctorName?.toLowerCase().includes(searchQuery);
        const matchesType = event.extendedProps?.appointmentType?.toLowerCase().includes(searchQuery);
        
        if (!(matchesTitle || matchesPatient || matchesDoctor || matchesType)) {
          return false;
        }
      }
      
      return true;
    });
  }
  private setHours(date: Date, hours: number, minutes: number): Date {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  // Methods to set default date/time for new appointments
  setDefaultDateTimeForNewAppointment(date: Date): void {
    // Set start time to the clicked time or 9:00 AM if no specific time
    const startTime = new Date(date);
    if (startTime.getHours() === 0 && startTime.getMinutes() === 0) {
      startTime.setHours(9, 0, 0, 0);
    }
    
    // Set end time to 1 hour after start time
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);
    
    this._defaultStartDateTime.set(startTime);
    this._defaultEndDateTime.set(endTime);
    
    console.log('CalendarService: Set default date/time for new appointment:', {
      start: startTime,
      end: endTime
    });
  }

  setDefaultDateTimeRangeForNewAppointment(startDate: Date, endDate: Date): void {
    this._defaultStartDateTime.set(new Date(startDate));
    this._defaultEndDateTime.set(new Date(endDate));
    
    console.log('CalendarService: Set default date/time range for new appointment:', {
      start: startDate,
      end: endDate
    });
  }

  // Method to clear default date/time (optional, for cleanup)
  clearDefaultDateTime(): void {
    this._defaultStartDateTime.set(null);
    this._defaultEndDateTime.set(null);
  }
}