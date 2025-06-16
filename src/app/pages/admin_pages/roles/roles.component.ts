import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, Subject, Subscription } from 'rxjs';
import { Role } from '../../../models/role.model';
import { PaginatedRolesResponse, RoleService } from '../../../services/admin-service/role.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html'
})
export class RolesComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  roles: Role[] = [];
  showDeleteConfirmation = false;
  roleToDelete: Role | null = null;
  loading = false;
  
  // System roles that should be listed first and protected
  systemRoles: string[] = ['admin', 'nurse', 'receptionist', 'doctor'];
  
  // Pagination variables
  currentPage = 1;
  pageSize = 15;
  totalItems = 0;
  totalPages = 0;
  maxPagesToShow = 5;
  
  // Sorting
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];
  
  constructor(
    private roleService: RoleService,
    private router: Router,
    private toastService: ToastService
  ) {}
  
  ngOnInit(): void {
    this.loadRoles();
    this.setupSubscriptions();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  private setupSubscriptions(): void {
    // Subscribe to role changes from service
    const roleChangedSub = this.roleService.roleChanged.subscribe(() => {
      console.log('Role changed event received, refreshing data');
      this.loadRoles();
    });
    this.subscriptions.push(roleChangedSub);
    
    // Setup search debouncing
    const searchSub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadRoles();
    });
    this.subscriptions.push(searchSub);
    
    // Listen for navigation events
    const routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url.includes('/admin/roles')) {
        console.log('Detected navigation to roles page, refreshing data');
        this.loadRoles();
      }
    });
    this.subscriptions.push(routerSub);
  }
  
  /**
   * Load roles data (always fresh)
   */
  loadRoles(): void {
    this.loading = true;
    console.log('Loading roles with params:', {
      page: this.currentPage,
      perPage: this.pageSize,
      search: this.searchQuery,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    });
    
    this.roleService.getRoles(
      this.currentPage,
      this.pageSize,
      this.searchQuery,
      this.sortBy,
      this.sortDirection
    ).subscribe({
      next: (response: PaginatedRolesResponse) => {
        this.handleRolesResponse(response);
      },
      error: (error) => this.handleRolesError(error)
    });
  }
  
  /**
   * Force refresh roles data
   */
  refreshRoles(showToast: boolean = true): void {
    console.log('Manual refresh triggered');
    this.roleService.clearAllRoleCaches();
    this.loadRoles();
    
    if (showToast) {
      this.toastService.success('Roles data refreshed');
    }
  }
  
  // Helper method to handle roles response
  private handleRolesResponse(response: PaginatedRolesResponse): void {
    console.log('API response:', response);
    this.roles = response.items;
    this.totalItems = response.pagination.total;
    this.totalPages = response.pagination.total_pages;
    this.currentPage = response.pagination.current_page;
    this.pageSize = response.pagination.per_page;
    this.loading = false;
    
    console.log(`Loaded ${this.roles.length} roles`);
  }
  
  // Helper method to handle roles error
  private handleRolesError(error: any): void {
    console.error('Error loading roles:', error);
    this.roles = [];
    this.loading = false;
    this.toastService.error('Failed to load roles. Please try again.');
  }
  
  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }
  
  // Get roles with system roles listed first
  get paginatedRoles(): Role[] {
    if (!this.roles || this.roles.length === 0) {
      return [];
    }
    
    const sortedRoles = [...this.roles];
    
    return sortedRoles.sort((a, b) => {
      const aIsSystem = this.isSystemRole(a);
      const bIsSystem = this.isSystemRole(b);
      
      if (aIsSystem === bIsSystem) {
        if (aIsSystem) {
          const aIndex = this.getSystemRoleIndex(a);
          const bIndex = this.getSystemRoleIndex(b);
          return aIndex - bIndex;
        }
        return a.name.localeCompare(b.name);
      }
      
      return aIsSystem ? -1 : 1;
    });
  }
  
  // Check if a role is a system role
  isSystemRole(role: Role): boolean {
    if (!role || !role.name) return false;
    const lowercaseName = role.name.toLowerCase();
    return this.systemRoles.some(sr => lowercaseName === sr || lowercaseName.includes(sr));
  }
  
  // Get the index of a system role for ordering
  private getSystemRoleIndex(role: Role): number {
    if (!role || !role.name) return 999;
    
    const lowercaseName = role.name.toLowerCase();
    for (let i = 0; i < this.systemRoles.length; i++) {
      if (lowercaseName === this.systemRoles[i] || lowercaseName.includes(this.systemRoles[i])) {
        return i;
      }
    }
    return 999;
  }
  
  get pagesToShow(): (number | string)[] {
    const pages: (number | string)[] = [];
    
    if (this.totalPages <= this.maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      const middlePoint = Math.floor(this.maxPagesToShow / 2);
      let startPage = Math.max(2, this.currentPage - middlePoint);
      let endPage = Math.min(this.totalPages - 1, this.currentPage + middlePoint);
      
      if (startPage === 2) {
        endPage = Math.min(this.totalPages - 1, startPage + (this.maxPagesToShow - 3));
      }
      
      if (endPage === this.totalPages - 1) {
        startPage = Math.max(2, endPage - (this.maxPagesToShow - 3));
      }
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < this.totalPages - 1) {
        pages.push('...');
      }
      
      pages.push(this.totalPages);
    }
    
    return pages;
  }
  
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRoles();
    }
  }
  
  sortRoles(field: string): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    
    this.currentPage = 1;
    this.loadRoles();
  }
  
  getSortIndicator(field: string): string {
    if (this.sortBy !== field) return '';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }
  
  navigateToNewRole(): void {
    this.router.navigate(['/admin/role', 'new']);
  }
  
  editRole(id: number): void {
    this.router.navigate(['/admin/role', id]);
  }
  
  confirmDelete(role: Role): void {
    this.roleToDelete = role;
    this.showDeleteConfirmation = true;
  }
  
  cancelDelete(): void {
    this.roleToDelete = null;
    this.showDeleteConfirmation = false;
  }
  
  deleteRole(): void {
    if (this.roleToDelete) {
      this.loading = true;
      this.roleService.deleteRole(this.roleToDelete.id).subscribe({
        next: () => {
          this.toastService.success(`Role "${this.roleToDelete?.name}" has been deleted.`);
          this.loadRoles();
          this.cancelDelete();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error deleting role:', error);
          
          if (error.status === 403) {
            this.toastService.error('This role cannot be deleted. It may be in use by users.');
          } else {
            this.toastService.error('Failed to delete role. Please try again.');
          }
          
          this.cancelDelete();
          this.loading = false;
        }
      });
    }
  }
  
  getPermissionCount(role: Role): number {
    // Always use the fresh permissionIds length
    if (role.permissionIds && Array.isArray(role.permissionIds)) {
      return role.permissionIds.length;
    }
    
    // Fallback checks
    if ((role as any).permissionsCount !== undefined) {
      return (role as any).permissionsCount;
    }
    
    if ((role as any).permissions_count !== undefined) {
      return (role as any).permissions_count;
    }
    
    return 0;
  }
  
  exportRoleData(): void {
    console.log('Exporting role data');
    // TODO: Implement export functionality
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('en-US', options);
  }
}