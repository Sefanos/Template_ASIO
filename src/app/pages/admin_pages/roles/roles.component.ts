import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Role } from '../../../models/role.model';
import { RoleService } from '../../../services/admin-service/role.service';

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
  
  currentPage = 1;
  pageSize = 10;
  maxPagesToShow = 5;
  
  constructor(
    private roleService: RoleService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadRoles();
  }
  
  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.roles = [];
      }
    });
  }
  
  get filteredRoles(): Role[] {
    let result = this.roles || [];
    
    if (this.searchQuery?.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(role => 
        role.name.toLowerCase().includes(query) || 
        role.id.toString().includes(query) ||
        (role.description && role.description.toLowerCase().includes(query))
      );
    }
    
    return result;
  }
  
  get paginatedRoles(): Role[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredRoles.slice(startIndex, startIndex + this.pageSize);
  }
  
  get totalPages(): number {
    return Math.ceil(this.filteredRoles.length / this.pageSize);
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
      this.roleService.deleteRole(this.roleToDelete.id).subscribe({
        next: () => {
          this.loadRoles();
          this.cancelDelete();
        },
        error: (error) => {
          console.error('Error deleting role:', error);
          this.cancelDelete();
        }
      });
    }
  }
  
  getPermissionCount(role: Role): number {
    return role.permissionIds?.length || 0;
  }
  
  exportRoleData(): void {
    // Export role list functionality
    console.log('Exporting role data');
  }
}