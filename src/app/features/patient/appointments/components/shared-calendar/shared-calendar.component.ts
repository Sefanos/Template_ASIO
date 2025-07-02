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
import { MatDialog } from '@angular/material/dialog';
import { RescheduleAppointmentComponent } from '../reschedule-appointment/reschedule-appointment.component';
import { ConfirmationDialogComponent, ConfirmationDialogData, ConfirmationDialogResult } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToastService } from '../../../../../shared/services/toast.service';

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
  


// Nouvelles propriétés pour l'amélioration de l'affichage des docteurs
  doctorSearchTerm: string = '';
  filteredResources: { id: string, title: string, eventColor: string, specialty?: string }[] = [];
  groupedDoctors: { specialty: string, doctors: any[] }[] = [];
  showGroupedView: boolean = false;
  


  // Loading and error states
  loadingDoctors = false;
  loadingAppointments = false;
  doctorsError: string | null = null;
  // Add new loading states for operations
  cancellingAppointment = false;
  reschedulingAppointment = false;
  isCalendarRefreshing = false;

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
    private authService: AuthService,
    private dialog: MatDialog,
    private toastService: ToastService
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
    this.showGroupedView = false; // Default to list view for available doctors
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
          title: `${doctor.name}`,
          eventColor: this.generateRandomColor(),
          specialty: doctor.doctor.specialty
        }));
        
        console.log('Created doctor resources:', this.resources);
        this.loadingDoctors = false;
        
            // Initialiser les filtres et groupes
        this.filteredResources = [...this.resources];
        this.groupDoctorsBySpecialty();
        this.showGroupedView = false; // Always default to list view
        

        // Auto-select all doctors by default when page loads
        this.selectedResources = this.resources.map(resource => resource.id);
        console.log('Auto-selected all doctors:', this.selectedResources);
        
        // Load appointments after doctors are ready
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error loading available doctors:', error);
        this.doctorsError = 'Failed to load available doctors. Please try again.';
        this.loadingDoctors = false;
        
        // Fallback to empty resources
        this.resources = [];
         this.filteredResources = [];
        this.selectedResources = [];
        
        // Still try to load appointments even if doctors failed
        this.loadAppointments();
      }
    });
  }

// Nouvelles méthodes pour la gestion améliorée des docteurs
  filterDoctors(): void {
    if (!this.doctorSearchTerm.trim()) {
      this.filteredResources = [...this.resources];
    } else {
      const searchLower = this.doctorSearchTerm.toLowerCase();
      this.filteredResources = this.resources.filter(resource => 
        resource.title.toLowerCase().includes(searchLower) ||
        (resource.specialty && resource.specialty.toLowerCase().includes(searchLower))
      );
    }
    
    // Re-grouper les docteurs filtrés
    if (this.showGroupedView) {
      this.groupDoctorsBySpecialty();
    }
  }

  groupDoctorsBySpecialty(): void {
    const doctorsToGroup = this.doctorSearchTerm ? this.filteredResources : this.resources;
    
    const grouped = doctorsToGroup.reduce((acc, doctor) => {
      const specialty = doctor.specialty || 'General Medicine';
      if (!acc[specialty]) {
        acc[specialty] = [];
      }
      acc[specialty].push(doctor);
      return acc;
    }, {} as Record<string, any[]>);

    this.groupedDoctors = Object.keys(grouped)
      .sort() // Trier les spécialités alphabétiquement
      .map(specialty => ({
        specialty,
        doctors: grouped[specialty].sort((a, b) => a.title.localeCompare(b.title)) // Trier les docteurs par nom
      }));
  }

  selectAllDoctors(): void {
    const doctorsToSelect = this.doctorSearchTerm ? this.filteredResources : this.resources;
    this.selectedResources = [...doctorsToSelect.map(r => r.id)];
    this.filterAndSearchEvents();
    this.toastService.success(`Selected all ${doctorsToSelect.length} doctors`);
  }


  deselectAllDoctors(): void {
    this.selectedResources = [];
    this.filterAndSearchEvents();
    this.toastService.info('Deselected all doctors');
  }

    toggleGroupedView(): void {
    this.showGroupedView = !this.showGroupedView;
  }

  trackByDoctorId(index: number, doctor: any): any {
    return doctor.id;
  }

  trackBySpecialty(index: number, group: any): any {
    return group.specialty;
  }

    // Méthode utilitaire pour obtenir le nombre de docteurs sélectionnés
  getSelectedDoctorsCount(): number {
    return this.selectedResources.length;
  }

  // Méthode utilitaire pour obtenir le nombre total de docteurs
  getTotalDoctorsCount(): number {
    return this.resources.length;
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

  // Helper to safely update isCalendarRefreshing and trigger change detection
  setCalendarRefreshing(value: boolean) {
    this.isCalendarRefreshing = value;
    this.cdr.detectChanges();
  }

  loadAppointments(): void {
    console.log('Loading appointments for calendar...');
    this.loadingAppointments = true;
    this.setCalendarRefreshing(true);
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
              resourceId: appointment.doctorId.toString(),
              description: appointment.reason,
              status: appointment.status as 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed',
              doctorName: appointment.doctorName,
              doctorSpecialty: appointment.doctorSpecialty || doctorResource?.specialty
            }
          };
          return calendarEvent;
        });
        this.loadingAppointments = false;
        this.setCalendarRefreshing(false);
        this.filterAndSearchEvents();
      },
      error: (error: any) => {
        console.error('Error loading appointments for calendar:', error);
        this.allCalendarEvents = [];
        this.loadingAppointments = false;
        this.setCalendarRefreshing(false);
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
      this.toastService.warning("You cannot select a past date or time.");
      if (this.calendarApi) this.calendarApi.unselect();
      return;
    }

    if (this.isSlotOccupied(selectInfo.start, selectInfo.end)) {
      this.toastService.warning("This time slot is already booked or blocked.");
      if (this.calendarApi) this.calendarApi.unselect();
      return;
    }

    // Check if we have available doctors
    if (this.resources.length === 0) {
      this.toastService.error("No doctors are available. Please try again later.");
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
        
        this.toastService.success('Appointment booked successfully!');
        
        // Set calendar refreshing state and reload appointments to show the new one
        this.isCalendarRefreshing = true;
        this.loadAppointments();
        
        // Close modal after a brief delay to show success message
        setTimeout(() => {
          this.closeBookingForm();
        }, 1000);
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

  // Reschedule appointment functionality
  rescheduleAppointment(appointmentId: string | undefined): void {
    if (!appointmentId) {
      console.error('No appointment ID provided for reschedule');
      return;
    }

    // Find the appointment details from allCalendarEvents
    const appointmentEvent = this.allCalendarEvents.find(event => event.id === appointmentId);
    if (!appointmentEvent) {
      console.error('Appointment not found for reschedule:', appointmentId);
      this.toastService.error('Appointment not found. Please refresh the page and try again.');
      return;
    }

    // Convert calendar event to appointment object format expected by reschedule modal
    const appointment = {
      id: parseInt(appointmentId),
      date: appointmentEvent.start instanceof Date ? 
        appointmentEvent.start.toISOString().split('T')[0] : 
        new Date(appointmentEvent.start).toISOString().split('T')[0],
      time: appointmentEvent.start instanceof Date ? 
        appointmentEvent.start.toTimeString().slice(0, 5) : 
        new Date(appointmentEvent.start).toTimeString().slice(0, 5),
      doctorName: appointmentEvent.extendedProps?.doctorName || 'Unknown Doctor',
      reason: appointmentEvent.extendedProps?.description || 'Appointment',
      status: appointmentEvent.extendedProps?.status || 'pending',
      doctorId: appointmentEvent.extendedProps?.resourceId ? 
        parseInt(appointmentEvent.extendedProps.resourceId) : null
    };

    // Check if appointment can be rescheduled
    if (!this.canRescheduleAppointment(appointment)) {
      return;
    }

    // Open the reschedule modal
    const dialogRef = this.dialog.open(RescheduleAppointmentComponent, {
      width: '500px',
      data: { appointment: appointment },
      disableClose: false
    });

    // Handle dialog result
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reschedulingAppointment = true;
        console.log('Appointment rescheduled successfully:', result);
        // Close the event details modal
        this.closeEventModal();
        // Set calendar refreshing state and refresh the calendar to show updated appointment
        this.isCalendarRefreshing = true;
        this.loadAppointments();
        // Show success message briefly
        this.toastService.success('Appointment rescheduled successfully!');
        this.reschedulingAppointment = false;
      }
    });
  }

    // Cancel appointment functionality with double confirmation
  cancelAppointment(appointmentId: string | undefined): void {
    console.log('cancelAppointment method called with ID:', appointmentId);
    
    if (!appointmentId) {
      console.error('No appointment ID provided for cancellation');
      return;
    }

    // Find the appointment details from allCalendarEvents
    const appointmentEvent = this.allCalendarEvents.find(event => event.id === appointmentId);
    if (!appointmentEvent) {
      console.error('Appointment not found for cancellation:', appointmentId);
      this.toastService.error('Appointment not found. Please refresh the page and try again.');
      return;
    }

    // Convert calendar event to appointment object for validation
    const appointment = {
      id: parseInt(appointmentId),
      date: appointmentEvent.start instanceof Date ? 
        appointmentEvent.start.toISOString().split('T')[0] : 
        new Date(appointmentEvent.start).toISOString().split('T')[0],
      time: appointmentEvent.start instanceof Date ? 
        appointmentEvent.start.toTimeString().slice(0, 5) : 
        new Date(appointmentEvent.start).toTimeString().slice(0, 5),
      doctorName: appointmentEvent.extendedProps?.doctorName || 'Unknown Doctor',
      reason: appointmentEvent.extendedProps?.description || 'Appointment',
      status: appointmentEvent.extendedProps?.status || 'pending'
    };

    // Check if appointment can be cancelled
    if (!this.canCancelAppointment(appointment)) {
      return;
    }

    // Open Angular Material confirmation dialog
    const dialogData: ConfirmationDialogData = {
      title: 'Cancel Appointment',
      message: `Are you sure you want to cancel this appointment?\n\nDate: ${appointment.date}\nTime: ${appointment.time}\nDoctor: ${appointment.doctorName}\nReason: ${appointment.reason}\n\nThis action cannot be undone.`,
      confirmText: 'Cancel Appointment',
      cancelText: 'Keep Appointment',
      needsReason: true,
      reasonLabel: 'Cancellation Reason',
      reasonPlaceholder: 'Please provide a reason for cancelling this appointment (this helps us improve our services)'
    };

    console.log('🔍 About to open dialog with data:', dialogData);
    console.log('🔍 Dialog service:', this.dialog);
    console.log('🔍 ConfirmationDialogComponent:', ConfirmationDialogComponent);

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      disableClose: true,
      panelClass: 'custom-dialog-container',
      autoFocus: false,
      restoreFocus: false
    });

    console.log('🔍 Dialog reference created:', dialogRef);

    dialogRef.afterClosed().subscribe((result: ConfirmationDialogResult | undefined) => {
      if (result && result.confirmed) {
        // Set loading state
        this.cancellingAppointment = true;
        
        // Proceed with cancellation
        console.log('Cancelling appointment:', appointmentId, 'Reason:', result.reason);
        
        this.patientAppointmentService.cancelMyAppointment(parseInt(appointmentId), result.reason!).subscribe({
          next: (success) => {
            this.cancellingAppointment = false;
            if (success) {
              console.log('Appointment cancelled successfully');
              // Close the event details modal
              this.closeEventModal();
              // Set calendar refreshing state and refresh the calendar to show updated appointment
              this.isCalendarRefreshing = true;
              this.loadAppointments();
              // Show success message
              this.toastService.success('Appointment cancelled successfully!');
            } else {
              this.toastService.error('Failed to cancel appointment. Please try again.');
            }
          },
          error: (error: any) => {
            this.cancellingAppointment = false;
            console.error('Error cancelling appointment:', error);
            
            // Handle specific error messages from the backend
            if (error.error && error.error.message) {
              this.toastService.error('Failed to cancel appointment', error.error.message);
            } else if (error.error && error.error.error) {
              this.toastService.error('Failed to cancel appointment', error.error.error);
            } else if (error.status === 422) {
              this.toastService.error('Invalid cancellation request. Please check the appointment details.');
            } else if (error.status === 404) {
              this.toastService.error('Appointment not found. It may have already been cancelled or modified.');
            } else {
              this.toastService.error('Failed to cancel appointment. Please try again later.');
            }
          }
        });
      }
    });
  }

  // Helper method to check if reschedule button should be shown
  canShowRescheduleButton(): boolean {
    const status = this.selectedEventDetails?.extendedProps?.status;
    return status != null && ['Confirmed', 'Pending'].includes(status);
  }

  // Check if appointment can be rescheduled
  canRescheduleAppointment(appointment: any): boolean {
    const status = appointment.status?.toLowerCase();
    if (!['confirmed', 'pending'].includes(status)) {
      this.toastService.warning('Only confirmed or pending appointments can be rescheduled.');
      return false;
    }

    // Check if appointment is in the past
    try {
      const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
      const now = new Date();
      if (appointmentDate < now) {
        this.toastService.warning('Cannot reschedule past appointments.');
        return false;
      }
    } catch (error) {
      console.error('Error checking appointment date:', error);
      this.toastService.error('Error checking appointment date. Please try again.');
      return false;
    }

    return true;
  }

  // Helper method to check if cancel button should be shown
  canShowCancelButton(): boolean {
    const status = this.selectedEventDetails?.extendedProps?.status;
    const canShow = status != null && ['Confirmed', 'Pending'].includes(status);
    console.log('canShowCancelButton called - status:', status, 'canShow:', canShow);
    return canShow;
  }

  // Check if appointment can be cancelled
  canCancelAppointment(appointment: any): boolean {
    const status = appointment.status?.toLowerCase();
    if (!['confirmed', 'pending'].includes(status)) {
      this.toastService.warning('Only confirmed or pending appointments can be cancelled.');
      return false;
    }

    // Check if appointment is in the past
    try {
      const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
      const now = new Date();
      if (appointmentDate < now) {
        this.toastService.warning('Cannot cancel past appointments.');
        return false;
      }
    } catch (error) {
      console.error('Error checking appointment date:', error);
      this.toastService.error('Error checking appointment date. Please try again.');
      return false;
    }

    return true;
  }

  // Helper method to get appointment type description
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