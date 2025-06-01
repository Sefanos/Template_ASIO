import { Component, inject, OnInit, Input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarResource } from '../../../../models/calendar/calendar.model';
import { CalendarContainerComponent } from '../calendar-container/calendar-container.component';

@Component({
  selector: 'app-resource-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resource-filter.component.html',
  styleUrls: ['./resource-filter.component.css']
})
export class ResourceFilterComponent implements OnInit {
  @Input() resources: CalendarResource[] = [];
  @Input() filteredDoctorIds: string[] = [];
  
  private calendarContainer = inject(CalendarContainerComponent, { optional: true });
  
  // Local reactive state
  availableResources = signal<CalendarResource[]>([]);
  selectedIds = signal<string[]>([]);
  
  constructor() {
    // Set up effect to watch for resource changes - MOVED TO CONSTRUCTOR
    if (this.calendarContainer) {
      effect(() => {
        const resources = this.calendarContainer!.getResources();
        this.availableResources.set(resources);
      });
    }
  }
  
  ngOnInit(): void {
    // Initialize with current filter state
    if (this.calendarContainer) {
      this.selectedIds.set(this.calendarContainer.getFilteredDoctorIds());
      this.availableResources.set(this.calendarContainer.getResources());
    }
  }
  
  // Check if a resource is selected
  isSelected(resourceId: string): boolean {
    return this.selectedIds().includes(resourceId);
  }
  
  // Toggle selection of a resource
  toggleResource(resourceId: string): void {
    const currentIds = this.selectedIds();
    const index = currentIds.indexOf(resourceId);
    
    let newIds: string[];
    if (index > -1) {
      newIds = currentIds.filter(id => id !== resourceId);
    } else {
      newIds = [...currentIds, resourceId];
    }
    
    this.selectedIds.set(newIds);
    
    // Update parent component
    if (this.calendarContainer) {
      this.calendarContainer.setFilteredDoctorIds(newIds);
    }
  }
  
  // Select all resources
  selectAll(): void {
    const allIds = this.availableResources().map(resource => resource.id);
    this.selectedIds.set(allIds);
    
    if (this.calendarContainer) {
      this.calendarContainer.setFilteredDoctorIds(allIds);
    }
  }
  
  // Deselect all resources
  selectNone(): void {
    this.selectedIds.set([]);
    
    if (this.calendarContainer) {
      this.calendarContainer.setFilteredDoctorIds([]);
    }
  }
  
  // Get the current resources for template
  getResources(): CalendarResource[] {
    return this.availableResources();
  }
}