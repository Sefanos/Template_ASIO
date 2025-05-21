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
  email = ''; // Changed from username to email to match backend
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnRole();
    }
  }
  
  login() {
    this.error = '';
    this.loading = true;
    
    if (!this.email || !this.password) {
      this.error = 'Email and password are required';
      this.loading = false;
      return;
    }
    
    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        this.loading = false;
        console.log('Login successful for user:', user.email);
        this.redirectBasedOnRole();
      },
      error: (error) => {
        this.loading = false;
        console.error('Login error:', error);
        this.error = error.message || 'Invalid email or password';
      }
    });
  }
  
  private redirectBasedOnRole(): void {
    const role = this.authService.getUserRole();
    console.log('Redirecting based on role:', role);
    
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
        default:
          console.warn('Unknown role:', role);
          this.error = 'Invalid user role detected';
          // Force logout if the role is unrecognized
          this.authService.logout();
      }
    } catch (error) {
      console.error('Navigation error:', error);
      this.error = 'Error navigating to dashboard';
    }
  }
}
