import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Role } from '../../../../models/analytics.model';
import { AnalyticsService } from '../../../../services/analytics.service';

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
  imports: [CommonModule, RouterModule],
  templateUrl: './user-roles-overview.component.html'
})
export class UserRolesOverviewComponent implements OnInit, OnDestroy {
  roles: RoleData[] = [];
  totalUsers: number = 0;
  loading = true;
  error: string | null = null;
  lastUpdated: Date | null = null;
  
  private subscription = new Subscription();
  
  // Configuration for role display
  roleConfigs: {[key: string]: {icon: string, color: string, bgColor: string}} = {
    admin: { 
      icon: 'shield', 
      color: '#E05C5C', // status-urgent
      bgColor: 'rgba(224, 92, 92, 0.1)'
    },
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
    // Default style for any future roles
    'default': { 
      icon: 'user-circle', 
      color: '#8096A7', // text-muted
      bgColor: 'rgba(128, 150, 167, 0.1)'
    }
  };
  
  constructor(private analyticsService: AnalyticsService) {}
  
  ngOnInit(): void {
    this.loadRoleData();
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  /**
   * Load role data from API
   */
  loadRoleData(forceRefresh: boolean = false): void {
    this.loading = true;
    this.error = null;
    
    this.subscription.add(
      this.analyticsService.getRoleStats(forceRefresh).subscribe({
        next: (response) => {
          if (response.success) {
            this.processRoleData(response.data.roles);
            this.totalUsers = response.data.total_assigned;
            this.lastUpdated = new Date();
          } else {
            this.error = response.message || 'Failed to load role statistics';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading role statistics:', error);
          this.error = error.message || 'Could not load role data. Please try again.';
          this.loading = false;
        }
      })
    );
  }
  
  /**
   * Process API role data into the format required by the UI
   */
  processRoleData(apiRoles: Role[]): void {
    this.roles = apiRoles.map(role => {
      const config = this.roleConfigs[role.code.toLowerCase()] || this.roleConfigs['default'];
      return {
        type: role.name,
        count: role.users_count,
        icon: config.icon,
        color: config.color,
        bgColor: config.bgColor,
        details: `${role.permissions_count} permissions`
      };
    });
    
    // Sort roles by count (descending)
    this.roles.sort((a, b) => b.count - a.count);
  }
  
  /**
   * Manually refresh data
   */
  refreshData(): void {
    if (this.loading) return;
    this.loadRoleData(true);
  }
  
  /**
   * Format the last updated time
   */
  formatLastUpdated(): string {
    return this.lastUpdated ? this.lastUpdated.toLocaleTimeString() : 'N/A';
  }
  
  /**
   * Calculate percentage of total users
   */
  getPercentage(count: number): number {
    return this.totalUsers ? Math.round((count / this.totalUsers) * 100) : 0;
  }
  
  /**
   * Get classes for progress bar
   */
  getProgressStyle(count: number): Object {
    const percentage = this.getPercentage(count);
    return { width: `${percentage}%` };
  }
  
  /**
   * Get icon based on role
   */
  getIconClass(icon: string): string {
    return `fas fa-${icon}`;
  }
}