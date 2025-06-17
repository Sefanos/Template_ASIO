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
import { BlockedTimeDeleteModalComponent } from '../blocked-time-delete-modal/blocked-time-delete-modal.component';

@Component({
  selector: 'app-calendar-container',
  standalone: true,
  imports: [
    CommonModule,
    CalendarToolbarComponent,
    MiniCalendarComponent,
    ResourceFilterComponent,
    SearchFilterComponent,
    TimeBlockFormComponent,
    AppointmentDetailsModalComponent,
    BlockedTimeDeleteModalComponent
  ],
  templateUrl: './calendar-container.component.html',
  styleUrls: ['./calendar-container.component.css']
})
export class CalendarContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('calendar') calendarEl!: ElementRef;
  private calendarService = inject(CalendarService);
  private calendar: Calendar | null = null;
  
  // State signals - Simplified approach
  initializing = signal<boolean>(true);
  eventsLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // State for time block form
  showTimeBlockForm = signal<boolean>(false);
  selectedBlockToEdit = signal<CalendarEvent | null>(null);
  isAppointmentForm = signal<boolean>(false);
  
  // State for appointment details modal
  showAppointmentDetails = signal<boolean>(false);
  selectedAppointment = signal<CalendarEvent | null>(null);
  
  // State for blocked time delete modal
  showBlockedTimeDeleteModal = signal<boolean>(false);
  selectedBlockedTime = signal<CalendarEvent | null>(null);
  
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
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.initCalendar();
    }, 50);
  }
  
  ngOnDestroy(): void {
    if (this.calendar) {
      this.calendar.destroy();
    }
  }
  
  private initCalendar(): void {
    if (!this.calendarEl) {
      console.error('Calendar element not found');
      this.error.set('Failed to initialize calendar - element not found');
      this.initializing.set(false);
      return;
    }

    try {
      this.calendar = new Calendar(this.calendarEl.nativeElement, {
        plugins: [
          dayGridPlugin,
          timeGridPlugin,
          listPlugin,
          interactionPlugin
        ],
        initialView: this.currentView(),
        initialDate: this.currentDate(),
        headerToolbar: false,
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
        loading: (isLoading: boolean) => {
          // FullCalendar's built-in loading callback
          this.eventsLoading.set(isLoading);
        },
        events: (fetchInfo, successCallback, failureCallback) => {
          // Load appointments for the current date range
          const startDate = fetchInfo.start.toISOString().split('T')[0];
          const endDate = fetchInfo.end.toISOString().split('T')[0];
          
          console.log('FullCalendar requesting events for:', { startDate, endDate });
          
          this.calendarService.loadAppointmentsByDateRange(startDate, endDate).subscribe({
            next: (calendarEvents) => {
              console.log('Events loaded successfully, count:', calendarEvents.length);
              if (calendarEvents.length > 0) {
                console.log('Sample event:', calendarEvents[0]);
              }
              
              // Transform the CalendarEvent objects to FullCalendar format
              const fullCalendarEvents = calendarEvents.map(event => {
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
                };
                
                return fcEvent;
              });
              
              console.log('Transformed events for FullCalendar:', fullCalendarEvents);
              successCallback(fullCalendarEvents);
            },
            error: (error) => {
              console.error('Failed to load calendar events:', error);
              this.error.set('Failed to load appointments. Please try again.');
              failureCallback(error);
            }
          });
        },
        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
        eventDidMount: (info) => {
          console.log('Event mounted:', info.event.title);
          info.el.style.minHeight = '20px';
        }
      });
      
      console.log('About to render calendar...');
      this.calendar.render();
      console.log('Calendar rendered successfully');
      
      // Mark initialization as complete
      this.initializing.set(false);
      
      // Check calendar state after render
      setTimeout(() => {
        console.log('Calendar post-render check:');
        console.log('- Calendar element:', this.calendarEl.nativeElement);
        console.log('- Calendar element children count:', this.calendarEl.nativeElement.children.length);
        console.log('- Calendar view:', this.calendar?.view?.type);
        const fcEvents = this.calendarEl.nativeElement.querySelectorAll('.fc-event');
        console.log('- Found events in DOM:', fcEvents.length);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to initialize calendar:', error);
      this.error.set('Failed to initialize calendar. Please refresh the page.');
      this.initializing.set(false);
    }
  }
  
  private refreshEvents(): void {
    if (!this.calendar) return;
    this.calendar.refetchEvents();
  }

  // Event handlers (keeping all your existing handlers unchanged)
  private handleEventClick(info: any): void {
    const clickedEvent = info.event;
    
    if (clickedEvent.extendedProps.isBlockedTime) {
      const blockedTimeEvent: CalendarEvent = {
        id: clickedEvent.id,
        title: clickedEvent.title,
        start: clickedEvent.start.toISOString(),
        end: clickedEvent.end.toISOString(),
        color: clickedEvent.backgroundColor,
        textColor: clickedEvent.textColor,
        extendedProps: {
          ...clickedEvent.extendedProps
        }
      };
      
      this.selectedBlockedTime.set(blockedTimeEvent);
      this.showBlockedTimeDeleteModal.set(true);
    } else {
      const selectedEvent: CalendarEvent = {
        id: clickedEvent.id,
        title: clickedEvent.title,
        start: clickedEvent.start.toISOString(),
        end: clickedEvent.end.toISOString(),
        extendedProps: {
          ...clickedEvent.extendedProps
        }
      };
      
      this.calendarService.setSelectedEvent(selectedEvent);
      this.selectedAppointment.set(selectedEvent);
      this.showAppointmentDetails.set(true);
      
      console.log('Appointment clicked:', selectedEvent);
    }
  }

  private handleDateClick(info: any): void {
    console.log('Date clicked for new appointment:', info.date);
    this.calendarService.setDefaultDateTimeForNewAppointment(info.date);
    this.selectedBlockToEdit.set(null);
    this.isAppointmentForm.set(true);
    this.showTimeBlockForm.set(true);
  }

  private handleRangeSelect(info: any): void {
    console.log('Date range selected for new appointment:', info.start, 'to', info.end);
    this.calendarService.setDefaultDateTimeRangeForNewAppointment(info.start, info.end);
    this.selectedBlockToEdit.set(null);
    this.isAppointmentForm.set(true);
    this.showTimeBlockForm.set(true);
  }

  private handleEventDrop(info: any): void {
    const movedEvent = info.event;
    
    const updatedEvent: CalendarEvent = {
      id: movedEvent.id,
      title: movedEvent.title,
      start: movedEvent.start.toISOString(),
      end: movedEvent.end.toISOString(),
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
    const resizedEvent = info.event;
    
    const updatedEvent: CalendarEvent = {
      id: resizedEvent.id,
      title: resizedEvent.title,
      start: resizedEvent.start.toISOString(),
      end: resizedEvent.end.toISOString(),
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
    this.selectedBlockToEdit.set(null);
    this.isAppointmentForm.set(false);
    this.showTimeBlockForm.set(true);
  }

  closeBlockTimeForm(): void {
    this.showTimeBlockForm.set(false);
    this.selectedBlockToEdit.set(null);
  }

  // Appointment details modal methods
  closeAppointmentDetails(): void {
    this.showAppointmentDetails.set(false);
    this.selectedAppointment.set(null);
  }

  // Blocked time delete modal methods
  closeBlockedTimeDeleteModal(): void {
    this.showBlockedTimeDeleteModal.set(false);
    this.selectedBlockedTime.set(null);
  }

  handleBlockedTimeDelete(blockedTimeId: string): void {
    this.calendarService.deleteBlockedTime(blockedTimeId).subscribe({
      next: (success) => {
        if (success) {
          console.log('Blocked time deleted successfully');
          this.refreshEvents();
        }
        this.closeBlockedTimeDeleteModal();
      },
      error: (error) => {
        console.error('Failed to delete blocked time:', error);
        this.closeBlockedTimeDeleteModal();
      }
    });
  }

  editAppointmentFromModal(appointment: CalendarEvent): void {
    this.closeAppointmentDetails();
    
    const appointmentToEdit: CalendarEvent = {
      ...appointment,
      extendedProps: {
        ...appointment.extendedProps,
        isAppointment: true
      }
    };
    
    this.selectedBlockToEdit.set(appointmentToEdit);
    this.isAppointmentForm.set(true);
    this.showTimeBlockForm.set(true);
    
    console.log('Opening appointment for editing:', appointmentToEdit);
  }

  handleBlockTimeSaved(event: CalendarEvent): void {
    if (this.selectedBlockToEdit()) {
      if (event.extendedProps?.['isAppointment']) {
        this.calendarService.updateEvent(event);
      } else {
        this.calendarService.updateBlockedTime(event);
      }
    } else {
      if (event.extendedProps?.['isAppointment']) {
        this.calendarService.addEvent(event);
      } else {
        this.calendarService.addBlockedTime(event);
      }
    }
    
    this.refreshEvents();
  }
  
  handleBlockTimeDeleted(eventId: string): void {
    if (eventId.startsWith('appointment-')) {
      this.calendarService.deleteEvent(eventId);
    } else {
      this.calendarService.deleteBlockedTime(eventId);
    }
    
    this.refreshEvents();
  }

  createNewAppointment(): void {
    console.log('Creating new appointment from toolbar button');
    
    const now = new Date();
    this.calendarService.setDefaultDateTimeForNewAppointment(now);
    
    this.selectedBlockToEdit.set(null);
    this.isAppointmentForm.set(true);
    this.showTimeBlockForm.set(true);
  }
  
  // Error handling method
  retryLoadData(): void {
    this.error.set(null);
    this.initializing.set(true);
    // Reinitialize the calendar
    if (this.calendar) {
      this.calendar.destroy();
      this.calendar = null;
    }
    setTimeout(() => {
      this.initCalendar();
    }, 100);
  }
}