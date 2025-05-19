import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { ProfileViewComponent } from './components/profile-view/profile-view.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { ProfileSecurityComponent } from './components/profile-security/profile-security.component';

const routes: Routes = [
  { 
    path: '', 
    component: ProfileComponent,
    children: [
      { path: '', redirectTo: 'view', pathMatch: 'full' },
      { path: 'view', component: ProfileViewComponent },
      { path: 'edit', component: ProfileEditComponent },
      { path: 'security', component: ProfileSecurityComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule { }
