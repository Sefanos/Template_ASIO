import { Injectable } from '@angular/core';

/**
 * Interface for sidebar menu items
 */
export interface SidebarItem {
  /** Display text for the menu item */
  label: string;
  
  /** Route to navigate to when clicked */
  route: string;
  
  /** Icon identifier */
  icon: string;
  
  /** Optional badge text to display */
  badge?: string;
  
  /** Badge color */
  badgeColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  
  /** Whether this item is active */
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private readonly doctorMenu = [
    {
      label: 'Dashboard',
      route: '/doctor/dashboard',
      icon: 'grid'
    },
    {
      label: 'Patients',
      route: '/doctor/patients',
      icon: 'users'
    },
    {
      label: 'Calendar',
      route: '/doctor/calendar',
      icon: 'calendar'
    },
    {
      label: 'Prescriptions',
      route: '/doctor/prescription',
      icon: 'heart'
    },
    {
      label: 'AI Assistant',
      route: '/doctor/ai-diagnostic',
      icon: 'help-circle'
    }
  ];

  private readonly adminMenu = [
    {
      label: 'Dashboard',
      route: '/admin/dashboard',
      icon: 'grid'
    },
    {
      label: 'Users List',
      route: '/admin/users',
      icon: 'users'
    },
    {
      label: 'Roles & Permissions',
      route: '/admin/roles',
      icon: 'shield'
    }
  ];

  constructor() { }

  getMenuByRole(role: string): SidebarItem[] {
    switch (role?.toLowerCase()) {
      case 'admin':
        return this.adminMenu;
      case 'doctor':
        return this.doctorMenu;
      default:
        console.warn(`No menu defined for role: ${role}, defaulting to doctor menu`);
        return this.doctorMenu;
    }
  }

  getMenuTitle(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Admin Menu';
      case 'doctor':
        return 'Doctor Menu';
      default:
        return 'Navigation';
    }
  }
}
