import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MedicalRecordComponent } from './medical-record.component';

// ✅ Importe le composant sans le déclarer
@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: MedicalRecordComponent }
    ])
  ]
})
export class MedicalRecordModule {}