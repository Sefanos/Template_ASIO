import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatientMainRoutingModule } from './patient-main-routing.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { BillsModule } from './bills/bills.module';
import { ChatModule } from './chat/chat.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MedicalRecordModule } from './medical-record/medical-record.module';
import { ProfileModule } from './profile/profile.module';
import { RemindersModule } from './reminders/reminders.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    PatientMainRoutingModule,
    AppointmentsModule,
    BillsModule,
    ChatModule,
    DashboardModule,
    MedicalRecordModule,
    ProfileModule,
    RemindersModule,
    FormsModule
  ]
})
export class PatientMainModule { }
