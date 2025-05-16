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
        user.username.toLowerCase().includes(query) || 
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
    }
  }
  
  editUser(id: number): void {
    this.router.navigate(['/admin/user-page', id]);
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
    if (this.userToDelete) {
      this.userService.deleteUser(this.userToDelete.id).subscribe({
        next: () => {
          this.loadUsers();
          this.cancelDelete();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.cancelDelete();
        }
      });
    }
  }
  
  showMoreFilters(): void {
    // Implement additional filters if needed
    console.log('Showing more filters');
  }
  
  exportUserData(): void {
    // Export user list functionality
    console.log('Exporting user data');
  }
  
  navigateToNewUser(): void {
    this.router.navigate(['/admin/user-page', 'new']);
  }

  getStatusClasses(status: string): string {
    switch(status) {
      case 'active':
        return 'bg-status-success bg-opacity-10 text-status-success';
      case 'pending':
        return 'bg-status-warning bg-opacity-10 text-status-warning';
      case 'suspended':
        return 'bg-status-urgent bg-opacity-10 text-status-urgent';
      default:
        return 'bg-text-muted bg-opacity-10 text-text-muted';
    }
  }
}