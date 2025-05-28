import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DoctorsPlanningComponent } from './doctors-planning.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: DoctorsPlanningComponent }
    ])
  ]
})
export class DoctorsPlanningModule {}