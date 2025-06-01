import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarContainerComponent } from '../calendar-container/calendar-container.component';

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.css']
})
export class SearchFilterComponent implements OnInit {
  @Input() searchQuery: string = '';
  
  // Use searchTerm to match the template
  searchTerm: string = '';
  
  private calendarContainer = inject(CalendarContainerComponent, { optional: true });
  
  ngOnInit(): void {
    // Initialize with current search state
    if (this.calendarContainer) {
      this.searchTerm = this.calendarContainer.getSearchQuery();
    }
  }
  
  onSearchChange(): void {
    if (this.calendarContainer) {
      this.calendarContainer.setSearchQuery(this.searchTerm);
    }
  }
  
  clearSearch(): void {
    this.searchTerm = '';
    if (this.calendarContainer) {
      this.calendarContainer.setSearchQuery('');
    }
  }
}