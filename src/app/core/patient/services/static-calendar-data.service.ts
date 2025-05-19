import { Injectable } from '@angular/core';
import { MyCalendarEvent } from '../domain/models/calendar-event.model';

@Injectable({
  providedIn: 'root'
})
export class StaticCalendarDataService {

  constructor() { }
  getStaticAppointments(): MyCalendarEvent[] {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    return [
      {
        id: '1',
        title: 'Réunion équipe A',
        start: new Date(currentYear, currentMonth, today.getDate(), 10, 0), // Aujourd'hui 10:00
        end: new Date(currentYear, currentMonth, today.getDate(), 11, 0),   // Aujourd'hui 11:00
        extendedProps: { resourceId: 'doctorSarah', description: 'Discussion projet X', status: 'Confirmed' }
      },
      {
        id: '2',
        title: 'Consultation Patient Y',
        start: new Date(currentYear, currentMonth, today.getDate() + 1, 14, 0), // Demain 14:00
        end: new Date(currentYear, currentMonth, today.getDate() + 1, 14, 45),
        extendedProps: { resourceId: 'doctorJohn', description: 'Suivi médical', status: 'Pending' }
      },
      {
        id: '3',
        title: 'Formation Interne',
        start: new Date(currentYear, currentMonth, today.getDate() - 1), // Hier (toute la journée)
        allDay: true,
        extendedProps: { resourceId: 'nurseCarol', status: 'Completed' }
      },
      // ... plus d'événements
      // Exemple pour correspondre à l'image (Octobre 2020)
      {
        id: 'bryntum1',
        title: 'Hackathon 2020',
        start: '2020-10-11',
        end: '2020-10-18', // Événement sur plusieurs jours
        backgroundColor: 'green',
        borderColor: 'green',
        extendedProps: { resourceId: 'doctorSarah', description: 'Hackathon annuel' }
      },
      {
        id: 'bryntum2',
        title: 'Relax and official...',
        start: '2020-10-11T10:00:00',
        end: '2020-10-11T12:00:00',
        backgroundColor: 'red',
        borderColor: 'red',
        extendedProps: { resourceId: 'doctorJohn' }
      },
      { title: 'Breakfast', start: '2020-10-12T09:00:00', extendedProps: { resourceId: 'nurseCarol' }, backgroundColor: '#f9e79f', textColor: '#333', borderColor: '#f9e79f' },
      { title: 'Team Scrum', start: '2020-10-12T10:00:00', extendedProps: { resourceId: 'doctorSarah' }, backgroundColor: '#aed6f1', textColor: '#333', borderColor: '#aed6f1' },
      // ... ajoutez d'autres événements de l'image pour tester
    ];
  }
}
