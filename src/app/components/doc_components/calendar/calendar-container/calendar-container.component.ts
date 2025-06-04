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
import { AppointmentDetailsModalComponent } from '../appointment-details-modal/appointment-details-modal.component';

@Component({
  selector: 'app-calendar-container',
  standalone: true,  imports: [
    CommonModule,
    CalendarToolbarComponent,
    MiniCalendarComponent,
    ResourceFilterComponent,
    SearchFilterComponent,
    TimeBlockFormComponent,
    AppointmentDetailsModalComponent
  ],
  templateUrl: './calendar-container.component.html',
  styleUrls: ['./calendar-container.component.css']
})
export class CalendarContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('calendar') calendarEl!: ElementRef;
    private calendarService = inject(CalendarService);
  private calendar: Calendar | null = null;
  
  // State signals
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
    // State for time block form
  showTimeBlockForm = signal<boolean>(false);
  selectedBlockToEdit = signal<CalendarEvent | null>(null);
  isAppointmentForm = signal<boolean>(false);
  
  // State for appointment details modal
  showAppointmentDetails = signal<boolean>(false);
  selectedAppointment = signal<CalendarEvent | null>(null);
  
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
        interactionPlugin
        // Temporarily remove resourceTimeGridPlugin to test basic events
        // resourceTimeGridPlugin
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
      eventDrop: this.handleEventDrop.bind(this),      eventResize: this.handleEventResize.bind(this),
      events: (fetchInfo, successCallback, failureCallback) => {
        // Load appointments for the current date range
        const startDate = fetchInfo.start.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
        const endDate = fetchInfo.end.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
        
        console.log('FullCalendar requesting events for:', { startDate, endDate });
        
        this.calendarService.loadAppointmentsByDateRange(startDate, endDate).subscribe({
          next: (calendarEvents) => {
            console.log('Events loaded successfully, count:', calendarEvents.length);
            if (calendarEvents.length > 0) {
              console.log('Sample event:', calendarEvents[0]);
            }
            
            // Transform the CalendarEvent objects to FullCalendar format
            const fullCalendarEvents = calendarEvents.map(event => {
              // Convert Date objects to ISO strings for FullCalendar
              let startTime = event.start;
              let endTime = event.end;
              
              if (startTime instanceof Date) {
                startTime = startTime.toISOString();
              }
              if (endTime instanceof Date) {
                endTime = endTime.toISOString();
              }
                const fcEvent: any = {
                id: event.id,
                title: event.title,
                start: startTime,
                end: endTime,
                allDay: event.allDay || false,
                backgroundColor: event.backgroundColor || event.color || '#4285F4',
                borderColor: event.borderColor || event.color || '#4285F4',
                textColor: event.textColor || '#FFFFFF',
                extendedProps: event.extendedProps || {}
                // Temporarily remove resourceId to test basic events
                // resourceId: event.resourceId
              };
              
              return fcEvent;
            });
            
            console.log('Transformed events for FullCalendar:', fullCalendarEvents);
            successCallback(fullCalendarEvents);
          },
          error: (error) => {
            console.error('Failed to load calendar events:', error);
            failureCallback(error);
          }        });      },
      // Temporarily remove resources to test basic events
      // resources: this.calendarService.resources(),
      schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
        // Professional event styling
      eventDidMount: (info) => {
        console.log('Event mounted:', info.event.title);
        // Apply professional styling
        info.el.style.minHeight = '20px';
      }
    });
    
    console.log('About to render calendar...');
    this.calendar.render();
    console.log('Calendar rendered successfully');
    
    // Check calendar state after render
    setTimeout(() => {
      console.log('Calendar post-render check:');
      console.log('- Calendar element:', this.calendarEl.nativeElement);
      console.log('- Calendar element children count:', this.calendarEl.nativeElement.children.length);
      console.log('- Calendar view:', this.calendar?.view?.type);
      const fcEvents = this.calendarEl.nativeElement.querySelectorAll('.fc-event');
      console.log('- Found events in DOM:', fcEvents.length);
    }, 1000);
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
        // resourceId: clickedEvent.getResources()[0]?.id, // Disabled since no resources
        color: clickedEvent.backgroundColor,
        textColor: clickedEvent.textColor,
        extendedProps: {
          ...clickedEvent.extendedProps
        }
      };
      
      this.selectedBlockToEdit.set(blockedTimeEvent);
      this.showTimeBlockForm.set(true);
    } else {
      // Handle regular appointment click - Show appointment details modal
      const selectedEvent: CalendarEvent = {
        id: clickedEvent.id,
        title: clickedEvent.title,
        start: clickedEvent.start.toISOString(),
        end: clickedEvent.end.toISOString(),
        // resourceId: clickedEvent.getResources()[0]?.id, // Disabled since no resources
        extendedProps: {
          ...clickedEvent.extendedProps
        }
      };
      
      this.calendarService.setSelectedEvent(selectedEvent);
      
      // Show appointment details modal
      this.selectedAppointment.set(selectedEvent);
      this.showAppointmentDetails.set(true);
      
      console.log('Appointment clicked:', selectedEvent);
    }
  }
    private handleDateClick(info: any): void {
    // Open the appointment creation form when a date/time cell is clicked
    console.log('Date clicked for new appointment:', info.date);
    
    // Store the clicked date/time info for the form to use
    this.calendarService.setDefaultDateTimeForNewAppointment(info.date);
    
    // Open new appointment form (no blockToEdit = creating new)
    this.selectedBlockToEdit.set(null); // Set to null for creating new appointment
    this.isAppointmentForm.set(true); // Set form type to appointment
    this.showTimeBlockForm.set(true);
  }
    private handleRangeSelect(info: any): void {
    // When a range is selected, open appointment form with the time range pre-filled
    console.log('Date range selected for new appointment:', info.start, 'to', info.end);
    
    // Store the selected range info for the form to use
    this.calendarService.setDefaultDateTimeRangeForNewAppointment(info.start, info.end);
    
    // Open new appointment form (no blockToEdit = creating new)
    this.selectedBlockToEdit.set(null); // Set to null for creating new appointment
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
      // resourceId: movedEvent.getResources()[0]?.id, // Disabled since no resources
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
      // resourceId: resizedEvent.getResources()[0]?.id, // Disabled since no resources
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
  
  // Appointment details modal methods
  closeAppointmentDetails(): void {
    this.showAppointmentDetails.set(false);
    this.selectedAppointment.set(null);
  }
  editAppointmentFromModal(appointment: CalendarEvent): void {
    // Close the details modal
    this.closeAppointmentDetails();
    
    // Ensure appointment is marked for editing as an appointment
    const appointmentToEdit: CalendarEvent = {
      ...appointment,
      extendedProps: {
        ...appointment.extendedProps,
        isAppointment: true
      }
    };
    
    // Open the appointment form for editing with complete appointment data
    this.selectedBlockToEdit.set(appointmentToEdit);
    this.isAppointmentForm.set(true);
    this.showTimeBlockForm.set(true);
    
    console.log('Opening appointment for editing:', appointmentToEdit);
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
    console.log('Creating new appointment from toolbar button');
    
    const now = new Date();
    // Store the default time for the form to use
    this.calendarService.setDefaultDateTimeForNewAppointment(now);
    
    // Open new appointment form (no blockToEdit = creating new)
    this.selectedBlockToEdit.set(null); // Set to null for creating new appointment
    this.isAppointmentForm.set(true); // Set form mode to appointment
    this.showTimeBlockForm.set(true);
  }
  
  // Error handling method
  retryLoadData(): void {
    this.error.set(null);
    this.loading.set(true);
    if (this.calendar) {
      this.calendar.refetchEvents();
    }
  }
}