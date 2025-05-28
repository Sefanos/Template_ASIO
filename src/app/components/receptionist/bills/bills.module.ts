import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Routes du module
import { BillsRoutingModule } from './bills-routing.module';

// Composants
import { BillsComponent } from './bills.component';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    BillsRoutingModule
  ]
})
export class BillsModule { }