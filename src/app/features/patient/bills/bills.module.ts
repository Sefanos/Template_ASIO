import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BillsRoutingModule } from './bills-routing.module';
import { BillsComponent } from './bills.component';
import { BillListComponent } from './components/bill-list/bill-list.component';

import { FormsModule } from '@angular/forms';
import { BillDetailComponent } from './components/bill-detail/bill-detail.component';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [
    BillsComponent,
    BillListComponent,
    BillDetailComponent
  ],
  
  imports: [
    CommonModule,
    BillsRoutingModule,
    FormsModule,
    HttpClientModule
  ]
})
export class BillsModule { }
