import { Component } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { BookAppointmentComponent } from './components/book-appointment/book-appointment.component';
 
@Component({
  selector: 'app-appointments',
  standalone: false,
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.css'
})
export class AppointmentsComponent {
  selectedTab: 'book' | 'history' = 'book'; // Vue par défaut

  switchTab(tabName: 'book' | 'history') {
    this.selectedTab = tabName;
  }

    // Récupération de la date actuelle
    currentDate = new Date();

    // Méthode pour formater la date avec suffixe ordinal
    // formatDate(date: Date): string {
    //   const day = date.getDate();
    //   const suffix = ['th','st','nd','rd'][((day + 90) % 100 -10) % 10] || 'th';
    //   return `${date.toLocaleDateString('en-US', { month: 'long' })} ${day}${suffix}, ${date.getFullYear()}`;
    // }
        // Méthode pour formater la date avec suffixe ordinal en français
    formatDate(date: Date): string {
      const day = date.getDate();
      return `${day} ${date.toLocaleDateString('fr-FR', { month: 'long' })} ${date.getFullYear()}`;
    }
}
