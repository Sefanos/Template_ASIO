import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-patient-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-search-filter.component.html',
  styleUrl: './patient-search-filter.component.css'
})
export class PatientSearchFilterComponent {
  @Input() searchQuery: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();
  
  @Input() filters: { recent: boolean; critical: boolean; followUp: boolean } = {
    recent: false,
    critical: false,
    followUp: false
  };
  @Output() filtersChange = new EventEmitter<{ recent: boolean; critical: boolean; followUp: boolean }>();
  
  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.searchQueryChange.emit(query);
  }
  
  onFilterChange(): void {
    this.filtersChange.emit(this.filters);
  }
  
  showMoreFilters(): void {
    // Show additional filter options
    console.log('Showing more filters');
  }
}