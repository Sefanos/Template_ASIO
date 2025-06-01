import { Injectable, signal } from '@angular/core';
import { CalendarEvent,CalendarResource } from '../../../models/calendar/calendar.model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  // Signal-based state for reactive UI updates
  private _events = signal<CalendarEvent[]>([]);
  private _resources = signal<CalendarResource[]>([]);
  private _currentView = signal<string>('dayGridMonth');
  private _currentDate = signal<Date>(new Date());
  private _selectedEvent = signal<CalendarEvent | null>(null);
  private _filteredDoctorIds = signal<string[]>([]);
  private _searchQuery = signal<string>('');

  // Public API for consuming components
  public events = this._events.asReadonly();
  public resources = this._resources.asReadonly();
  public currentView = this._currentView.asReadonly();
  public currentDate = this._currentDate.asReadonly();
  public selectedEvent = this._selectedEvent.asReadonly();
  public filteredDoctorIds = this._filteredDoctorIds.asReadonly();
  public searchQuery = this._searchQuery.asReadonly();

  constructor() {
    // Initialize with mock data for MVP
    this.loadMockData();
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
  }

  // Data operations
  getEvents(): Observable<CalendarEvent[]> {
    // In a real implementation, this would call an API
    return of(this._events());
  }

  getResources(): Observable<CalendarResource[]> {
    // In a real implementation, this would call an API
    return of(this._resources());
  }

  addEvent(event: CalendarEvent): void {
    // Here you would typically make an API call
    // For MVP, we're just updating the local state
    this._events.update(events => [...events, event]);
  }

  updateEvent(updatedEvent: CalendarEvent): void {
    this._events.update(events => 
      events.map(event => event.id === updatedEvent.id ? updatedEvent : event)
    );
  }

  deleteEvent(eventId: string): void {
    this._events.update(events => events.filter(event => event.id !== eventId));
  }

  // Time blocking specific methods
  addBlockedTime(blockedTime: CalendarEvent): void {
    if (!blockedTime.extendedProps) {
      blockedTime.extendedProps = {};
    }
    blockedTime.extendedProps.isBlockedTime = true;
    this.addEvent(blockedTime);
  }

  updateBlockedTime(blockedTime: CalendarEvent): void {
    this.updateEvent(blockedTime);
  }

  deleteBlockedTime(blockedTimeId: string): void {
    this.deleteEvent(blockedTimeId);
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

  // MVP Implementation with mock data
  private loadMockData(): void {
    // Mock resources (doctors)
    const mockResources: CalendarResource[] = [
      {
        id: 'doctor-1',
        title: 'Dr. Smith',
        eventColor: '#4285F4',
        extendedProps: {
          type: 'doctor',
          specialty: 'Cardiology',
          image: '/assets/placeholder-user.jpg'
        },
        businessHours: [
          {
            startTime: '08:00',
            endTime: '17:00',
            daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday
          }
        ]   
      },
      {
        id: 'doctor-2',
        title: 'Dr. Johnson',
        eventColor: '#0F9D58',
        extendedProps: {
          type: 'doctor',
          specialty: 'Neurology',
          image: '/assets/placeholder-user.jpg'
        },
        businessHours: [
          {
            startTime: '09:00',
            endTime: '18:00',
            daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday
          }
        ]
      },
      {
        id: 'doctor-3',
        title: 'Dr. Williams',
        eventColor: '#F4B400',
        extendedProps: {
          type: 'doctor',
          specialty: 'Pediatrics',
          image: '/assets/placeholder-user.jpg'
        },
        businessHours: [
          {
            startTime: '08:00',
            endTime: '16:00',
            daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday
          }
        ]
      }
    ];

    // Set up current date as reference for mock data
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    // Mock events (appointments)
    const mockEvents: CalendarEvent[] = [
      {
        id: 'event-1',
        title: 'Annual Checkup',
        start: this.setHours(today, 10, 0),
        end: this.setHours(today, 11, 0),
        resourceId: 'doctor-1',
        extendedProps: {
          patientId: 101,
          patientName: 'John Doe',
          doctorId: 1,
          doctorName: 'Dr. Smith',
          appointmentType: 'Annual Checkup',
          status: 'scheduled'
        }
      },
      {
        id: 'event-2',
        title: 'Follow-up',
        start: this.setHours(today, 13, 30),
        end: this.setHours(today, 14, 0),
        resourceId: 'doctor-2',
        extendedProps: {
          patientId: 102,
          patientName: 'Jane Smith',
          doctorId: 2,
          doctorName: 'Dr. Johnson',
          appointmentType: 'Follow-up',
          status: 'scheduled'
        }
      },
      {
        id: 'event-3',
        title: 'Vaccination',
        start: this.setHours(tomorrow, 9, 0),
        end: this.setHours(tomorrow, 9, 30),
        resourceId: 'doctor-3',
        extendedProps: {
          patientId: 103,
          patientName: 'Emma Wilson',
          doctorId: 3,
          doctorName: 'Dr. Williams',
          appointmentType: 'Vaccination',
          status: 'scheduled'
        }
      },
      {
        id: 'block-1',
        title: 'Lunch Break',
        start: this.setHours(today, 12, 0),
        end: this.setHours(today, 13, 0),
        resourceId: 'doctor-1',
        color: '#E67C73',
        textColor: '#FFFFFF',
        extendedProps: {
          isBlockedTime: true,
          blockCategory: 'lunch',
          recurrenceRule: 'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR'
        }
      },
      {
        id: 'block-2',
        title: 'Team Meeting',
        start: this.setHours(dayAfterTomorrow, 15, 0),
        end: this.setHours(dayAfterTomorrow, 16, 0),
        resourceId: 'doctor-2',
        color: '#8E24AA',
        textColor: '#FFFFFF',
        extendedProps: {
          isBlockedTime: true,
          blockCategory: 'meeting'
        }
      }
    ];

    // Update signals with mock data
    this._resources.set(mockResources);
    this._events.set(mockEvents);
  }

  private setHours(date: Date, hours: number, minutes: number): Date {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }
}