import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../../models/user.model';
import { PaginatedResponse, UserFilters, UserService } from '../../../services/admin-service/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  searchQuery: string = '';
  filters: UserFilters = {
    page: 1,
    per_page: 10,
    sort_by: 'created_at',
    sort_direction: 'desc'
  };
  
  statusFilters = {
    active: false,
    pending: false,
    suspended: false
  };
  
  users: User[] = [];
  showDeleteConfirmation = false;
  userToDelete: User | null = null;
  
  // Pagination variables
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 10;
  maxPagesToShow = 5;
  
  // Stats
  userCounts: { active: number; pending: number; suspended: number } = {
    active: 0,
    pending: 0,
    suspended: 0
  };
  
  loading = false;
  
  constructor(
    private userService: UserService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadUsers();
    this.loadUserCounts();
  }
  
  // Add a getter for paginatedUsers to fix the template error
  get paginatedUsers(): User[] {
    return this.users;
  }
  
  loadUserCounts(): void {
    this.userService.getUserCountsByStatus().subscribe({
      next: (counts) => {
        // Use bracket notation to access index signature properties
        this.userCounts = {
          active: counts['active'] || 0,
          pending: counts['pending'] || 0,
          suspended: counts['suspended'] || 0
        };
      },
      error: (error) => {
        console.error('Error loading user counts:', error);
      }
    });
  }
  
  loadUsers(): void {
    this.loading = true;
    
    // Apply status filters if any are selected
    let statusFilter = '';
    if (this.statusFilters.active && !this.statusFilters.pending && !this.statusFilters.suspended) {
      statusFilter = 'active';
    } else if (!this.statusFilters.active && this.statusFilters.pending && !this.statusFilters.suspended) {
      statusFilter = 'pending';
    } else if (!this.statusFilters.active && !this.statusFilters.pending && this.statusFilters.suspended) {
      statusFilter = 'suspended';
    }
    
    const filters: UserFilters = {
      ...this.filters,
      search: this.searchQuery || undefined,
      status: statusFilter || undefined
    };
    
    this.userService.getUsers(filters).subscribe({
      next: (response: PaginatedResponse<User>) => {
        this.users = response.items;
        this.totalItems = response.pagination.total;
        this.totalPages = response.pagination.total_pages;
        this.currentPage = response.pagination.current_page;
        this.pageSize = response.pagination.per_page;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.users = [];
        this.loading = false;
      }
    });
  }
  
  onSearch(): void {
    this.filters.page = 1; // Reset to first page when searching
    this.loadUsers();
  }
  
  onStatusFilterChange(): void {
    this.filters.page = 1; // Reset to first page when changing filters
    this.loadUsers();
  }
  
  getStatusClasses(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  getUserRoleName(user: User): string {
    return user.roles && user.roles.length > 0 ? user.roles[0].name : 'No role';
  }
  
  showMoreFilters(): void {
    // Implement advanced filtering if needed
    console.log('Show more filters clicked');
  }
  
  navigateToNewUser(): void {
    this.loading = true; // Show loading indicator
    this.router.navigate(['/admin/user-page/new'])
      .then(() => {
        this.loading = false;
      })
      .catch(error => {
        console.error('Navigation error:', error);
        this.loading = false;
        // You could display an error message here
      });
  }
  
  editUser(id: number): void {
    this.router.navigate([`/admin/user-page/${id}`]);  // Changed from '/admin/users/${id}'
  }
  
  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteConfirmation = true;
  }
  
  cancelDelete(): void {
    this.userToDelete = null;
    this.showDeleteConfirmation = false;
  }
  
  deleteUser(): void {
    if (!this.userToDelete) return;
    
    this.userService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.loadUsers();
        this.loadUserCounts();
        this.showDeleteConfirmation = false;
        this.userToDelete = null;
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        // Could show an error notification here
      }
    });
  }
  
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.filters.page = page;
      this.loadUsers();
    }
  }
  
  get pagesToShow(): Array<number | string> {
    const pages: Array<number | string> = [];
    
    if (this.totalPages <= this.maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of pages to show
      let start = Math.max(2, this.currentPage - Math.floor(this.maxPagesToShow / 2));
      let end = Math.min(this.totalPages - 1, start + this.maxPagesToShow - 3);
      
      // Adjust if at the end
      if (end >= this.totalPages - 1) {
        start = Math.max(2, this.totalPages - this.maxPagesToShow + 2);
      }
      
      // Show ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Show ellipsis if needed
      if (end < this.totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }
  
  exportUserData(): void {
    // Implement export functionality
    console.log('Export user data clicked');
  }
}