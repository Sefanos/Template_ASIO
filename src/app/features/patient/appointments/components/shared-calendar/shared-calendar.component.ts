import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CalendarOptions, EventClickArg, DateSelectArg, CalendarApi, ViewApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarEvent } from '../../../../../models/calendar/calendar.model';
import { PatientAppointmentService } from '../../../../../shared/services/appointment/patient-appointment.service';
import { AuthService } from '../../../../../core/auth/auth.service'; // ✅ Add AuthService
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Appointment } from '../../../../../models/appointment.model';
import { User } from '../../../../../models/user.model'; // ✅ Add User model

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

  // ✅ Add current user properties
  currentUser: User | null = null;
  currentPatientName: string = '';

  doctorName = 'Dr. Sarah Johnson';
  allCalendarEvents: CalendarEvent[] = [];
  calendarEvents: CalendarEvent[] = [];
  resources = [
    { id: 'doctorSarah', title: 'Dr. Sarah Johnson', eventColor: '#3a87ad' },
    { id: 'doctorJohn', title: 'Doctor John', eventColor: '#468847' },
  ];
  selectedResources: string[] = [];
  searchTerm: string = '';

  miniCalendarViewDate: Date = new Date();
  miniCalendarDays: { date: Date, dayOfMonth: number, isCurrentMonth: boolean, isSelected: boolean }[] = [];
  miniCalendarWeekDaysHeader = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  customToolbarTitle: string = '';

  isSubmitting: boolean = false;
  isLoading: boolean = false;

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
  selectedEventDetails: CalendarEvent | null = null;

  isBookingFormOpen = false;
  bookingForm: FormGroup;
  selectedDateForBooking: Date | null = null;
  selectedTimeForBooking: string | null = null;
  selectedEndTimeForBooking: string | null = null;
  slotDurationMinutes = 30; 

  constructor(
    private patientAppointmentService: PatientAppointmentService,
    private authService: AuthService, // ✅ Add AuthService
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
    // ✅ Load current user first
    this.loadCurrentUser();
    this.loadAppointments();
    this.selectedResources = this.resources.map(r => r.id);
    this.generateMiniCalendar();
  }

  ngAfterViewInit() {
    if (this.calendarComponent) {
      this.calendarApi = this.calendarComponent.getApi();
      this.updateCustomToolbarTitle(this.calendarApi.view);
      this.filterAndSearchEvents();
    }
  }

  // ✅ Load current user information
  private loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        if (user) {
          // Extract patient name from user data
          this.currentPatientName = user.name || 'Current Patient';
          
          // Pre-fill form with user data
          this.bookingForm.patchValue({
            fullName: this.currentPatientName,
            email: user.email || '',
            phoneNumber: user.phone || ''
          });
        }
      },
      error: (error) => {
        console.error('Error loading current user:', error);
        this.currentPatientName = 'Current Patient';
      }
    });
  }

  // 🔄 Simplified load appointments - only real data
  loadAppointments(): void {
    this.isLoading = true;
    
    this.patientAppointmentService.getMyAppointments().subscribe({
      next: (appointments) => {
        // Convert appointments to calendar events
        this.allCalendarEvents = this.convertAppointmentsToEvents(appointments);
        this.filterAndSearchEvents();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.isLoading = false;
        // Show empty calendar on error
        this.allCalendarEvents = [];
        this.filterAndSearchEvents();
      }
    });
  }

  // 🔄 Convert appointment models to calendar events
  private convertAppointmentsToEvents(appointments: Appointment[]): CalendarEvent[] {
    return appointments.map(appointment => {
      // Parse date and time
      const appointmentDate = new Date(appointment.date);
      const timeString = appointment.time.trim();
      
      // Handle different time formats
      let startDate: Date;
      if (timeString.includes('AM') || timeString.includes('PM')) {
        // 12-hour format: "10:30 AM"
        const [time, period] = timeString.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        let hour24 = hours;
        if (period === 'PM' && hours !== 12) hour24 += 12;
        if (period === 'AM' && hours === 12) hour24 = 0;
        
        startDate = new Date(appointmentDate);
        startDate.setHours(hour24, minutes, 0, 0);
      } else {
        // 24-hour format: "10:30" or "14:30"
        const [hours, minutes] = timeString.split(':').map(Number);
        startDate = new Date(appointmentDate);
        startDate.setHours(hours, minutes || 0, 0, 0);
      }
      
      const endDate = new Date(startDate);
      endDate.setMinutes(startDate.getMinutes() + this.slotDurationMinutes);

      // Determine color based on status
      const statusColors = {
        'Confirmed': '#28a745',
        'Pending': '#ffc107', 
        'Completed': '#6c757d',
        'Cancelled': '#dc3545'
      };

      const backgroundColor = statusColors[appointment.status as keyof typeof statusColors] || '#007bff';

      return {
        id: appointment.id.toString(),
        title: `${appointment.reason} - ${appointment.doctorName}`,
        start: startDate,
        end: endDate,
        allDay: false,
        backgroundColor: backgroundColor, // ✅ Now properly typed
        borderColor: backgroundColor,    // ✅ Now properly typed
        textColor: '#ffffff',           // ✅ White text for better contrast
        extendedProps: {
          appointmentId: appointment.id,
          patientName: this.currentPatientName || 'Current Patient', // ✅ Use real patient name
          doctorName: appointment.doctorName,
          doctorSpecialty: appointment.doctorSpecialty,
          status: appointment.status as "Confirmed" | "Pending" | "Completed" | "Cancelled",
          location: appointment.location,
          reason: appointment.reason,
          notes: appointment.notes,
          followUp: appointment.followUp,
          cancelReason: appointment.cancelReason,
          resourceId: this.getDoctorResourceId(appointment.doctorName)
        }
      };
    });
  }

  // 🔄 Map doctor names to resource IDs
  private getDoctorResourceId(doctorName: string): string {
    if (doctorName.includes('Sarah Johnson')) return 'doctorSarah';
    if (doctorName.includes('John')) return 'doctorJohn';
    return 'doctorSarah'; // Default fallback
  }

  // 🔄 Updated submitNewAppointment
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

    let endDate = new Date(startDate);
    if (this.selectedEndTimeForBooking) {
      const [endHours, endMinutes] = this.selectedEndTimeForBooking.split(':').map(Number);
      endDate.setHours(endHours, endMinutes, 0, 0);
    } else { 
      endDate.setMinutes(startDate.getMinutes() + this.slotDurationMinutes);
    }

    // Validation checks
    if (startDate < new Date()) {
      alert("Impossible de créer un rendez-vous dans le passé.");
      this.closeBookingForm();
      return;
    }
    if (this.isSlotOccupied(startDate, endDate)) {
      alert("Ce créneau horaire a été réservé pendant que vous remplissiez le formulaire.");
      this.closeBookingForm();
      return;
    }

    // ✅ Create appointment object with real user data
    const appointmentData = {
      date: this.datePipe.transform(startDate, 'yyyy-MM-dd')!,
      time: this.datePipe.transform(startDate, 'hh:mm a')!,
      reason: formValue.notes || 'Consultation générale',
      doctorName: this.doctorName,
      doctorSpecialty: 'General Medicine',
      patientName: formValue.fullName || this.currentPatientName,
      patientEmail: formValue.email || this.currentUser?.email,
      patientPhone: formValue.phoneNumber || this.currentUser?.phone,
      patientId: this.currentUser?.id, // ✅ Include patient ID
      notes: formValue.notes ? [formValue.notes] : []
    };

    // Book appointment using the service
    this.patientAppointmentService.bookAppointment(appointmentData).subscribe({
      next: (appointment) => {
        // Add the new appointment to calendar
        const newEvent = this.convertAppointmentsToEvents([appointment])[0];
        this.allCalendarEvents.push(newEvent);
        this.filterAndSearchEvents();
        this.closeBookingForm();
        this.isSubmitting = false;
        
        // Show success message
        alert('Rendez-vous créé avec succès!');
      },
      error: (error) => {
        console.error('Error creating appointment:', error);
        alert('Erreur lors de la création du rendez-vous. Veuillez réessayer.');
        this.isSubmitting = false;
      }
    });
  }

  // 🔄 Updated event click handler
  handleEventClick(clickInfo: EventClickArg) {
    const appointmentId = clickInfo.event.extendedProps?.['appointmentId'];
    
    if (appointmentId) {
      // For real appointments, try to get detailed info
      if (this.patientAppointmentService.getAppointmentDetails) {
        this.patientAppointmentService.getAppointmentDetails(appointmentId).subscribe({
          next: (appointment) => {
            this.selectedEventDetails = {
              id: clickInfo.event.id,
              title: clickInfo.event.title,
              start: clickInfo.event.start || new Date(),
              end: clickInfo.event.end || new Date(),
              allDay: clickInfo.event.allDay,
              backgroundColor: clickInfo.event.backgroundColor,
              borderColor: clickInfo.event.borderColor,
              textColor: clickInfo.event.textColor,
              extendedProps: {
                ...clickInfo.event.extendedProps,
                ...appointment,
                status: appointment.status as "Confirmed" | "Pending" | "Completed" | "Cancelled"
              }
            };
            this.isEventModalOpen = true;
          },
          error: (error) => {
            console.error('Error loading appointment details:', error);
            // Fallback to basic event info
            this.showBasicEventInfo(clickInfo);
          }
        });
      } else {
        this.showBasicEventInfo(clickInfo);
      }
    } else {
      this.showBasicEventInfo(clickInfo);
    }
  }

  // 🔄 Helper method for showing basic event info
  private showBasicEventInfo(clickInfo: EventClickArg): void {
    this.selectedEventDetails = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start || new Date(),
      end: clickInfo.event.end || new Date(),
      allDay: clickInfo.event.allDay,
      backgroundColor: clickInfo.event.backgroundColor,
      borderColor: clickInfo.event.borderColor,
      textColor: clickInfo.event.textColor,
      extendedProps: clickInfo.event.extendedProps
    };
    this.isEventModalOpen = true;
  }

  // 🔄 Refresh appointments
  refreshAppointments(): void {
    this.loadAppointments();
  }

  // 🔄 Cancel appointment method
  cancelAppointment(appointmentId: number, reason: string): void {
    if (this.patientAppointmentService.cancelMyAppointment) {
      this.patientAppointmentService.cancelMyAppointment(appointmentId, reason).subscribe({
        next: () => {
          // Remove or update the event in calendar
          const eventIndex = this.allCalendarEvents.findIndex(e => 
            e.extendedProps?.appointmentId === appointmentId
          );
          if (eventIndex !== -1) {
            this.allCalendarEvents[eventIndex].extendedProps!.status = 'Cancelled';
            this.allCalendarEvents[eventIndex].backgroundColor = '#dc3545';
            this.allCalendarEvents[eventIndex].borderColor = '#dc3545';
          }
          this.filterAndSearchEvents();
          this.closeEventModal();
          alert('Rendez-vous annulé avec succès!');
        },
        error: (error) => {
          console.error('Error cancelling appointment:', error);
          alert('Erreur lors de l\'annulation du rendez-vous.');
        }
      });
    } else {
      alert('Fonction d\'annulation non disponible.');
    }
  }

  // ✅ Get current user info for display
  getCurrentUserInfo(): string {
    if (this.currentUser) {
      return this.currentPatientName;
    }
    return 'Patient';
  }

  // ✅ Check if user is authenticated
  isUserAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  // All your existing methods remain the same...
  updateCustomToolbarTitle(view: ViewApi) {
    if (view.type === 'timeGridWeek' || view.type === 'dayGridWeek') {
      const start = this.datePipe.transform(view.activeStart, 'MMM d');
      const end = this.datePipe.transform(view.activeEnd, 'MMM d, yyyy');
      this.customToolbarTitle = `${start} - ${end}`;
    } else if (view.type === 'dayGridMonth') {
      this.customToolbarTitle = this.datePipe.transform(view.currentStart, 'MMMM yyyy') || '';
    } else if (view.type === 'timeGridDay') {
      this.customToolbarTitle = this.datePipe.transform(view.currentStart, 'MMMM d, yyyy') || '';
    } else {
      this.customToolbarTitle = view.title;
    }
    this.cdr.detectChanges();
  }

  filterAndSearchEvents(): void {
    let filtered = this.allCalendarEvents.filter(event =>
      this.selectedResources.includes(event.extendedProps?.resourceId || '')
    );
    if (this.searchTerm.trim() !== '') {
      const lowerSearchTerm = this.searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(lowerSearchTerm) ||
        (event.extendedProps?.description && event.extendedProps.description.toLowerCase().includes(lowerSearchTerm))
      );
    }
    this.calendarEvents = filtered;
    if (this.calendarApi) {
      this.calendarApi.removeAllEvents();
      this.calendarApi.addEventSource(this.calendarEvents);
    } else {
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
    firstDayToDisplay.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
    
    const mainCalendarCurrentDate = this.calendarApi ? this.calendarApi.getDate() : new Date();

    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(firstDayToDisplay);
      currentDay.setDate(firstDayToDisplay.getDate() + i);
      this.miniCalendarDays.push({
        date: new Date(currentDay),
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
    this.miniCalendarViewDate = new Date(this.miniCalendarViewDate);
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
      this.miniCalendarDays.forEach(day => day.isSelected = this.isSameDate(day.date, date));
      this.miniCalendarViewDate = new Date(date);
      this.generateMiniCalendar();
    }
  }

  goToToday(): void {
    if (this.calendarApi) {
      this.calendarApi.today();
    }
    this.miniCalendarViewDate = new Date();
    this.generateMiniCalendar();
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
    today.setHours(0, 0, 0, 0);

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

    this.bookingForm.reset({ 
      fullName: this.currentPatientName,
      email: this.currentUser?.email || '',
      phoneNumber: this.currentUser?.phone || '',
      notes: '' 
    });
    this.isBookingFormOpen = true;
  }

  closeBookingForm(): void {
    this.isBookingFormOpen = false;
    this.selectedDateForBooking = null;
    this.selectedTimeForBooking = null;
    this.selectedEndTimeForBooking = null;
    this.isSubmitting = false;
    if (this.calendarApi) {
      this.calendarApi.unselect();
    }
  }

  closeEventModal(): void {
    this.isEventModalOpen = false;
    this.selectedEventDetails = null;
  }

  printCalendar(): void {
    alert('Fonctionnalité d\'impression à implémenter.');
  }
}