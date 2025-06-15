import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PatientAppointmentService } from '../../../../../shared/services/patient-appointment.service';
import { RescheduleAppointmentComponent } from '../reschedule-appointment/reschedule-appointment.component';

@Component({
  selector: 'app-appointment-history',
  standalone: false,
  templateUrl: './appointment-history.component.html',
  styleUrl: './appointment-history.component.css'
})
export class AppointmentHistoryComponent implements OnInit {

  // Gestion simplifiée des données - travailler directement avec la réponse de l'API
  appointments: any[] = [];
  filteredAppointments: any[] = [];
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPagesCount: number = 0;
  totalRecords: number = 0;
  
  // Recherche et filtres
  searchTerm: string = '';
  statusFilter: string = '';
  
  // État de l'interface utilisateur
  isLoading: boolean = false;
  errorMessage: string | null = null;
  expandedAppointmentIds: Set<number> = new Set();
  
  // Cache des spécialités des médecins et état de chargement
  doctorCache: Map<number, any> = new Map();
  loadingDoctorIds: Set<number> = new Set();

  constructor(
    private patientAppointmentService: PatientAppointmentService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAppointmentHistory();
  }

  loadAppointmentHistory(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.patientAppointmentService.getAppointmentHistory().subscribe({
      next: (response) => {
        console.log('Réponse brute de l\'API:', response);
        
        // Travailler directement avec la structure de réponse de l'API
        this.appointments = response.data || [];
        this.totalRecords = response.pagination?.total || this.appointments.length;
        
        console.log('Rendez-vous chargés:', this.appointments);
        
        // Charger automatiquement les spécialités des médecins pour les rendez-vous sans elles
        this.loadMissingDoctorSpecialties();
        
        this.applyFilters();
        this.isLoading = false;
        
        // Charger automatiquement les spécialités des médecins manquantes
        this.loadMissingDoctorSpecialties();
        
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement de l\'historique des rendez-vous:', error);
        this.errorMessage = 'Échec du chargement de l\'historique des rendez-vous. Veuillez réessayer plus tard.';
        this.isLoading = false;
        this.appointments = [];
        this.filteredAppointments = [];
        this.cdr.detectChanges(); 
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.appointments];
    
    // Appliquer le filtre de recherche
    if (this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter((appointment: any) => {
        // Rechercher dans plusieurs champs - gérer à la fois la structure mappée et la structure brute de l'API
        const searchFields = [
          appointment.reason_for_visit || appointment.reason,
          appointment.provider,
          appointment.doctorName,
          appointment.patientName,
          appointment.notes,
          appointment.notes_by_patient,
          appointment.notes_by_staff,
          this.formatDate(appointment.date || appointment.appointment_datetime_start)
        ];
        
        return searchFields.some(field => 
          field && field.toString().toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Appliquer le filtre de statut
    if (this.statusFilter && this.statusFilter !== '') {
      filtered = filtered.filter((appointment: any) => 
        appointment.status?.toLowerCase() === this.statusFilter.toLowerCase()
      );
    }
    
    this.filteredAppointments = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPagesCount = Math.ceil(this.filteredAppointments.length / this.itemsPerPage);
    
    // S'assurer que la page actuelle est valide
    if (this.currentPage > this.totalPagesCount && this.totalPagesCount > 0) {
      this.currentPage = this.totalPagesCount;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  getPaginatedAppointments(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAppointments.slice(startIndex, endIndex);
  }

  onSearchTermChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  totalPages(): number {
    return this.totalPagesCount;
  }

  totalPagesArray(): number[] {
    const total = this.totalPages();
    if (total === 0) return [];
    return Array(total).fill(0).map((x, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  openFilterModal(): void {
    console.log('Bouton de filtre cliqué');
  }

  exportData(): void {
    console.log('Bouton d\'exportation cliqué');
  }

  trackByAppointmentId(index: number, appointment: any): number {
    return appointment.id;
  }

  // Style du statut basé sur la réponse de l'API
  getStatusClass(status: string | null | undefined): string {
    if (!status) {
      return 'bg-hover text-text-muted border border-border';
    }
    
    switch (status.toLowerCase()) {
      case 'confirmé':
      case 'confirmed':
      case 'terminé':
      case 'completed':
        return 'bg-status-success/20 text-status-success border border-status-success/30';
      case 'en attente':
      case 'pending':
        return 'bg-status-warning/20 text-status-warning border border-status-warning/30';
      case 'annulé':
      case 'cancelled':
        return 'bg-status-urgent/20 text-status-urgent border border-status-urgent/30';
      default:
        return 'bg-hover text-text-muted border border-border';
    }
  }

  // Détails du rendez-vous étendu avec chargement de la spécialité du médecin
  toggleAppointmentDetails(appointment: any): void {
    if (this.expandedAppointmentIds.has(appointment.id)) {
      this.expandedAppointmentIds.delete(appointment.id);
    } else {
      this.expandedAppointmentIds.add(appointment.id);
      
      // Charger la spécialité du médecin lors de l'expansion des détails (Option 4)
      const doctorId = this.getDoctorId(appointment);
      if (doctorId) {
        this.loadDoctorSpecialty(doctorId);
      }
    }
  }

  isAppointmentExpanded(id: number): boolean {
    return this.expandedAppointmentIds.has(id);
  }

  // Option 4: Méthodes de chargement ciblé des médecins
  loadDoctorSpecialty(doctorId: number): void {
    if (this.doctorCache.has(doctorId) || this.loadingDoctorIds.has(doctorId)) {
      return; // Déjà chargé ou en cours de chargement
    }

    this.loadingDoctorIds.add(doctorId);

    this.patientAppointmentService.getDoctorById(doctorId).subscribe({
      next: (doctor) => {
        console.log('Médecin chargé via la méthode ciblée:', doctor);
        this.doctorCache.set(doctorId, doctor);
        this.loadingDoctorIds.delete(doctorId);
        
        // Mettre à jour les rendez-vous avec la spécialité chargée
        const specialty = doctor.doctor?.specialty || 'Médecine générale';
        this.appointments.forEach(appointment => {
          if (this.getDoctorId(appointment) === doctorId) {
            appointment.doctorSpecialty = specialty;
          }
        });
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la spécialité du médecin:', error);
        this.loadingDoctorIds.delete(doctorId);
        this.cdr.detectChanges();
      }
    });
  }

  getDoctorSpecialty(doctorId: number | null): string {
    if (!doctorId) return 'Non disponible';
    
    const doctor = this.doctorCache.get(doctorId);
    if (doctor) {
      // Gérer la structure de réponse de l'API: Utilisateur -> médecin -> spécialité
      return doctor.doctor?.specialty || 
             doctor.specialty || 
             'Médecine générale';
    }
    
    if (this.loadingDoctorIds.has(doctorId)) {
      return 'Chargement...';
    }
    
    return 'Non disponible';
  }

  isDoctorLoading(doctorId: number | null): boolean {
    if (!doctorId) return false;
    return this.loadingDoctorIds.has(doctorId);
  }

  getDoctorId(appointment: any): number | null {
    // Extraire l'ID utilisateur du médecin du rendez-vous - cela correspond à l'ID utilisateur dans les médecins disponibles
    const doctorId = appointment.doctor_user_id || appointment.doctorId || null;
    console.log('getDoctorId pour le rendez-vous', appointment.id, ':', doctorId, 'du rendez-vous:', appointment);
    return doctorId;
  }

  // Charger automatiquement les spécialités des médecins pour les rendez-vous qui ne les ont pas
  loadMissingDoctorSpecialties(): void {
    console.log('Chargement des spécialités de médecins manquantes...');
    this.appointments.forEach(appointment => {
      const doctorId = this.getDoctorId(appointment);
      console.log('Rendez-vous:', appointment.id, 'ID médecin:', doctorId, 'Spécialité actuelle:', appointment.doctorSpecialty);
      if (doctorId && !appointment.doctorSpecialty) {
        console.log('Chargement de la spécialité pour l\'ID médecin:', doctorId);
        this.loadDoctorSpecialty(doctorId);
      }
    });
  }

  // Méthodes d'aide pour travailler avec la structure de données de l'API
  getDoctorName(appointment: any): string {
    return appointment.provider || 
           appointment.doctorName || 
           'Médecin inconnu';
  }

  getPatientName(appointment: any): string {
    return appointment.patientName || 
           'Patient inconnu';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Date inconnue';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  }

  formatTime(timeString: string): string {
    if (!timeString) return 'Heure inconnue';
    
    try {
      // Gérer les formats "HH:mm:ss" et "HH:mm", et les heures déjà formatées
      if (timeString.includes('AM') || timeString.includes('PM')) {
        // Convertir du format 12h vers 24h
        const [time, period] = timeString.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours);
        
        if (period.toUpperCase() === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        return `${hour24.toString().padStart(2, '0')}:${minutes}`;
      }
      
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        const hours = timeParts[0];
        const minutes = timeParts[1];
        return `${hours}:${minutes}`;
      }
      return timeString;
    } catch (error) {
      return timeString;
    }
  }

  // Méthodes d'action
  viewMedicalRecord(id: number): void {
    this.router.navigate(['/dossiers-medicaux'], { queryParams: { appointmentId: id } });
  }

  rescheduleAppointment(id: number): void {
    // Trouver le rendez-vous à reprogrammer
    const appointment = this.appointments.find(app => app.id === id);
    if (!appointment) {
      console.error('Rendez-vous non trouvé pour reprogrammer:', id);
      return;
    }

    // Ouvrir la modale de reprogrammation
    const dialogRef = this.dialog.open(RescheduleAppointmentComponent, {
      width: '500px',
      data: { appointment: appointment },
      disableClose: false
    });

    // Gérer le résultat de la boîte de dialogue
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Rendez-vous reprogrammé:', result);
        // Actualiser la liste des rendez-vous pour afficher les données mises à jour
        this.loadAppointmentHistory();
      }
    });
  }

  printConfirmation(appointment: any): void {
    const formattedDate = this.formatDate(appointment.date);
    const formattedTime = this.formatTime(appointment.time);
    const doctorName = this.getDoctorName(appointment);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Confirmation de rendez-vous</title>
            <style>
              body { 
                font-family: 'Helvetica Neue', Arial, sans-serif; 
                padding: 40px;
                margin: 0;
                color: #333;
                line-height: 1.6;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #3b82f6;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #3b82f6;
                margin-bottom: 5px;
              }
              h1 { 
                color: #3b82f6; 
                font-size: 28px;
                margin: 0;
                font-weight: 500;
              }
              .details {
                background-color: #f8fafc;
                padding: 25px;
                border-radius: 8px;
                border-left: 5px solid #3b82f6;
                margin: 30px 0;
              }
              .detail-row {
                display: flex;
                margin-bottom: 12px;
                align-items: baseline;
              }
              .label {
                font-weight: 600;
                width: 140px;
                color: #4b5563;
                font-size: 15px;
              }
              .value {
                flex: 1;
                font-size: 16px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">CENTRE MÉDICAL</div>
              <h1>Confirmation de rendez-vous</h1>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">Date :</span>
                <span class="value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Heure :</span>
                <span class="value">${formattedTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">Médecin :</span>
                <span class="value">${doctorName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Motif :</span>
                <span class="value">${appointment.reason || 'Non spécifié'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Statut :</span>
                <span class="value">${appointment.status || 'Inconnu'}</span>
              </div>
              <div class="detail-row">
                <span class="label">ID du rendez-vous :</span>
                <span class="value">RDV-${appointment.id}</span>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  cancelAppointment(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      this.patientAppointmentService.cancelMyAppointment(id, 'Annulé par le patient').subscribe({
        next: () => {
          // Mettre à jour le statut local
          const appointment = this.appointments.find(a => a.id === id);
          if (appointment) {
            appointment.status = 'annulé';
            appointment.notes = appointment.notes ? 
              appointment.notes + '; Annulé par le patient' : 
              'Annulé par le patient';
          }
          
          this.applyFilters();
          this.cdr.detectChanges();
          
          // Afficher le message de succès
          alert('Rendez-vous annulé avec succès.');
        },
        error: (error: any) => {
          console.error('Échec de l\'annulation du rendez-vous:', error);
          let errorMessage = 'Échec de l\'annulation du rendez-vous. Veuillez réessayer.';
          
          if (error.error && error.error.error) {
            errorMessage = error.error.error;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          
          alert(errorMessage);
        }
      });
    }
  }
  canReschedule(appointment: any): boolean {
    const status = appointment.status?.toLowerCase();
    const validStatuses = ['confirmé', 'confirmed', 'en attente', 'pending'];
    return validStatuses.includes(status) && 
           !this.isAppointmentInPast(appointment);
  }

  canCancel(appointment: any): boolean {
    const status = appointment.status?.toLowerCase();
    const validStatuses = ['confirmé', 'confirmed', 'en attente', 'pending'];
    return validStatuses.includes(status) && 
           !this.isAppointmentInPast(appointment);
  }

  isAppointmentInPast(appointment: any): boolean {
    if (!appointment.date && !appointment.startDateTime) return false;
    
    try {
      const appointmentDate = new Date(appointment.date || appointment.startDateTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return appointmentDate < today;
    } catch (error) {
      return false;
    }
  }

  // Options de statut disponibles pour le filtre
  getStatusOptions(): string[] {
    const uniqueStatuses = [...new Set(
      this.appointments
        .map(apt => apt.status)
        .filter(status => status)
        .map(status => {
          // Mapper les statuts anglais vers français pour l'affichage
          switch (status.toLowerCase()) {
            case 'confirmed': return 'confirmé';
            case 'pending': return 'en attente';
            case 'cancelled': return 'annulé';
            case 'completed': return 'terminé';
            default: return status.toLowerCase();
          }
        })
    )];
    
    return uniqueStatuses.sort();
  }
}