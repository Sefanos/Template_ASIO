import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BillsRoutingModule } from './bills-routing.module';
import { BillsComponent } from './bills.component';
import { BillListComponent } from './components/bill-list/bill-list.component';

import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    BillsComponent,
    BillListComponent,
   
  ],
  imports: [
    CommonModule,
    BillsRoutingModule,
    FormsModule
  ]
})
export class BillsModule { }
