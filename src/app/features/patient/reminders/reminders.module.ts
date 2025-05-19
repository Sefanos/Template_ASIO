import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    RemindersRoutingModule
  ]
})
export class RemindersModule { }
