import { Component } from '@angular/core';

@Component({
  selector: 'app-appointment-summary',
  standalone: false,
  templateUrl: './appointment-summary.component.html',
  styleUrl: './appointment-summary.component.css'
})
export class AppointmentSummaryComponent {
  appointments = [
    { date: '2025-04-20', time: '10:00 AM', reason: 'Consultation générale' },
    { date: '2025-04-22', time: '02:00 PM', reason: 'Suivi médical' }
  ];
}
