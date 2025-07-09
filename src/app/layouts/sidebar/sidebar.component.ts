import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { SidebarItem, SidebarService } from '../../shared/services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers: [SidebarService],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  @Input() role: string = '';
  @Output() collapsedChange = new EventEmitter<boolean>();
  
  menuItems: SidebarItem[] = [];
  menuTitle: string = 'Navigation';
  isCollapsed: boolean = false;
  
  // Icon map for SVG content - predefined to avoid recalculating during render
  private iconMap: { [key: string]: string } = {
    'grid': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    'users': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    'calendar': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    'heart': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>`,
    'help-circle': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    'shield': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    'file-text': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    'message-square': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    'user': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    'bell': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
    'log-out': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
    'chevron-left': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
    'chevron-right': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
    'financial-dashboard': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M3 3v18h18V3H3zm6 14H5v-2h4v2zm0-4H5v-2h4v2zm0-4H5V7h4v2zm6 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V7h4v2z"></path></svg>`,
    'fiancial': '<svg width="1em" height="1em" viewBox="0 0 448 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"> M500 416h-24V80c0-26.5-21.5-48-48-48H80c-26.5 0-48 21.5-48 48v336H8c-4.4 0-8 3.6-8 8v16c0 13.3 10.7 24 24 24h464c13.3 0 24-10.7 24-24v-16c0-4.4-3.6-8-8-8zM80 80h352v336H80V80zm96 272c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16V208c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v144zm96 0c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v208zm96 0c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16V272c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v80z'
  };
  
  // Pre-sanitize SVG icons to improve performance
  private sanitizedIcons: { [key: string]: SafeHtml } = {};
  
  constructor(
    private sidebarService: SidebarService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}
  ngOnInit(): void {
    // Pre-sanitize all icons on component initialization to avoid doing it on render
    for (const [key, value] of Object.entries(this.iconMap)) {
      this.sanitizedIcons[key] = this.sanitizer.bypassSecurityTrustHtml(value);
    }
    
    // Use interface instead of role
    this.loadMenu();
  }

  loadMenu(): void {
    try {
      // Get the interface from the auth service instead of using the role input
      const userInterface = this.authService.getUserInterface();
      
      if (!userInterface) {
        this.menuItems = [];
        this.menuTitle = 'Navigation';
        return;
      }
      
      // Use getMenuByInterface instead of getMenuByRole
      this.menuItems = this.sidebarService.getMenuByInterface(userInterface);
      this.menuTitle = this.sidebarService.getMenuTitleByInterface(userInterface);
    } catch (error) {
      console.error('Error loading menu:', error);
      this.menuItems = [];
      this.menuTitle = 'Navigation';
    }
  }
    getSanitizedSvgIcon(iconName: string): SafeHtml {
    // Return pre-sanitized icon from cache instead of sanitizing on each render
    if (!iconName || !this.sanitizedIcons[iconName]) {
      return this.sanitizedIcons['placeholder'] || 
        (this.sanitizedIcons['placeholder'] = 
          this.sanitizer.bypassSecurityTrustHtml('<svg class="h-5 w-5" viewBox="0 0 24 24"></svg>'));
    }
    
    return this.sanitizedIcons[iconName];
  }  toggleSidebar(): void {
    // Add a small delay to allow CSS transitions to complete properly
    document.body.classList.add('sidebar-transitioning');
    this.isCollapsed = !this.isCollapsed;
    this.collapsedChange.emit(this.isCollapsed);
    
    // Remove transitioning class after animation completes
    setTimeout(() => {
      document.body.classList.remove('sidebar-transitioning');
    }, 300);
  }
  
  logout(): void {
    this.authService.logout();
  }
}