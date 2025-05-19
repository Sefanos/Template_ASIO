import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AppointmentService } from '../../../../../core/patient/services/appointment.service';
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
  
    currentPatientId: number = 1; // <<--- EXAMPLE: Replace with actual patientId source
  
    isLoading: boolean = false;
    errorMessage: string | null = null;
  
    constructor(
      private appointmentService: AppointmentService,
      private cdr: ChangeDetectorRef // Inject ChangeDetectorRef

    ) {}
  
    ngOnInit(): void {
      if (this.currentPatientId) {
        this.loadAppointmentHistory();
      } else {
        this.errorMessage = 'Patient ID is not set. Cannot load history.';
        console.error(this.errorMessage);
      }
    }
  
    loadAppointmentHistory(): void {
      if (!this.currentPatientId) {
        this.errorMessage = 'Cannot load history: Patient ID is missing.';
        console.error(this.errorMessage);
        return;
      }
      this.isLoading = true;
      this.errorMessage = null;
      this.appointmentService.getAppointmentHistory(this.currentPatientId).subscribe(
        (data) => {
          this.allAppointments = data.map(appointment => {
            let parsedDate: string = appointment.date as string; // Default to original string
            if (typeof appointment.date === 'string') {
              // Remove ordinal suffixes (st, nd, rd, th) before attempting to parse
              const dateStringWithoutOrdinal = appointment.date.replace(/(\d+)(st|nd|rd|th)/, '$1');
              const tempDate = new Date(dateStringWithoutOrdinal);
              if (!isNaN(tempDate.getTime())) { // Check if the conversion was successful
                parsedDate = tempDate.toISOString(); // Convert Date to ISO string
              } else {
                console.warn(`Could not parse date string: "${appointment.date}". Using original or it might appear as invalid.`);
              }
            } else if (appointment.date && Object.prototype.toString.call(appointment.date) === '[object Date]') {
              parsedDate = (appointment.date as Date).toISOString(); // Convert Date to ISO string
            }

            return {
              ...appointment,
              date: parsedDate, // Ensure date is always a string
              status: appointment.status || 'Unknown'
            };
          });
                    // ---- DEBUT DU DEBUG ----
                    console.log('Données brutes reçues (data):', JSON.stringify(data.slice(0, 10))); // Affiche les 10 premiers éléments bruts
                    console.log('allAppointments (après mapping, 10 premiers):', JSON.stringify(this.allAppointments.slice(0, 10)));
                    // ---- FIN DU DEBUG ----
          
          this.applyFiltersAndPagination();
                    // ---- DEBUT DU DEBUG (après pagination pour la première page) ----
                    if (this.paginatedAppointments) {
                      console.log('paginatedAppointments (première page):', JSON.stringify(this.paginatedAppointments));
                      console.log('Nombre dans paginatedAppointments:', this.paginatedAppointments.length);
                    }
                    console.log('currentPage:', this.currentPage, 'itemsPerPage:', this.itemsPerPage);
                    //
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('Error fetching appointment history:', error);
          this.errorMessage = 'Failed to load appointment history. Please try again later.';
          this.isLoading = false;
          this.allAppointments = [];
          this.applyFiltersAndPagination();
          this.cdr.detectChanges(); 
        }
      );
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
  
    // Nouvelle méthode pour obtenir la classe CSS du statut
    getStatusClass(status: string | null | undefined): string {
      if (!status) {
        return '';
      }
      return status.toLowerCase().replace(/\s+/g, '-');
    }
   
  
}
