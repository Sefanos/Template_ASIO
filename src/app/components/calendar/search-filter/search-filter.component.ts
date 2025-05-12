import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../../services/calendar/calendar.service';

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.css']
})
export class SearchFilterComponent {
  private calendarService = inject(CalendarService);
  
  // Local state
  searchTerm: string = '';
  
  // Handle search changes
  onSearchChange(): void {
    this.calendarService.setSearchQuery(this.searchTerm);
  }
  
  // Clear search
  clearSearch(): void {
    this.searchTerm = '';
    this.calendarService.setSearchQuery('');
  }
}