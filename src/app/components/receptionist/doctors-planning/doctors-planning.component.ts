import { Component, AfterViewInit, ViewChild, ElementRef, signal, effect, NgZone } from '@angular/core';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import listPlugin from '@fullcalendar/list';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doctors-planning',
  templateUrl: './doctors-planning.component.html',
  styleUrls: ['./doctors-planning.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DoctorsPlanningComponent implements AfterViewInit {
  doctorName = 'Dr. Kamal Berrada';
  selectedView = 'timeGridWeek';
  currentViewDate = 'Juin 2025';
  selectedDateAppointments: any[] = [];
  showAppointmentPanel = false;
  showEventModal = false;
  selectedDate = '';
  
  // Mini-calendrier
  currentYear = new Date().getFullYear();
  currentMonthIndex = new Date().getMonth();
  currentMonthName = new Date().toLocaleString('fr-FR', { month: 'long' });
  dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  calendarDays: { date: Date; currentMonth: boolean; hasEvents: boolean; hasUrgentEvents: boolean }[] = [];
  
  // Filtres médecins
  doctors = [
    { id: 'dr-berrada', name: 'Dr. Kamal Berrada', specialty: 'Cardiologie', selected: true, color: '#6366f1' },
    { id: 'dr-alaoui', name: 'Dr. Fatima El Alaoui', specialty: 'Pédiatrie', selected: false, color: '#10b981' },
    { id: 'dr-tazi', name: 'Dr. Mohammed Tazi', specialty: 'Neurologie', selected: false, color: '#f59e0b' }
  ];
  
  // États des modales et formulaires en utilisant des signaux
  showTimeBlockModal = signal<boolean>(false);
  isAppointmentForm = signal<boolean>(true);
  selectedBlockToEdit = signal<any | null>(null);

  views = [
    { value: 'dayGridMonth', label: 'Mois' },
    { value: 'timeGridWeek', label: 'Semaine' },
    { value: 'timeGridDay', label: 'Jour' }
  ];

  calendarEvents = [
    {
      title: 'Consultation - Salwa Slimani',
      start: '2025-06-10T10:00:00',
      end: '2025-06-10T11:00:00',
      backgroundColor: '#6366f1',
      borderColor: '#6366f1',
      resourceId: 'dr-berrada'
    },
    {
      title: 'Examen - Imane Tahri',
      start: '2025-06-15T14:30:00',
      end: '2025-06-15T15:30:00',
      backgroundColor: '#10b981',
      borderColor: '#10b981',
      resourceId: 'dr-alaoui'
    },
    {
      title: 'Suivi - Sana Barkouch',
      start: '2025-06-15T16:00:00',
      end: '2025-06-15T17:00:00',
      backgroundColor: '#f59e0b',
      borderColor: '#f59e0b',
      resourceId: 'dr-tazi'
    }
  ];

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

  editingEvent: any = null; // Sert pour ajout ET édition
  searchQuery: string = '';
  @ViewChild('calendarEl') calendarEl!: ElementRef<HTMLElement>;
  private calendar!: Calendar;
    constructor(private ngZone: NgZone) {
    // Générer les jours du calendrier
    this.generateCalendarDays();
    
    // Utiliser effect pour réagir aux changements
    effect(() => {
      const showModal = this.showTimeBlockModal();
      if (!showModal) {
        // Nettoyer lorsque le modal est fermé
        this.selectedBlockToEdit.set(null);
      }
    });
  }ngAfterViewInit(): void {
    const calendarElement = this.calendarEl?.nativeElement;

    if (!calendarElement) {
      console.error('Élément #calendar introuvable');
      return;
    }

    // Initialiser la valeur currentViewDate avec la date actuelle avant de créer le calendrier
    this.updateCurrentViewDateFromDate(new Date());

    this.calendar = new Calendar(calendarElement, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, resourceTimeGridPlugin, listPlugin],
      initialView: this.selectedView,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      events: this.getFilteredEvents.bind(this),
      resources: this.getFilteredDoctors(),
      editable: true,
      selectable: true,
      selectMirror: true,
      navLinks: true,
      slotMinTime: '07:00:00',
      slotMaxTime: '19:00:00',
      slotDuration: '00:15:00',
      allDaySlot: true,
      nowIndicator: true,
      
      dateClick: this.handleDateClick.bind(this),
      eventClick: this.handleEventClick.bind(this),
      select: this.handleDateSelect.bind(this),
      datesSet: (info) => {
        // Exécuter le code dans la NgZone pour déclencher la détection de changements
        this.ngZone.run(() => {
          this.updateCurrentViewDateFromInfo(info);
        });
      }
    });

    this.calendar.render();
  }
  
  // Méthodes pour le mini-calendrier
  generateCalendarDays(): void {
    this.calendarDays = [];
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonthIndex, 1);
    const lastDayOfMonth = new Date(this.currentYear, this.currentMonthIndex + 1, 0);
    
    // Obtenir le premier jour de la semaine (0 = Dimanche, 1 = Lundi)
    let firstDayOfWeek = firstDayOfMonth.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convertir pour que Lundi = 0, Dimanche = 6
    
    // Ajouter les jours du mois précédent pour compléter la première semaine
    const previousMonth = new Date(this.currentYear, this.currentMonthIndex, 0);
    for (let i = 0; i < firstDayOfWeek; i++) {
      const day = previousMonth.getDate() - firstDayOfWeek + i + 1;
      this.calendarDays.push({
        date: new Date(this.currentYear, this.currentMonthIndex - 1, day),
        currentMonth: false,
        hasEvents: false,
        hasUrgentEvents: false
      });
    }
    
    // Ajouter les jours du mois courant
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(this.currentYear, this.currentMonthIndex, day);
      const dateStr = date.toISOString().split('T')[0];
      
      // Vérifier s'il y a des événements pour ce jour
      const hasEvents = this.calendarEvents.some(event => event.start.includes(dateStr));
      // On pourrait vérifier aussi s'il y a des événements urgents
      const hasUrgentEvents = false;
      
      this.calendarDays.push({
        date,
        currentMonth: true,
        hasEvents,
        hasUrgentEvents
      });
    }
    
    // Compléter les jours restants du mois suivant
    const daysToAdd = 42 - this.calendarDays.length; // 6 semaines complètes (6 x 7 = 42)
    for (let day = 1; day <= daysToAdd; day++) {
      this.calendarDays.push({
        date: new Date(this.currentYear, this.currentMonthIndex + 1, day),
        currentMonth: false,
        hasEvents: false,
        hasUrgentEvents: false
      });
    }
  }
  
  prevMonth(): void {
    this.currentMonthIndex--;
    if (this.currentMonthIndex < 0) {
      this.currentMonthIndex = 11;
      this.currentYear--;
    }
    this.updateMonthDisplay();
    this.generateCalendarDays();
  }
  
  nextMonth(): void {
    this.currentMonthIndex++;
    if (this.currentMonthIndex > 11) {
      this.currentMonthIndex = 0;
      this.currentYear++;
    }
    this.updateMonthDisplay();
    this.generateCalendarDays();
  }
  
  updateMonthDisplay(): void {
    const date = new Date(this.currentYear, this.currentMonthIndex, 1);
    this.currentMonthName = date.toLocaleString('fr-FR', { month: 'long' });
  }
  
  isSelectedDate(date: Date): boolean {
    return date.toISOString().split('T')[0] === this.selectedDate;
  }
  
  selectDate(date: Date): void {
    this.selectedDate = date.toISOString().split('T')[0];
    // Naviguer vers cette date dans le calendrier principal
    this.calendar.gotoDate(date);
  }
  
  // Méthodes pour les filtres de médecins
  toggleDoctor(doctorId: string): void {
    const doctor = this.doctors.find(d => d.id === doctorId);
    if (doctor) {
      doctor.selected = !doctor.selected;
      this.refreshCalendar();
    }
  }
  
  selectAllDoctors(): void {
    this.doctors.forEach(doctor => doctor.selected = true);
    this.refreshCalendar();
  }
  
  clearAllDoctors(): void {
    this.doctors.forEach(doctor => doctor.selected = false);
    this.refreshCalendar();
  }
  
  getFilteredDoctors(): any[] {
    return this.doctors.map(doctor => ({
      id: doctor.id,
      title: doctor.name,
      eventColor: doctor.color
    }));
  }
  
  getFilteredEvents(info: any, successCallback: Function): void {
    // Filtrer les événements selon les médecins sélectionnés
    const selectedDoctorIds = this.doctors.filter(d => d.selected).map(d => d.id);
    let filteredEvents = this.calendarEvents.filter(event => selectedDoctorIds.includes(event.resourceId));
    
    // Filtrer selon la recherche si elle existe
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(query)
      );
    }
    
    successCallback(filteredEvents);
  }
  
  // Recherche
  onSearchChange(): void {
    this.refreshCalendar();
  }
  
  // Rafraîchissement du calendrier
  refreshCalendar(): void {
    if (this.calendar) {
      this.calendar.refetchEvents();
    }
  }  updateCurrentViewDateFromInfo(info: any): void {
    // Mise à jour sécurisée à partir des informations de datesSet
    if (this.selectedView === 'dayGridMonth') {
      // Pour la vue mois, on affiche juste le mois et l'année
      const month = info.start.toLocaleString('fr-FR', { month: 'long' });
      const year = info.start.getFullYear();
      this.currentViewDate = `${month[0].toUpperCase() + month.slice(1)} ${year}`;
    } else if (this.selectedView === 'timeGridWeek') {
      // Pour une vue semaine, on affiche la plage de dates du lundi au dimanche
      const startDate = info.start.getDate();
      const endDate = new Date(info.end);
      endDate.setDate(endDate.getDate() - 1); // L'end date est exclusive, donc on retire un jour
      
      const startMonth = info.start.toLocaleString('fr-FR', { month: 'long' });
      const endMonth = endDate.toLocaleString('fr-FR', { month: 'long' });
      
      // Si même mois, on n'affiche qu'une fois
      if (startMonth === endMonth) {
        this.currentViewDate = `${startDate} – ${endDate.getDate()} ${startMonth} ${info.start.getFullYear()}`;
      } else {
        this.currentViewDate = `${startDate} ${startMonth} – ${endDate.getDate()} ${endMonth} ${info.start.getFullYear()}`;
      }
    } else {
      // Vue jour - on affiche seulement la date du jour
      const dayOfWeek = info.start.toLocaleString('fr-FR', { weekday: 'long' });
      const month = info.start.toLocaleString('fr-FR', { month: 'long' });
      const date = info.start.getDate();
      const year = info.start.getFullYear();
      
      // Mettre la première lettre en majuscule
      const capitalizedDay = dayOfWeek[0].toUpperCase() + dayOfWeek.slice(1);
      
      this.currentViewDate = `${capitalizedDay} ${date} ${month} ${year}`;
    }
  }
  
  updateCurrentViewDateFromDate(date: Date): void {
    // Format initial basé sur la vue
    if (this.selectedView === 'dayGridMonth') {
      const month = date.toLocaleString('fr-FR', { month: 'long' });
      const year = date.getFullYear();
      this.currentViewDate = `${month[0].toUpperCase() + month.slice(1)} ${year}`;
    } else if (this.selectedView === 'timeGridWeek') {
      // Pour une vue semaine, calculer le début et la fin de la semaine
      const startOfWeek = new Date(date);
      const day = startOfWeek.getDay();
      // En France, la semaine commence le lundi (1), donc si c'est dimanche (0), on recule de 6 jours
      const diff = day === 0 ? 6 : day - 1;
      startOfWeek.setDate(date.getDate() - diff);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startMonth = startOfWeek.toLocaleString('fr-FR', { month: 'long' });
      const endMonth = endOfWeek.toLocaleString('fr-FR', { month: 'long' });
      
      // Si même mois, on n'affiche qu'une fois
      if (startMonth === endMonth) {
        this.currentViewDate = `${startOfWeek.getDate()} – ${endOfWeek.getDate()} ${startMonth} ${startOfWeek.getFullYear()}`;
      } else {
        this.currentViewDate = `${startOfWeek.getDate()} ${startMonth} – ${endOfWeek.getDate()} ${endMonth} ${startOfWeek.getFullYear()}`;
      }
    } else {
      // Vue jour
      const dayOfWeek = date.toLocaleString('fr-FR', { weekday: 'long' });
      const month = date.toLocaleString('fr-FR', { month: 'long' });
      
      // Mettre la première lettre en majuscule
      const capitalizedDay = dayOfWeek[0].toUpperCase() + dayOfWeek.slice(1);
      
      this.currentViewDate = `${capitalizedDay} ${date.getDate()} ${month} ${date.getFullYear()}`;
    }
  }
  
  formatDateFr(date: Date): string {
    // Format court pour les dates: "1 juin 2025"
    const month = date.toLocaleString('fr-FR', { month: 'long' });
    return `${date.getDate()} ${month}`;
  }changeView(view: string): void {
    this.selectedView = view;
    this.calendar.changeView(view);
    
    // Utiliser NgZone pour s'assurer que la détection de changements est correctement déclenchée
    this.ngZone.run(() => {
      this.updateCurrentViewDateFromDate(this.calendar.getDate());
    });
  }

  prev(): void {
    this.calendar.prev();
    
    // Utiliser NgZone pour s'assurer que la détection de changements est correctement déclenchée
    this.ngZone.run(() => {
      this.updateCurrentViewDateFromDate(this.calendar.getDate());
    });
  }

  next(): void {
    this.calendar.next();
    
    // Utiliser NgZone pour s'assurer que la détection de changements est correctement déclenchée
    this.ngZone.run(() => {
      this.updateCurrentViewDateFromDate(this.calendar.getDate());
    });
  }

  handleDateClick(arg: any): void {
    const clickedDateStr = arg.dateStr.split('T')[0];
    this.selectedDate = clickedDateStr;
    
    // Filtrer les rendez-vous pour cette date
    this.selectedDateAppointments = this.calendarEvents.filter(event =>
      event.start.includes(clickedDateStr)
    );
    
    // Montrer le panneau des rendez-vous 
    this.showAppointmentPanel = this.selectedDateAppointments.length > 0;

    setTimeout(() => {
      const panel = document.getElementById('appointment-panel');
      panel?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
  handleDateSelect(selectInfo: any): void {
    const date = selectInfo.startStr.split('T')[0];
    const startTime = selectInfo.start.toTimeString().substring(0, 5);
    
    // Calculer la date et l'heure de fin
    const endDate = selectInfo.endStr.split('T')[0];
    const endTime = selectInfo.end.toTimeString().substring(0, 5);

    this.editingEvent = {
      title: '',
      patient: '',
      type: 'Consultation',
      date: date,
      time: startTime,
      endDate: endDate,
      endTime: endTime,
      resourceId: selectInfo.resource?.id || this.doctors[0].id
    };
    this.showEventModal = true;

    this.calendar.unselect();
  }
  handleEventClick(clickInfo: any): void {
    const [typeTitle, patient] = clickInfo.event.title.split(' - ');
    const typeMatch = typeTitle.match(/^\[(.*?)\]/);
    const type = typeMatch ? typeMatch[1] : 'Consultation';
    const title = typeTitle.replace(/^\[.*?\]\s?/, '');

    this.editingEvent = {
      event: clickInfo.event,
      title,
      patient: patient || '',
      type,
      date: clickInfo.event.startStr.split('T')[0],
      time: clickInfo.event.startStr.split('T')[1]?.substring(0,5) || '09:00',
      endDate: clickInfo.event.endStr.split('T')[0],
      endTime: clickInfo.event.endStr.split('T')[1]?.substring(0,5) || '09:30',
      resourceId: clickInfo.event.getResources()[0]?.id || this.doctors[0].id
    };
    this.showEventModal = true;
  }
  openAddEventModal(): void {
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date();
    const startTime = currentTime.getHours().toString().padStart(2, '0') + ':' + 
                     currentTime.getMinutes().toString().padStart(2, '0');
    
    // Calcul d'une heure de fin par défaut (30 minutes après)
    const endTime = new Date(currentTime.getTime() + 30 * 60000);
    const endTimeStr = endTime.getHours().toString().padStart(2, '0') + ':' + 
                      endTime.getMinutes().toString().padStart(2, '0');
    
    this.editingEvent = {
      title: '',
      patient: '',
      type: 'Consultation',
      date: currentDate,
      time: startTime,
      endDate: currentDate,
      endTime: endTimeStr,
      resourceId: this.doctors[0].id
    };
    this.showEventModal = true;
  }

  closeAddEventModal(): void {
    this.showEventModal = false;
    this.editingEvent = null;
  }
  
  // Pour gérer le blocage de temps
  openBlockTimeModal(): void {
    this.isAppointmentForm.set(false);
    this.selectedBlockToEdit.set(null);
    this.showTimeBlockModal.set(true);
  }
  
  closeBlockTimeModal(): void {
    this.showTimeBlockModal.set(false);
  }
    // Ajout d'un nouveau rendez-vous
  addNewEvent(): void {
    if (!this.editingEvent.title || !this.editingEvent.patient || 
        !this.editingEvent.date || !this.editingEvent.time || 
        !this.editingEvent.endDate || !this.editingEvent.endTime) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    const start = new Date(`${this.editingEvent.date}T${this.editingEvent.time}`);
    const end = new Date(`${this.editingEvent.endDate}T${this.editingEvent.endTime}`);
    
    // Vérifier que la date de fin est après la date de début
    if (end <= start) {
      alert('La date et l\'heure de fin doivent être après la date et l\'heure de début.');
      return;
    }

    // Utiliser la couleur du médecin sélectionné
    const selectedDoctor = this.doctors.find(d => d.id === this.editingEvent.resourceId);
    const eventColor = selectedDoctor ? selectedDoctor.color : '#6366f1';

    this.calendarEvents.push({
      title: `[${this.editingEvent.type}] ${this.editingEvent.title} - ${this.editingEvent.patient}`,
      start: start.toISOString(),
      end: end.toISOString(),
      backgroundColor: eventColor,
      borderColor: eventColor,
      resourceId: this.editingEvent.resourceId
    });

    this.closeAddEventModal();
    this.refreshCalendar();
    this.generateCalendarDays(); // Mettre à jour le mini-calendrier
  }
  updateEvent(): void {
    if (!this.editingEvent.title || !this.editingEvent.patient || 
        !this.editingEvent.date || !this.editingEvent.time || 
        !this.editingEvent.endDate || !this.editingEvent.endTime) {
      alert('Veuillez remplir tous les champs.');
      return;
    }
    
    const start = new Date(`${this.editingEvent.date}T${this.editingEvent.time}`);
    const end = new Date(`${this.editingEvent.endDate}T${this.editingEvent.endTime}`);
    
    // Vérifier que la date de fin est après la date de début
    if (end <= start) {
      alert('La date et l\'heure de fin doivent être après la date et l\'heure de début.');
      return;
    }

    // Utiliser la couleur du médecin sélectionné
    const selectedDoctor = this.doctors.find(d => d.id === this.editingEvent.resourceId);
    const eventColor = selectedDoctor ? selectedDoctor.color : '#6366f1';

    this.editingEvent.event.setProp('title', `[${this.editingEvent.type}] ${this.editingEvent.title} - ${this.editingEvent.patient}`);
    this.editingEvent.event.setStart(start.toISOString());
    this.editingEvent.event.setEnd(end.toISOString());
    this.editingEvent.event.setProp('backgroundColor', eventColor);
    this.editingEvent.event.setProp('borderColor', eventColor);
    
    // Mettre à jour la ressource si elle a changé
    if (this.editingEvent.event.getResources()[0]?.id !== this.editingEvent.resourceId) {
      this.editingEvent.event.setResources([this.editingEvent.resourceId]);
    }

    this.closeAddEventModal();
    this.generateCalendarDays(); // Mettre à jour le mini-calendrier
  }

  deleteEditEvent() {
    if (this.editingEvent && this.editingEvent.event && confirm('Voulez-vous vraiment supprimer ce rendez-vous ?')) {
      this.editingEvent.event.remove();
        // Supprimer également de notre tableau local
      const eventId = this.editingEvent.event.id;
      // Identifier l'événement à supprimer par son titre et sa date de début
      const eventTitle = this.editingEvent.event.title;
      const eventStart = this.editingEvent.event.start?.toISOString();
      const index = this.calendarEvents.findIndex(e => 
        e.title === eventTitle && e.start === eventStart
      );
      if (index !== -1) {
        this.calendarEvents.splice(index, 1);
      }
      
      this.closeAddEventModal();
      this.generateCalendarDays(); // Mettre à jour le mini-calendrier
    }
  }

  saveAllEvents(): void {
    alert('Les rendez-vous ont été sauvegardés avec succès.');
    // Dans une vraie application, vous implémenteriez ici la sauvegarde vers une API
  }
}