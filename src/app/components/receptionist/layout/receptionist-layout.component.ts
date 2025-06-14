import { Component, HostListener, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { SafeHtmlPipe } from './safe-html.pipe';
import { AuthService } from '../../../core/auth/auth.service';

// Animation fade pour les menus et modales
const fadeAnimation = trigger('fadeAnimation', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('200ms', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms', style({ opacity: 0 }))
  ])
]);

@Component({
  selector: 'app-layout',
  templateUrl: './receptionist-layout.component.html',
  styleUrls: ['./receptionist-layout.component.css'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    SafeHtmlPipe
  ],
  animations: [
    fadeAnimation
  ]
})
export class LayoutComponent implements OnInit {
  showLogoutModal = false;
  isSidebarCollapsed = false;
  showUserMenu = false;
  showNotifications = false;
  notificationCount = 3;
  showHelpModal = false;

  // Données utilisateur
  userName = 'Omar Bennani';
  userRole = 'Réceptionniste';
  userEmail = 'omar.bennani@asioclinic.com';
  userAvatar = 'assets/receptionist/images/pers.jpg';

  // Navigation items with badge counts
  navItems = [
    { route: 'dashboard', label: 'Dashboard', icon: 'dashboard', count: 0 },
    { route: 'appointments', label: 'Rendez-vous', icon: 'appointments', count: 5 },
    { route: 'doctors-planning', label: 'Planning', icon: 'planning', count: 0 },
    { route: 'medical-record', label: 'Patients', icon: 'patients', count: 2 },
    { route: 'bills', label: 'Factures', icon: 'bills', count: 0 },
    { route: 'reminders', label: 'Rappels', icon: 'reminders', count: 1 },
    { route: 'profile', label: 'Profil', icon: 'profile', count: 0 }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isSidebarCollapsed = window.innerWidth < 1024;
  }

  isActive(route: string): boolean {
    return this.router.url.endsWith('/' + route) || this.router.url === '/' + route;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotifications = false;
    }
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showUserMenu = false;
    }
  }

  openLogoutModal(): void {
    this.showLogoutModal = true;
    this.showUserMenu = false;
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  logout(): void {
    this.authService.logout();
    this.showLogoutModal = false;
    this.router.navigate(['/login']);
  }

  openHelpModal(): void {
    this.showHelpModal = true;
  }

  closeHelpModal(): void {
    this.showHelpModal = false;
  }

  getIcon(iconName: string): string {
    switch (iconName) {
      case 'dashboard':
        return `<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>`;
      case 'appointments':
        return `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>`;
      case 'planning':
        return `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>`;
      case 'patients':
        return `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`;
      case 'bills':
        return `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path>`;
      case 'reminders':
        return `<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>`;
      case 'profile':
        return `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>`;
      default:
        return '';
    }
  }
}