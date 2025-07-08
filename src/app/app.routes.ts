import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { InterfaceGuard } from './core/auth/interface.guard'; // Add this import
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { BillsManagmentComponent } from './pages/admin_pages/bills-managment/bills-managment.component';
import { DashboardComponent as adminDashboard } from './pages/admin_pages/dashboard/dashboard.component';
import { FinancialDashboardComponent } from './pages/admin_pages/financial-dashboard/financial-dashboard.component';
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
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'booking',
    loadComponent: () => import('./pages/public-booking/public-booking.component').then(m => m.PublicBookingComponent)
  },
  {
    path: 'doctor',
    component: MainLayoutComponent,
    canActivate: [AuthGuard, InterfaceGuard], // Replace RoleGuard with InterfaceGuard
    data: { interface: 'doctor' }, // Use interface instead of roles
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: docDashboard },      
      { path: 'patients', component: PatientManagementComponent },
      { path: 'calendar', component: AppointmentCalendarComponent },
      // { path: 'patient/:id', component: PatientRecordComponent },
      { path: 'patient-record/:patientId', component: PatientRecordComponent, data: { breadcrumb: 'Patient Record' } },
      { path: 'prescription', component: PrescriptionComponent },
      { path: 'ai-diagnostic', component: AiDiagnosticComponent },
      { path: 'profile', loadComponent: () => import('./pages/doc_pages/doctor-profile/doctor-profile.component').then(m => m.DoctorProfileComponent) },
    ]
  },  {
    path: 'admin',
    component: MainLayoutComponent,
    canActivate: [AuthGuard, InterfaceGuard],
    data: { interface: 'admin' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: adminDashboard },
      { path: 'users', component: UsersComponent },
      { path: 'users/new', component: UserPageComponent },
      { path: 'users/:id', component: UserPageComponent },
      { path: 'user-page/:id', component: UserPageComponent },
      { path: 'roles', component: RolesComponent },
      { path: 'role/:id', component: RolePageComponent },
      { path: 'financial-dashboard', component: FinancialDashboardComponent },
      { path: 'bills-managment', component: BillsManagmentComponent }
    ]
  },
  {
    path: 'patient',
    component: MainLayoutComponent,
    loadChildren: () => import('./features/patient/patient-main.module').then(m => m.PatientMainModule),
    canActivate: [AuthGuard, InterfaceGuard],
    data: { interface: 'patient' }
  },
    {
    path: 'receptionist',
    loadChildren: () => import('./components/receptionist/receptionist.module').then(m => m.ReceptionistModule),
    canActivate: [AuthGuard, InterfaceGuard],
    data: { interface: 'receptionist' }
  }
];
