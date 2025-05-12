import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../../services/calendar/calendar.service';
import { CalendarResource } from '../../../models/calendar/calendar-resource.model';

@Component({
  selector: 'app-resource-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resource-filter.component.html',
  styleUrls: ['./resource-filter.component.css']
})
export class ResourceFilterComponent implements OnInit {
  private calendarService = inject(CalendarService);
  
  // Get reactive state from service
  resources = this.calendarService.resources;
  filteredDoctorIds = this.calendarService.filteredDoctorIds;
  
  // Local state
  selectedIds: string[] = [];
  
  ngOnInit(): void {
    // Initialize with all resources selected
    this.selectAll();
  }
  
  // Check if a resource is selected
  isSelected(resourceId: string): boolean {
    return this.selectedIds.includes(resourceId);
  }
  
  // Toggle selection of a resource
  toggleResource(resourceId: string): void {
    if (this.isSelected(resourceId)) {
      this.selectedIds = this.selectedIds.filter(id => id !== resourceId);
    } else {
      this.selectedIds = [...this.selectedIds, resourceId];
    }
    
    // Update service state
    this.calendarService.setFilteredDoctorIds(this.selectedIds);
  }
  
  // Select all resources
  selectAll(): void {
    this.selectedIds = this.resources().map(resource => resource.id);
    this.calendarService.setFilteredDoctorIds(this.selectedIds);
  }
  
  // Deselect all resources
  selectNone(): void {
    this.selectedIds = [];
    this.calendarService.setFilteredDoctorIds(this.selectedIds);
  }
}