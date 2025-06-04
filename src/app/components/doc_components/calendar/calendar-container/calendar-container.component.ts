import { Component, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorAppointmentService } from '../../../../shared/services/appointment/doctor-appointement.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { CalendarEvent, CalendarResource } from '../../../../models/calendar/calendar.model';
import { Appointment, AppointmentStatus } from '../../../../models/appointment.model';
import { User } from '../../../../models/user.model';
import { LoggingService } from '../../../../shared/services/loggin.service';


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
  
  private doctorAppointmentService = inject(DoctorAppointmentService);
  private authService = inject(AuthService);
  private calendar: Calendar | null = null;
   private loggingService = inject(LoggingService);
  
  // State for time block form
  showTimeBlockForm = signal<boolean>(false);
  selectedBlockToEdit = signal<CalendarEvent | null>(null);
  isAppointmentForm = signal<boolean>(false);
  
  // Calendar reactive state
  currentView = signal<string>('timeGridWeek');
  currentDate = signal<Date>(new Date());
  
  // Filter states for UI components
  filteredDoctorIds = signal<string[]>([]);
  searchQuery = signal<string>('');
  selectedEvent = signal<CalendarEvent | null>(null);
  
  // Doctor appointment state
  doctorAppointments = this.doctorAppointmentService.filteredAppointments;
  
  // Current authenticated doctor - convert Observable to signal
  currentDoctor = signal<User | null>(null);
  
  // Resources - only show current doctor
  resources = signal<CalendarResource[]>([]);
  
  constructor() {
try {
      
      // Subscribe to auth service and convert to signal
      this.authService.currentUser.subscribe(user => {
        this.currentDoctor.set(user);
      });
      
      // Initialize resources with current doctor
      effect(() => {
        const doctor = this.currentDoctor();
        if (doctor && this.authService.hasRole(['doctor'])) {
          this.resources.set([{
            id: doctor.id.toString(),
            title: `Dr. ${doctor.name}`,
            eventColor: '#4285F4',
            extendedProps: {
              type: 'doctor',
              // specialty: doctor.specialty || 'General Practice',
              // image: doctor.profileImage || '/assets/placeholder-user.jpg',
              // firstName: doctor.firstName,
              // lastName: doctor.lastName,
              email: doctor.email
            },
            businessHours: [{
              startTime: '08:00',
              endTime: '17:00',
              daysOfWeek: [1, 2, 3, 4, 5]
            }]
          }]);
        }
      });
} catch (error) {
   this.loggingService.error('Error setting up doctor resources:', error);
}
    
    // Use effect to react to view changes
    effect(() => {
      const view = this.currentView();
      if (this.calendar && this.calendar.view && this.calendar.view.type !== view) {
        this.calendar.changeView(view);
      }
    });
    
    // Use effect to react to date changes
    effect(() => {
      const date = this.currentDate();
      if (this.calendar) {
        this.calendar.gotoDate(date);
        // Load appointments for the new date
        this.loadAppointmentsForDate(date);
      }
    });
    
    // Use effect to react to filter changes
    effect(() => {
      this.filteredDoctorIds();
      if (this.calendar) {
        this.refreshEvents();
      }
    });
    
    // Use effect to react to search changes
    effect(() => {
      this.searchQuery();
      if (this.calendar) {
        this.refreshEvents();
      }
    });
    
    // Use effect to react to appointment changes
    effect(() => {
      this.doctorAppointments();
      if (this.calendar) {
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.refreshEvents();
        });
      }
    });
  }
  
  ngAfterViewInit(): void {
    // Use setTimeout to ensure proper initialization order
    setTimeout(() => {
      this.initCalendar();
      this.loadInitialAppointments();
    });
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
      slotMinTime: '06:00:00',
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
        // Convert doctor appointments to calendar events
        const calendarEvents = this.convertAppointmentsToEvents();
        // Apply filters
        const filteredEvents = this.applyFilters(calendarEvents);
        successCallback(filteredEvents);
      },
      resources: this.resources(),
      schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source'
    });
    
    this.calendar.render();
  }
  
  private loadInitialAppointments(): void {
    // Load appointments for the current date
    this.loadAppointmentsForDate(this.currentDate());
  }
  
  private loadAppointmentsForDate(date: Date): void {
    // Set the selected date in doctor service and load appointments
    this.doctorAppointmentService.setSelectedDate(date);
  }
  
  private convertAppointmentsToEvents(): CalendarEvent[] {
    const appointments = this.doctorAppointments();
    
    return appointments.map(appointment => this.appointmentToCalendarEvent(appointment));
  }
  
  private appointmentToCalendarEvent(appointment: Appointment): CalendarEvent {
    // Combine date and time to create full datetime strings
    const startDateTime = this.combineDateTime(appointment.date, appointment.time);
    const endDateTime = appointment.endTime ? 
      this.combineDateTime(appointment.date, appointment.endTime) : 
      this.addMinutes(startDateTime, appointment.duration);
    
    return {
      id: appointment.id.toString(),
      title: appointment.isBlockedTime ? appointment.reason : `${appointment.patientName} - ${appointment.reason}`,
      start: startDateTime,
      end: endDateTime,
      resourceId: appointment.doctorId?.toString(),
      color: appointment.isBlockedTime ? '#FF5722' : this.getAppointmentColor(appointment),
      textColor: '#FFFFFF',
      extendedProps: {
        isBlockedTime: appointment.isBlockedTime,
        isAppointment: !appointment.isBlockedTime,
        status: appointment.status,
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        reason: appointment.reason,
        notes: appointment.notes,
        appointmentType: appointment.type,
        originalAppointment: appointment
      }
    };
  }
  
  private combineDateTime(date: string, time: string): string {
    return `${date}T${time}:00`;
  }
  
  private addMinutes(dateTimeString: string, minutes: number): string {
    const date = new Date(dateTimeString);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
  }
  
  private getAppointmentColor(appointment: Appointment): string {
    // Color coding based on appointment status
    switch (appointment.status) {
      case AppointmentStatus.Pending:
        return '#4285F4'; // Blue
      case AppointmentStatus.Confirmed:
        return '#34A853'; // Green
      case AppointmentStatus.Cancelled:
        return '#EA4335'; // Red
      case AppointmentStatus.Completed:
        return '#9AA0A6'; // Gray
      case AppointmentStatus.NoShow:
        return '#FF6D01'; // Orange
      default:
        return '#4285F4'; // Default blue
    }
  }
  
  private applyFilters(events: CalendarEvent[]): CalendarEvent[] {
    const currentDoctor = this.currentDoctor();
    const searchQuery = this.searchQuery().toLowerCase();
    
    return events.filter(event => {
      // Only show appointments for current doctor
      if (currentDoctor && event.resourceId !== currentDoctor.id.toString()) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const matchesTitle = event.title.toLowerCase().includes(searchQuery);
        const matchesPatient = event.extendedProps?.patientName?.toLowerCase().includes(searchQuery);
        const matchesType = event.extendedProps?.appointmentType?.toLowerCase().includes(searchQuery);
        const matchesReason = event.extendedProps?.reason?.toLowerCase().includes(searchQuery);
        
        if (!(matchesTitle || matchesPatient || matchesType || matchesReason)) {
          return false;
        }
      }
      
      return true;
    });
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
      // Handle regular appointment click
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
      
      this.selectedEvent.set(selectedEvent);
      console.log('Appointment clicked:', selectedEvent);
    }
  }
  
  private handleDateClick(info: any): void {
    const currentDoctor = this.currentDoctor();
    if (!currentDoctor) return;
    
    // Open the appointment creation form when a date/time cell is clicked
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
      resourceId: currentDoctor.id.toString(),
      color: '#4285F4',
      textColor: '#FFFFFF',
      extendedProps: {
        isAppointment: true,
        status: AppointmentStatus.Pending
      }
    };
    
    this.selectedBlockToEdit.set(newAppointment);
    this.isAppointmentForm.set(true);
    this.showTimeBlockForm.set(true);
  }
  
  private handleRangeSelect(info: any): void {
    const currentDoctor = this.currentDoctor();
    if (!currentDoctor) return;
    
    // When a range is selected, open appointment form with the time range pre-filled
    const newAppointment: CalendarEvent = {
      id: `appointment-${Date.now()}`,
      title: 'New Appointment',
      start: info.start.toISOString(),
      end: info.end.toISOString(),
      resourceId: currentDoctor.id.toString(),
      color: '#4285F4',
      textColor: '#FFFFFF',
      extendedProps: {
        isAppointment: true,
        status: AppointmentStatus.Pending
      }
    };
    
    this.selectedBlockToEdit.set(newAppointment);
    this.isAppointmentForm.set(true);
    this.showTimeBlockForm.set(true);
  }
  
  private handleEventDrop(info: any): void {
    // Handle dropped (moved) events
    const movedEvent = info.event;
    
    if (movedEvent.extendedProps.originalAppointment) {
      // This is from the doctor appointment service
      const originalAppointment: Appointment = movedEvent.extendedProps.originalAppointment;
      const newDate = movedEvent.start.toISOString().split('T')[0];
      const newTime = movedEvent.start.toTimeString().substring(0, 5);
      
      // Update through doctor appointment service
      if (originalAppointment.isBlockedTime) {
        const updatedBlockData: Partial<Appointment> = {
          date: newDate,
          time: newTime,
          endTime: movedEvent.end?.toTimeString().substring(0, 5),
          reason: originalAppointment.reason,
          isBlockedTime: true
        };
        
        this.doctorAppointmentService.addBlockedTime(updatedBlockData).subscribe({
          next: () => this.refreshEvents(),
          error: (error) => {
            console.error('Error updating blocked time:', error);
            info.revert(); // Revert the move on error
          }
        });
      } else {
        // For regular appointments, call reschedule method
        this.doctorAppointmentService.rescheduleDoctorAppointment(originalAppointment.id, newDate, newTime).subscribe({
          next: () => this.refreshEvents(),
          error: (error) => {
            console.error('Error rescheduling appointment:', error);
            info.revert();
          }
        });
      }
    }
  }
  
  private handleEventResize(info: any): void {
    // Handle resized events - similar logic to handleEventDrop
    const resizedEvent = info.event;
    
    if (resizedEvent.extendedProps.originalAppointment) {
      const originalAppointment: Appointment = resizedEvent.extendedProps.originalAppointment;
      const newEndTime = resizedEvent.end?.toTimeString().substring(0, 5);
      
      if (originalAppointment.isBlockedTime) {
        const updatedBlockData: Partial<Appointment> = {
          date: originalAppointment.date,
          time: originalAppointment.time,
          endTime: newEndTime,
          reason: originalAppointment.reason,
          isBlockedTime: true
        };
        
        this.doctorAppointmentService.addBlockedTime(updatedBlockData).subscribe({
          next: () => this.refreshEvents(),
          error: (error) => {
            console.error('Error updating blocked time:', error);
            info.revert();
          }
        });
      } else {
        console.log('Resizing appointment to end at:', newEndTime);
        // TODO: Implement appointment duration update
      }
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
  
  handleBlockTimeSaved(event: CalendarEvent): void {
    if (this.selectedBlockToEdit()) {
      // Update existing event
      if (event.extendedProps?.['isAppointment']) {
        // For appointments - TODO: implement appointment update
        console.log('Updating appointment via doctor service:', event);
      } else {
        // For blocked time, use doctor service
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        
        const blockData: Partial<Appointment> = {
          date: startDate.toISOString().split('T')[0],
          time: startDate.toTimeString().substring(0, 5),
          endTime: endDate.toTimeString().substring(0, 5),
          reason: event.title,
          isBlockedTime: true
        };
        
        this.doctorAppointmentService.addBlockedTime(blockData).subscribe({
          next: () => {
            this.refreshEvents();
            this.closeBlockTimeForm();
          },
          error: (error) => console.error('Error saving blocked time:', error)
        });
        return;
      }
    } else {
      // Add new event
      if (event.extendedProps?.['isAppointment']) {
        // For new appointments - TODO: implement appointment creation
        console.log('Creating new appointment via doctor service:', event);
      } else {
        // For new blocked time
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        
        const blockData: Partial<Appointment> = {
          date: startDate.toISOString().split('T')[0],
          time: startDate.toTimeString().substring(0, 5),
          endTime: endDate.toTimeString().substring(0, 5),
          reason: event.title,
          isBlockedTime: true
        };
        
        this.doctorAppointmentService.addBlockedTime(blockData).subscribe({
          next: () => {
            this.refreshEvents();
            this.closeBlockTimeForm();
          },
          error: (error) => console.error('Error adding blocked time:', error)
        });
        return;
      }
    }
    
    this.refreshEvents();
    this.closeBlockTimeForm();
  }
  
  handleBlockTimeDeleted(eventId: string): void {
    // TODO: Implement proper deletion through doctor appointment service
    console.log('Deleting event:', eventId);
    this.refreshEvents();
    this.closeBlockTimeForm();
  }
  
  // Handle "New Appointment" button click from toolbar
  createNewAppointment(): void {
    const currentDoctor = this.currentDoctor();
    if (!currentDoctor) return;
    
    const startDateTime = new Date(this.currentDate());
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + 30);
    
    const newAppointment: CalendarEvent = {
      id: `appointment-${Date.now()}`,
      title: 'New Appointment',
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      resourceId: currentDoctor.id.toString(),
      color: '#4285F4',
      textColor: '#FFFFFF',
      extendedProps: {
        isAppointment: true,
        status: AppointmentStatus.Pending
      }
    };
    
    this.selectedBlockToEdit.set(newAppointment);
    this.isAppointmentForm.set(true);
    this.showTimeBlockForm.set(true);
  }
  
  // Public methods for UI components
  setCurrentView(view: string): void {
    this.currentView.set(view);
  }
  
  setCurrentDate(date: Date): void {
    this.currentDate.set(date);
  }
  
  setFilteredDoctorIds(doctorIds: string[]): void {
    this.filteredDoctorIds.set(doctorIds);
  }
  
  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }
  
  // Getter methods for child components
  getCurrentView(): string {
    return this.currentView();
  }
  
  getCurrentDate(): Date {
    return this.currentDate();
  }
  
  getResources(): CalendarResource[] {
    return this.resources();
  }
  
  getSearchQuery(): string {
    return this.searchQuery();
  }
  
  getFilteredDoctorIds(): string[] {
    return this.filteredDoctorIds();
  }
}