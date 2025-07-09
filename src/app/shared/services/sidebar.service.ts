import { Injectable } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

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

  /** Required permissions to view this menu item */
  permissions?: string[];
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
      icon: 'heart'
    },
    {
      label: 'Bills',
      route: '/patient/bills',
      icon: 'file-text'
    },
    // {
    //   label: 'Chat',
    //   route: '/patient/chat',
    //   icon: 'message-square' // Example: using a message-square icon for chat
    // },
    {
      label: 'Profile',
      route: '/patient/profile',
      icon: 'user'
    },
    {
      label: 'Reminders',
      route: '/patient/reminders',
      icon: 'bell'
    }
  ];

  private readonly receptionistMenu: SidebarItem[] = [
    {
      label: 'Dashboard',
      route: '/receptionist/dashboard',
      icon: 'grid'
    },
    {
      label: 'Patients',
      route: '/receptionist/medical-record',
      icon: 'users'
    },
    {
      label: 'Rendez-vous',
      route: '/receptionist/appointments',
      icon: 'calendar'
    },
    {
      label: 'Planning',
      route: '/receptionist/doctors-planning',
      icon: 'calendar'
    },
    {
      label: 'Factures',
      route: '/receptionist/bills',
      icon: 'file-text'
    },
    {
      label: 'Rappels',
      route: '/receptionist/reminders',
      icon: 'bell'
    },
    {
      label: 'Profil',
      route: '/receptionist/profile',
      icon: 'user'
    }
  ];

  constructor(private authService: AuthService) { }

  getMenuByRole(role: string): SidebarItem[] {
    let menuItems: SidebarItem[] = [];
    
    // Role-based menu selection
    switch (role?.toLowerCase()) {
      case 'admin':
        menuItems = this.adminMenu;
        break;
      case 'doctor':
        menuItems = this.doctorMenu;
        break;
      case 'patient':
        menuItems = this.patientMenu;
        break;
      case 'receptionist':
        menuItems = this.receptionistMenu;
        break;
      default:
        console.warn(`No menu defined for role: ${role}, defaulting to empty menu`);
        return [];
    }
    
    // Permission-based filtering
    return menuItems.filter(item => {
      if (!item.permissions || item.permissions.length === 0) {
        return true;
      }
      
      return this.authService.hasAnyPermission(item.permissions);
    });
  }

  getMenuByInterface(interfaceType: string): SidebarItem[] {
    let menuItems: SidebarItem[] = [];
    
    // Get menu based on interface, not role
    switch (interfaceType?.toLowerCase()) {
      case 'admin':
        menuItems = this.adminMenu;
        break;
      case 'doctor':
        menuItems = this.doctorMenu;
        break;
      case 'patient':
        menuItems = this.patientMenu;
        break;
      case 'receptionist':
        menuItems = this.receptionistMenu;
        break;
      default:
        console.warn(`No menu defined for interface: ${interfaceType}, defaulting to empty menu`);
        return [];
    }
    
    // Filter by permissions
    return this.filterMenuByPermissions(menuItems);
  }

  private filterMenuByPermissions(menuItems: SidebarItem[]): SidebarItem[] {
    return menuItems.filter(item => {
      if (!item.permissions || item.permissions.length === 0) {
        return true;
      }
      
      return this.authService.hasAnyPermission(item.permissions);
    });
  }

  getMenuTitle(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Admin Menu';
      case 'doctor':
        return 'Doctor Menu';
      case 'patient':
        return 'Patient Menu';
      case 'receptionist':
        return 'RÉCEPTIONNISTE MENU';
      default:
        return 'Navigation';
    }
  }

  // Also update the title method to work with interfaces
  getMenuTitleByInterface(interfaceType: string): string {
    switch (interfaceType?.toLowerCase()) {
      case 'admin':
        return 'Admin Menu';
      case 'doctor':
        return 'Doctor Menu';
      case 'patient':
        return 'Patient Menu';
      case 'receptionist':
        return 'RÉCEPTIONNISTE MENU';
      default:
        return 'Navigation';
    }
  }
}