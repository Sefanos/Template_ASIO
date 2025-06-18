import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientSearchFilters } from '../../../../services/doc-services/doctor-patient.service';

@Component({
  selector: 'app-patient-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-search-filter.component.html',
  styleUrl: './patient-search-filter.component.css'
})
export class PatientSearchFilterComponent {
  @Input() searchQuery: string = '';
  @Input() activeTab: 'my-patients' | 'all-patients' = 'my-patients';
  
  @Output() searchQueryChange = new EventEmitter<string>(); // ✅ Added for two-way binding
  @Output() searchChange = new EventEmitter<void>();
  @Output() filtersChange = new EventEmitter<PatientSearchFilters>();
  
  // Filter options
  filters: PatientSearchFilters = {
    status: '',
    gender: '',
    ageRange: [0, 100]
  };
  
  showAdvancedFilters = false;
  
  // Options for dropdowns
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' }
  ];
  
  genderOptions = [
    { value: '', label: 'All Genders' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];
    onSearchChange(query: string): void {
    this.searchQuery = query;
    this.searchQueryChange.emit(query); // ✅ Emit for two-way binding
    this.searchChange.emit(); // ✅ Emit for parent component logic
  }
  
  onFilterChange(): void {
    this.filtersChange.emit(this.filters);
  }
  
  onStatusChange(): void {
    this.onFilterChange();
  }
  
  onGenderChange(): void {
    this.onFilterChange();
  }
  
  onAgeRangeChange(): void {
    this.onFilterChange();
  }
  
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }
    clearAllFilters(): void {
    this.searchQuery = '';
    this.filters = {
      status: '',
      gender: '',
      ageRange: [0, 100]
    };
    this.searchQueryChange.emit(this.searchQuery); // ✅ Emit for two-way binding
    this.searchChange.emit();
    this.filtersChange.emit(this.filters);
  }
  
  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || 
             this.filters.status || 
             this.filters.gender || 
             (this.filters.ageRange && (this.filters.ageRange[0] > 0 || this.filters.ageRange[1] < 100)));
  }
}