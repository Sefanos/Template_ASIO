import { Component, AfterViewInit, ViewChild, ElementRef, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';

interface Doctor {
  id: string;
  name: string;
  selected: boolean;
  color: string;
}

@Component({
  selector: 'app-doctors-planning-adapted',
  templateUrl: './doctors-planning-adapted.component.html',
  styleUrls: ['./doctors-planning-adapted.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DoctorsPlanningAdaptedComponent implements AfterViewInit, OnDestroy {
  @ViewChild('calendarEl') calendarEl!: ElementRef<HTMLElement>;
  
  // État du calendrier
  doctorName = 'Dr. Kamal Berrada';
  selectedView = 'timeGridWeek';
  currentViewDate = 'Juin 2025';
  calendar: Calendar | null = null;
  
  // État des événements
  calendarEvents = [
    {
      id: '1',
      title: 'Consultation - Salwa Slimani',
      start: '2025-06-10T10:00:00',
      end: '2025-06-10T11:00:00',
      resourceId: 'doctor-1',
      backgroundColor: '#6366f1',
      borderColor: '#6366f1',
      extendedProps: {
        type: 'Consultation',
        patient: 'Salwa Slimani',
        isAppointment: true
      }
    },
    {
      id: '2',
      title: 'Examen - Imane Tahri',
      start: '2025-06-15T14:30:00',
      end: '2025-06-15T15:30:00',
      resourceId: 'doctor-1',
      backgroundColor: '#10b981',
      borderColor: '#10b981',
      extendedProps: {
        type: 'Examen',
        patient: 'Imane Tahri',
        isAppointment: true
      }
    },
    {
      id: '3',
      title: 'Suivi - Sana Barkouch',
      start: '2025-06-15T16:00:00',
      end: '2025-06-15T17:00:00',
      resourceId: 'doctor-2',
      backgroundColor: '#f59e0b',
      borderColor: '#f59e0b',
      extendedProps: {
        type: 'Suivi',
        patient: 'Sana Barkouch',
        isAppointment: true
      }
    }
  ];

  // Configuration des vues
  views = [
    { value: 'dayGridMonth', label: 'Mois' },
    { value: 'timeGridWeek', label: 'Semaine' },
    { value: 'timeGridDay', label: 'Jour' }
  ];
  
  // Types d'appointements
  appointmentTypes = [
    'Consultation',
    'Suivi',
    'Examen',
    'Urgence',
    'Vaccination',
    'Bilan',
    'Téléconsultation',
    'Intervention',
    'Autre'
  ];
  
  // Liste des médecins
  doctors: Doctor[] = [
    { id: 'doctor-1', name: 'Dr. Kamal Berrada', selected: true, color: '#6366f1' },
    { id: 'doctor-2', name: 'Dr. Yasmine Alaoui', selected: true, color: '#10b981' },
    { id: 'doctor-3', name: 'Dr. Ahmed Benani', selected: true, color: '#f59e0b' }
  ];
  
  // État du mini calendrier
  daysInMonth: Date[] = [];
  selectedDate = new Date();
  
  // État du formulaire modal
  showEventModal = false;
  editingEvent: any = null;
  
  // Initialisation
  ngAfterViewInit(): void {
    this.initCalendar();
    this.generateCalendarDays();
  }
  
  ngOnDestroy(): void {
    if (this.calendar) {
      this.calendar.destroy();
    }
  }
  
  // Initialisation du calendrier FullCalendar
  private initCalendar(): void {
    if (!this.calendarEl || !this.calendarEl.nativeElement) {
      console.error('Élément #calendar introuvable');
      return;
    }

    const resources = this.doctors.map(doctor => ({
      id: doctor.id,
      title: doctor.name
    }));
    
    this.calendar = new Calendar(this.calendarEl.nativeElement, {
      plugins: [
        dayGridPlugin,
        timeGridPlugin,
        listPlugin,
        interactionPlugin,
        resourceTimeGridPlugin
      ],
      initialView: this.selectedView,
      headerToolbar: false, // Nous utilisons notre propre barre d'outils personnalisée
      events: this.calendarEvents,
      resources: resources,
      editable: true,
      selectable: true,
      selectMirror: true,
      allDaySlot: true,
      nowIndicator: true,
      slotMinTime: '07:00:00',
      slotMaxTime: '19:00:00',
      slotDuration: '00:15:00',
      dateClick: this.handleDateClick.bind(this),
      eventClick: this.handleEventClick.bind(this),
      select: this.handleDateSelect.bind(this),
      datesSet: () => this.updateCurrentViewDate()
    });
    
    this.calendar.render();
    this.updateCurrentViewDate();
  }
  
  // Gestionnaires d'événements du calendrier
  updateCurrentViewDate(): void {
    if (this.calendar && this.calendar.view) {
      this.currentViewDate = this.calendar.view.title;
    }
  }
  
  changeView(view: string): void {
    if (this.calendar) {
      this.calendar.changeView(view);
      this.selectedView = view;
      this.updateCurrentViewDate();
    }
  }
  
  prev(): void {
    if (this.calendar) {
      this.calendar.prev();
      this.updateCurrentViewDate();
    }
  }
  
  next(): void {
    if (this.calendar) {
      this.calendar.next();
      this.updateCurrentViewDate();
    }
  }
  
  // Gestionnaire d'événements du calendrier
  handleDateClick(arg: any): void {
    // Ouvrir le formulaire de création pour la date/heure cliquée
    const date = arg.dateStr.split('T')[0];
    const time = arg.date.toTimeString().substring(0, 5);
    
    this.editingEvent = {
      title: '',
      patient: '',
      type: 'Consultation',
      date: date,
      time: time,
      duration: 30
    };
    this.showEventModal = true;
  }
  
  handleDateSelect(selectInfo: any): void {
    const date = selectInfo.startStr.split('T')[0];
    const startTime = selectInfo.start.toTimeString().substring(0, 5);
    const duration = (selectInfo.end.getTime() - selectInfo.start.getTime()) / 60000;
    
    this.editingEvent = {
      title: '',
      patient: '',
      type: 'Consultation',
      date: date,
      time: startTime,
      duration: duration > 0 ? duration : 30,
      resourceId: selectInfo.resource?.id || this.doctors[0].id
    };
    this.showEventModal = true;
    
    if (this.calendar) {
      this.calendar.unselect();
    }
  }
  
  handleEventClick(clickInfo: any): void {
    const event = clickInfo.event;
    const extProps = event.extendedProps;
    
    this.editingEvent = {
      event: event,
      title: extProps.type || '',
      patient: extProps.patient || '',
      type: extProps.type || 'Consultation',
      date: event.start.toISOString().split('T')[0],
      time: event.start.toTimeString().substring(0, 5),
      duration: (event.end.getTime() - event.start.getTime()) / 60000,
      resourceId: event.getResources()[0]?.id
    };
    
    this.showEventModal = true;
  }
  
  // Gestion du formulaire modal
  openAddEventModal(): void {
    const currentDate = new Date().toISOString().split('T')[0];
    this.editingEvent = {
      title: '',
      patient: '',
      type: 'Consultation',
      date: currentDate,
      time: '09:00',
      duration: 30,
      resourceId: this.doctors[0].id
    };
    this.showEventModal = true;
  }
  
  closeAddEventModal(): void {
    this.showEventModal = false;
    this.editingEvent = null;
  }
  
  addNewEvent(): void {
    if (!this.editingEvent.title || !this.editingEvent.patient) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    const start = new Date(`${this.editingEvent.date}T${this.editingEvent.time}`);
    const end = new Date(start.getTime() + this.editingEvent.duration * 60000);
    
    const doctor = this.doctors.find(d => d.id === this.editingEvent.resourceId);
    const color = doctor?.color || '#6366f1';
    
    if (this.calendar) {
      this.calendar.addEvent({
        id: `appointment-${Date.now()}`,
        title: `${this.editingEvent.type} - ${this.editingEvent.patient}`,
        start: start.toISOString(),
        end: end.toISOString(),
        resourceId: this.editingEvent.resourceId,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          type: this.editingEvent.type,
          patient: this.editingEvent.patient,
          isAppointment: true
        }
      });
    }
    
    this.closeAddEventModal();
  }
  
  updateEvent(): void {
    if (!this.editingEvent.title || !this.editingEvent.patient) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    const start = new Date(`${this.editingEvent.date}T${this.editingEvent.time}`);
    const end = new Date(start.getTime() + this.editingEvent.duration * 60000);
    
    if (this.editingEvent.event) {
      this.editingEvent.event.setProp('title', `${this.editingEvent.type} - ${this.editingEvent.patient}`);
      this.editingEvent.event.setStart(start);
      this.editingEvent.event.setEnd(end);
      
      // Mise à jour des propriétés étendues
      this.editingEvent.event.setExtendedProp('type', this.editingEvent.type);
      this.editingEvent.event.setExtendedProp('patient', this.editingEvent.patient);
      
      // Mise à jour de la ressource (médecin)
      if (this.editingEvent.resourceId) {
        this.editingEvent.event.setResources([this.editingEvent.resourceId]);
      }
    }
    
    this.closeAddEventModal();
  }
  
  deleteEditEvent(): void {
    if (this.editingEvent && this.editingEvent.event && confirm('Voulez-vous vraiment supprimer ce rendez-vous ?')) {
      this.editingEvent.event.remove();
      this.closeAddEventModal();
    }
  }
  
  saveAllEvents(): void {
    // Dans une application réelle, vous appelleriez ici votre API pour sauvegarder les événements
    alert('Les événements ont été sauvegardés avec succès!');
  }
  
  // Fonctions de gestion du mini calendrier
  generateCalendarDays(): void {
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Récupérer le premier jour du mois et le dernier jour du mois
    // Générer les jours du mois précédent pour compléter la première semaine
    const daysInMonth = [];
    
    // Trouver le premier jour de la semaine (lundi = 1, dimanche = 0)
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Ajustement pour que lundi soit le premier jour
    
    // Ajouter les jours du mois précédent
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      daysInMonth.push(prevDate);
    }
    
    // Ajouter les jours du mois actuel
    for (let i = 1; i <= lastDay.getDate(); i++) {
      daysInMonth.push(new Date(year, month, i));
    }
    
    // Compléter le mois avec les premiers jours du mois suivant
    const remainingDays = 42 - daysInMonth.length; // 6 semaines x 7 jours = 42
    for (let i = 1; i <= remainingDays; i++) {
      daysInMonth.push(new Date(year, month + 1, i));
    }
    
    this.daysInMonth = daysInMonth;
  }
  
  isSelectedDay(day: Date): boolean {
    return day.getDate() === this.selectedDate.getDate() && 
           day.getMonth() === this.selectedDate.getMonth() && 
           day.getFullYear() === this.selectedDate.getFullYear();
  }
  
  isCurrentMonth(day: Date): boolean {
    return day.getMonth() === this.selectedDate.getMonth();
  }
  
  selectDate(day: Date): void {
    this.selectedDate = day;
    if (this.calendar) {
      this.calendar.gotoDate(day);
      if (this.selectedView === 'dayGridMonth') {
        this.changeView('timeGridDay');
      }
    }
  }
  
  // Filtrer les médecins
  filterDoctors(): void {
    if (!this.calendar) return;
    
    const selectedDoctorIds = this.doctors
      .filter(doctor => doctor.selected)
      .map(doctor => doctor.id);
    
    const events = this.calendarEvents.filter(event => 
      selectedDoctorIds.includes(event.resourceId)
    );
    
    this.calendar.getEvents().forEach(event => event.remove());
    events.forEach(event => this.calendar?.addEvent(event));
  }
}
