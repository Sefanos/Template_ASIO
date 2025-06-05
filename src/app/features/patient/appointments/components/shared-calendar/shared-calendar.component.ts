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
import { AuthService } from '../../../../../core/auth/auth.service';

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

  isSubmitting: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

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

  // Available appointment types with descriptions
  appointmentTypes = [
    { value: 'consultation', label: 'General Consultation', description: 'Initial or routine medical consultation' },
    { value: 'follow-up', label: 'Follow-up Visit', description: 'Follow-up appointment for ongoing treatment' },
    { value: 'procedure', label: 'Medical Procedure', description: 'Scheduled medical procedure or treatment' },
    { value: 'therapy', label: 'Therapy Session', description: 'Physical therapy or rehabilitation session' },
    { value: 'emergency', label: 'Urgent Care', description: 'Urgent medical attention needed' }
  ];

  constructor(
    private patientAppointmentService: PatientAppointmentService,
    private appointmentAdapter: PatientAppointmentAdapter,
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {
    this.bookingForm = this.fb.group({
      doctorId: ['', Validators.required],
      appointmentType: ['consultation', Validators.required],
      reasonForVisit: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      notes: ['', Validators.maxLength(1000)]
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
      alert("You cannot select a past date or time.");
      if (this.calendarApi) this.calendarApi.unselect();
      return;
    }

    if (this.isSlotOccupied(selectInfo.start, selectInfo.end)) {
      alert("This time slot is already booked or blocked.");
      if (this.calendarApi) this.calendarApi.unselect();
      return;
    }

    // Check if we have available doctors
    if (this.resources.length === 0) {
      alert("No doctors are available. Please try again later.");
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

    // Reset form with default values
    this.bookingForm.reset({
      doctorId: '',
      appointmentType: 'consultation',
      reasonForVisit: '',
      notes: ''
    });
    this.isBookingFormOpen = true;
  }

  submitNewAppointment(): void {
    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;
    
    if (this.bookingForm.invalid || !this.selectedDateForBooking || !this.selectedTimeForBooking) {
      this.bookingForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields correctly.';
      this.isSubmitting = false;
      return;
    }

    // Get current user from auth service
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      this.errorMessage = 'Please log in to book an appointment.';
      this.isSubmitting = false;
      return;
    }

    const formValue = this.bookingForm.value;
    const startDate = new Date(this.selectedDateForBooking!);
    const [startHours, startMinutes] = this.selectedTimeForBooking!.split(':').map(Number);
    startDate.setHours(startHours, startMinutes, 0, 0);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + this.slotDurationMinutes);

    if (startDate < new Date()) {
      this.errorMessage = "Cannot schedule appointment in the past.";
      this.isSubmitting = false;
      return;
    }

    // Prepare appointment data for API according to backend requirements
    // ✅ FIXED: Use 'reason' instead of 'reason_for_visit' to match backend expectations
    const appointmentData = {
      doctor_id: parseInt(formValue.doctorId),
      appointment_datetime_start: startDate.toISOString(),
      appointment_datetime_end: endDate.toISOString(),
      type: formValue.appointmentType,
      reason: formValue.reasonForVisit, // ✅ FIXED: Changed from 'reason_for_visit' to 'reason'
      notes_by_patient: formValue.notes
      // ✅ REMOVED: Manual patient contact info - using authenticated user instead
    };

    console.log('Submitting appointment data:', appointmentData);

    // Use the real API to book appointment
    this.patientAppointmentService.bookAppointment(appointmentData).subscribe({
      next: (response) => {
        console.log('Appointment booked successfully:', response);
        
        this.successMessage = 'Appointment booked successfully!';
        
        // Reload appointments to show the new one
        this.loadAppointments();
        
        // Close modal after a brief delay to show success message
        setTimeout(() => {
          this.closeBookingForm();
        }, 1500);
      },
      error: (error: any) => {
        console.error('Error booking appointment:', error);
        
        // Handle specific error messages from the backend
        // Prioritize the most specific error message available
        if (error.error && error.error.error) {
          // This contains the most specific error (like appointment limits)
          this.errorMessage = error.error.error;
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.error && error.error.errors) {
          // Handle validation errors
          const errors = Object.values(error.error.errors).flat();
          this.errorMessage = Array.isArray(errors) ? errors.join(', ') : 'Validation failed.';
        } else if (error.status === 422) {
          this.errorMessage = 'Please check your appointment details and try again.';
        } else if (error.status === 409) {
          this.errorMessage = 'This time slot is no longer available. Please choose another time.';
        } else {
          this.errorMessage = 'Failed to book appointment. Please try again.';
        }
        this.isSubmitting = false;
      }
    });
  }

  closeBookingForm(): void {
    this.isBookingFormOpen = false;
    this.selectedDateForBooking = null;
    this.selectedTimeForBooking = null;
    this.selectedEndTimeForBooking = null;
    this.isSubmitting = false;
    this.successMessage = null;
    this.errorMessage = null;
    this.bookingForm.reset({
      doctorId: '',
      appointmentType: 'consultation',
      reasonForVisit: '',
      notes: ''
    });
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
  // Helper method for template to safely get appointment type description
  getAppointmentTypeDescription(value: string): string {
    const type = this.appointmentTypes.find(t => t.value === value);
    return type ? type.description : '';
  }

  // Helper method to get form control value safely
  getFormControlValue(controlName: string): any {
    return this.bookingForm.get(controlName)?.value || '';
  }

  // Helper method to check if form control has specific error
  hasFormControlError(controlName: string, errorType: string): boolean {
    const control = this.bookingForm.get(controlName);
    return !!(control?.errors?.[errorType] && (control?.dirty || control?.touched));
  }

  // Helper method to check if form control is invalid and touched/dirty
  isFormControlInvalid(controlName: string): boolean {
    const control = this.bookingForm.get(controlName);
    return !!(control?.invalid && (control?.dirty || control?.touched));
  }
}