import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceptionistAppointmentService } from '../../../shared/services/appointment/receptionist-appointment.service';
import { Appointment, AppointmentStatus } from '../../../models/appointment.model';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
  // Component state
  searchQuery = '';
  selectedStatus = '';
  selectedDate = '';
  appointments: Appointment[] = [];
  editingAppointment: Partial<Appointment> | null = null;
  selectedAppointment: Appointment | null = null;
  isLoading = false;

  // Pagination
  itemsPerPage = 10;
  currentPage = 1;

  // Reference to AppointmentStatus enum for template
  readonly AppointmentStatus = AppointmentStatus;

  // Status options for dropdown
  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: AppointmentStatus.Pending, label: 'En attente' },
    { value: AppointmentStatus.Confirmed, label: 'Confirmé' },
    { value: AppointmentStatus.Completed, label: 'Terminé' },
    { value: AppointmentStatus.Cancelled, label: 'Annulé' },
    { value: AppointmentStatus.NoShow, label: 'Absent' }
  ];

  // Appointment types
  appointmentTypes = [
    'Consultation générale',
    'Consultation spécialisée',
    'Suivi',
    'Urgence',
    'Vaccination',
    'Examen médical'
  ];

  constructor(
    private receptionistService: ReceptionistAppointmentService,
    private router: Router
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchQuery = searchTerm;
      this.loadAppointments();
    });
  }

  ngOnInit(): void {
    this.loadAppointments();
    
    // Subscribe to automatic refreshes from the service
    this.receptionistService.getAllAppointments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          this.appointments = appointments;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error loading appointments:', error);
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Navigation
  goToPlanning(): void {
    this.router.navigate(['/receptionist/doctors-planning']);
  }

  // Data loading
  loadAppointments(): void {
    this.isLoading = true;
    const filters: any = {};
    
    if (this.selectedDate) {
      filters.date = this.selectedDate;
    }
    
    if (this.selectedStatus) {
      filters.status = this.selectedStatus;
    }
    
    if (this.searchQuery.trim()) {
      filters.search = this.searchQuery.trim();
    }

    console.log('🔄 Loading appointments with filters:', filters);

    this.receptionistService.getAllAppointments(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          this.appointments = appointments;
          console.log('✅ Loaded appointments:', appointments.length);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error loading appointments:', error);
          this.isLoading = false;
          // Show user-friendly error message
          this.showErrorMessage('Erreur lors du chargement des rendez-vous');
        }
      });
  }

  // Search handling with debouncing
  onSearchInput(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  // Computed properties
  get filteredAppointments(): Appointment[] {
    return this.appointments.filter((appointment) => {
      const matchesSearch = !this.searchQuery || 
        appointment.patientName?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        appointment.reason?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        appointment.patientPhone?.includes(this.searchQuery) ||
        appointment.patientEmail?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus = !this.selectedStatus || appointment.status === this.selectedStatus;
      const matchesDate = !this.selectedDate || appointment.date === this.selectedDate;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }

  get paginatedAppointments(): Appointment[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredAppointments.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAppointments.length / this.itemsPerPage);
  }

  get appointmentStats() {
    return {
      total: this.appointments.length,
      pending: this.appointments.filter(a => a.status === AppointmentStatus.Pending).length,
      confirmed: this.appointments.filter(a => a.status === AppointmentStatus.Confirmed).length,
      completed: this.appointments.filter(a => a.status === AppointmentStatus.Completed).length,
      cancelled: this.appointments.filter(a => a.status === AppointmentStatus.Cancelled).length
    };
  }

  // Helper methods
  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  trackByAppointmentId(index: number, appointment: Appointment): any {
  return appointment.id || index;
}

trackByPageNumber(index: number, page: number): number {
  return page;
}
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      [AppointmentStatus.Pending]: 'En attente',
      [AppointmentStatus.Confirmed]: 'Confirmé',
      [AppointmentStatus.Completed]: 'Terminé',
      [AppointmentStatus.Cancelled]: 'Annulé',
      [AppointmentStatus.NoShow]: 'Absent'
    };
    return statusLabels[status] || status;
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      [AppointmentStatus.Pending]: 'bg-yellow-100 text-yellow-800',
      [AppointmentStatus.Confirmed]: 'bg-blue-100 text-blue-800',
      [AppointmentStatus.Completed]: 'bg-green-100 text-green-800',
      [AppointmentStatus.Cancelled]: 'bg-red-100 text-red-800',
      [AppointmentStatus.NoShow]: 'bg-gray-100 text-gray-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  // Modal management
  openEditModal(appointment: Appointment): void {
    console.log('✏️ Opening edit modal for appointment:', appointment.id);
    
    this.editingAppointment = {
      id: appointment.id,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      patientEmail: appointment.patientEmail,
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration,
      type: appointment.type,
      reason: appointment.reason,
      status: appointment.status,
      notes: appointment.notes ? [...appointment.notes] : []
    };
  }

  closeEditModal(): void {
    this.editingAppointment = null;
  }

  viewAppointmentDetails(appointment: Appointment): void {
    this.selectedAppointment = { ...appointment };
    console.log('👁️ Viewing appointment details:', appointment.id);
  }

  closeDetailsModal(): void {
    this.selectedAppointment = null;
  }

  // CRUD Operations
  createNewAppointment(): void {
    this.editingAppointment = {
      patientName: '',
      patientPhone: '',
      patientEmail: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      duration: 30,
      type: 'Consultation générale',
      reason: '',
      status: AppointmentStatus.Pending,
      notes: []
    };
  }

  saveNewAppointment(): void {
    if (!this.editingAppointment) return;

    // Validation
    const validation = this.validateAppointment(this.editingAppointment);
    if (!validation.isValid) {
      this.showErrorMessage(validation.message);
      return;
    }

    console.log('💾 Creating new appointment');

    this.receptionistService.scheduleAppointment(this.editingAppointment).subscribe({
      next: (response) => {
        console.log('✅ Appointment created successfully:', response);
        this.closeEditModal();
        this.showSuccessMessage('Rendez-vous créé avec succès');
        this.refreshAppointments();
      },
      error: (error) => {
        console.error('❌ Error creating appointment:', error);
        this.showErrorMessage('Erreur lors de la création: ' + error.message);
      }
    });
  }

  saveUpdatedAppointment(): void {
    if (!this.editingAppointment?.id) {
      this.showErrorMessage("Aucun rendez-vous sélectionné");
      return;
    }

    // Validation
    const validation = this.validateAppointment(this.editingAppointment);
    if (!validation.isValid) {
      this.showErrorMessage(validation.message);
      return;
    }

    console.log('💾 Saving appointment:', this.editingAppointment.id);

    this.receptionistService.updateAppointmentDetails(
      this.editingAppointment.id, 
      this.editingAppointment
    ).subscribe({
      next: (response) => {
        console.log('✅ Appointment updated successfully:', response);
        this.closeEditModal();
        this.showSuccessMessage('Rendez-vous mis à jour avec succès');
        this.refreshAppointments();
      },
      error: (error) => {
        console.error('❌ Error updating appointment:', error);
        this.showErrorMessage('Erreur lors de la mise à jour: ' + error.message);
      }
    });
  }

  deleteAppointment(appointment: Appointment): void {
    if (!appointment.id) return;

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le rendez-vous de ${appointment.patientName} ?`;
    
    if (confirm(confirmMessage)) {
      console.log('🗑️ Deleting appointment:', appointment.id);
      
      this.receptionistService.cancelAppointmentByReceptionist(
        appointment.id, 
        'Supprimé par la réception'
      ).subscribe({
        next: () => {
          console.log('✅ Appointment deleted successfully');
          this.showSuccessMessage('Rendez-vous supprimé avec succès');
          this.refreshAppointments();
        },
        error: (error) => {
          console.error('❌ Error deleting appointment:', error);
          this.showErrorMessage('Erreur lors de la suppression: ' + error.message);
        }
      });
    }
  }

  confirmAppointment(appointment: Appointment): void {
    if (!appointment.id) return;

    this.receptionistService.confirmAppointment(appointment.id).subscribe({
      next: () => {
        console.log('✅ Appointment confirmed');
        this.showSuccessMessage('Rendez-vous confirmé avec succès');
        this.refreshAppointments();
      },
      error: (error) => {
        console.error('❌ Error confirming appointment:', error);
        this.showErrorMessage('Erreur lors de la confirmation: ' + error.message);
      }
    });
  }

  // Quick actions
  quickConfirm(appointment: Appointment): void {
    this.confirmAppointment(appointment);
  }

  quickCancel(appointment: Appointment): void {
    const reason = prompt('Raison de l\'annulation:');
    if (reason && appointment.id) {
      this.receptionistService.cancelAppointmentByReceptionist(appointment.id, reason).subscribe({
        next: () => {
          this.showSuccessMessage('Rendez-vous annulé');
          this.refreshAppointments();
        },
        error: (error) => this.showErrorMessage('Erreur: ' + error.message)
      });
    }
  }

  // Utility methods
  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedDate = '';
    this.currentPage = 1;
    this.loadAppointments();
  }

  refreshAppointments(): void {
    console.log('🔄 Manual refresh triggered');
    this.receptionistService.refreshAppointments();
    this.loadAppointments();
  }

  // Pagination
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // Export functionality
  exportAppointments(): void {
    const data = this.filteredAppointments.map(apt => ({
      'Patient': apt.patientName,
      'Téléphone': apt.patientPhone,
      'Email': apt.patientEmail,
      'Date': apt.date,
      'Heure': apt.time,
      'Type': apt.type,
      'Statut': this.getStatusLabel(apt.status),
      'Raison': apt.reason
    }));

    const csv = this.convertToCSV(data);
    this.downloadCSV(csv, `rendez-vous-${new Date().toISOString().split('T')[0]}.csv`);
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  }

  private downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Validation
  private validateAppointment(appointment: Partial<Appointment>): { isValid: boolean; message: string } {
    if (!appointment.patientName?.trim()) {
      return { isValid: false, message: "Le nom du patient est obligatoire" };
    }

    if (!appointment.date || !appointment.time) {
      return { isValid: false, message: "La date et l'heure sont obligatoires" };
    }

    // Validate date is not in the past
    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    if (appointmentDate < now) {
      return { isValid: false, message: "La date ne peut pas être dans le passé" };
    }

    // Validate phone format if provided
    if (appointment.patientPhone && !/^[\d\s\-\+\(\)]{10,}$/.test(appointment.patientPhone)) {
      return { isValid: false, message: "Format de téléphone invalide" };
    }

    // Validate email format if provided
    if (appointment.patientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(appointment.patientEmail)) {
      return { isValid: false, message: "Format d'email invalide" };
    }

    return { isValid: true, message: "" };
  }

  // Message handling
  private showSuccessMessage(message: string): void {
    // You can replace this with a proper toast notification service
    alert(message);
  }

  private showErrorMessage(message: string): void {
    // You can replace this with a proper toast notification service
    alert(message);
  }

  // Utility for template
  Math = Math;
}