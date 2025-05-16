import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}  async login() {
    this.error = '';
    this.loading = true;
    console.log('Login attempt with:', this.username);

    if (!this.username || !this.password) {
      this.error = 'Username and password are required';
      this.loading = false;
      return;
    }

    try {
      const success = await this.authService.login(this.username, this.password);
      console.log('Login success:', success);
      
      if (success) {
        const role = this.authService.getUserRole();
        console.log('Detected user role:', role);
        
        // Remove the timeout causing potential issues
        if (role === 'doctor') {
          console.log('Navigating to doctor dashboard');
          this.loading = false;
          this.router.navigate(['/doctor/dashboard']).catch(err => {
            console.error('Navigation error:', err);
            this.error = 'Navigation error';
            this.loading = false;
          });
        } else if (role === 'admin') {
          console.log('Navigating to admin dashboard');
          this.loading = false;
          this.router.navigate(['/admin/dashboard']).catch(err => {
            console.error('Navigation error:', err);
            this.error = 'Navigation error';
            this.loading = false;
          });
        } else {
          console.warn('Unknown role, defaulting to login page');
          this.error = 'Invalid role detected';
          this.loading = false;
        }
      } else {
        this.error = 'Invalid username or password';
        this.loading = false;
      }
    } catch (e) {
      this.error = 'An error occurred during login';
      console.error('Login error:', e);
      this.loading = false;
    }
  }
}
