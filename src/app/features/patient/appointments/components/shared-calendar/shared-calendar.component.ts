import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CalendarOptions, EventClickArg, DateSelectArg, CalendarApi, ViewApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr'; // Import de la locale française
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

  doctorName = 'Médecins disponibles';
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
  
  // États de chargement et d'erreur
  loadingDoctors = false;
  loadingAppointments = false;
  doctorsError: string | null = null;
  // Nouveaux états de chargement pour les opérations
  cancellingAppointment = false;
  reschedulingAppointment = false;
  isCalendarRefreshing = false;

  miniCalendarViewDate: Date = new Date(2025, 4, 1); // 1er mai 2025
  miniCalendarDays: { date: Date, dayOfMonth: number, isCurrentMonth: boolean, isSelected: boolean }[] = [];
  // En-têtes des jours en français pour le mini-calendrier (commençant par lundi)
  miniCalendarWeekDaysHeader = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  customToolbarTitle: string = '';

  isSubmitting: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    locale: frLocale, // Configuration de la locale française
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
    // Format d'heure français (24h)
    eventTimeFormat: { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: false 
    },
    displayEventTime: true,
    allDaySlot: false,
    firstDay: 1, // Commencer la semaine par lundi (standard français)
    datesSet: (arg) => {
      if (this.calendarApi) {
        this.updateCustomToolbarTitle(arg.view);
      }
    },
    // Textes personnalisés en français
    buttonText: {
      today: 'Aujourd\'hui',
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour',
      list: 'Liste'
    },
    // Configuration des en-têtes de jours
    dayHeaderFormat: { 
      weekday: 'short' 
    },
    // Configuration des textes d'agenda
    allDayText: 'Toute la journée',
    moreLinkText: function(n) {
      return '+ ' + n + ' autre(s)';
    },
    noEventsText: 'Aucun rendez-vous à afficher',
    // Format des heures dans la grille
    slotLabelFormat: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    }
  };

  isEventModalOpen = false;
  selectedEventDetails: MyCalendarEvent | null = null;

  isBookingFormOpen = false;
  bookingForm: FormGroup;
  selectedDateForBooking: Date | null = null;
  selectedTimeForBooking: string | null = null;
  selectedEndTimeForBooking: string | null = null;
  slotDurationMinutes = 30; 

  // Types de rendez-vous disponibles avec descriptions en français
  appointmentTypes = [
    { value: 'consultation', label: 'Consultation générale', description: 'Consultation médicale initiale ou de routine' },
    { value: 'follow-up', label: 'Visite de suivi', description: 'Rendez-vous de suivi pour un traitement en cours' },
    { value: 'procedure', label: 'Procédure médicale', description: 'Procédure médicale ou traitement programmé' },
    { value: 'therapy', label: 'Séance de thérapie', description: 'Séance de kinésithérapie ou de rééducation' },
    { value: 'emergency', label: 'Soins urgents', description: 'Attention médicale urgente nécessaire' }
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
    // Charger d'abord les médecins, puis les rendez-vous seront chargés après que les médecins soient prêts
    this.loadAvailableDoctors();
    this.generateMiniCalendar();
  }

  loadAvailableDoctors(): void {
    this.loadingDoctors = true;
    this.doctorsError = null;
    
    this.patientAppointmentService.getAvailableDoctors().subscribe({
      next: (doctors) => {
        console.log('Médecins reçus de l\'API:', doctors);
        
        // Filtrer les utilisateurs sans profil médecin et créer les ressources
        const validDoctors = doctors.filter(doctor => doctor.doctor !== null);
        
        this.resources = validDoctors.map(doctor => ({
          id: doctor.id.toString(),
          title: `${doctor.name}`,
          eventColor: this.generateRandomColor(),
          specialty: doctor.doctor.specialty
        }));
        
        console.log('Ressources médecins créées:', this.resources);
        this.loadingDoctors = false;
          // Initialiser les filtres et groupes
        this.filteredResources = [...this.resources];
        this.groupDoctorsBySpecialty();
        this.showGroupedView = false; // Vue liste par défaut

        // Auto-sélectionner tous les médecins par défaut au chargement de la page
        this.selectedResources = this.resources.map(resource => resource.id);
        console.log('Tous les médecins auto-sélectionnés:', this.selectedResources);
        
        // Charger les rendez-vous après que les médecins soient prêts
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des médecins disponibles:', error);
        this.doctorsError = 'Échec du chargement des médecins disponibles. Veuillez réessayer.';
        this.loadingDoctors = false;
        
        // Solution de repli vers des ressources vides
        this.resources = [];
        this.filteredResources = [];
        this.selectedResources = [];
        
        // Essayer quand même de charger les rendez-vous même si les médecins ont échoué
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
      const specialty = doctor.specialty || 'Médecine générale';
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
    this.toastService.success(`Tous les ${doctorsToSelect.length} médecins sélectionnés`);
  }

  deselectAllDoctors(): void {
    this.selectedResources = [];
    this.filterAndSearchEvents();
    this.toastService.info('Tous les médecins désélectionnés');
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

  loadAppointments(): void {
    console.log('Chargement des rendez-vous pour le calendrier...');
    this.loadingAppointments = true;
    this.isCalendarRefreshing = true;
    
    // Charger tous les rendez-vous pour affichage dans le calendrier (pas seulement les prochains)
    this.patientAppointmentService.getMyAppointments().subscribe({
      next: (sharedAppointments) => {
        console.log('Rendez-vous reçus de l\'API:', sharedAppointments);
        // Convertir les rendez-vous partagés vers le modèle patient puis vers les événements de calendrier
        const patientAppointments = this.appointmentAdapter.toPatientModelArray(sharedAppointments);
        console.log('Convertis en rendez-vous patient:', patientAppointments);
        
        this.allCalendarEvents = patientAppointments.map(appointment => {
          // Convertir le format d'heure de "9:00 AM" vers le format "09:00"
          const convertedTime = this.convertTimeFormat(appointment.time);
          const startDateTime = `${appointment.date}T${convertedTime}`;
          const startDate = new Date(startDateTime);
          const endDate = new Date(startDate.getTime() + 30 * 60000); // Ajouter 30 minutes
          
          // Trouver la ressource médecin pour obtenir les informations de spécialité
          const doctorResource = this.resources.find(r => r.id === appointment.doctorId.toString());
          const doctorDisplayName = doctorResource ? 
            `${appointment.doctorName} (${doctorResource.specialty})` : 
            (appointment.doctorName || 'Médecin');
          
          const mapStatusToFrench = (englishStatus: string): 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | undefined => {
            switch (englishStatus?.toLowerCase()) {
              case 'en attente': return 'Pending';
              case 'confirmé': return 'Confirmed';
              case 'annulé': return 'Cancelled';
              case 'terminé': return 'Completed';
              default: return 'Pending';
            }
          };

          const calendarEvent: MyCalendarEvent = {
            id: appointment.id.toString(),
            title: `${appointment.reason || 'Rendez-vous'} - ${doctorDisplayName}`,
            start: startDate,
            end: endDate,
            backgroundColor: this.getStatusColor(appointment.status),
            borderColor: this.getStatusColor(appointment.status),
            extendedProps: {
              resourceId: appointment.doctorId.toString(), // Utiliser l'ID réel du médecin
              description: appointment.reason,
              status: mapStatusToFrench(appointment.status),
              doctorName: appointment.doctorName,
              doctorSpecialty: appointment.doctorSpecialty || doctorResource?.specialty
            }
          };
          console.log('Événement de calendrier créé:', calendarEvent);
          console.log('Heure originale:', appointment.time, 'Heure convertie:', convertedTime);
          console.log('Date de début de l\'événement:', calendarEvent.start);
          console.log('Date de fin de l\'événement:', calendarEvent.end);
          return calendarEvent;
        });
        
        console.log('Événements de calendrier créés:', this.allCalendarEvents);
        this.loadingAppointments = false;
        this.isCalendarRefreshing = false;
        
        // Afficher seulement les événements pour les médecins sélectionnés (aucun sélectionné initialement)
        this.filterAndSearchEvents();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des rendez-vous pour le calendrier:', error);
        this.allCalendarEvents = [];
        this.loadingAppointments = false;
        this.isCalendarRefreshing = false;
        this.filterAndSearchEvents();
      }
    });
  }

  private convertTimeFormat(timeStr: string): string {
    // Convertir "9:00 AM" vers le format "09:00"
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
      console.error('Erreur lors de la conversion du format d\'heure:', error);
      return '09:00'; // Solution de repli par défaut
    }
  }

  private getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmé': return '#28a745';
      case 'en attente': return '#ffc107';
      case 'annulé': return '#dc3545';
      case 'terminé': return '#6c757d';
      default: return '#3788d8';
    }
  }

  ngAfterViewInit() {
    if (this.calendarComponent) {
      this.calendarApi = this.calendarComponent.getApi();
      this.updateCustomToolbarTitle(this.calendarApi.view);
      console.log('API de calendrier initialisée');
      // Recharger les rendez-vous après que le calendrier soit prêt
      this.loadAppointments();
    }
  }

  updateCustomToolbarTitle(view: ViewApi) {
    if (view.type === 'timeGridWeek' || view.type === 'dayGridWeek') {
      const start = this.datePipe.transform(view.activeStart, 'dd MMM', '', 'fr');
      const end = this.datePipe.transform(view.activeEnd, 'dd MMM yyyy', '', 'fr');
      this.customToolbarTitle = `${start} - ${end}`;
    } else if (view.type === 'dayGridMonth') {
      this.customToolbarTitle = this.datePipe.transform(view.currentStart, 'MMMM yyyy', '', 'fr')?.replace(/^\w/, c => c.toUpperCase()) || '';
    } else if (view.type === 'timeGridDay') {
      this.customToolbarTitle = this.datePipe.transform(view.currentStart, 'EEEE dd MMMM yyyy', '', 'fr')?.replace(/^\w/, c => c.toUpperCase()) || '';
    } else {
      this.customToolbarTitle = view.title;
    }
    this.cdr.detectChanges();
  }

  filterAndSearchEvents(): void {
    console.log('Filtrage des événements. Tous les événements:', this.allCalendarEvents);
    console.log('Ressources sélectionnées:', this.selectedResources);
    
    let filtered: MyCalendarEvent[] = [];
    
    // Si aucun médecin n'est sélectionné, n'afficher aucun événement (comme requis)
    if (this.selectedResources.length === 0) {
      console.log('Aucun médecin sélectionné, affichage d\'aucun événement');
      filtered = [];
    } else {
      // Filtrer les événements par ressources médecin sélectionnées
      filtered = this.allCalendarEvents.filter(event =>
        this.selectedResources.includes(event.extendedProps?.resourceId || '')
      );
      console.log('Événements filtrés par médecins sélectionnés:', filtered);
    }
    
    // Appliquer le filtre de recherche si un terme de recherche est fourni
    if (this.searchTerm.trim() !== '') {
      const lowerSearchTerm = this.searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(lowerSearchTerm) ||
        (event.extendedProps?.description && event.extendedProps.description.toLowerCase().includes(lowerSearchTerm)) ||
        (event.extendedProps?.doctorName && event.extendedProps.doctorName.toLowerCase().includes(lowerSearchTerm)) ||
        (event.extendedProps?.doctorSpecialty && event.extendedProps.doctorSpecialty.toLowerCase().includes(lowerSearchTerm))
      );
      console.log('Événements après filtre de recherche:', filtered);
    }
    
    this.calendarEvents = filtered;
    console.log('Événements filtrés finaux pour le calendrier:', this.calendarEvents);
    
    if (this.calendarApi) {
      console.log('Mise à jour du calendrier avec les événements');
      this.calendarApi.removeAllEvents();
      // Au lieu d'addEventSource, utiliser addEvent pour chaque événement individuel
      this.calendarEvents.forEach(event => {
        console.log('Ajout d\'un événement au calendrier:', event);
        this.calendarApi.addEvent(event);
      });
    } else {
      console.log('API de calendrier pas prête, définition des événements dans les options');
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
    
    // Ajuster pour commencer par lundi (1) au lieu de dimanche (0)
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysToSubtract = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
    firstDayToDisplay.setDate(firstDayOfMonth.getDate() - daysToSubtract);
    
    const mainCalendarCurrentDate = this.calendarApi ? this.calendarApi.getDate() : new Date();

    for (let i = 0; i < 42; i++) { // 6 semaines * 7 jours
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
      this.toastService.warning("Vous ne pouvez pas sélectionner une date ou heure passée.");
      if (this.calendarApi) this.calendarApi.unselect();
      return;
    }

    if (this.isSlotOccupied(selectInfo.start, selectInfo.end)) {
      this.toastService.warning("Ce créneau horaire est déjà réservé ou bloqué.");
      if (this.calendarApi) this.calendarApi.unselect();
      return;
    }

    if (this.resources.length === 0) {
      this.toastService.error("Aucun médecin n'est disponible. Veuillez réessayer plus tard.");
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
      this.errorMessage = 'Veuillez remplir tous les champs requis correctement.';
      this.isSubmitting = false;
      return;
    }

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      this.errorMessage = 'Veuillez vous connecter pour prendre un rendez-vous.';
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
      this.errorMessage = "Impossible de programmer un rendez-vous dans le passé.";
      this.isSubmitting = false;
      return;
    }

    const appointmentData = {
      doctor_id: parseInt(formValue.doctorId),
      appointment_datetime_start: startDate.toISOString(),
      appointment_datetime_end: endDate.toISOString(),
      type: formValue.appointmentType,
      reason: formValue.reasonForVisit,
      notes_by_patient: formValue.notes
    };

    console.log('Soumission des données de rendez-vous:', appointmentData);

    this.patientAppointmentService.bookAppointment(appointmentData).subscribe({
      next: (response) => {
        console.log('Rendez-vous réservé avec succès:', response);
        
        this.toastService.success('Rendez-vous réservé avec succès !');
        
        this.isCalendarRefreshing = true;
        this.loadAppointments();
        
        setTimeout(() => {
          this.closeBookingForm();
        }, 1000);
      },
      error: (error: any) => {
        console.error('Erreur lors de la réservation du rendez-vous:', error);
        
        if (error.error && error.error.error) {
          this.errorMessage = error.error.error;
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.error && error.error.errors) {
          const errors = Object.values(error.error.errors).flat();
          this.errorMessage = Array.isArray(errors) ? errors.join(', ') : 'Échec de la validation.';
        } else if (error.status === 422) {
          this.errorMessage = 'Veuillez vérifier les détails de votre rendez-vous et réessayer.';
        } else if (error.status === 409) {
          this.errorMessage = 'Ce créneau horaire n\'est plus disponible. Veuillez choisir un autre horaire.';
        } else {
          this.errorMessage = 'Échec de la réservation du rendez-vous. Veuillez réessayer.';
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
      start: clickInfo.event.start || new Date(),
      end: clickInfo.event.end ?? undefined,
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

  rescheduleAppointment(appointmentId: string | undefined): void {
    if (!appointmentId) {
      console.error('Aucun identifiant de rendez-vous fourni pour la reprogrammation');
      return;
    }

    const appointmentEvent = this.allCalendarEvents.find(event => event.id === appointmentId);
    if (!appointmentEvent) {
      console.error('Rendez-vous non trouvé pour reprogrammer :', appointmentId);
      this.toastService.error('Rendez-vous introuvable. Veuillez actualiser la page et réessayer.');
      return;
    }

    const appointment = {
      id: parseInt(appointmentId),
      date: appointmentEvent.start instanceof Date ? 
        appointmentEvent.start.toISOString().split('T')[0] : 
        new Date(appointmentEvent.start).toISOString().split('T')[0],
      time: appointmentEvent.start instanceof Date ? 
        appointmentEvent.start.toTimeString().slice(0, 5) : 
        new Date(appointmentEvent.start).toTimeString().slice(0, 5),
      doctorName: appointmentEvent.extendedProps?.doctorName || 'Médecin inconnu',
      reason: appointmentEvent.extendedProps?.description || 'Rendez-vous',
      status: appointmentEvent.extendedProps?.status || 'en attente',
      doctorId: appointmentEvent.extendedProps?.resourceId ? 
        parseInt(appointmentEvent.extendedProps.resourceId) : null
    };

    if (!this.canRescheduleAppointment(appointment)) {
      return;
    }

    const dialogRef = this.dialog.open(RescheduleAppointmentComponent, {
      width: '500px',
      data: { appointment: appointment },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reschedulingAppointment = true;
        console.log('Rendez-vous reprogrammé avec succès :', result);
        this.closeEventModal();
        this.isCalendarRefreshing = true;
        this.loadAppointments();
        this.toastService.success('Rendez-vous reprogrammé avec succès !');
        this.reschedulingAppointment = false;
      }
    });
  }

  cancelAppointment(appointmentId: string | undefined): void {
    console.log('Méthode cancelAppointment appelée avec l\'ID :', appointmentId);
    
    if (!appointmentId) {
      console.error('Aucun identifiant de rendez-vous fourni pour l\'annulation');
      return;
    }

    const appointmentEvent = this.allCalendarEvents.find(event => event.id === appointmentId);
    if (!appointmentEvent) {
      console.error('Rendez-vous non trouvé pour l\'annulation:', appointmentId);
      this.toastService.error('Rendez-vous introuvable. Veuillez actualiser la page et réessayer.');
      return;
    }

    const appointment = {
      id: parseInt(appointmentId),
      date: appointmentEvent.start instanceof Date ? 
        appointmentEvent.start.toISOString().split('T')[0] : 
        new Date(appointmentEvent.start).toISOString().split('T')[0],
      time: appointmentEvent.start instanceof Date ? 
        appointmentEvent.start.toTimeString().slice(0, 5) : 
        new Date(appointmentEvent.start).toTimeString().slice(0, 5),
      doctorName: appointmentEvent.extendedProps?.doctorName || 'Médecin inconnu',
      reason: appointmentEvent.extendedProps?.description || 'Rendez-vous',
      status: appointmentEvent.extendedProps?.status || 'en attente'
    };

    if (!this.canCancelAppointment(appointment)) {
      return;
    }

    const dialogData: ConfirmationDialogData = {
      title: 'Annuler le rendez-vous',
      message: `Êtes-vous sûr de vouloir annuler ce rendez-vous ?\n\nDate: ${appointment.date}\nHeure: ${appointment.time}\nMédecin: ${appointment.doctorName}\nMotif: ${appointment.reason}\n\nCette action ne peut pas être annulée.`,
      confirmText: 'Annuler le rendez-vous',
      cancelText: 'Conserver le rendez-vous',
      needsReason: true,
      reasonLabel: 'Motif d\'annulation',
      reasonPlaceholder: 'Veuillez fournir un motif pour l\'annulation de ce rendez-vous (cela nous aide à améliorer nos services)'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      disableClose: true,
      panelClass: 'custom-dialog-container',
      autoFocus: false,
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe((result: ConfirmationDialogResult | undefined) => {
      if (result && result.confirmed) {
        this.cancellingAppointment = true;
        
        console.log('Annulation du rendez-vous:', appointmentId, 'Motif:', result.reason);
        
        this.patientAppointmentService.cancelMyAppointment(parseInt(appointmentId), result.reason!).subscribe({
          next: (success) => {
            this.cancellingAppointment = false;
            if (success) {
              console.log('Rendez-vous annulé avec succès');
              this.closeEventModal();
              this.isCalendarRefreshing = true;
              this.loadAppointments();
              this.toastService.success('Rendez-vous annulé avec succès !');
            } else {
              this.toastService.error('Échec de l\'annulation du rendez-vous. Veuillez réessayer.');
            }
          },
          error: (error: any) => {
            this.cancellingAppointment = false;
            console.error('Erreur lors de l\'annulation du rendez-vous:', error);
            
            if (error.error && error.error.message) {
              this.toastService.error('Échec de l\'annulation du rendez-vous', error.error.message);
            } else if (error.error && error.error.error) {
              this.toastService.error('Échec de l\'annulation du rendez-vous', error.error.error);
            } else if (error.status === 422) {
              this.toastService.error('Demande d\'annulation invalide. Veuillez vérifier les détails du rendez-vous.');
            } else if (error.status === 404) {
              this.toastService.error('Rendez-vous introuvable. Il a peut-être déjà été annulé ou modifié.');
            } else {
              this.toastService.error('Échec de l\'annulation du rendez-vous. Veuillez réessayer plus tard.');
            }
          }
        });
      }
    });
  }
  canShowRescheduleButton(): boolean {
    const status = this.selectedEventDetails?.extendedProps?.status;
    return status != null && ['Confirmed', 'Pending', 'Confirmé', 'En attente'].includes(status);
  }

  canRescheduleAppointment(appointment: any): boolean {
    const status = appointment.status?.toLowerCase();
    if (!['confirmed', 'pending', 'confirmé', 'en attente'].includes(status)) {
      this.toastService.warning('Seuls les rendez-vous confirmés ou en attente peuvent être reprogrammés.');
      return false;
    }

    try {
      const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
      const now = new Date();
      if (appointmentDate < now) {
        this.toastService.warning('Impossible de reprogrammer les rendez-vous passés.');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la date du rendez-vous:', error);
      this.toastService.error('Erreur lors de la vérification de la date du rendez-vous. Veuillez réessayer.');
      return false;
    }

    return true;
  }
  canShowCancelButton(): boolean {
    const status = this.selectedEventDetails?.extendedProps?.status;
    const canShow = status != null && ['Confirmed', 'Pending', 'Confirmé', 'En attente'].includes(status);
    console.log('canShowCancelButton appelé - statut:', status, 'canShow:', canShow);
    return canShow;
  }

  canCancelAppointment(appointment: any): boolean {
    const status = appointment.status?.toLowerCase();
    if (!['confirmed', 'pending', 'confirmé', 'en attente'].includes(status)) {
      this.toastService.warning('Seuls les rendez-vous confirmés ou en attente peuvent être annulés.');
      return false;
    }

    try {
      const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
      const now = new Date();
      if (appointmentDate < now) {
        this.toastService.warning('Impossible d\'annuler les rendez-vous passés.');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la date du rendez-vous:', error);
      this.toastService.error('Erreur lors de la vérification de la date du rendez-vous. Veuillez réessayer.');
      return false;
    }

    return true;
  }

  getAppointmentTypeDescription(value: string): string {
    const type = this.appointmentTypes.find(t => t.value === value);
    return type ? type.description : '';
  }

  getFormControlValue(controlName: string): any {
    return this.bookingForm.get(controlName)?.value || '';
  }

  hasFormControlError(controlName: string, errorType: string): boolean {
    const control = this.bookingForm.get(controlName);
    return !!(control?.errors?.[errorType] && (control?.dirty || control?.touched));
  }

  isFormControlInvalid(controlName: string): boolean {
    const control = this.bookingForm.get(controlName);
    return !!(control?.invalid && (control?.dirty || control?.touched));
  }
}