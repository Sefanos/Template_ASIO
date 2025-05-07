import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upcoming-appointments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upcoming-appointments.component.html',
  styleUrls: ['./upcoming-appointments.component.css']
})
export class UpcomingAppointmentsComponent {
  // Today's date
  today = new Date();
  
  // Upcoming appointments data
  appointments = [
    {
      time: '10:30',
      patientName: 'Jean Dupont',
      appointmentType: 'Annual checkup',
      imageUrl: '/assets/placeholder-user.jpg'
    },
    {
      time: '11:15',
      patientName: 'Marie Laurent',
      appointmentType: 'Follow-up',
      imageUrl: '/assets/placeholder-user.jpg'
    },
    {
      time: '13:00',
      patientName: 'Thomas Moreau',
      appointmentType: 'Test results',
      imageUrl: '/assets/placeholder-user.jpg'
    }
  ];
}
