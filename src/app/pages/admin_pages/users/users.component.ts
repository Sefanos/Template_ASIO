import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/admin-service/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  searchQuery: string = '';
  filters = {
    active: false,
    pending: false,
    suspended: false
  };
  
  users: User[] = [];
  showDeleteConfirmation = false;
  userToDelete: User | null = null;
  
  currentPage = 1;
  pageSize = 10;
  maxPagesToShow = 5;
  
  constructor(
    private userService: UserService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadUsers();
  }
  
  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        // Initialize with empty array to prevent errors
        this.users = [];
      }
    });
  }
  
  get filteredUsers(): User[] {
    let result = this.users || [];
    
    if (this.searchQuery?.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(user => 
        // Add null checks for optional properties
        (user.username?.toLowerCase().includes(query) || '') || 
        user.email.toLowerCase().includes(query) ||
        user.id.toString().includes(query) ||
        (user.firstName && user.firstName.toLowerCase().includes(query)) ||
        (user.lastName && user.lastName.toLowerCase().includes(query))
      );
    }
    
    if (this.filters.active) {
      result = result.filter(user => user.status === 'active');
    }
    
    if (this.filters.pending) {
      result = result.filter(user => user.status === 'pending');
    }
    
    if (this.filters.suspended) {
      result = result.filter(user => user.status === 'suspended');
    }
    
    return result;
  }
  
  get paginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }
  
  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize);
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
      pages.push(this.totalPages);
    }
    
    return pages;
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
    // Implement this method based on your requirements
    console.log('Show more filters clicked');
  }
  
  navigateToNewUser(): void {
    this.router.navigate(['/admin/users/new']);
  }
  
  editUser(id: number): void {
    this.router.navigate([`/admin/users/${id}`]);
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
        this.showDeleteConfirmation = false;
        this.userToDelete = null;
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        // Could add error handling here
      }
    });
  }
  
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  exportUserData(): void {
    // Implement export functionality based on your requirements
    console.log('Export user data clicked');
  }
}