import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  standalone: true,
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(-8px)' }),
        animate('150ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(-8px)' }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit {
  isDropdownOpen = false;
  userName: string = '';
  userEmail: string = '';
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Get current user details from auth service
    this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.userName = user.name || '';
        this.userEmail = user.email;
      }
    });
  }
  
  ngOnInit(): void {
    // Rien à initialiser ici
  }
  
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  
  closeDropdown(): void {
    this.isDropdownOpen = false;
  }
  
  logout(): void {
    this.authService.logout();
    this.closeDropdown();
  }
  
  navigateToProfile(): void {
    // Get user role and navigate to appropriate profile route
    const userRole = this.authService.getUserRole();
    switch (userRole) {
      case 'doctor':
        this.router.navigate(['/doctor/profile']);
        break;
      case 'patient':
        this.router.navigate(['/patient/profile']);
        break;
      case 'receptionist':
      case 'nurse':
        this.router.navigate(['/receptionist/profile']);
        break;
      case 'admin':
        // Admin might not have a dedicated profile, redirect to dashboard
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        // Fallback to login if role is unknown
        this.router.navigate(['/login']);
    }
    this.closeDropdown();
  }
}
