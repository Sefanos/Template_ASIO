import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppointmentsRoutingModule } from './appointments-routing.module';
import { AppointmentsComponent } from './appointments.component';
 
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular'; 
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { BookAppointmentComponent } from './components/book-appointment/book-appointment.component';
import { AppointmentHistoryComponent } from './components/appointment-history/appointment-history.component';
 
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { FlexLayoutModule } from '@angular/flex-layout';
import { SharedCalendarComponent } from './components/shared-calendar/shared-calendar.component';



@NgModule({
  declarations: [
    AppointmentsComponent,
 
    BookAppointmentComponent,
    AppointmentHistoryComponent,
    SharedCalendarComponent,
     
  ],
  imports: [
    CommonModule,
    RouterModule,
    AppointmentsRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    // Angular Material
    FullCalendarModule

]
})
export class AppointmentsModule { 


  
}
