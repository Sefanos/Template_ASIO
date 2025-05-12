import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { PatientService } from '../../services/patient.service';
import { PatientSearchFilterComponent } from '../../components/patient-management/patient-search-filter/patient-search-filter.component';
import { PatientListTableComponent, PatientTableRow } from '../../components/patient-management/patient-list-table/patient-list-table.component';
import { Patient } from '../../models/patient.model';

@Component({
  selector: 'app-patient-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    PatientSearchFilterComponent, 
    PatientListTableComponent
  ],
  templateUrl: './patient-management.component.html',
  styleUrl: './patient-management.component.css'
})
export class PatientManagementComponent implements OnInit {
  searchQuery: string = '';
  filters = {
    recent: false,
    critical: false,
    followUp: false
  };
  
  patients: PatientTableRow[] = [];
  isLoading: boolean = false;
  
  currentPage = 1;
  pageSize = 8;
  maxPagesToShow = 5; 
  
  constructor(private router: Router, private patientService: PatientService) {}
  
  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.isLoading = true;
    
    this.patientService.getAllPatients()
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(data => {
        // Map the patient data to the simplified format needed for the table
        this.patients = data.map(patient => this.mapPatientToTableRow(patient));
      });
  }
  
  /**
   * Maps a Patient object to a simplified PatientTableRow for display in the table
   */
  private mapPatientToTableRow(patient: Patient): PatientTableRow {
    // Determine the last visit date from appointments
    let lastVisit = 'No visits';
    let status = 'Active'; // Default status
    
    if (patient.appointments && patient.appointments.length > 0) {
      // Sort appointments by date (most recent first)
      const sortedAppointments = [...patient.appointments].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      // Get the most recent appointment
      const mostRecentAppointment = sortedAppointments[0];
      
      // Determine the "days ago" text for the last visit
      const mostRecentDate = new Date(mostRecentAppointment.date);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - mostRecentDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        lastVisit = 'Today';
      } else if (diffDays === 1) {
        lastVisit = 'Yesterday';
      } else if (diffDays < 7) {
        lastVisit = `${diffDays} days ago`;
      } else if (diffDays < 30) {
        lastVisit = `${Math.floor(diffDays / 7)} weeks ago`;
      } else {
        lastVisit = `${Math.floor(diffDays / 30)} months ago`;
      }
      
      // Set the status based on the most recent appointment status
      if (mostRecentAppointment.status === 'scheduled') {
        status = 'Follow up';
      } else if (mostRecentAppointment.status === 'no-show') {
        status = 'Missed Appointment';
      }
    }
    
    // Override status if there are other important conditions
    if (patient.conditions && patient.conditions.some(c => c.severity === 'severe')) {
      status = 'Critical';
    } else if (patient.labResults && patient.labResults.some(lr => lr.status === 'abnormal')) {
      status = 'Lab Results';
    }
    
    return {
      id: patient.id,
      name: patient.name,
      lastVisit: lastVisit,
      status: status
    };
  }
  
  get filteredPatients(): PatientTableRow[] {
    let result = this.patients;
    
    if (this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(patient => 
        patient.name.toLowerCase().includes(query) || 
        patient.id.toString().includes(query)
      );
    }
    
    if (this.filters.recent) {
      result = result.filter(patient => 
        patient.lastVisit === 'Today' || 
        patient.lastVisit === 'Yesterday' || 
        patient.lastVisit.includes('days')
      );
    }
    
    if (this.filters.critical) {
      result = result.filter(patient => patient.status === 'Critical');
    }
    
    if (this.filters.followUp) {
      result = result.filter(patient => patient.status === 'Follow up');
    }
    
    return result;
  }
  
  get paginatedPatients(): PatientTableRow[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredPatients.slice(startIndex, startIndex + this.pageSize);
  }
  
  get totalPages(): number {
    return Math.ceil(this.filteredPatients.length / this.pageSize);
  }
  
  /**
   * Get the array of page numbers to display in pagination
   * This implementation shows a limited number of pages with ellipses
   */
  get pagesToShow(): (number | string)[] {
    const pages: (number | string)[] = [];
    
    if (this.totalPages <= this.maxPagesToShow) {
      // If we have fewer pages than the max to show, display all pages
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate middle pages to show
      const middlePoint = Math.floor(this.maxPagesToShow / 2);
      let startPage = Math.max(2, this.currentPage - middlePoint);
      let endPage = Math.min(this.totalPages - 1, this.currentPage + middlePoint);
      
      // Adjust if we're near the beginning
      if (startPage === 2) {
        endPage = Math.min(this.totalPages - 1, startPage + (this.maxPagesToShow - 3));
      }
      
      // Adjust if we're near the end
      if (endPage === this.totalPages - 1) {
        startPage = Math.max(2, endPage - (this.maxPagesToShow - 3));
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < this.totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(this.totalPages);
    }
    
    return pages;
  }
  
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  viewPatient(id: number): void {
    this.router.navigate(['/patient', id]);
  }
  
  goToPatientRecord(id: number): void {
    this.router.navigate(['/patient', id]);
  }
  
  messagePatient(id: number): void {
    // Open messaging interface
    console.log(`Messaging patient with ID: ${id}`);
  }
  
  exportPatientData(): void {
    // Export patient list
    console.log('Exporting patient data');
  }
  
  showMoreFilters(): void {
    // Show additional filter options
    console.log('Showing more filters');
  }
  
  updateSearchQuery(query: string): void {
    this.searchQuery = query;
  }
  
  updateFilters(filters: { recent: boolean; critical: boolean; followUp: boolean }): void {
    this.filters = filters;
  }
}
