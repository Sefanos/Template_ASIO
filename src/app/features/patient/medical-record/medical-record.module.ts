import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MedicalRecordRoutingModule } from './medical-record-routing.module';
import { MedicalRecordComponent } from './medical-record.component';
import { LabResultsComponent } from './components/lab-results/lab-results.component';
 import {PatientFilesComponent} from './components/patient-files/patient-files.component';
import { MedicalHistoryComponent } from './components/medical-history/medical-history.component';
import { PrescriptionListComponent } from './components/prescription-list/prescription-list.component';
// import { NotesComponent } from './components/notes/notes.component';
import { VitalSignsComponent } from './components/vital-signs/vital-signs.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
//import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // Requis par ngx-charts
import { NotesComponent } from './components/notes/notes.component';
@NgModule({
  declarations: [
    MedicalRecordComponent,
    LabResultsComponent,
    PatientFilesComponent,
    PrescriptionListComponent,
    MedicalHistoryComponent,
   
   VitalSignsComponent,
    NotesComponent
  ],
  imports: [
    CommonModule,
    MedicalRecordRoutingModule,
    FormsModule,
      NgxChartsModule,

      
 
    ReactiveFormsModule

  ]

  
})
export class MedicalRecordModule { }