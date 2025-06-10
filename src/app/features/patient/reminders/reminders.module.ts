import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { RemindersRoutingModule } from './reminders-routing.module';
import { RemindersComponent } from './reminders.component';
import { ReminderListComponent } from './components/reminder-list/reminder-list.component';
import { ReminderDetailComponent } from './components/reminder-detail/reminder-detail.component';


@NgModule({
  declarations: [
    RemindersComponent,
    ReminderListComponent,
    ReminderDetailComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    RemindersRoutingModule
  ]
})
export class RemindersModule { }
