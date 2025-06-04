import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Appointment } from '../../../../models/appointment.model';

@Component({
  selector: 'app-tab-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tab-appointments.component.html',
})
export class TabAppointmentsComponent implements OnChanges {
  @Input() appointments: Appointment[] = [];
  @Output() scheduleNewAppointment = new EventEmitter<void>();
  
  statusFilters: string[] = ['All Appointments', 'Scheduled', 'Completed', 'Cancelled', 'No-Show'];
  selectedStatusFilter: string = 'All Appointments';
  
  timeFrameFilters: string[] = ['All Time', 'Last Month', 'Last 3 Months', 'Last 6 Months', 'Last Year'];
  selectedTimeFrameFilter: string = 'All Time';
  
  searchQuery: string = '';
  
  // Pagination properties
  currentPage = 1;
  pageSize = 5;
  maxPagesToShow = 5;
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appointments']) {
      console.log('Appointments tab data updated:', this.appointments, this.appointments?.length || 0);
      // Reset to first page when appointments change
      this.currentPage = 1;
      // Force change detection when appointments change
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }
  
  setStatusFilter(filter: string): void {
    this.selectedStatusFilter = filter;
    this.currentPage = 1; // Reset to first page when filter changes
    this.cdr.detectChanges();
  }
  
  setTimeFrameFilter(filter: string): void {
    this.selectedTimeFrameFilter = filter;
    this.currentPage = 1; // Reset to first page when filter changes
    this.cdr.detectChanges();
  }
  
  get filteredAppointments(): Appointment[] {
    let result = [...this.appointments];
    
    // Apply status filter
    if (this.selectedStatusFilter !== 'All Appointments') {
      const status = this.selectedStatusFilter.toLowerCase();
      result = result.filter(appt => appt.status === status);
    }
    
    // Apply time frame filter (this is simplified since we don't have actual Date objects)
    // For a real implementation, you would parse the dates and filter based on actual date ranges
    if (this.selectedTimeFrameFilter !== 'All Time') {
      if (this.selectedTimeFrameFilter === 'Last Month') {
        // Filter logic would go here in a real app
      } else if (this.selectedTimeFrameFilter === 'Last 3 Months') {
        // Filter logic would go here in a real app
      } else if (this.selectedTimeFrameFilter === 'Last 6 Months') {
        // Filter logic would go here in a real app
      } else if (this.selectedTimeFrameFilter === 'Last Year') {
        // Filter logic would go here in a real app
      }
    }
    
    // Apply search query
    if (this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(appt => 
        appt.reason.toLowerCase().includes(query) ||
        appt.doctorName.toLowerCase().includes(query) ||
        appt.type.toLowerCase().includes(query)
      );
    }
    
    return result;
  }
  
  /**
   * Get paginated appointments
   */
  get paginatedAppointments(): Appointment[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredAppointments.slice(startIndex, startIndex + this.pageSize);
  }
  
  /**
   * Get total number of pages
   */
  get totalPages(): number {
    return Math.ceil(this.filteredAppointments.length / this.pageSize);
  }
  
  /**
   * Get page numbers to display in pagination controls
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
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }
  
  /**
   * Change the current page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }
  
  getStatusClass(status: string): string {
    switch(status) {
      case 'scheduled':
        return 'bg-status-info/10 text-status-info';
      case 'completed':
        return 'bg-status-success/10 text-status-success';
      case 'cancelled':
        return 'bg-status-urgent/10 text-status-urgent';
      case 'no-show':
        return 'bg-status-warning/10 text-status-warning';
      default:
        return 'bg-text/10 text-text';
    }
  }
  
  onScheduleNewAppointment(): void {
    this.scheduleNewAppointment.emit();
  }
  
  formatDate(date: string): string {
    // In a real app, this would properly format the date
    return date;
  }
}
