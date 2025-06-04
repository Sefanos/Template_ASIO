import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CalendarOptions, EventClickArg, DateSelectArg, CalendarApi, ViewApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction'; // Pour la sélection de date, le clic sur événement
import { FullCalendarComponent } from '@fullcalendar/angular';
import { MyCalendarEvent } from '../../../../../core/patient/domain/models/calendar-event.model';
import { StaticCalendarDataService } from '../../../../../core/patient/services/static-calendar-data.service';
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

  doctorName = 'Dr. Sarah Johnson';
  allCalendarEvents: MyCalendarEvent[] = [];
  calendarEvents: MyCalendarEvent[] = [];
  resources = [
    { id: 'doctorSarah', title: 'Dr. Sarah Johnson', eventColor: '#3a87ad' },
    { id: 'doctorJohn', title: 'Doctor John', eventColor: '#468847' },
  ];
  selectedResources: string[] = [];
  searchTerm: string = '';

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
    private staticDataService: StaticCalendarDataService,
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
    this.allCalendarEvents = this.staticDataService.getStaticAppointments().map(app => ({
      ...app,
      start: new Date(app.start), 
      end: app.end ? new Date(app.end) : undefined,
      backgroundColor: this.resources.find(r => r.id === app.extendedProps?.resourceId)?.eventColor || '#3788d8',
      borderColor: this.resources.find(r => r.id === app.extendedProps?.resourceId)?.eventColor || '#3788d8'
    }));
    this.selectedResources = this.resources.map(r => r.id);
    this.filterAndSearchEvents();
    this.generateMiniCalendar();
  }

  ngAfterViewInit() {
    if (this.calendarComponent) {
      this.calendarApi = this.calendarComponent.getApi();
      this.updateCustomToolbarTitle(this.calendarApi.view);
      // No need to removeAllEvents and addEventSource here if events are set via calendarOptions
      // and updated via filterAndSearchEvents which calls addEventSource.
      // If initial events are not showing, ensure calendarOptions.events is correctly populated
      // or call filterAndSearchEvents once calendarApi is available.
      this.filterAndSearchEvents(); // Ensure events are loaded after API is ready
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
      // This branch might be hit if filterAndSearchEvents is called before ngAfterViewInit
      // It's generally safer to ensure calendarApi is initialized.
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
    this.isSubmitting = true; // Set submitting state
    if (this.bookingForm.invalid || !this.selectedDateForBooking || !this.selectedTimeForBooking) {
      this.bookingForm.markAllAsTouched();
      this.isSubmitting = false; // Reset if validation fails early
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

    if (startDate < new Date()) {
      alert("Impossible de créer un rendez-vous dans le passé.");
      this.closeBookingForm(); // This will also set isSubmitting to false
      return;
    }
    if (this.isSlotOccupied(startDate, endDate)) {
      alert("Ce créneau horaire a été réservé pendant que vous remplissiez le formulaire.");
      this.closeBookingForm(); // This will also set isSubmitting to false
      return;
    }

    const newEvent: MyCalendarEvent = {
      id: `new_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: formValue.fullName,
      start: startDate,
      end: endDate,
      allDay: false,
      extendedProps: {
        description: formValue.notes,
        status: 'Pending', 
        patientEmail: formValue.email,
        patientPhone: formValue.phoneNumber,
        // resourceId: this.resources[0].id, // Assign a default resource if needed
      },
      backgroundColor: '#ffc107', 
      borderColor: '#ffc107'
    };

    this.allCalendarEvents.push(newEvent);
    this.filterAndSearchEvents(); 
    this.closeBookingForm(); // This will also set isSubmitting to false
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

  printCalendar(): void {
    alert('Fonctionnalité d\'impression à implémenter.');
    // Consider using a library or more robust print CSS for better results
    // window.print(); 
  }
}