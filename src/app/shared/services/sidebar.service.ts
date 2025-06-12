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
    },
    {
      label: 'Financial Dashboard',
      route: '/admin/financial-dashboard',
      icon: 'financial-dashboard'
    },
    {
      label: 'Bills Management',
      route: '/admin/bills-managment',
      icon: 'file-text'
    }
  ];

  private readonly patientMenu: SidebarItem[] = [
    {
      label: 'Dashboard',
      route: '/patient/dashboard',
      icon: 'grid'
    },
    {
      label: 'Appointments',
      route: '/patient/appointments',
      icon: 'calendar'
    },
    {
      label: 'Medical Record',
      route: '/patient/medical-record',
      icon: 'heart' // Consider a different icon if 'heart' is too doctor-specific
    },
    {
      label: 'Bills',
      route: '/patient/bills',
      icon: 'file-text' // Example: using a file-text icon for bills
    },
    {
      label: 'Chat',
      route: '/patient/chat',
      icon: 'message-square' // Example: using a message-square icon for chat
    },
    {
      label: 'Profile',
      route: '/patient/profile',
      icon: 'user' // Example: using a user icon for profile
    },
    {
      label: 'Reminders',
      route: '/patient/reminders',
      icon: 'bell' // Example: using a bell icon for reminders
    }
  ];

  constructor() { }

  getMenuByRole(role: string): SidebarItem[] {
    switch (role?.toLowerCase()) {
      case 'admin':
        return this.adminMenu;
      case 'doctor':
        return this.doctorMenu;
      case 'patient':
        return this.patientMenu;
      default:
        console.warn(`No menu defined for role: ${role}, defaulting to empty menu`);
        return []; // Return empty array for unknown roles
    }
  }

  getMenuTitle(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Admin Menu';
      case 'doctor':
        return 'Doctor Menu';
      case 'patient':
        return 'Patient Menu';
      default:
        return 'Navigation';
    }
  }
}
