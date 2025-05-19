import { Component } from '@angular/core';

@Component({
  selector: 'app-reminders',
  standalone: false,
  templateUrl: './reminders.component.html',
  styleUrl: './reminders.component.css'
})
export class RemindersComponent {
  reminders = [
    { message: 'Prendre vos médicaments', date: '2025-04-24' },
    { message: 'Rendez-vous demain à 10h', date: '2025-04-25' }
  ];
  
}
