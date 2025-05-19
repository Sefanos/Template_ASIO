import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MedicalRecordRoutingModule } from './medical-record-routing.module';
import { MedicalRecordComponent } from './medical-record.component';
import { LabResultsComponent } from './components/lab-results/lab-results.component';
 
import { MedicalImagesComponent } from './components/medical-images/medical-images.component';
 
 
import { FormsModule } from '@angular/forms';
import { MedicalHistoryComponent } from './components/medical-history/medical-history.component';
import { PrescriptionListComponent } from './components/prescription-list/prescription-list.component';
 
@NgModule({
  declarations: [
     
    LabResultsComponent,
    MedicalImagesComponent,
    MedicalRecordComponent,
   
 PrescriptionListComponent,
    MedicalHistoryComponent,
   
  ],
   
  imports: [
    CommonModule,
    MedicalRecordRoutingModule,
    FormsModule,
   
   
]
})
export class MedicalRecordModule { }
