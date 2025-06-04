import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PatientAppointmentService } from '../../../../../shared/services/patient-appointment.service';
import { PatientAppointmentAdapter } from '../../../../../shared/services/patient-appointment-adapter.service';
import { Appointment } from '../../../../../core/patient/domain/models/appointment.model';
 

@Component({
  selector: 'app-appointment-history',
  standalone: false,
  templateUrl: './appointment-history.component.html',
  styleUrl: './appointment-history.component.css'
})
export class AppointmentHistoryComponent implements OnInit {

  allAppointments: Appointment[] = [];
    filteredAppointments: Appointment[] = [];
    paginatedAppointments: Appointment[] = [];
  
    currentPage: number = 1;
    itemsPerPage: number = 5;
    searchTerm: string = '';
  
    doctorName: string = 'Dr. Sarah Johnson';
  
     
    isLoading: boolean = false;
    errorMessage: string | null = null;
    
    // Nouvelle propriété pour suivre les rendez-vous développés
    expandedAppointmentIds: Set<number> = new Set();
  
    constructor(
      private patientAppointmentService: PatientAppointmentService,
      private appointmentAdapter: PatientAppointmentAdapter,
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
    
    // Use the real patient appointment service
    this.patientAppointmentService.getAppointmentHistory().subscribe({
      next: (response) => {
        // Convert shared appointments to patient model using adapter
        const sharedAppointments = response.data;
        this.allAppointments = this.appointmentAdapter.toPatientModelArray(sharedAppointments);
        
        console.log('Appointment history loaded:', this.allAppointments);
        
        this.applyFiltersAndPagination();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading appointment history:', error);
        this.errorMessage = 'Failed to load appointment history. Please try again later.';
        this.isLoading = false;
        this.allAppointments = [];
        this.applyFiltersAndPagination();
        this.cdr.detectChanges(); 
      }
    });
  }


  
    applyFiltersAndPagination(): void {
      let tempAppointments = this.allAppointments;
      if (this.searchTerm.trim() !== '') {
        tempAppointments = this.allAppointments.filter((appointment) =>
          appointment.reason?.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      }
      this.filteredAppointments = tempAppointments;
      this.updatePaginatedAppointments();
    }
  
    onSearchTermChange(): void {
      this.currentPage = 1;
      this.applyFiltersAndPagination();
    }
  
    updatePaginatedAppointments(): void {
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      this.paginatedAppointments = this.filteredAppointments.slice(
        startIndex,
        endIndex
      );
    }
  
    totalPages(): number {
      return Math.ceil(this.filteredAppointments.length / this.itemsPerPage);
    }
  
    totalPagesArray(): number[] {
      const total = this.totalPages();
      if (total === 0) return [];
      return Array(total)
        .fill(0)
        .map((x, i) => i + 1);
    }
  
    goToPage(page: number): void {
      if (page >= 1 && page <= this.totalPages()) {
        this.currentPage = page;
        this.updatePaginatedAppointments();
      }
    }
  
    nextPage(): void {
      if (this.currentPage < this.totalPages()) {
        this.currentPage++;
        this.updatePaginatedAppointments();
      }
    }
  
    previousPage(): void {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.updatePaginatedAppointments();
      }
    }
  
    openFilterModal(): void {
      console.log('Filter button clicked');
    }
  
    exportData(): void {
      console.log('Export button clicked');
    }
  
    trackByAppointmentId(index: number, appointment: Appointment): number {
      return appointment.id;
    }
  
    // Méthode pour obtenir la classe CSS du statut
    getStatusClass(status: string | null | undefined): string {
      if (!status) {
        return '';
      }
      
      switch (status.toLowerCase()) {
        case 'confirmed':
        case 'completed':
          return 'bg-status-success/20 text-status-success border border-status-success/30';
        case 'pending':
          return 'bg-status-warning/20 text-status-warning border border-status-warning/30';
        case 'cancelled':
          return 'bg-status-urgent/20 text-status-urgent border border-status-urgent/30';
        default:
          return 'bg-hover text-text-muted border border-border';
      }
    }
    
    // Méthodes pour la vue détaillée
    toggleAppointmentDetails(appointment: Appointment): void {
      if (this.expandedAppointmentIds.has(appointment.id)) {
        this.expandedAppointmentIds.delete(appointment.id);
      } else {
        this.expandedAppointmentIds.add(appointment.id);
        
        // Charger des détails supplémentaires si nécessaire
        if (!appointment.doctorSpecialty) {
          this.loadAppointmentDetails(appointment.id);
        }
      }
    }
  
    isAppointmentExpanded(id: number): boolean {
      return this.expandedAppointmentIds.has(id);
    }
  
    loadAppointmentDetails(id: number): void {
      // Charger des détails supplémentaires depuis l'API
      this.patientAppointmentService.getAppointmentDetails(id).subscribe({
        next: (sharedAppointment) => {
          // Convert shared appointment to patient model using adapter
          const appointmentDetails = this.appointmentAdapter.toPatientModel(sharedAppointment);
          
          // Mettre à jour les détails du rendez-vous
          const index = this.allAppointments.findIndex(a => a.id === id);
          if (index !== -1) {
            this.allAppointments[index] = {
              ...this.allAppointments[index],
              ...appointmentDetails
            };
            
            // Mettre à jour également dans les rendez-vous paginés
            const pageIndex = this.paginatedAppointments.findIndex(a => a.id === id);
            if (pageIndex !== -1) {
              this.paginatedAppointments[pageIndex] = this.allAppointments[index];
            }
            
            this.cdr.detectChanges();
          }
        },
        error: (error: any) => {
          console.error('Failed to load appointment details:', error);
        }
      });
    }
  
    viewMedicalRecord(id: number): void {
      // Naviguer vers la page du dossier médical
      this.router.navigate(['/medical-records'], { queryParams: { appointmentId: id } });
    }
  
    rescheduleAppointment(id: number): void {
      // Naviguer vers la page de reprogrammation
      this.router.navigate(['/appointments/reschedule', id]);
    }
  
    printConfirmation(id: number): void {
      const appointmentIndex = this.paginatedAppointments.findIndex(a => a.id === id);
      if (appointmentIndex !== -1) {
        const appointment = this.paginatedAppointments[appointmentIndex];
            const formattedDate = new Date(appointment.date).toLocaleDateString('fr-FR', {
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            });
        // Créer une nouvelle fenêtre pour l'impression
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Confirmation de Rendez-vous</title>
                <style>
                  @media print {
                @page { margin: 1.5cm; }
              }
              * { box-sizing: border-box; }
              body { 
                font-family: 'Helvetica Neue', Arial, sans-serif; 
                padding: 0; 
                margin: 0;
                color: #333;
                line-height: 1.6;
              }
              .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px 30px;
                border: 1px solid #e0e0e0;
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
              .subtitle {
                color: #666;
                font-size: 16px;
                margin-top: 5px;
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
                .status {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 15px;
                font-weight: 500;
                background-color: #dcfce7;
                color: #166534;
              }
              .instructions {
                margin: 30px 0;
                padding: 20px;
                border: 1px dashed #d1d5db;
                border-radius: 8px;
              }
              .instructions h2 {
                margin-top: 0;
                font-size: 18px;
                color: #4b5563;
              }
                .instructions ul {
                padding-left: 20px;
              }
              .instructions li {
                margin-bottom: 8px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                display: flex;
                justify-content: space-between;
              }
              .qr-placeholder {
                text-align: center;
                margin-top: 20px;
              }
                .qr-code {
                border: 1px solid #ddd;
                padding: 10px;
                display: inline-block;
                background: white;
              }
              .qr-text {
                font-size: 12px;
                color: #666;
                margin-top: 5px;
              }      
              </style>
              </head>
              <body>
               <div class="container">
              <div class="header">
                <div class="logo">CENTRE MÉDICAL</div>
                <h1>Confirmation de Rendez-vous</h1>
                <p class="subtitle">Merci de conserver ce document pour votre visite</p>
              </div>
              
              <div class="details">
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Heure:</span>
                  <span class="value">${appointment.time}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Médecin:</span>
                  <span class="value">${appointment.doctorName}</span>
                </div>
                ${appointment.doctorSpecialty ? 
                  `<div class="detail-row">
                    <span class="label">Spécialité:</span>
                    <span class="value">${appointment.doctorSpecialty}</span>
                  </div>` : ''}
                <div class="detail-row">
                  <span class="label">Statut:</span>
                  <span class="value">
                    <span class="status">Confirmé</span>
                  </span>
                </div>
                 <div class="detail-row">
                  <span class="label">Raison:</span>
                  <span class="value">${appointment.reason || 'Non spécifié'}</span>
                </div>
                ${appointment.location ? 
                  `<div class="detail-row">
                    <span class="label">Lieu:</span>
                    <span class="value">${appointment.location}</span>
                  </div>` : ''}
                <div class="detail-row">
                  <span class="label">N° Rendez-vous:</span>
                  <span class="value">APPT-${appointment.id}-${new Date().getFullYear()}</span>
                </div>
              </div>
              <div class="instructions">
                <h2>Instructions importantes</h2>
                <ul>
                  <li>Veuillez arriver 15 minutes avant l'heure de votre rendez-vous.</li>
                  <li>Apportez votre carte d'assurance et une pièce d'identité avec photo.</li>
                  <li>Si vous prenez des médicaments, veuillez apporter une liste à jour.</li>
                  <li>Pour toute annulation, veuillez nous contacter au moins 24 heures à l'avance.</li>
                </ul>
              </div>
              
               <div class="qr-placeholder">
                <div class="qr-code">
                  [QR Code]<br>
                  APPT-${appointment.id}
                </div>
                <div class="qr-text">Présentez ce code lors de votre enregistrement</div>
              </div>
              
              <div class="footer">
                <div>Centre Médical • 123 Rue de la Santé • Paris</div>
                <div>Tél: 01 23 45 67 89</div>
              </div>
            </div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    }
  
    cancelAppointment(id: number): void {
      if (confirm('Are you sure you want to cancel this appointment?')) {
        this.patientAppointmentService.cancelMyAppointment(id, 'Cancelled by patient').subscribe({
          next: () => {
            // Mettre à jour le statut du rendez-vous en local
            const index = this.allAppointments.findIndex(a => a.id === id);
            if (index !== -1) {
              this.allAppointments[index].status = 'Cancelled';
              this.allAppointments[index].cancelReason = 'Cancelled by patient';
              
              // Mettre à jour également dans les rendez-vous paginés
              const pageIndex = this.paginatedAppointments.findIndex(a => a.id === id);
              if (pageIndex !== -1) {
                this.paginatedAppointments[pageIndex].status = 'Cancelled';
                this.paginatedAppointments[pageIndex].cancelReason = 'Cancelled by patient';
              }
              
              this.cdr.detectChanges();
            }
          },
          error: (error: any) => {
            console.error('Failed to cancel appointment:', error);
          }
        });
      }
    }
  
    canReschedule(appointment: Appointment): boolean {
      // Un rendez-vous peut être reprogrammé s'il est confirmé ou en attente
      // et s'il n'est pas dans le passé
      return ['Confirmed', 'Pending'].includes(appointment.status || '') && 
             !this.isAppointmentInPast(appointment);
    }
  
    canCancel(appointment: Appointment): boolean {
      // Un rendez-vous peut être annulé s'il est confirmé ou en attente
      // et s'il n'est pas dans le passé
      return ['Confirmed', 'Pending'].includes(appointment.status || '') && 
             !this.isAppointmentInPast(appointment);
    }
  
    isAppointmentInPast(appointment: Appointment): boolean {
      if (!appointment.date) return false;
      
      const appointmentDate = new Date(appointment.date);
      const today = new Date();
      // Set time to 00:00:00 for today to compare dates only, not times
      today.setHours(0, 0, 0, 0); 
      // Retourner true si le rendez-vous est dans le passé
      return appointmentDate < today;
    }

    private mapServiceStatusToDomainStatus(
      serviceStatus: string | undefined, 
      currentStatus: Appointment['status']
    ): Appointment['status'] {
      if (serviceStatus === undefined || serviceStatus === null || serviceStatus.trim() === '') {
        return currentStatus; // Use fallback status if serviceStatus is not provided
      }
      const validStatuses: ReadonlyArray<Appointment['status']> = ["Pending", "Confirmed", "Completed", "Cancelled", "Unknown"];
      const normalizedServiceStatus = serviceStatus.trim();

      for (const validStatus of validStatuses) {
        if (validStatus.toLowerCase() === normalizedServiceStatus.toLowerCase()) {
          return validStatus; // Return the matched status with correct casing
        }
      }
      // If serviceStatus is provided but not recognized, default to 'Unknown'
      return 'Unknown';
    }
   
  
}
