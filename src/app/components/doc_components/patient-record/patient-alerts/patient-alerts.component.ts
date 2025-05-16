import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Alert {
  type: 'warning' | 'danger' | 'info';
  message: string;
}

@Component({
  selector: 'app-patient-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-alerts.component.html',
})
export class PatientAlertsComponent implements OnChanges {
  @Input() allergies: string[] = [];
  @Input() alerts: Alert[] = [];
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['allergies'] || changes['alerts']) {
      console.log('Patient alerts updated - Allergies:', this.allergies?.length || 0, 'Alerts:', this.alerts?.length || 0);
      // Force change detection when data changes
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }
}