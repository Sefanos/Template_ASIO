import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../layouts/header/header.component';
import { SidebarComponent } from '../../../layouts/sidebar/sidebar.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-receptionist-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './receptionist-layout.component.html',
  styleUrl: './receptionist-layout.component.css'
})
export class ReceptionistLayoutComponent implements OnInit {
  userRole: string = 'receptionist';
  sidebarCollapsed: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    try {
      // Get the current user role from auth service
      const role = this.authService.getUserRole();
      if (role) {
        console.log('ReceptionistLayoutComponent: Setting user role:', role);
        this.userRole = role;
      } else {
        console.warn('ReceptionistLayoutComponent: No user role found, defaulting to receptionist');
      }
    } catch (error) {
      console.error('ReceptionistLayoutComponent: Error getting user role:', error);
    }
  }
}