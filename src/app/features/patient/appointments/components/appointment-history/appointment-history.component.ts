import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PatientAppointmentService } from '../../../../../shared/services/patient-appointment.service';
import { RescheduleAppointmentComponent } from '../reschedule-appointment/reschedule-appointment.component';

@Component({
  selector: 'app-appointment-history',
  standalone: false,
  templateUrl: './appointment-history.component.html',
  styleUrl: './appointment-history.component.css'
})
export class AppointmentHistoryComponent implements OnInit {

  // Simplified data management - work directly with API response
  appointments: any[] = [];
  filteredAppointments: any[] = [];
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPagesCount: number = 0;
  totalRecords: number = 0;
  
  // Search and filters
  searchTerm: string = '';
  statusFilter: string = '';
  
  // UI state
  isLoading: boolean = false;
  errorMessage: string | null = null;
  expandedAppointmentIds: Set<number> = new Set();
  
  // Doctor specialty cache and loading state
  doctorCache: Map<number, any> = new Map();
  loadingDoctorIds: Set<number> = new Set();

  constructor(
    private patientAppointmentService: PatientAppointmentService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAppointmentHistory();
  }

  loadAppointmentHistory(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.patientAppointmentService.getAppointmentHistory().subscribe({
      next: (response) => {
        console.log('Raw API response:', response);
        
        // Work directly with API response structure
        this.appointments = response.data || [];
        this.totalRecords = response.pagination?.total || this.appointments.length;
        
        console.log('Appointments loaded:', this.appointments);
        
        // Auto-load doctor specialties for appointments without them
        this.loadMissingDoctorSpecialties();
        
        this.applyFilters();
        this.isLoading = false;
        
        // Auto-load missing doctor specialties
        this.loadMissingDoctorSpecialties();
        
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading appointment history:', error);
        this.errorMessage = 'Failed to load appointment history. Please try again later.';
        this.isLoading = false;
        this.appointments = [];
        this.filteredAppointments = [];
        this.cdr.detectChanges(); 
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.appointments];
    
    // Apply search filter
    if (this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter((appointment: any) => {
        // Search across multiple fields - handle both mapped and raw API structure
        const searchFields = [
          appointment.reason_for_visit || appointment.reason,
          appointment.provider,
          appointment.doctorName,
          appointment.patientName,
          appointment.notes,
          appointment.notes_by_patient,
          appointment.notes_by_staff,
          this.formatDate(appointment.date || appointment.appointment_datetime_start)
        ];
        
        return searchFields.some(field => 
          field && field.toString().toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Apply status filter
    if (this.statusFilter && this.statusFilter !== '') {
      filtered = filtered.filter((appointment: any) => 
        appointment.status?.toLowerCase() === this.statusFilter.toLowerCase()
      );
    }
    
    this.filteredAppointments = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPagesCount = Math.ceil(this.filteredAppointments.length / this.itemsPerPage);
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPagesCount && this.totalPagesCount > 0) {
      this.currentPage = this.totalPagesCount;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  getPaginatedAppointments(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAppointments.slice(startIndex, endIndex);
  }

  onSearchTermChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  totalPages(): number {
    return this.totalPagesCount;
  }

  totalPagesArray(): number[] {
    const total = this.totalPages();
    if (total === 0) return [];
    return Array(total).fill(0).map((x, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  openFilterModal(): void {
    console.log('Filter button clicked');
  }

  exportData(): void {
    console.log('Export button clicked');
  }

  trackByAppointmentId(index: number, appointment: any): number {
    return appointment.id;
  }

  // Status styling based on API response
  getStatusClass(status: string | null | undefined): string {
    if (!status) {
      return 'bg-hover text-text-muted border border-border';
    }
    
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'bg-status-success/20 text-status-success border border-status-success/30';
      case 'pending':
        return 'bg-status-warning/20 text-status-warning border border-status-warning/30';
      case 'cancelled':
        return 'bg-status-urgent/20 text-status-urgent border border-status-urgent/30';
      default:
        return 'bg-hover text-text-muted border border-border';
    }
  }

  // Expanded appointment details with doctor specialty loading
  toggleAppointmentDetails(appointment: any): void {
    if (this.expandedAppointmentIds.has(appointment.id)) {
      this.expandedAppointmentIds.delete(appointment.id);
    } else {
      this.expandedAppointmentIds.add(appointment.id);
      
      // Load doctor specialty when expanding details (Option 4)
      const doctorId = this.getDoctorId(appointment);
      if (doctorId) {
        this.loadDoctorSpecialty(doctorId);
      }
    }
  }

  isAppointmentExpanded(id: number): boolean {
    return this.expandedAppointmentIds.has(id);
  }

  // Option 4: Targeted doctor loading methods
  loadDoctorSpecialty(doctorId: number): void {
    if (this.doctorCache.has(doctorId) || this.loadingDoctorIds.has(doctorId)) {
      return; // Already loaded or loading
    }

    this.loadingDoctorIds.add(doctorId);

    this.patientAppointmentService.getDoctorById(doctorId).subscribe({
      next: (doctor) => {
        console.log('Doctor loaded via targeted method:', doctor);
        this.doctorCache.set(doctorId, doctor);
        this.loadingDoctorIds.delete(doctorId);
        
        // Update appointments with the loaded specialty
        const specialty = doctor.doctor?.specialty || 'General Practice';
        this.appointments.forEach(appointment => {
          if (this.getDoctorId(appointment) === doctorId) {
            appointment.doctorSpecialty = specialty;
          }
        });
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading doctor specialty:', error);
        this.loadingDoctorIds.delete(doctorId);
        this.cdr.detectChanges();
      }
    });
  }

  getDoctorSpecialty(doctorId: number | null): string {
    if (!doctorId) return 'Not available';
    
    const doctor = this.doctorCache.get(doctorId);
    if (doctor) {
      // Handle API response structure: User -> doctor -> specialty
      return doctor.doctor?.specialty || 
             doctor.specialty || 
             'General Practice';
    }
    
    if (this.loadingDoctorIds.has(doctorId)) {
      return 'Loading...';
    }
    
    return 'Not available';
  }

  isDoctorLoading(doctorId: number | null): boolean {
    if (!doctorId) return false;
    return this.loadingDoctorIds.has(doctorId);
  }

  getDoctorId(appointment: any): number | null {
    // Extract doctor user ID from appointment - this matches the user ID in available doctors
    const doctorId = appointment.doctor_user_id || appointment.doctorId || null;
    console.log('getDoctorId for appointment', appointment.id, ':', doctorId, 'from appointment:', appointment);
    return doctorId;
  }

  // Auto-load doctor specialties for appointments that don't have them
  loadMissingDoctorSpecialties(): void {
    console.log('Loading missing doctor specialties...');
    this.appointments.forEach(appointment => {
      const doctorId = this.getDoctorId(appointment);
      console.log('Appointment:', appointment.id, 'Doctor ID:', doctorId, 'Current specialty:', appointment.doctorSpecialty);
      if (doctorId && !appointment.doctorSpecialty) {
        console.log('Loading specialty for doctor ID:', doctorId);
        this.loadDoctorSpecialty(doctorId);
      }
    });
  }

  // Helper methods for working with API data structure
  getDoctorName(appointment: any): string {
    return appointment.provider || 
           appointment.doctorName || 
           'Unknown Doctor';
  }

  getPatientName(appointment: any): string {
    return appointment.patientName || 
           'Unknown Patient';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown Date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }

  formatTime(timeString: string): string {
    if (!timeString) return 'Unknown Time';
    
    try {
      // Handle both "HH:mm:ss" and "HH:mm" formats, and already formatted times
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString; // Already formatted
      }
      
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes} ${ampm}`;
      }
      return timeString;
    } catch (error) {
      return timeString;
    }
  }

  // Action methods
  viewMedicalRecord(id: number): void {
    this.router.navigate(['/medical-records'], { queryParams: { appointmentId: id } });
  }

  rescheduleAppointment(id: number): void {
    // Find the appointment to reschedule
    const appointment = this.appointments.find(app => app.id === id);
    if (!appointment) {
      console.error('Appointment not found for reschedule:', id);
      return;
    }

    // Open the reschedule modal
    const dialogRef = this.dialog.open(RescheduleAppointmentComponent, {
      width: '500px',
      data: { appointment: appointment },
      disableClose: false
    });

    // Handle dialog result
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Appointment rescheduled:', result);
        // Refresh the appointment list to show updated data
        this.loadAppointmentHistory();
      }
    });
  }

  printConfirmation(appointment: any): void {
    const formattedDate = this.formatDate(appointment.date);
    const formattedTime = this.formatTime(appointment.time);
    const doctorName = this.getDoctorName(appointment);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Appointment Confirmation</title>
            <style>
              body { 
                font-family: 'Helvetica Neue', Arial, sans-serif; 
                padding: 40px;
                margin: 0;
                color: #333;
                line-height: 1.6;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #3b82f6;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #3b82f6;
                margin-bottom: 5px;
              }
              h1 { 
                color: #3b82f6; 
                font-size: 28px;
                margin: 0;
                font-weight: 500;
              }
              .details {
                background-color: #f8fafc;
                padding: 25px;
                border-radius: 8px;
                border-left: 5px solid #3b82f6;
                margin: 30px 0;
              }
              .detail-row {
                display: flex;
                margin-bottom: 12px;
                align-items: baseline;
              }
              .label {
                font-weight: 600;
                width: 140px;
                color: #4b5563;
                font-size: 15px;
              }
              .value {
                flex: 1;
                font-size: 16px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">MEDICAL CENTER</div>
              <h1>Appointment Confirmation</h1>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${formattedTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">Doctor:</span>
                <span class="value">${doctorName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Reason:</span>
                <span class="value">${appointment.reason || 'Not specified'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value">${appointment.status || 'Unknown'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Appointment ID:</span>
                <span class="value">APPT-${appointment.id}</span>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  cancelAppointment(id: number): void {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.patientAppointmentService.cancelMyAppointment(id, 'Cancelled by patient').subscribe({
        next: () => {
          // Update local status
          const appointment = this.appointments.find(a => a.id === id);
          if (appointment) {
            appointment.status = 'cancelled';
            appointment.notes = appointment.notes ? 
              appointment.notes + '; Cancelled by patient' : 
              'Cancelled by patient';
          }
          
          this.applyFilters();
          this.cdr.detectChanges();
          
          // Show success message
          alert('Appointment cancelled successfully.');
        },
        error: (error: any) => {
          console.error('Failed to cancel appointment:', error);
          let errorMessage = 'Failed to cancel appointment. Please try again.';
          
          if (error.error && error.error.error) {
            errorMessage = error.error.error;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          
          alert(errorMessage);
        }
      });
    }
  }

  canReschedule(appointment: any): boolean {
    const status = appointment.status?.toLowerCase();
    return ['confirmed', 'pending'].includes(status) && 
           !this.isAppointmentInPast(appointment);
  }

  canCancel(appointment: any): boolean {
    const status = appointment.status?.toLowerCase();
    return ['confirmed', 'pending'].includes(status) && 
           !this.isAppointmentInPast(appointment);
  }

  isAppointmentInPast(appointment: any): boolean {
    if (!appointment.date && !appointment.startDateTime) return false;
    
    try {
      const appointmentDate = new Date(appointment.date || appointment.startDateTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return appointmentDate < today;
    } catch (error) {
      return false;
    }
  }

  // Available status options for filter
  getStatusOptions(): string[] {
    const uniqueStatuses = [...new Set(
      this.appointments
        .map(apt => apt.status)
        .filter(status => status)
        .map(status => status.toLowerCase())
    )];
    
    return uniqueStatuses.sort();
  }
}
