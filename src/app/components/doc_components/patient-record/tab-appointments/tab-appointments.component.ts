import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Appointment } from '../../../../models/appointment.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tab-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tab-appointments.component.html',
})
export class TabAppointmentsComponent implements OnChanges, OnDestroy {
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
  
  private currentUser: any = null;
  private userSubscription: Subscription | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {
    // Subscribe to current user changes
    this.userSubscription = this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appointments']) {
      console.log('Appointments tab data updated:', this.appointments, this.appointments?.length || 0);
      // Reset to first page when appointments change
      this.currentPage = 1;
      // Force change detection when appointments change
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }
  
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
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
      // Apply time frame filter
    if (this.selectedTimeFrameFilter !== 'All Time') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (this.selectedTimeFrameFilter) {
        case 'Last Month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'Last 3 Months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case 'Last 6 Months':
          filterDate.setMonth(now.getMonth() - 6);
          break;
        case 'Last Year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      result = result.filter(appt => {
        const appointmentDate = new Date(this.getAppointmentDate(appt));
        return appointmentDate >= filterDate;
      });
    }
      // Apply search query
    if (this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(appt => 
        (appt.reason && appt.reason.toLowerCase().includes(query)) ||
        (this.getDoctorName(appt) && this.getDoctorName(appt).toLowerCase().includes(query)) ||
        (appt.type && appt.type.toLowerCase().includes(query))
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
    if (!date) return '';
    
    try {
      // Handle ISO date strings
      if (date.includes('T')) {
        const parsedDate = new Date(date);
        return parsedDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      
      // Handle simple date strings like '2025-07-02'
      const parsedDate = new Date(date);
      return parsedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return date; // Return original if parsing fails
    }
  }
  
  // Add helper methods for consistent data extraction
  getAppointmentDate(appointment: any): string {
    const dateValue = appointment.date || appointment.appointmentDate || appointment.scheduled_date || appointment.appointment_datetime_start;
    if (!dateValue) return '';
    
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      return dateValue.split('T')[0];
    }
    
    return dateValue;
  }
  
  getAppointmentTime(appointment: any): string {
    if (appointment.time) {
      return appointment.time;
    }
    
    const dateTimeValue = appointment.appointment_datetime_start || appointment.appointmentTime || appointment.scheduled_time;
    if (dateTimeValue && typeof dateTimeValue === 'string' && dateTimeValue.includes('T')) {
      try {
        const date = new Date(dateTimeValue);
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      } catch {
        return '';
      }
    }
    
    return dateTimeValue || '';
  }
  
  getDoctorName(appointment: any): string {
    // First try to get doctor from appointment data (if it exists and is valid)
    if (appointment.doctor && typeof appointment.doctor === 'object') {
      const doctorName = appointment.doctor.name || 
                        appointment.doctor.full_name || 
                        `Dr. ${appointment.doctor.last_name}`;
      if (doctorName && doctorName !== 'Dr. undefined') {
        return doctorName;
      }
    }
    
    // Check appointment direct fields (skip hardcoded sample data)
    if (appointment.provider && !appointment.provider.includes('Dr. Sefanos')) {
      return appointment.provider;
    }
    if (appointment.doctor_name) {
      return appointment.doctor_name;
    }
    if (appointment.physician_name) {
      return appointment.physician_name;
    }
    
    // Fallback to current logged-in doctor
    if (this.currentUser) {
      const doctorName = this.currentUser.full_name || 
                        this.currentUser.name || 
                        (this.currentUser.first_name && this.currentUser.last_name ? 
                          `Dr. ${this.currentUser.first_name} ${this.currentUser.last_name}` : null) ||
                        (this.currentUser.last_name ? `Dr. ${this.currentUser.last_name}` : null) ||
                        this.currentUser.username;
      
      if (doctorName && doctorName !== 'Dr. undefined') {
        return doctorName;
      }
    }
    
    // Final fallback
    return 'Doctor';
  }
}
