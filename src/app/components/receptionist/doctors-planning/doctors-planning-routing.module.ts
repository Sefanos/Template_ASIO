import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DoctorsPlanningComponent } from './doctors-planning.component';

const routes: Routes = [{ path: '', component: DoctorsPlanningComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DoctorsPlanningRoutingModule { }
