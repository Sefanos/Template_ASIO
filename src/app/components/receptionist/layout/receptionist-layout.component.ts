import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-receptionist-layout',
  templateUrl: './receptionist-layout.component.html',
  styleUrls: ['./receptionist-layout.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class ReceptionistLayoutComponent {
  showLogoutModal = false;

  constructor(private router: Router) {}

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  openLogoutModal(): void {
    this.showLogoutModal = true;
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  logout(): void {
    // Handle logout logic
    this.router.navigate(['/login']);
  }
}