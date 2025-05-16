import { Component, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from '../../../../services/doc-services/calendar/calendar.service';
import { CalendarEvent } from '../../../../models/calendar/calendar-event.model';

// FullCalendar imports
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';

// Import subcomponents
import { CalendarToolbarComponent } from '../calendar-toolbar/calendar-toolbar.component';
import { MiniCalendarComponent } from '../mini-calendar/mini-calendar.component';
import { ResourceFilterComponent } from '../resource-filter/resource-filter.component';
import { SearchFilterComponent } from '../search-filter/search-filter.component';
import { TimeBlockFormComponent } from '../time-block-form/time-block-form.component';

@Component({
  selector: 'app-calendar-container',
  standalone: true,
  imports: [
    CommonModule,
    CalendarToolbarComponent,
    MiniCalendarComponent,
    ResourceFilterComponent,
    SearchFilterComponent,
    TimeBlockFormComponent
  ],
  templateUrl: './calendar-container.component.html',
  styleUrls: ['./calendar-container.component.css']
})
export class CalendarContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('calendar') calendarEl!: ElementRef;
  
  private calendarService = inject(CalendarService);
  private calendar: Calendar | null = null;
  
  // State for time block form
  showTimeBlockForm = signal<boolean>(false);
  selectedBlockToEdit = signal<CalendarEvent | null>(null);
  isAppointmentForm = signal<boolean>(false);
  
  // Calendar reactive state from service
  currentView = this.calendarService.currentView;
  currentDate = this.calendarService.currentDate;
  
  constructor() {
    // Use effect to react to signal changes
    effect(() => {
      const view = this.currentView();
      if (this.calendar && this.calendar.view && this.calendar.view.type !== view) {
        this.calendar.changeView(view);
      }
    });
    
    effect(() => {
      const date = this.currentDate();
      if (this.calendar) {
        this.calendar.gotoDate(date);
      }
    });
    
    effect(() => {
      // This will run whenever filteredDoctorIds changes
      this.calendarService.filteredDoctorIds();
      if (this.calendar) {
        this.refreshEvents();
      }
    });
    
    effect(() => {
      // This will run whenever searchQuery changes
      this.calendarService.searchQuery();
      if (this.calendar) {
        this.refreshEvents();
      }
    });
  }
  
  ngAfterViewInit(): void {
    this.initCalendar();
  }
  
  ngOnDestroy(): void {
    if (this.calendar) {
      this.calendar.destroy();
    }
  }
  
  private initCalendar(): void {
    if (!this.calendarEl) return;
    
    this.calendar = new Calendar(this.calendarEl.nativeElement, {
      plugins: [
        dayGridPlugin,
        timeGridPlugin,
        listPlugin,
        interactionPlugin,
        resourceTimeGridPlugin
      ],
      initialView: this.currentView(),
      initialDate: this.currentDate(),
      headerToolbar: false, // We're using our custom toolbar
      allDaySlot: true,
      dayMaxEvents: true,
      slotMinTime: '07:00:00',
      slotMaxTime: '19:00:00',
      slotDuration: '00:15:00',
      navLinks: true,
      selectable: true,
      editable: true,
      droppable: true,
      nowIndicator: true,
      height: '100%',
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        meridiem: false,
        hour12: false
      },
      eventClick: this.handleEventClick.bind(this),
      dateClick: this.handleDateClick.bind(this),
      select: this.handleRangeSelect.bind(this),
      eventDrop: this.handleEventDrop.bind(this),
      eventResize: this.handleEventResize.bind(this),
      events: (fetchInfo, successCallback) => {
        // Get filtered events from service
        const events = this.calendarService.getFilteredEvents();
        successCallback(events);
      },
      resources: this.calendarService.resources(),
      schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source'
    });
    
    this.calendar.render();
  }
  
  private refreshEvents(): void {
    if (!this.calendar) return;
    this.calendar.refetchEvents();
  }
  
  // Event handlers
  private handleEventClick(info: any): void {
    const clickedEvent = info.event;
    
    // Check if it's a blocked time event
    if (clickedEvent.extendedProps.isBlockedTime) {
      // Convert to our CalendarEvent model
      const blockedTimeEvent: CalendarEvent = {
        id: clickedEvent.id,
        title: clickedEvent.title,
        start: clickedEvent.start.toISOString(),
        end: clickedEvent.end.toISOString(),
        resourceId: clickedEvent.getResources()[0]?.id,
        color: clickedEvent.backgroundColor,
        textColor: clickedEvent.textColor,
        extendedProps: {
          ...clickedEvent.extendedProps
        }
      };
      
      this.selectedBlockToEdit.set(blockedTimeEvent);
      this.showTimeBlockForm.set(true);
    } else {
      // Handle regular appointment click - This would typically open an appointment detail view
      const selectedEvent: CalendarEvent = {
        id: clickedEvent.id,
        title: clickedEvent.title,
        start: clickedEvent.start.toISOString(),
        end: clickedEvent.end.toISOString(),
        resourceId: clickedEvent.getResources()[0]?.id,
        extendedProps: {
          ...clickedEvent.extendedProps
        }
      };
      
      this.calendarService.setSelectedEvent(selectedEvent);
      // For MVP, we'll just log this
      console.log('Appointment clicked:', selectedEvent);
    }
  }
  
  private handleDateClick(info: any): void {
    // Open the appointment creation form when a date/time cell is clicked
    
    // We'll reuse the time block form for appointments by default
    // For a production app, you might want a dedicated appointment form
    let startDateTime = new Date(info.date);
    let endDateTime = new Date(info.date);
    
    // For time grid views, set a default appointment duration (e.g., 30 minutes)
    if (info.view.type.includes('timeGrid')) {
      endDateTime.setMinutes(endDateTime.getMinutes() + 30);
    } 
    // For day grid views (all-day), set the end date to the next day
    else {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
    
    // Create an appointment event object
    const newAppointment: CalendarEvent = {
      id: `appointment-${Date.now()}`,
      title: 'New Appointment',
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      resourceId: info.resource?.id || this.calendarService.resources()[0]?.id,
      color: '#4285F4', // Google Calendar blue
      textColor: '#FFFFFF',
      extendedProps: {
        isAppointment: true,
        status: 'scheduled'
      }
    };
    
    // Open the form with this pre-filled appointment
    this.selectedBlockToEdit.set(newAppointment);
    this.isAppointmentForm.set(true); // Set form type to appointment
    this.showTimeBlockForm.set(true);
  }
  
  private handleRangeSelect(info: any): void {
    // When a range is selected, open appointment form with the time range pre-filled
    
    // Create an appointment event object with the selected time range
    const newAppointment: CalendarEvent = {
      id: `appointment-${Date.now()}`,
      title: 'New Appointment',
      start: info.start.toISOString(),
      end: info.end.toISOString(),
      resourceId: info.resource?.id || this.calendarService.resources()[0]?.id,
      color: '#4285F4', // Google Calendar blue
      textColor: '#FFFFFF',
      extendedProps: {
        isAppointment: true,
        status: 'scheduled'
      }
    };
    
    // Open the form with this pre-filled appointment
    this.selectedBlockToEdit.set(newAppointment);
    this.isAppointmentForm.set(true); // Set form type to appointment
    this.showTimeBlockForm.set(true);
  }
  
  private handleEventDrop(info: any): void {
    // Handle dropped (moved) events
    const movedEvent = info.event;
    
    // Create event object from the moved event
    const updatedEvent: CalendarEvent = {
      id: movedEvent.id,
      title: movedEvent.title,
      start: movedEvent.start.toISOString(),
      end: movedEvent.end.toISOString(),
      resourceId: movedEvent.getResources()[0]?.id,
      color: movedEvent.backgroundColor,
      textColor: movedEvent.textColor,
      extendedProps: {
        ...movedEvent.extendedProps
      }
    };
    
    if (updatedEvent.extendedProps?.isBlockedTime) {
      this.calendarService.updateBlockedTime(updatedEvent);
    } else {
      this.calendarService.updateEvent(updatedEvent);
    }
  }
  
  private handleEventResize(info: any): void {
    // Handle resized events
    const resizedEvent = info.event;
    
    // Create event object from the resized event
    const updatedEvent: CalendarEvent = {
      id: resizedEvent.id,
      title: resizedEvent.title,
      start: resizedEvent.start.toISOString(),
      end: resizedEvent.end.toISOString(),
      resourceId: resizedEvent.getResources()[0]?.id,
      color: resizedEvent.backgroundColor,
      textColor: resizedEvent.textColor,
      extendedProps: {
        ...resizedEvent.extendedProps
      }
    };
    
    if (updatedEvent.extendedProps?.isBlockedTime) {
      this.calendarService.updateBlockedTime(updatedEvent);
    } else {
      this.calendarService.updateEvent(updatedEvent);
    }
  }
  
  // Time block form methods
  showBlockTimeForm(): void {
    this.selectedBlockToEdit.set(null); // Reset any previously selected block
    this.isAppointmentForm.set(false); // Set form mode to time block
    this.showTimeBlockForm.set(true);
  }
  
  closeBlockTimeForm(): void {
    this.showTimeBlockForm.set(false);
    this.selectedBlockToEdit.set(null);
    // No need to reset isAppointmentForm as it will be set when opening the form again
  }
  
  handleBlockTimeSaved(event: CalendarEvent): void {
    if (this.selectedBlockToEdit()) {
      // Update existing event
      if (event.extendedProps?.['isAppointment']) {
        this.calendarService.updateEvent(event);
      } else {
        this.calendarService.updateBlockedTime(event);
      }
    } else {
      // Add new event
      if (event.extendedProps?.['isAppointment']) {
        this.calendarService.addEvent(event);
      } else {
        this.calendarService.addBlockedTime(event);
      }
    }
    
    this.refreshEvents();
  }
  
  handleBlockTimeDeleted(eventId: string): void {
    // Determine if it's an appointment or blocked time based on the ID prefix
    if (eventId.startsWith('appointment-')) {
      this.calendarService.deleteEvent(eventId);
    } else {
      this.calendarService.deleteBlockedTime(eventId);
    }
    
    this.refreshEvents();
  }
  
  // Handle "New Appointment" button click from toolbar
  createNewAppointment(): void {
    // Create default appointment at current time with 30-minute duration
    const startDateTime = new Date(this.currentDate());
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + 30);
    
    // Create appointment event object
    const newAppointment: CalendarEvent = {
      id: `appointment-${Date.now()}`,
      title: 'New Appointment',
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      resourceId: this.calendarService.resources()[0]?.id,
      color: '#4285F4', // Google Calendar blue
      textColor: '#FFFFFF',
      extendedProps: {
        isAppointment: true,
        status: 'scheduled'
      }
    };
    
    // Open the form with this pre-filled appointment
    this.selectedBlockToEdit.set(newAppointment);
    this.isAppointmentForm.set(true); // Set form mode to appointment
    this.showTimeBlockForm.set(true);
  }
}