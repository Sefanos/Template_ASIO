import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Appointment {
  id: number;
  date: string;
  time: string;
  type: string;
  provider: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

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
      console.log('Appointment history updated:', this.appointments?.length || 0);
      // Force change detection when appointments change
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }
  
  getStatusClass(status: string): string {
    switch(status) {
      case 'scheduled':
        return 'bg-status-info/10 text-status-info';
      case 'completed':
        return 'bg-success/10 text-success';
      case 'cancelled':
        return 'bg-status-urgent/10 text-status-urgent';
      case 'no-show':
        return 'bg-status-warning/10 text-status-warning';
      default:
        return 'bg-text/10 text-text';
    }
  }
}