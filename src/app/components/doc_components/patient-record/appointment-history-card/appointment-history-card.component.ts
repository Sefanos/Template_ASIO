import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../../models/appointment.model'; 

@Component({
  selector: 'app-appointment-history-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-history-card.component.html',
})
export class AppointmentHistoryCardComponent implements OnChanges {
  @Input() appointments: Appointment[] = [];
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appointments']) {
      // Force change detection when appointments change
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }
  
  /**
   * Returns only the 3 most recent appointments sorted by date
   */
  get recentAppointments(): Appointment[] {
    if (!this.appointments || this.appointments.length === 0) {
      return [];
    }
    
    // Sort appointments by date (most recent first)
    // Using a new array to avoid modifying the original data
    return [...this.appointments]
      .sort((a, b) => {
        // Convert string dates to Date objects for comparison
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 3); // Only take the first 3 (most recent)
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
}