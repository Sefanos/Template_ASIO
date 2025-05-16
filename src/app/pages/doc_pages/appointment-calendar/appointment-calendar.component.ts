import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarContainerComponent } from '../../../components/doc_components/calendar/calendar-container/calendar-container.component';

@Component({
  selector: 'app-appointment-calendar',
  standalone: true,
  imports: [CommonModule, CalendarContainerComponent],
  template: `
    <div class="container mx-auto p-4">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-text mb-1">Appointment Calendar</h1>
        <p class="text-text-light">Manage and schedule patient appointments</p>
      </div>
      
      <app-calendar-container></app-calendar-container>
    </div>
  `,
})
export class AppointmentCalendarComponent {
  // The calendar logic is now handled by the standalone calendar components
}
