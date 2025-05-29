import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { RoleGuard } from './core/auth/role.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { DashboardComponent as adminDashboard } from './pages/admin_pages/dashboard/dashboard.component';
import { RolePageComponent } from './pages/admin_pages/role-page/role-page.component';
import { RolesComponent } from './pages/admin_pages/roles/roles.component';
import { UserPageComponent } from './pages/admin_pages/user-page/user-page.component';
import { UsersComponent } from './pages/admin_pages/users/users.component';
import { AiDiagnosticComponent } from './pages/doc_pages/ai-diagnostic/ai-diagnostic.component';
import { AppointmentCalendarComponent } from './pages/doc_pages/appointment-calendar/appointment-calendar.component';
import { DashboardComponent as docDashboard } from './pages/doc_pages/dashboard/dashboard.component';
import { PatientManagementComponent } from './pages/doc_pages/patient-management/patient-management.component';
import { PatientRecordComponent } from './pages/doc_pages/patient-record/patient-record.component';
import { PrescriptionComponent } from './pages/doc_pages/prescription/prescription.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'doctor',
    component: MainLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['doctor'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: docDashboard },
      { path: 'patients', component: PatientManagementComponent },
      { path: 'calendar', component: AppointmentCalendarComponent },
      { path: 'patient/:id', component: PatientRecordComponent },
      { path: 'prescription', component: PrescriptionComponent },
      { path: 'ai-diagnostic', component: AiDiagnosticComponent },
    ]
  },  {
    path: 'admin',
    component: MainLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: adminDashboard },
      { path: 'users', component: UsersComponent },
      { path: 'users/new', component: UserPageComponent },
      { path: 'users/:id', component: UserPageComponent },
      { path: 'user-page/:id', component: UserPageComponent },
      { path: 'roles', component: RolesComponent },
      { path: 'role/:id', component: RolePageComponent }
    ]
  },
  {
    path: 'patient',
    component: MainLayoutComponent,
    loadChildren: () => import('./features/patient/patient-main.module').then(m => m.PatientMainModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['patient'] }
  },
    {
    path: 'receptionist',
    loadChildren: () => import('./components/receptionist/receptionist.module').then(m => m.ReceptionistModule),
    //canActivate: [AuthGuard, RoleGuard],
    //data: { roles: ['receptionist'] }
  }
];
