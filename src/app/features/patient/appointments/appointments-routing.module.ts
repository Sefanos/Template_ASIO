import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentsComponent } from './appointments.component';
 

const routes: Routes = [
  { path: '',
   component: AppointmentsComponent,
  children: [
    { path: '', redirectTo: 'list', pathMatch: 'full' },
    // { path: 'list', component: AppointmentListComponent },
    // { path: 'create', component: AppointmentCreateComponent },
    // { path: 'detail/:id', component: AppointmentDetailComponent }
  ]
 }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppointmentsRoutingModule { }
