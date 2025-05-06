import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Patient {
  id: number;
  name: string;
  lastVisit: string;
  status: string;
}

@Component({
  selector: 'app-patient-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-management.component.html',
  styleUrl: './patient-management.component.css'
})
export class PatientManagementComponent {
  searchQuery: string = '';
  filters = {
    recent: false,
    critical: false,
    followUp: false
  };
  
  patients: Patient[] = [
    { id: 123, name: 'Jean Dupont', lastVisit: 'Today', status: 'Active' },
    { id: 890, name: 'Sophie Bernard', lastVisit: 'Yesterday', status: 'Follow up' },
    { id: 456, name: 'Marie Laurent', lastVisit: '5 days ago', status: 'Follow up' },
    { id: 789, name: 'Thomas Moreau', lastVisit: '2 weeks ago', status: 'Lab Results' },
    { id: 234, name: 'Claire Martin', lastVisit: '1 month ago', status: 'Critical' },
    { id: 567, name: 'Pierre Dubois', lastVisit: '3 days ago', status: 'Active' },
    { id: 890, name: 'John Pork', lastVisit: '2 days ago', status: 'Follow up' },
    { id: 890, name: 'Capucchinu Assassino', lastVisit: 'Yesterday', status: 'Follow up' },
    { id: 101, name: 'Lucie Petit', lastVisit: 'Today', status: 'Active' },
    { id: 102, name: 'Émile Garnier', lastVisit: '2 days ago', status: 'Follow up' },
    { id: 103, name: 'Nathalie Robert', lastVisit: '1 week ago', status: 'Critical' },
    { id: 104, name: 'Antoine Lefevre', lastVisit: 'Yesterday', status: 'Lab Results' },
    { id: 105, name: 'Julien Fontaine', lastVisit: '5 days ago', status: 'Active' },
    { id: 106, name: 'Camille Chevalier', lastVisit: '3 weeks ago', status: 'Follow up' },
    { id: 107, name: 'Victor Mercier', lastVisit: '1 month ago', status: 'Critical' },
    { id: 108, name: 'Isabelle Denis', lastVisit: 'Today', status: 'Active' },
    { id: 109, name: 'Hugo Marchand', lastVisit: 'Yesterday', status: 'Follow up' },
    { id: 110, name: 'Alice Blanchard', lastVisit: '4 days ago', status: 'Lab Results' },
    { id: 111, name: 'Louis Caron', lastVisit: '2 months ago', status: 'Critical' },
    { id: 112, name: 'Sophie Renard', lastVisit: '6 days ago', status: 'Follow up' },
    { id: 113, name: 'Gabriel Lemaitre', lastVisit: '1 week ago', status: 'Active' },
    { id: 114, name: 'Emma Roche', lastVisit: '3 days ago', status: 'Follow up' },
    { id: 115, name: 'Chloé Noël', lastVisit: 'Yesterday', status: 'Critical' },
    { id: 116, name: 'Mathis Tessier', lastVisit: 'Today', status: 'Lab Results' },
    { id: 117, name: 'Manon Gilbert', lastVisit: '2 weeks ago', status: 'Active' },
    { id: 118, name: 'Lucas Roy', lastVisit: '4 weeks ago', status: 'Follow up' },
    { id: 119, name: 'Léa Dupuis', lastVisit: '3 days ago', status: 'Critical' },
    { id: 120, name: 'Noah Faure', lastVisit: 'Today', status: 'Active' }
  ];
  
  currentPage = 1;
  pageSize = 8;
  
  constructor(private router: Router) {}
  
  get filteredPatients(): Patient[] {
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
  
  get paginatedPatients(): Patient[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredPatients.slice(startIndex, startIndex + this.pageSize);
  }
  
  get totalPages(): number {
    return Math.ceil(this.filteredPatients.length / this.pageSize);
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
}
