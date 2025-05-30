import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Update the path below if your appointment.service.ts is in a different folder
import { AppointmentService } from '../../../services/recepetionist-services/appointment.service';

import { Router } from '@angular/router';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AppointmentsComponent implements OnInit {
  searchQuery = '';
  selectedStatus = '';
  selectedDate = '';
  appointments: any[] = [];
  editingAppointment: any = null;
  selectedAppointment: any = null;
  isLoading = false;

  // Pagination
  itemsPerPage = 5;
  currentPage = 1;

  constructor(
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  goToPlanning() {
    this.router.navigate(['/doctors-planning']);
  }

  loadAppointments() {
    this.isLoading = true;
    const filters: any = {};
    
    if (this.selectedDate) {
      filters.date = this.selectedDate;
    }
    
    if (this.selectedStatus) {
      filters.statut = this.getBackendStatusFromFilter();
    }
    
    if (this.searchQuery.trim()) {
      filters.search = this.searchQuery.trim();
    }

    console.log('🔄 COMPONENT: Chargement avec filtres:', filters);

    this.appointmentService.getAppointments(filters).subscribe({
      next: (response: any) => {
        console.log('✅ COMPONENT: Réponse reçue:', response);
        this.appointments = (response.data || []).map((rdv: any) => ({
          id: rdv.id,
          patient: rdv.nom_patient,
          prenom: rdv.prenom_patient,
          nom_patient: rdv.nom_patient,
          prenom_patient: rdv.prenom_patient,
          time: rdv.date_heure,
          date_heure: rdv.date_heure,
          type: rdv.type,
          status: this.mapBackendStatusToFrontend(rdv.statut),
          statut: rdv.statut,
          reminder: rdv.rappel,
          rappel: rdv.rappel
        }));
        console.log('📝 COMPONENT: RDV mappés:', this.appointments.length, 'rendez-vous');
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ COMPONENT: Erreur chargement:', error);
        alert('Erreur lors du chargement: ' + error);
        this.isLoading = false;
      }
    });
  }

  getBackendStatusFromFilter(): string {
    const statusMap: {[key: string]: string} = {
      'upcoming': 'À Venir',
      'in_progress': 'En Cours',
      'completed': 'Terminé',
      'canceled': 'Annulé'
    };
    return statusMap[this.selectedStatus] || '';
  }

  mapBackendStatusToFrontend(statut: string): string {
    const statusMap: {[key: string]: string} = {
      'À Venir': 'upcoming',
      'En Cours': 'in_progress',
      'Terminé': 'completed',
      'Annulé': 'canceled'
    };
    return statusMap[statut] || 'upcoming';
  }

  mapFrontendStatusToBackend(status: string): string {
    const statusMap: {[key: string]: string} = {
      'upcoming': 'À Venir',
      'in_progress': 'En Cours',
      'completed': 'Terminé',
      'canceled': 'Annulé'
    };
    return statusMap[status] || 'À Venir';
  }

  get filteredAppointments() {
    return this.appointments.filter((app: any) => {
      const matchesSearch = !this.searchQuery || 
        app.patient?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        app.prenom?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus = !this.selectedStatus || app.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  get paginatedAppointments() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredAppointments.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAppointments.length / this.itemsPerPage);
  }

  getPagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i);
  }

  getLabelFromStatus(status: string): string {
    const labels: {[key: string]: string} = {
      'upcoming': 'À venir',
      'in_progress': 'En cours',
      'completed': 'Terminé',
      'canceled': 'Annulé'
    };
    return labels[status] || 'Inconnu';
  }

  openEditModal(appointment: any): void {
    console.log('✏️ COMPONENT: Ouverture édition pour RDV ID:', appointment.id);
    
    const dateTime = new Date(appointment.date_heure);
    const formattedDateTime = dateTime.toISOString().slice(0, 16);

    this.editingAppointment = {
      id: appointment.id,
      nom_patient: appointment.nom_patient || '',
      prenom_patient: appointment.prenom_patient || '',
      date_heure: formattedDateTime,
      type: appointment.type || 'Consultation',
      status: appointment.status || 'upcoming',
      rappel: appointment.rappel || ''
    };

    console.log('📝 COMPONENT: Données édition préparées:', this.editingAppointment);
  }

  closeEditModal(): void {
    this.editingAppointment = null;
    console.log('❌ COMPONENT: Modal édition fermée');
  }

  saveUpdatedAppointment(): void {
    if (!this.editingAppointment?.id) {
      alert("Aucun RDV sélectionné");
      return;
    }

    // Validation
    if (!this.editingAppointment.nom_patient?.trim()) {
      alert("Le nom du patient est obligatoire");
      return;
    }

    if (!this.editingAppointment.date_heure) {
      alert("La date et l'heure sont obligatoires");
      return;
    }

    // Formatage date MySQL
    const dateTime = new Date(this.editingAppointment.date_heure);
    const formattedDateTime = `${dateTime.getFullYear()}-${String(dateTime.getMonth() + 1).padStart(2, '0')}-${String(dateTime.getDate()).padStart(2, '0')} ${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}:00`;

    const dataToSend = {
      nom_patient: this.editingAppointment.nom_patient.trim(),
      prenom_patient: this.editingAppointment.prenom_patient?.trim() || '',
      date_heure: formattedDateTime,
      type: this.editingAppointment.type || 'Consultation',
      statut: this.mapFrontendStatusToBackend(this.editingAppointment.status),
      rappel: this.editingAppointment.rappel?.trim() || null
    };

    console.log('💾 COMPONENT: Sauvegarde RDV ID:', this.editingAppointment.id);
    console.log('📤 COMPONENT: Données à envoyer:', dataToSend);

    this.appointmentService.updateAppointment(this.editingAppointment.id, dataToSend).subscribe({
      next: (response: any) => {
        console.log('✅ COMPONENT: RDV mis à jour avec succès:', response);
        this.closeEditModal();
        
        // Recharger immédiatement la liste
        this.loadAppointments();
        alert('Rendez-vous mis à jour avec succès');
      },
      error: (error: any) => {
        console.error('❌ COMPONENT: Erreur mise à jour:', error);
        alert('Erreur lors de la mise à jour: ' + error);
      }
    });
  }

  deleteAppointment(appointment: any): void {
    if (!appointment.id) return;

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le rendez-vous de ${appointment.patient} ${appointment.prenom || ''} ?`;
    
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
          alert('Erreur lors de la suppression: ' + error);
        }
      });
    }
  }

  viewAppointmentDetails(appointment: any): void {
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
}
