import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../../shared/services/appointment.service';
import { Appointment } from '../../../models/appointment.model';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  // ✅ Add destroy$ subject
  private destroy$ = new Subject<void>();
  
  searchQuery = '';
  selectedStatus = '';
  selectedDate = '';
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = []; // ✅ Add this property
  editingAppointment: any = null;
  selectedAppointment: any = null;
  isLoading = false;

  // Pagination
  itemsPerPage = 5;
  currentPage = 1;
  totalPages = 0; // ✅ Add this property

  constructor(
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  // ✅ Add OnDestroy implementation
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToPlanning() {
    this.router.navigate(['/doctors-planning']);
  }

  loadAppointments() {
    this.isLoading = true;
    
    const filters = this.getFilters();

    this.appointmentService.getAllAppointments(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          this.appointments = appointments;
          this.applyFilters(); // ✅ Use proper filtering method
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error loading appointments:', error);
          this.isLoading = false;
        }
      });
  }

  // ✅ Add missing updatePagination method
  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAppointments.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  // ✅ Add proper filtering method
  private applyFilters(): void {
    this.filteredAppointments = this.appointments.filter((appointment: Appointment) => {
      // ✅ Use correct field names from the transformed model
      const matchesSearch = !this.searchQuery || 
        appointment.patientName?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        appointment.doctorName?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus = !this.selectedStatus || appointment.status === this.selectedStatus;

      const matchesDate = !this.selectedDate || appointment.date === this.selectedDate;

      return matchesSearch && matchesStatus && matchesDate;
    });
    
    this.updatePagination();
  }

  getFilters() {
    const filters: any = {};
    
    if (this.selectedDate) {
      filters.date = this.selectedDate;
    }
    
    if (this.selectedStatus) {
      filters.status = this.selectedStatus; // ✅ Use correct field name
    }
    
    if (this.searchQuery.trim()) {
      filters.search = this.searchQuery.trim();
    }

    return filters;
  }

  // ✅ Remove old status mapping methods - not needed with transformation layer

  get paginatedAppointments(): Appointment[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredAppointments.slice(start, end);
  }

  get totalPagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  // ✅ Updated method to handle the correct status values
  getLabelFromStatus(status: string): string {
    const labels: {[key: string]: string} = {
      'scheduled': 'Programmé',
      'completed': 'Terminé', 
      'cancelled': 'Annulé',
      'no-show': 'Absent'
    };
    return labels[status] || 'Inconnu';
  }

  // ✅ Fixed openEditModal to use transformed data
  openEditModal(appointment: Appointment): void {
    console.log('✏️ COMPONENT: Ouverture édition pour RDV ID:', appointment.id);
    
    // ✅ Use the properly transformed date/time from the appointment
    const startDateTime = appointment.startDateTime || new Date();
    const formattedDateTime = startDateTime.toISOString().slice(0, 16);

    this.editingAppointment = {
      id: appointment.id,
      patientName: appointment.patientName || '',
      doctorName: appointment.doctorName || '',
      date: appointment.date,
      time: appointment.time,
      datetime: formattedDateTime, // For HTML datetime-local input
      type: appointment.type || 'consultation',
      status: appointment.status || 'scheduled',
      reason: appointment.reason || '',
      notes: appointment.notes || ''
    };

    console.log('📝 COMPONENT: Données édition préparées:', this.editingAppointment);
  }

  closeEditModal(): void {
    this.editingAppointment = null;
    console.log('❌ COMPONENT: Modal édition fermée');
  }

  // ✅ Fixed saveUpdatedAppointment to use proper data structure
  saveUpdatedAppointment(): void {
    if (!this.editingAppointment?.id) {
      alert("Aucun RDV sélectionné");
      return;
    }

    // Validation
    if (!this.editingAppointment.patientName?.trim()) {
      alert("Le nom du patient est obligatoire");
      return;
    }

    if (!this.editingAppointment.datetime) {
      alert("La date et l'heure sont obligatoires");
      return;
    }

    // ✅ Create proper Appointment object for the mapper
    const appointmentToUpdate: Appointment = {
      id: this.editingAppointment.id,
      date: this.editingAppointment.date,
      time: this.editingAppointment.time,
      type: this.editingAppointment.type,
      provider: this.editingAppointment.doctorName,
      reason: this.editingAppointment.reason,
      status: this.editingAppointment.status,
      notes: this.editingAppointment.notes,
      patientName: this.editingAppointment.patientName,
      doctorName: this.editingAppointment.doctorName,
      startDateTime: new Date(this.editingAppointment.datetime)
    };

    console.log('💾 COMPONENT: Sauvegarde RDV ID:', this.editingAppointment.id);
    console.log('📤 COMPONENT: Données à envoyer:', appointmentToUpdate);

    // ✅ Use the proper service method with correct typing
    this.appointmentService.updateAppointment(this.editingAppointment.id, appointmentToUpdate).subscribe({
      next: (response: Appointment) => {
        console.log('✅ COMPONENT: RDV mis à jour avec succès:', response);
        this.closeEditModal();
        this.loadAppointments();
        alert('Rendez-vous mis à jour avec succès');
      },
      error: (error: any) => {
        console.error('❌ COMPONENT: Erreur mise à jour:', error);
        alert('Erreur lors de la mise à jour: ' + (error.message || error));
      }
    });
  }

  // ✅ Fixed deleteAppointment to use correct field names
  deleteAppointment(appointment: Appointment): void {
    if (!appointment.id) return;

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le rendez-vous de ${appointment.patientName} ?`;
    
    if (confirm(confirmMessage)) {
      console.log('🗑️ COMPONENT: Suppression RDV ID:', appointment.id);
      
      this.appointmentService.deleteAppointment(appointment.id).subscribe({
        next: (response: any) => {
          console.log('✅ COMPONENT: RDV supprimé:', response);
          this.loadAppointments();
          alert('Rendez-vous supprimé avec succès');
        },
        error: (error: any) => {
          console.error('❌ COMPONENT: Erreur suppression:', error);
          alert('Erreur lors de la suppression: ' + (error.message || error));
        }
      });
    }
  }

  // ✅ Fixed viewAppointmentDetails
  viewAppointmentDetails(appointment: Appointment): void {
    this.selectedAppointment = { ...appointment };
    console.log('👁️ COMPONENT: Affichage détails RDV:', appointment.id);
  }

  closeDetailsModal(): void {
    this.selectedAppointment = null;
  }

  // Méthodes utilitaires
  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedDate = '';
    this.currentPage = 1;
    this.loadAppointments();
  }

  refreshAppointments(): void {
    console.log('🔄 COMPONENT: Actualisation forcée');
    this.loadAppointments();
  }

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
  getPagesArray(): any[] {
  return Array(this.totalPages).fill(0);
}

  quickConfirm(appointment: Appointment): void {
    this.appointmentService.confirmAppointment(appointment.id)
      .subscribe({
        next: (updatedAppointment) => {
          const index = this.appointments.findIndex(a => a.id === appointment.id);
          if (index !== -1) {
            this.appointments[index] = updatedAppointment;
            this.applyFilters(); // ✅ Update filtered list
          }
        },
        error: (error) => console.error('❌ Error confirming appointment:', error)
      });
  }

  // ✅ Add search functionality
  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onDateChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }
}
