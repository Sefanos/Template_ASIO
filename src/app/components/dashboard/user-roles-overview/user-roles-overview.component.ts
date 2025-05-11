import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

interface RoleData {
  type: string;
  count: number;
  icon: string;
  color: string;
  bgColor: string;
  details?: string;
}

@Component({
  selector: 'app-user-roles-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-roles-overview.component.html'
})
export class UserRolesOverviewComponent implements OnInit {
  roles: RoleData[] = [];
  totalUsers: number = 0;
  
  // Configuration for role display
  roleConfigs: {[key: string]: {icon: string, color: string, bgColor: string}} = {
    doctor: { 
      icon: 'stethoscope', 
      color: '#5CBA99', // status-success
      bgColor: 'rgba(92, 186, 153, 0.1)'
    },
    patient: { 
      icon: 'user', 
      color: '#2C6EAA', // primary
      bgColor: 'rgba(44, 110, 170, 0.1)'
    },
    nurse: { 
      icon: 'syringe', 
      color: '#6098D3', // status-info
      bgColor: 'rgba(96, 152, 211, 0.1)'
    },
    receptionist: { 
      icon: 'desktop', 
      color: '#F0B86C', // status-warning
      bgColor: 'rgba(240, 184, 108, 0.1)'
    },
    admin: { 
      icon: 'shield', 
      color: '#E05C5C', // status-urgent
      bgColor: 'rgba(224, 92, 92, 0.1)'
    },
    // Default style for any future roles
    'default': { 
      icon: 'user-circle', 
      color: '#8096A7', // text-muted
      bgColor: 'rgba(128, 150, 167, 0.1)'
    }
  };
  
  constructor() {}
  
  ngOnInit(): void {
    this.loadRoleData();
  }
  
  loadRoleData(): void {
    // This would be replaced with an API call
    // this.userService.getRoleCounts().subscribe(data => {...})
    
    // Generate sample data - in a real app, this would come from the API
    const sampleData = [
      { type: 'doctor', count: 28, details: '12 Specialists, 16 General' },
      { type: 'patient', count: 752, details: '425 Active, 327 Archive' },
      { type: 'nurse', count: 17, details: '12 Full-time, 5 Part-time' },
      { type: 'receptionist', count: 8, details: '3 Front Desk, 5 Call Center' },
      { type: 'admin', count: 3, details: 'System Administrators' },
      // Uncomment to test with additional role types
      // { type: 'technician', count: 5, details: 'Lab Technicians' }
    ];
    
    this.roles = sampleData.map(role => {
      const config = this.roleConfigs[role.type] || this.roleConfigs['default'];
      return {
        ...role,
        icon: config.icon,
        color: config.color,
        bgColor: config.bgColor
      };
    });
    
    this.totalUsers = this.roles.reduce((sum, role) => sum + role.count, 0);
  }
  
  // Calculate percentage of total users
  getPercentage(count: number): number {
    return Math.round((count / this.totalUsers) * 100);
  }
  
  // Get classes for progress bar
  getProgressStyle(count: number): Object {
    const percentage = this.getPercentage(count);
    return { width: `${percentage}%` };
  }
  
  // Get icon based on role
  getIconClass(icon: string): string {
    return `fas fa-${icon}`;
  }
}