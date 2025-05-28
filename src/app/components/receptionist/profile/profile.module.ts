import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Modules nécessaires
import { FormsModule } from '@angular/forms'; // ✅ Pour [(ngModel)]
import { ProfileRoutingModule } from './profile-routing.module';

// Composants standalone
import { ProfileComponent } from './profile.component'; // ✅ Import du composant standalone

@NgModule({
  imports: [
    CommonModule, // ✅ Fournit les directives Angular de base (ngIf, ngFor, etc.)
    FormsModule, // ✅ Nécessaire pour les formulaires et [(ngModel)]
    ProfileRoutingModule, // ✅ Gestion des routes spécifiques au module Profile
    ProfileComponent // ✅ Importation du composant standalone
  ],
  exports: [
    ProfileComponent // ✅ Permet d'utiliser ProfileComponent dans d'autres modules si nécessaire
  ]
})
export class ProfileModule { }