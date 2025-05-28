import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { RemindersComponent } from './reminders.component';

// ✅ Route par défaut pour ce module
const routes: Routes = [
  { path: '', component: RemindersComponent }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes) // ✅ Pour charger les routes enfants
  ]
})
export class RemindersModule {}