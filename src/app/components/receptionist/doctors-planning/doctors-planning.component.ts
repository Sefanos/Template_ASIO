import { Component, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanningService } from '../../../services/recepetionist-services/planning.service';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import listPlugin from '@fullcalendar/list';

@Component({
  selector: 'app-doctors-planning',
  templateUrl: './doctors-planning.component.html',
  styleUrls: ['./doctors-planning.component.css'],
  standalone: true,
  // providers: [PlanningService],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class DoctorsPlanningComponent implements AfterViewInit {
  @ViewChild('calendarEl') calendarEl!: ElementRef<HTMLElement>;
  calendar!: Calendar;
  appointments: any[] = [];
  doctors: any[] = [];
  patients: any[] = [];
  selectedView = 'timeGridWeek';
  currentViewDate = '';
  showEventModal = false;
  editingEvent: any = null;
  showAppointmentPanel = false;
  selectedDate: string = '';
  selectedDateAppointments: any[] = [];
  searchQuery: string = '';
  views = [
    { label: 'Semaine', value: 'timeGridWeek' },
    { label: 'Jour', value: 'timeGridDay' },
    { label: 'Liste', value: 'listWeek' }
  ];
  currentMonthName: string = '';
  currentYear: number = new Date().getFullYear();
  dayNames: string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  calendarDays: any[] = [];
  appointmentTypes: string[] = ['Consultation', 'Suivi', 'Urgence'];
  patientSearchTerm: string = '';
  filteredPatients: any[] = [];
  searchingPatients: boolean = false;

  constructor(
    private planningService: PlanningService,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.loadInitialData();
  }

  generateCalendarDays(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: any[] = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dayDate = new Date(year, month, d);
      const hasEvents = this.appointments.some(app => {
        const appDate = new Date(app.appointment_datetime_start);
        return appDate.getFullYear() === year && appDate.getMonth() === month && appDate.getDate() === d;
      });
      const hasUrgentEvents = this.appointments.some(app => {
        const appDate = new Date(app.appointment_datetime_start);
        return appDate.getFullYear() === year && appDate.getMonth() === month && appDate.getDate() === d && app.type === 'Urgence';
      });
      days.push({
        date: dayDate,
        currentMonth: true,
        hasEvents,
        hasUrgentEvents
      });
    }
    this.calendarDays = days;
    this.currentMonthName = date.toLocaleString('fr-FR', { month: 'long' });
    this.currentYear = year;
  }

  loadInitialData(): void {
    // Récupérer les docteurs disponibles
    this.planningService.getAvailableDoctors().subscribe({
      next: (res) => {
        this.doctors = Array.isArray(res.data) ? res.data.map((d: any) => ({
          id: d.id,
          name: d.name,
          email: d.email,
          phone: d.phone,
          specialty: d.doctor?.specialty || '',
          doctorId: d.doctor?.id,
          doctorInfo: d.doctor,
          color: '#6366f1',
          selected: false
        })) : [];
        console.log('[Doctors loaded]', this.doctors);
        // Récupérer les rendez-vous
        this.planningService.getAppointments().subscribe({
          next: (res2) => {
            this.appointments = res2.data;
            console.log('[Appointments loaded]', this.appointments);
            this.initCalendar();
            this.generateCalendarDays(new Date());
          },
          error: (err2) => {
            console.error('[Appointments API Error]', err2);
          }
        });
        // Récupérer les patients
        this.planningService.getPatients().subscribe({
          next: (res3) => {
            this.patients = Array.isArray(res3.data) ? res3.data : [];
            console.log('[Patients loaded]', this.patients);
          },
          error: (err3) => {
            console.error('[Patients API Error]', err3);
          }
        });
      },
      error: (err) => {
        console.error('[Doctors API Error]', err);
      }
    });
  }

  onPatientSearch(term: string) {
    this.patientSearchTerm = term;
    if (term.length < 1) {
      this.filteredPatients = [];
      return;
    }
    this.searchingPatients = true;
    this.planningService.getPatients().subscribe({
      next: (res) => {
        this.filteredPatients = res.data.filter((p: any) => p.name.toLowerCase().startsWith(term.toLowerCase()));
        this.searchingPatients = false;
      },
      error: () => {
        this.filteredPatients = [];
        this.searchingPatients = false;
      }
    });
  }

  selectPatient(patient: any) {
    this.editingEvent.patient_id = patient.id;
    this.patientSearchTerm = patient.name;
    this.filteredPatients = [];
    // Optionnel: stocker le nom pour affichage
    this.editingEvent.patient_name = patient.name;
  }

  openAddEventModal() {
    this.showEventModal = true;
    this.editingEvent = {};
    this.patientSearchTerm = '';
    this.filteredPatients = [];
  }

  prevMonth() {}
  nextMonth() {}
  // Récupérer les créneaux disponibles pour un docteur et une date
  getAvailableSlotsForDoctor(doctorId: number, date: string) {
    this.planningService.getAvailableSlots(doctorId, date).subscribe({
      next: (res) => {
        console.log('[Available slots]', res.data);
        // Utilisez res.data pour afficher les créneaux dans le template ou le composant
      },
      error: (err) => {
        console.error('[Available slots API Error]', err);
      }
    });
  }
  isSelectedDate(date: Date): boolean {
    return this.selectedDate === date.toISOString().split('T')[0];
  }
  selectDate(date: Date) {
    this.selectedDate = date.toISOString().split('T')[0];
    this.selectedDateAppointments = this.appointments.filter(app => {
      const appDate = new Date(app.appointment_datetime_start);
      return appDate.toISOString().split('T')[0] === this.selectedDate;
    });
    this.showAppointmentPanel = true;
  }
  selectAllDoctors() {
    this.doctors.forEach(doc => doc.selected = true);
  }
  clearAllDoctors() {
    this.doctors.forEach(doc => doc.selected = false);
  }
  toggleDoctor(id: number) {
    const doctor = this.doctors.find(doc => doc.id === id);
    if (doctor) doctor.selected = !doctor.selected;
  }
  prev() {
    const current = new Date(this.currentYear, new Date().getMonth(), 1);
    current.setMonth(current.getMonth() - 1);
    this.generateCalendarDays(current);
  }
  next() {
    const current = new Date(this.currentYear, new Date().getMonth(), 1);
    current.setMonth(current.getMonth() + 1);
    this.generateCalendarDays(current);
  }
  changeView(view: string) {
    this.selectedView = view;
    if (this.calendar) {
      this.calendar.changeView(view);
    }
  }
  onSearchChange() {
    if (this.searchQuery.length > 0) {
      this.filteredPatients = this.patients.filter(p => p.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
    } else {
      this.filteredPatients = [];
    }
  }
  // Ajout d'un nouveau rendez-vous
  addNewEvent() {
    // Formatage des dates si nécessaire
    const payload = {
      patient_id: this.editingEvent.patient_id,
      doctor_id: this.editingEvent.doctor_id,
      appointment_datetime_start: this.editingEvent.appointment_datetime_start,
      appointment_datetime_end: this.editingEvent.appointment_datetime_end,
      type: this.editingEvent.type,
      reason: this.editingEvent.reason,
      staff_notes: this.editingEvent.staff_notes
    };
    this.planningService.createAppointment(payload).subscribe({
      next: (res) => {
        console.log('[Appointment created]', res.data);
        this.showEventModal = false;
        this.loadInitialData();
      },
      error: (err) => {
        console.error('[Create Appointment Error]', err);
      }
    });
  }

  // Mettre à jour un rendez-vous existant
  updateEvent() {
    if (!this.editingEvent?.id) return;
    const payload = {
      appointment_datetime_start: this.editingEvent.appointment_datetime_start,
      appointment_datetime_end: this.editingEvent.appointment_datetime_end,
      reason: this.editingEvent.reason,
      staff_notes: this.editingEvent.staff_notes
    };
    this.planningService.updateAppointment(this.editingEvent.id, payload).subscribe({
      next: (res) => {
        console.log('[Appointment updated]', res.data);
        this.showEventModal = false;
        this.loadInitialData();
      },
      error: (err) => {
        console.error('[Update Appointment Error]', err);
      }
    });
  }
  closeAddEventModal() {
    this.showEventModal = false;
    this.editingEvent = null;
  }

  deleteEditEvent() {
    if (this.editingEvent?.event) {
      this.closeAddEventModal();
    }
  }

  initCalendar(): void {
    const calendarOptions: any = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, resourceTimeGridPlugin, listPlugin],
      initialView: this.selectedView,
      events: this.formatEventsForCalendar(),
      resources: this.formatDoctorsForCalendar(),
      eventClick: this.handleEventClick.bind(this),
      dateClick: this.handleDateClick.bind(this),
      selectable: true,
      editable: true,
      locale: 'fr'
    };
    this.calendar = new Calendar(this.calendarEl.nativeElement, calendarOptions);
    this.calendar.render();
  }

  formatEventsForCalendar(): any[] {
    return this.appointments.map(app => ({
      id: app.id,
      title: `[${app.type}] ${app.reason_for_visit || app.reason} - ${app.patient?.name || ''}`,
      start: app.appointment_datetime_start,
      end: app.appointment_datetime_end,
      backgroundColor: '#6366f1',
      borderColor: '#6366f1',
      resourceId: app.doctor_user_id || (app.doctor ? app.doctor.id : null)
    }));
  }

  formatDoctorsForCalendar(): any[] {
    return this.doctors.map(doc => ({
      id: doc.id,
      title: doc.name,
      eventColor: '#6366f1'
    }));
  }

  handleEventClick(info: any): void {
    const eventId = info.event.id;
    this.planningService.getAppointment(eventId).subscribe(res => {
      this.editingEvent = res.data;
      this.showEventModal = true;
    });
  }

  handleDateClick(info: any): void {
    this.editingEvent = {
      appointment_datetime_start: info.dateStr + 'T09:00:00',
      appointment_datetime_end: info.dateStr + 'T09:30:00',
      doctor_id: null,
      patient_id: null,
      type: 'consultation',
      reason: '',
      staff_notes: ''
    };
    this.showEventModal = true;
  }

  createOrUpdateAppointment(): void {
    if (this.editingEvent.id) {
      this.planningService.updateAppointment(this.editingEvent.id, this.editingEvent).subscribe(() => {
        this.showEventModal = false;
        this.loadInitialData();
      });
    } else {
      // Format date to 'YYYY-MM-DD HH:mm:ss'
      function formatDate(dt: string) {
        if (!dt) return '';
        // Accepts 'YYYY-MM-DDTHH:mm' or 'YYYY-MM-DD HH:mm:ss'
        return dt.replace('T', ' ').replace(/\..*$/, '');
      }
      const payload = {
        patient_id: this.editingEvent.patient_id,
        doctor_id: this.editingEvent.doctor_id,
        appointment_datetime_start: formatDate(this.editingEvent.appointment_datetime_start),
        appointment_datetime_end: formatDate(this.editingEvent.appointment_datetime_end),
        type: this.editingEvent.type,
        reason: this.editingEvent.reason,
        staff_notes: this.editingEvent.staff_notes
      };
      this.planningService.createAppointment(payload).subscribe({
        next: () => {
          this.showEventModal = false;
          this.loadInitialData();
        },
        error: (err) => {
          console.error('[Create Appointment Error]', err);
        }
      });
    }
  }

  cancelAppointment(): void {
    if (this.editingEvent.id) {
      const reason = prompt('Motif de l\'annulation ?');
      if (reason) {
        this.planningService.cancelAppointment(this.editingEvent.id, reason).subscribe(() => {
          this.showEventModal = false;
          this.loadInitialData();
        });
      }
    }
  }

  confirmAppointment(): void {
    if (this.editingEvent.id) {
      this.planningService.confirmAppointment(this.editingEvent.id).subscribe(() => {
        this.showEventModal = false;
        this.loadInitialData();
      });
    }
  }

  rescheduleAppointment(): void {
    if (this.editingEvent.id) {
      const newStart = prompt('Nouvelle date/heure de début (YYYY-MM-DD HH:mm:ss)');
      const newEnd = prompt('Nouvelle date/heure de fin (YYYY-MM-DD HH:mm:ss)');
      const reason = prompt('Motif du report ?');
      const notes = prompt('Notes de staff ?');
      if (newStart && newEnd) {
        this.planningService.rescheduleAppointment(this.editingEvent.id, {
          new_datetime_start: newStart,
          new_datetime_end: newEnd,
          reason,
          notes_by_staff: notes
        }).subscribe(() => {
          this.showEventModal = false;
          this.loadInitialData();
        });
      }
    }
  }

  completeAppointment(): void {
    if (this.editingEvent.id) {
      const notes = prompt('Notes de fin de rendez-vous ?');
      this.planningService.completeAppointment(this.editingEvent.id, notes || '').subscribe(() => {
        this.showEventModal = false;
        this.loadInitialData();
      });
    }
  }

  deleteAppointment(): void {
    if (this.editingEvent.id && confirm('Supprimer ce rendez-vous ?')) {
      this.planningService.deleteAppointment(this.editingEvent.id).subscribe(() => {
        this.showEventModal = false;
        this.loadInitialData();
      });
    }
  }
}