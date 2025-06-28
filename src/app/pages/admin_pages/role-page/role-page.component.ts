import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { Permission, Role } from '../../../models/role.model';
import { RoleService } from '../../../services/admin-service/role.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-role-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './role-page.component.html'
})
export class RolePageComponent implements OnInit {
  roleId: number | null = null;
  isNewRole = false;
  roleForm: FormGroup;
  permissions: Permission[] = [];
  permissionsByCategory: {[group: string]: Permission[]} = {};
  categories: string[] = [];
  formSubmitted = false;
  currentRole: Role | null = null;
  loading = false;
  errorMessage: string | null = null;
  usingCachedData = false;
  expandedCategory: string | null = null;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private roleService: RoleService,
    private toastService: ToastService
  ) {
    this.roleForm = this.createForm();
  }
  
  ngOnInit(): void {
    // Get role ID from route params first
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam === 'new') {
        this.isNewRole = true;
        this.loadPermissionsOnly();
      } else if (idParam) {
        this.roleId = +idParam;
        this.loadRoleWithPermissions(+idParam);
      } else {
        this.router.navigate(['/admin/roles']);
      }
    });
    
    // Setup name uniqueness validation
    this.roleForm.get('name')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(name => !!name),
      switchMap(name => this.roleService.checkRoleNameExists(name, this.roleId || undefined))
    ).subscribe(exists => {
      const nameControl = this.roleForm.get('name');
      if (exists) {
        nameControl?.setErrors({ ...nameControl?.errors, nameExists: true });
      } else if (nameControl?.errors && nameControl.errors['nameExists']) {
        const errors = { ...nameControl.errors };
        delete errors['nameExists'];
        nameControl.setErrors(Object.keys(errors).length ? errors : null);
      }
    });
  }
  
  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      permissions: this.fb.group({})
    });
  }
  
  /**
   * Refresh permissions data
   */
  refreshPermissions(): void {
    this.loading = true;
    
    forkJoin({
      permissions: this.roleService.refreshPermissions(),
      permissionsByCategory: this.roleService.getPermissionsByCategory()
    }).subscribe({
      next: (result) => {
        this.permissions = result.permissions;
        this.permissionsByCategory = result.permissionsByCategory;
        this.categories = Object.keys(result.permissionsByCategory);
        
        // Re-initialize permission controls
        this.initializePermissionControls();
        
        this.loading = false;
        this.toastService.success('Permissions refreshed');
      },
      error: (error) => {
        console.error('Error refreshing permissions:', error);
        this.errorMessage = 'Failed to refresh permissions. Please try again.';
        this.loading = false;
      }
    });
  }
  
  // Initialize permission controls with current selection state
  private initializePermissionControls(): void {
    const permissionGroup = this.roleForm.get('permissions') as FormGroup;
    
    // Clear existing controls
    Object.keys(permissionGroup.controls).forEach(key => {
      permissionGroup.removeControl(key);
    });
    
    // Add controls for all permissions
    this.permissions.forEach(permission => {
      const isChecked = this.currentRole?.permissionIds?.includes(permission.id) || false;
      permissionGroup.addControl(
        permission.id.toString(), 
        this.fb.control(isChecked)
      );
    });
    
    console.log(`Created ${Object.keys(permissionGroup.controls).length} permission form controls`);
  }
  
  // Load permissions only for new role
  loadPermissionsOnly(): void {
    this.loading = true;
    forkJoin({
      permissions: this.roleService.getPermissions(),
      permissionsByCategory: this.roleService.getPermissionsByCategory()
    }).subscribe({
      next: (result) => {
        this.permissions = result.permissions;
        this.permissionsByCategory = result.permissionsByCategory;
        this.categories = Object.keys(result.permissionsByCategory);
        
        // Initialize all permission controls with unchecked state for new role
        const permissionGroup = this.roleForm.get('permissions') as FormGroup;
        this.permissions.forEach(permission => {
          permissionGroup.addControl(
            permission.id.toString(), 
            this.fb.control(false)
          );
        });
        this.loading = false;
        
        // We know we're always using fresh permission data now
        this.usingCachedData = false;
      },
      error: (error) => {
        console.error('Error loading permissions:', error);
        this.errorMessage = 'Failed to load permissions. Please try again.';
        this.loading = false;
      }
    });
  }
  
  // Load role with permissions for editing
  loadRoleWithPermissions(roleId: number): void {
    this.loading = true;
    
    // FIRST, clear any existing permissions controls
    const permissionGroup = this.roleForm.get('permissions') as FormGroup;
    Object.keys(permissionGroup.controls).forEach(key => {
      permissionGroup.removeControl(key);
    });
    
    forkJoin({
      role: this.roleService.getRole(roleId),
      permissions: this.roleService.getPermissions(),
      permissionsByCategory: this.roleService.getPermissionsByCategory()
    }).subscribe({
      next: (result) => {
        this.permissions = result.permissions;
        this.permissionsByCategory = result.permissionsByCategory;
        this.categories = Object.keys(result.permissionsByCategory);
        this.currentRole = result.role || null;
        
        console.log(`Loaded ${this.permissions.length} permissions and ${this.categories.length} categories`);
        
        if (this.currentRole) {
          // Ensure permissionIds is always an array
          if (!this.currentRole.permissionIds) {
            this.currentRole.permissionIds = [];
          }
          
          console.log(`Current role has ${this.currentRole.permissionIds.length} permissions`);
          
          // Set form values
          this.roleForm.patchValue({
            name: this.currentRole.name,
            description: this.currentRole.description || ''
          });
          
          // IMPORTANT: Create form controls for ALL permissions BEFORE template renders
          this.permissions.forEach(permission => {
            const isChecked = this.currentRole?.permissionIds?.includes(permission.id) || false;
            permissionGroup.addControl(
              permission.id.toString(), 
              this.fb.control(isChecked)
            );
          });
          
          console.log(`Created ${Object.keys(permissionGroup.controls).length} permission form controls`);
        } else {
          this.errorMessage = 'Role not found.';
          setTimeout(() => this.router.navigate(['/admin/roles']), 2000);
        }
        this.loading = false;
        
        // We know we're always using fresh permission data now
        this.usingCachedData = false;
      },
      error: (error) => {
        console.error('Error loading role data:', error);
        this.errorMessage = 'Failed to load role data. Please try again.';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/admin/roles']), 2000);
      }
    });
  }
  
  onSubmit(): void {
    this.formSubmitted = true;
    this.errorMessage = null;
    
    if (this.roleForm.invalid) {
      return;
    }
    
    const formValues = this.roleForm.getRawValue();
    const permissionsObj = formValues.permissions || {};
    
    const permissionIds = Object.keys(permissionsObj)
      .filter(key => permissionsObj[key])
      .map(key => parseInt(key, 10));
    
    console.log('Selected permissions:', permissionIds);
    
    const roleCode = formValues.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
    
    const roleData: Role = {
      id: this.roleId || 0,
      name: formValues.name,
      code: roleCode,
      description: formValues.description,
      permissionIds: permissionIds,
      createdAt: this.currentRole?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.loading = true;
    
    if (this.isNewRole) {
      this.roleService.addRole(roleData).subscribe({
        next: (updatedRole) => {
          console.log('Role created with response:', updatedRole);
          
          if (updatedRole.permissionIds && 
              permissionIds.length !== updatedRole.permissionIds.length) {
            
            const savedCount = updatedRole.permissionIds.length;
            const selectedCount = permissionIds.length;
            this.errorMessage = `Note: Only ${savedCount} of ${selectedCount} selected permissions were applied.`;
            
            setTimeout(() => {
              this.router.navigate(['/admin/roles']);
            }, 2500);
          } else {
            this.toastService.success(`Role "${updatedRole.name}" created successfully`);
            this.router.navigate(['/admin/roles']);
          }
        },
        error: (error) => {
          console.error('Error creating role:', error);
          this.handleApiError(error);
          this.loading = false;
        }
      });
    } else {
      this.roleService.updateRole(roleData).subscribe({
        next: (updatedRole) => {
          console.log('Role updated with response:', updatedRole);
          
          if (updatedRole.permissionIds && 
              permissionIds.length !== updatedRole.permissionIds.length) {
            
            const savedCount = updatedRole.permissionIds.length;
            const selectedCount = permissionIds.length;
            this.errorMessage = `Note: Only ${savedCount} of ${selectedCount} selected permissions were applied.`;
            
            setTimeout(() => {
              this.router.navigate(['/admin/roles']);
            }, 2500);
          } else {
            this.toastService.success(`Role "${updatedRole.name}" updated successfully`);
            this.router.navigate(['/admin/roles']);
          }
        },
        error: (error) => {
          console.error('Error updating role:', error);
          this.handleApiError(error);
          this.loading = false;
        }
      });
    }
  }
  
  // Handle API errors
  private handleApiError(error: any): void {
    if (error.status === 403) {
      this.errorMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 422 && error.error?.errors) {
      // Validation errors
      const errorMessages = [];
      const errors = error.error.errors;
      
      for (const field in errors) {
        if (errors.hasOwnProperty(field)) {
          errorMessages.push(errors[field].join(' '));
          
          // Set field-specific errors
          const control = this.roleForm.get(field);
          if (control) {
            control.setErrors({ serverError: errors[field].join(' ') });
          }
        }
      }
      
      this.errorMessage = errorMessages.join(' ');
    } else {
      this.errorMessage = 'An error occurred. Please try again.';
    }
  }
  
  // Format date from ISO string to human readable format
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', options);
  }
  
  getPermissionControl(id: number): AbstractControl | null {
    const permissionsGroup = this.roleForm.get('permissions') as FormGroup;
    if (!permissionsGroup) return null;
    
    const controlName = id.toString();
    return permissionsGroup.get(controlName);
  }
  
  isPermissionSelected(id: number): boolean {
    return this.getPermissionControl(id)?.value || false;
  }
  
  getCategoryPermissionCount(category: string): { total: number, selected: number } {
    const permissions = this.permissionsByCategory[category] || [];
    let selected = 0;
    
    permissions.forEach(permission => {
      if (this.isPermissionSelected(permission.id)) {
        selected++;
      }
    });
    
    return {
      total: permissions.length,
      selected
    };
  }
  
  selectAllInCategory(category: string): void {
    const permissions = this.permissionsByCategory[category] || [];
    const permissionsGroup = this.roleForm.get('permissions') as FormGroup;
    
    permissions.forEach(permission => {
      const controlName = permission.id.toString();
      const control = permissionsGroup.get(controlName);
      
      if (control) {
        control.setValue(true);
      } else {
        // If control doesn't exist, create it
        permissionsGroup.addControl(controlName, this.fb.control(true));
      }
    });
    
    console.log(`Selected all permissions in ${category}:`, permissions.length);
  }
  
  deselectAllInCategory(category: string): void {
    const permissions = this.permissionsByCategory[category] || [];
    const permissionsGroup = this.roleForm.get('permissions') as FormGroup;
    
    permissions.forEach(permission => {
      const controlName = permission.id.toString();
      const control = permissionsGroup.get(controlName);
      
      if (control) {
        control.setValue(false);
      } else {
        // If control doesn't exist, create it
        permissionsGroup.addControl(controlName, this.fb.control(false));
      }
    });
    
    console.log(`Deselected all permissions in ${category}:`, permissions.length);
  }
  
  // Method to select ALL permissions
  selectAllPermissions(): void {
    const permissionsGroup = this.roleForm.get('permissions') as FormGroup;
    if (!permissionsGroup) return;
    
    this.permissions.forEach(permission => {
      const controlName = permission.id.toString();
      const control = permissionsGroup.get(controlName);
      
      if (control) {
        control.setValue(true);
      } else {
        permissionsGroup.addControl(controlName, this.fb.control(true));
      }
    });
    
    console.log(`Selected all ${this.permissions.length} permissions`);
  }
  
  deselectAllPermissions(): void {
    const permissionsGroup = this.roleForm.get('permissions') as FormGroup;
    if (!permissionsGroup) return;
    
    this.permissions.forEach(permission => {
      const controlName = permission.id.toString();
      const control = permissionsGroup.get(controlName);
      
      if (control) {
        control.setValue(false);
      } else {
        permissionsGroup.addControl(controlName, this.fb.control(false));
      }
    });
    
    console.log('Deselected all permissions');
  }
  
  cancel(): void {
    this.router.navigate(['/admin/roles']);
  }
  
  /** Toggle a single category drawer */
  toggleCategory(category: string): void {
    this.expandedCategory = this.expandedCategory === category ? null : category;
  }
}