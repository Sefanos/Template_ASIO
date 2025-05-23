import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Role } from '../../../models/role.model';
import { PaginatedRolesResponse, RoleService } from '../../../services/admin-service/role.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html'
})
export class RolesComponent implements OnInit {
  searchQuery: string = '';
  roles: Role[] = [];
  showDeleteConfirmation = false;
  roleToDelete: Role | null = null;
  loading = false;
  
  // Pagination variables
  currentPage = 1;
  pageSize = 15; // Matching backend default
  totalItems = 0;
  totalPages = 0;
  maxPagesToShow = 5;
  
  // Sorting
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  private searchSubject = new Subject<string>();
  
  constructor(
    private roleService: RoleService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadRoles();
    
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1; // Reset to first page on new search
      this.loadRoles();
    });
    
    // Check if we just came back from editing a role - FIXED TYPE ERROR
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state && navigation.extras.state['refreshRoles']) {
      console.log('Detected return from role editing, refreshing list');
      this.loadRoles();
    }
  }
  
  loadRoles(): void {
    this.loading = true;
    this.roleService.getRoles(
      this.currentPage,
      this.pageSize,
      this.searchQuery,
      this.sortBy,
      this.sortDirection
    ).subscribe({
      next: (response: PaginatedRolesResponse) => {
        this.roles = response.items;
        this.totalItems = response.pagination.total;
        this.totalPages = response.pagination.total_pages;
        this.currentPage = response.pagination.current_page;
        this.pageSize = response.pagination.per_page;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.roles = [];
        this.loading = false;
      }
    });
  }
  
  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }
  
  // For backward compatibility with template
  get paginatedRoles(): Role[] {
    // Make a copy to avoid modifying the original array
    const sortedRoles = [...this.roles];
    
    // Sort roles to show system/protected roles first
    sortedRoles.sort((a, b) => {
      const aIsProtected = this.isProtectedRole(a);
      const bIsProtected = this.isProtectedRole(b);
      
      // If protection status is different, sort protected first
      if (aIsProtected && !bIsProtected) return -1;
      if (!aIsProtected && bIsProtected) return 1;
      
      // If both have the same protection status, maintain current sort order
      // This preserves the backend sorting within each group
      return 0;
    });
    
    return sortedRoles;
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
      // Toggle direction if already sorting by this field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc'; // Default to ascending when changing field
    }
    
    this.currentPage = 1; // Reset to first page when sorting
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
      // Check if it's a protected role
      if (this.roleService.isProtectedRole(this.roleToDelete.code)) {
        alert('System roles cannot be deleted.');
        this.cancelDelete();
        return;
      }

      this.loading = true;
      this.roleService.deleteRole(this.roleToDelete.id).subscribe({
        next: () => {
          this.loadRoles();
          this.cancelDelete();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error deleting role:', error);
          
          // Handle 403 error for protected roles
          if (error.status === 403) {
            alert('This role cannot be deleted. It may be a system role or in use by users.');
          } else {
            alert('Failed to delete role. Please try again.');
          }
          
          this.cancelDelete();
          this.loading = false;
        }
      });
    }
  }
  
  getPermissionCount(role: Role): number {
    // First check for explicit permissions count property
    if ((role as any).permissionsCount !== undefined) {
      return (role as any).permissionsCount;
    }
    
    // Then check API's permissions_count
    if ((role as any).permissions_count !== undefined) {
      return (role as any).permissions_count;
    }
    
    // Fallback to length of permissionIds array if available
    return role.permissionIds?.length || 0;
  }
  
  isProtectedRole(role: Role): boolean {
    return this.roleService.isProtectedRole(role.code);
  }
  
  exportRoleData(): void {
    // Export role list functionality
    console.log('Exporting role data');
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