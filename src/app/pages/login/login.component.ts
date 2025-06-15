import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = ''; // Changé de username à email pour correspondre au backend
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Rediriger si déjà connecté
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnRole();
    }
  }
  
  login() {
    this.error = '';
    this.loading = true;
    
    if (!this.email || !this.password) {
      this.error = 'L\'email et le mot de passe sont requis';
      this.loading = false;
      return;
    }
    
    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        this.loading = false;
        console.log('Connexion réussie pour l\'utilisateur:', user.email);
        this.redirectBasedOnRole();
      },
      error: (error) => {
        this.loading = false;
        console.error('Erreur de connexion:', error);
        this.error = error.message || 'Email ou mot de passe invalide';
      }
    });
  }
  
  private redirectBasedOnRole(): void {
    const role = this.authService.getUserRole();
    console.log('Redirection basée sur le rôle:', role);
    
    try {
      switch (role) {
        case 'admin':
          this.router.navigate(['/admin/dashboard']);
          break;
        case 'doctor':
          this.router.navigate(['/doctor/dashboard']);
          break;
        case 'patient':
          this.router.navigate(['/patient/dashboard']);
          break;
        case 'nurse':
          this.router.navigate(['/receptionist/dashboard']);
          break;
        case 'receptionist':
          this.router.navigate(['/receptionist/dashboard']);
          break;
        default:
          console.warn('Rôle inconnu:', role);
          this.error = 'Rôle utilisateur invalide détecté';
          // Forcer la déconnexion si le rôle n'est pas reconnu
          this.authService.logout();
      }
    } catch (error) {
      console.error('Erreur de navigation:', error);
      this.error = 'Erreur lors de la navigation vers le tableau de bord';
    }
  }
}