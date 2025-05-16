import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit {
  userRole: string = '';
  sidebarCollapsed: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    try {
      // Get the current user role
      const role = this.authService.getUserRole();
      if (role) {
        console.log('MainLayoutComponent: Setting user role:', role);
        this.userRole = role;
      } else {
        console.warn('MainLayoutComponent: No user role found');
        this.userRole = '';
      }
    } catch (error) {
      console.error('MainLayoutComponent: Error getting user role:', error);
      this.userRole = '';
    }
  }
}
