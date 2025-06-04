import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CalendarOptions, EventClickArg, DateSelectArg, CalendarApi, ViewApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction'; // Pour la sélection de date, le clic sur événement
import { FullCalendarComponent } from '@fullcalendar/angular';
import { MyCalendarEvent } from '../../../../../core/patient/domain/models/calendar-event.model';
import { PatientAppointmentService } from '../../../../../shared/services/patient-appointment.service';
import { PatientAppointmentAdapter } from '../../../../../shared/services/patient-appointment-adapter.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-shared-calendar',
  standalone: false,
  templateUrl: './shared-calendar.component.html',
  styleUrl: './shared-calendar.component.css',
  providers: [DatePipe]
})
export class SharedCalendarComponent implements OnInit, AfterViewInit {
  
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  public calendarApi!: CalendarApi;

  doctorName = 'Available Doctors';
  allCalendarEvents: MyCalendarEvent[] = [];
  calendarEvents: MyCalendarEvent[] = [];
  resources: { id: string, title: string, eventColor: string, specialty?: string }[] = [];
  selectedResources: string[] = [];
  searchTerm: string = '';
  
  // Loading and error states
  loadingDoctors = false;
  loadingAppointments = false;
  doctorsError: string | null = null;

  miniCalendarViewDate: Date = new Date(2025, 4, 1); // May 1, 2025
  miniCalendarDays: { date: Date, dayOfMonth: number, isCurrentMonth: boolean, isSelected: boolean }[] = [];
  miniCalendarWeekDaysHeader = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  customToolbarTitle: string = '';

  isSubmitting: boolean = false; // Added this property

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: false,
    weekends: true,
    editable: true, 
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    events: [],
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    height: 'auto',
    contentHeight: 650,
    slotMinTime: '07:00:00',
    slotMaxTime: '19:00:00',
    eventTimeFormat: { hour: 'numeric', minute: '2-digit', meridiem: 'short' },
    displayEventTime: true,
    allDaySlot: false,
    datesSet: (arg) => {
      if (this.calendarApi) {
        this.updateCustomToolbarTitle(arg.view);
      }
    },
  };

  isEventModalOpen = false;
  selectedEventDetails: MyCalendarEvent | null = null;

  isBookingFormOpen = false;
  bookingForm: FormGroup;
  selectedDateForBooking: Date | null = null;
  selectedTimeForBooking: string | null = null;
  selectedEndTimeForBooking: string | null = null;
  slotDurationMinutes = 30; 

  constructor(
    private patientAppointmentService: PatientAppointmentService,
    private appointmentAdapter: PatientAppointmentAdapter,
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef
  ) {
    this.bookingForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.email]],
      phoneNumber: [''],
      notes: [''],
    });
  }

  ngOnInit(): void {
    // Load doctors first, then appointments will be loaded after doctors are ready
    this.loadAvailableDoctors();
    this.generateMiniCalendar();
  }

  loadAvailableDoctors(): void {
    this.loadingDoctors = true;
    this.doctorsError = null;
    
    this.patientAppointmentService.getAvailableDoctors().subscribe({
      next: (doctors) => {
        console.log('Received doctors from API:', doctors);
        
        // Filter out users without doctor profile and create resources
        const validDoctors = doctors.filter(doctor => doctor.doctor !== null);
        
        this.resources = validDoctors.map(doctor => ({
          id: doctor.id.toString(),
          title: `${doctor.name} (${doctor.doctor.specialty})`,
          eventColor: this.generateRandomColor(),
          specialty: doctor.doctor.specialty
        }));
        
        console.log('Created doctor resources:', this.resources);
        this.loadingDoctors = false;
        
        // Start with no doctors selected (as requested)
        this.selectedResources = [];
        
        // Load appointments after doctors are ready
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error loading available doctors:', error);
        this.doctorsError = 'Failed to load available doctors. Please try again.';
        this.loadingDoctors = false;
        
        // Fallback to empty resources
        this.resources = [];
        this.selectedResources = [];
        
        // Still try to load appointments even if doctors failed
        this.loadAppointments();
      }
    });
  }

  private generateRandomColor(): string {
    const colors = [
      '#3a87ad', '#468847', '#c09853', '#b94a48', '#5a5a5a',
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  loadAppointments(): void {
    console.log('Loading appointments for calendar...');
    this.loadingAppointments = true;
    
    // Load all appointments to display in calendar (not just upcoming)
    this.patientAppointmentService.getMyAppointments().subscribe({
      next: (sharedAppointments) => {
        console.log('Received appointments from API:', sharedAppointments);
        // Convert shared appointments to patient model then to calendar events
        const patientAppointments = this.appointmentAdapter.toPatientModelArray(sharedAppointments);
        console.log('Converted to patient appointments:', patientAppointments);
        
        this.allCalendarEvents = patientAppointments.map(appointment => {
          // Convert time format from "9:00 AM" to "09:00" format
          const convertedTime = this.convertTimeFormat(appointment.time);
          const startDateTime = `${appointment.date}T${convertedTime}`;
          const startDate = new Date(startDateTime);
          const endDate = new Date(startDate.getTime() + 30 * 60000); // Add 30 minutes
          
          // Find the doctor resource to get specialty information
          const doctorResource = this.resources.find(r => r.id === appointment.doctorId.toString());
          const doctorDisplayName = doctorResource ? 
            `${appointment.doctorName} (${doctorResource.specialty})` : 
            (appointment.doctorName || 'Doctor');
          
          const calendarEvent = {
            id: appointment.id.toString(),
            title: `${appointment.reason || 'Appointment'} - ${doctorDisplayName}`,
            start: startDate,
            end: endDate,
            backgroundColor: this.getStatusColor(appointment.status),
            borderColor: this.getStatusColor(appointment.status),
            extendedProps: {
              resourceId: appointment.doctorId.toString(), // Use actual doctor ID
              description: appointment.reason,
              status: appointment.status as 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed',
              doctorName: appointment.doctorName,
              doctorSpecialty: appointment.doctorSpecialty || doctorResource?.specialty
            }
          };
          console.log('Created calendar event:', calendarEvent);
          console.log('Original time:', appointment.time, 'Converted time:', convertedTime);
          console.log('Event start date:', calendarEvent.start);
          console.log('Event end date:', calendarEvent.end);
          return calendarEvent;
        });
        
        console.log('Calendar events created:', this.allCalendarEvents);
        this.loadingAppointments = false;
        
        // Only show events for selected doctors (none selected initially)
        this.filterAndSearchEvents();
      },
      error: (error: any) => {
        console.error('Error loading appointments for calendar:', error);
        this.allCalendarEvents = [];
        this.loadingAppointments = false;
        this.filterAndSearchEvents();
      }
    });
  }

  private convertTimeFormat(timeStr: string): string {
    // Convert "9:00 AM" to "09:00" format
    try {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours, 10);
      
      if (period.toUpperCase() === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      return `${hour24.toString().padStart(2, '0')}:${minutes}`;
    } catch (error) {
      console.error('Error converting time format:', error);
      return '09:00'; // Default fallback
    }
  }

  private getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed': return '#28a745';
      case 'pending': return '#ffc107';
      case 'cancelled': return '#dc3545';
      case 'completed': return '#6c757d';
      default: return '#3788d8';
    }
  }

  ngAfterViewInit() {
    if (this.calendarComponent) {
      this.calendarApi = this.calendarComponent.getApi();
      this.updateCustomToolbarTitle(this.calendarApi.view);
      console.log('Calendar API initialized');
      // Reload appointments after calendar is ready
      this.loadAppointments();
    }
  }

  updateCustomToolbarTitle(view: ViewApi) { // Changed type to ViewApi for better type safety
    if (view.type === 'timeGridWeek' || view.type === 'dayGridWeek') { // dayGridWeek is not a standard FullCalendar view type, maybe custom?
      const start = this.datePipe.transform(view.activeStart, 'MMM d');
      const end = this.datePipe.transform(view.activeEnd, 'MMM d, yyyy');
      this.customToolbarTitle = `${start} - ${end}`;
    } else if (view.type === 'dayGridMonth') {
      this.customToolbarTitle = this.datePipe.transform(view.currentStart, 'MMMM yyyy') || '';
    } else if (view.type === 'timeGridDay') {
      this.customToolbarTitle = this.datePipe.transform(view.currentStart, 'MMMM d, yyyy') || '';
    } else {
      this.customToolbarTitle = view.title; // Fallback to FullCalendar's default title
    }
    this.cdr.detectChanges(); // Ensure view updates if title changes outside Angular's zone
  }

  filterAndSearchEvents(): void {
    console.log('Filtering events. All events:', this.allCalendarEvents);
    console.log('Selected resources:', this.selectedResources);
    
    let filtered: MyCalendarEvent[] = [];
    
    // If no doctors are selected, show no events (as per requirement)
    if (this.selectedResources.length === 0) {
      console.log('No doctors selected, showing no events');
      filtered = [];
    } else {
      // Filter events by selected doctor resources
      filtered = this.allCalendarEvents.filter(event =>
        this.selectedResources.includes(event.extendedProps?.resourceId || '')
      );
      console.log('Events filtered by selected doctors:', filtered);
    }
    
    // Apply search filter if search term is provided
    if (this.searchTerm.trim() !== '') {
      const lowerSearchTerm = this.searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(lowerSearchTerm) ||
        (event.extendedProps?.description && event.extendedProps.description.toLowerCase().includes(lowerSearchTerm)) ||
        (event.extendedProps?.doctorName && event.extendedProps.doctorName.toLowerCase().includes(lowerSearchTerm)) ||
        (event.extendedProps?.doctorSpecialty && event.extendedProps.doctorSpecialty.toLowerCase().includes(lowerSearchTerm))
      );
      console.log('Events after search filter:', filtered);
    }
    
    this.calendarEvents = filtered;
    console.log('Final filtered events for calendar:', this.calendarEvents);
    
    if (this.calendarApi) {
      console.log('Updating calendar with events');
      this.calendarApi.removeAllEvents();
      // Instead of addEventSource, use addEvent for each individual event
      this.calendarEvents.forEach(event => {
        console.log('Adding event to calendar:', event);
        this.calendarApi.addEvent(event);
      });
    } else {
      console.log('Calendar API not ready, setting events in options');
      this.calendarOptions.events = this.calendarEvents;
    }
  }

  onSearchTermChange(): void { this.filterAndSearchEvents(); }

  toggleResource(resourceId: string): void {
    const index = this.selectedResources.indexOf(resourceId);
    if (index > -1) {
      this.selectedResources.splice(index, 1);
    } else {
      this.selectedResources.push(resourceId);
    }
    this.filterAndSearchEvents();
  }

  generateMiniCalendar(): void {
    this.miniCalendarDays = [];
    const firstDayOfMonth = new Date(this.miniCalendarViewDate.getFullYear(), this.miniCalendarViewDate.getMonth(), 1);
    const firstDayToDisplay = new Date(firstDayOfMonth);
    firstDayToDisplay.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay()); // Adjust to start of the week (Sunday)
    
    const mainCalendarCurrentDate = this.calendarApi ? this.calendarApi.getDate() : new Date();

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const currentDay = new Date(firstDayToDisplay);
      currentDay.setDate(firstDayToDisplay.getDate() + i);
      this.miniCalendarDays.push({
        date: new Date(currentDay), // Create a new Date object to avoid reference issues
        dayOfMonth: currentDay.getDate(),
        isCurrentMonth: currentDay.getMonth() === this.miniCalendarViewDate.getMonth(),
        isSelected: this.isSameDate(currentDay, mainCalendarCurrentDate)
      });
    }
  }

  isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  previousMiniMonth(): void {
    this.miniCalendarViewDate.setMonth(this.miniCalendarViewDate.getMonth() - 1);
    this.miniCalendarViewDate = new Date(this.miniCalendarViewDate); // Create new Date object to trigger change detection if needed
    this.generateMiniCalendar();
  }

  nextMiniMonth(): void {
    this.miniCalendarViewDate.setMonth(this.miniCalendarViewDate.getMonth() + 1);
    this.miniCalendarViewDate = new Date(this.miniCalendarViewDate);
    this.generateMiniCalendar();
  }

  selectMiniCalendarDate(date: Date): void {
    if (this.calendarApi) {
      this.calendarApi.gotoDate(date);
      // The datesSet callback in calendarOptions should handle updating the miniCalendar's selected state
      // by calling generateMiniCalendar, which checks against calendarApi.getDate().
      // Explicitly updating here can also work:
      this.miniCalendarDays.forEach(day => day.isSelected = this.isSameDate(day.date, date));
      this.miniCalendarViewDate = new Date(date); // Sync mini-calendar view if needed
      this.generateMiniCalendar(); // Re-generate to update selection
    }
  }

  goToToday(): void {
    if (this.calendarApi) {
      this.calendarApi.today();
    }
    this.miniCalendarViewDate = new Date(); // Set mini-calendar to current month
    this.generateMiniCalendar(); // Regenerate to select today
  }

  mainCalendarNext(): void { if (this.calendarApi) this.calendarApi.next(); }
  mainCalendarPrev(): void { if (this.calendarApi) this.calendarApi.prev(); }
  
  changeMainCalendarView(view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'): void {
    if (this.calendarApi) this.calendarApi.changeView(view);
  }

  isSlotOccupied(startTime: Date, endTime: Date): boolean {
    return this.allCalendarEvents.some(event => {
      const eventStart = new Date(event.start);
      const eventEnd = event.end ? new Date(event.end) : new Date(eventStart.getTime() + (this.slotDurationMinutes * 60000));
      return startTime < eventEnd && endTime > eventStart;
    });
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare dates only, not time for past date check

    if (selectInfo.start < today) {
      alert("Vous ne pouvez pas sélectionner une date ou une heure passée.");
      if (this.calendarApi) this.calendarApi.unselect();
      return;
    }

    if (this.isSlotOccupied(selectInfo.start, selectInfo.end)) {
      alert("Ce créneau horaire est déjà réservé ou bloqué.");
      if (this.calendarApi) this.calendarApi.unselect();
      return;
    }

    this.selectedDateForBooking = selectInfo.start;
    if (!selectInfo.allDay) {
      this.selectedTimeForBooking = this.datePipe.transform(selectInfo.start, 'HH:mm');
      this.selectedEndTimeForBooking = this.datePipe.transform(selectInfo.end, 'HH:mm');
    } else {
      this.selectedTimeForBooking = "08:00"; 
      const defaultEndDate = new Date(selectInfo.start);
      defaultEndDate.setHours(8, this.slotDurationMinutes, 0, 0); 
      this.selectedEndTimeForBooking = this.datePipe.transform(defaultEndDate, 'HH:mm');
    }

    this.bookingForm.reset({ fullName: '', email: '', phoneNumber: '', notes: '' });
    this.isBookingFormOpen = true;
  }

  submitNewAppointment(): void {
    this.isSubmitting = true;
    if (this.bookingForm.invalid || !this.selectedDateForBooking || !this.selectedTimeForBooking) {
      this.bookingForm.markAllAsTouched();
      this.isSubmitting = false;
      return;
    }

    const formValue = this.bookingForm.value;
    const startDate = new Date(this.selectedDateForBooking!);
    const [startHours, startMinutes] = this.selectedTimeForBooking!.split(':').map(Number);
    startDate.setHours(startHours, startMinutes, 0, 0);

    if (startDate < new Date()) {
      alert("Cannot create appointment in the past.");
      this.closeBookingForm();
      return;
    }

    // Prepare appointment data for API
    const appointmentData = {
      doctor_id: 1, // You might want to make this configurable
      date: this.selectedDateForBooking,
      time: this.selectedTimeForBooking,
      reason: formValue.notes || 'General consultation',
      patient_name: formValue.fullName,
      patient_email: formValue.email,
      patient_phone: formValue.phoneNumber
    };

    // Use the real API to book appointment
    this.patientAppointmentService.bookAppointment(appointmentData).subscribe({
      next: (sharedAppointment) => {
        // Convert shared appointment to patient model using adapter
        const patientAppointment = this.appointmentAdapter.toPatientModel(sharedAppointment);
        
        // Create calendar event from the booked appointment
        const newEvent: MyCalendarEvent = {
          id: patientAppointment.id.toString(),
          title: `${patientAppointment.reason || 'Appointment'} - ${patientAppointment.doctorName || 'Doctor'}`,
          start: new Date(patientAppointment.date + 'T' + patientAppointment.time),
          end: new Date(new Date(patientAppointment.date + 'T' + patientAppointment.time).getTime() + 30 * 60000),
          backgroundColor: this.getStatusColor(patientAppointment.status),
          borderColor: this.getStatusColor(patientAppointment.status),
          extendedProps: {
            resourceId: 'doctor' + patientAppointment.doctorId,
            description: patientAppointment.reason,
            status: patientAppointment.status as 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed'
          }
        };

        this.allCalendarEvents.push(newEvent);
        this.filterAndSearchEvents();
        this.closeBookingForm();
        
        alert('Appointment booked successfully!');
      },
      error: (error: any) => {
        console.error('Error booking appointment:', error);
        alert('Failed to book appointment. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  closeBookingForm(): void {
    this.isBookingFormOpen = false;
    this.selectedDateForBooking = null;
    this.selectedTimeForBooking = null;
    this.selectedEndTimeForBooking = null;
    this.isSubmitting = false; // Ensure isSubmitting is reset
    if (this.calendarApi) {
      this.calendarApi.unselect();
    }
  }

  handleEventClick(clickInfo: EventClickArg) {
    this.selectedEventDetails = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start || new Date(), // Fallback if start is null
      end: clickInfo.event.end ?? undefined, // Use nullish coalescing
      allDay: clickInfo.event.allDay,
      extendedProps: clickInfo.event.extendedProps,
      backgroundColor: clickInfo.event.backgroundColor,
      borderColor: clickInfo.event.borderColor
    };
    this.isEventModalOpen = true;
  }

  closeEventModal(): void {
    this.isEventModalOpen = false;
    this.selectedEventDetails = null;
  }
}