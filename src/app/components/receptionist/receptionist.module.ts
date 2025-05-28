import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ReceptionistLayoutComponent } from './layout/receptionist-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DoctorsPlanningComponent } from './doctors-planning/doctors-planning.component';
// Remove direct import of MedicalRecordComponent
import { BillsComponent } from './bills/bills.component';
import { RemindersComponent } from './reminders/reminders.component';
import { ProfileComponent } from './profile/profile.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ReceptionistLayoutComponent,
    DashboardComponent,
    DoctorsPlanningComponent,
    BillsComponent,
    RemindersComponent,
    ProfileComponent,
    RouterModule.forChild([
      {
        path: '',
        component: ReceptionistLayoutComponent,
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: DashboardComponent },
          { path: 'doctors-planning', component: DoctorsPlanningComponent },
          // Use lazy loading for medical-record feature module
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