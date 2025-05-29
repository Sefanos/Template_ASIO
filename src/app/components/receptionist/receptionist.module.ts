import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DashboardComponent } from './dashboard/dashboard.component';
import { DoctorsPlanningComponent } from './doctors-planning/doctors-planning.component';
import { BillsComponent } from './bills/bills.component';
import { RemindersComponent } from './reminders/reminders.component';
import { ProfileComponent } from './profile/profile.component';
import { LayoutComponent } from './layout/receptionist-layout.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutComponent,
    DashboardComponent,
    DoctorsPlanningComponent,
    BillsComponent,
    RemindersComponent,
    ProfileComponent,
    RouterModule.forChild([
      {
        path: '',
        component: LayoutComponent,
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: DashboardComponent },
          { path: 'appointments', loadComponent: () => import('./appointments/appointments.component').then(m => m.AppointmentsComponent) },
          { path: 'doctors-planning', component: DoctorsPlanningComponent },
          { 
            path: 'medical-record', 
            loadChildren: () => import('./medical-record/medical-record.module').then(m => m.MedicalRecordModule) 
          },
          { path: 'bills', component: BillsComponent },
          { path: 'reminders', component: RemindersComponent },
          { path: 'profile', component: ProfileComponent }
        ]
      }
    ])
  ]
})
export class ReceptionistModule { }