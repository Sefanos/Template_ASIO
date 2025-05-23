import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { Permission, Role } from '../../../models/role.model';
import { RoleService } from '../../../services/admin-service/role.service';

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
  isProtectedRole = false;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private roleService: RoleService
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
        
        if (this.currentRole) {
          // Check if this is a protected role
          this.isProtectedRole = this.roleService.isProtectedRole(this.currentRole.code);
          
          // Log the permissions found in the current role
          console.log('Current role permissions:', this.currentRole.permissionIds);
          
          // Ensure permissionIds is always an array
          if (!this.currentRole.permissionIds) {
            this.currentRole.permissionIds = [];
          }
          
          // Initialize all permissions controls first
          const permissionGroup = this.roleForm.get('permissions') as FormGroup;
          this.permissions.forEach(permission => {
            // Check if this permission is included in the role's permissions
            const isChecked = this.currentRole?.permissionIds?.includes(permission.id) || false;
            
            // Add a control for this permission
            permissionGroup.addControl(
              permission.id.toString(), 
              this.fb.control(isChecked)
            );
          });
          
          // Then set the form values
          this.roleForm.patchValue({
            name: this.currentRole.name,
            description: this.currentRole.description || ''
          });
          
          // Disable name field for protected roles
          if (this.isProtectedRole) {
            this.roleForm.get('name')?.disable();
          }
        } else {
          this.errorMessage = 'Role not found.';
          setTimeout(() => this.router.navigate(['/admin/roles']), 2000);
        }
        this.loading = false;
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
    
    const formValues = this.roleForm.getRawValue(); // Use getRawValue to include disabled fields
    const permissionsObj = formValues.permissions || {};
    
    // Convert permissions object to array of IDs
    const permissionIds = Object.keys(permissionsObj)
      .filter(key => permissionsObj[key])
      .map(key => parseInt(key, 10));
    
    console.log('Selected permissions:', permissionIds);
    
    // Generate a code from the name (lowercase, no spaces)
    const roleCode = formValues.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
    
    const roleData: Role = {
      id: this.roleId || 0,
      name: formValues.name,
      code: this.isProtectedRole ? this.currentRole?.code || roleCode : roleCode,
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
          
          // Check if all permissions were saved
          if (updatedRole.permissionIds && 
              permissionIds.length !== updatedRole.permissionIds.length) {
            
            const notSaved = permissionIds.filter(id => 
              !updatedRole.permissionIds?.includes(id)
            );
            
            console.log('Permissions not saved by backend:', notSaved);
            
            // Show warning
            const savedCount = updatedRole.permissionIds.length;
            const selectedCount = permissionIds.length;
            this.errorMessage = `Note: Only ${savedCount} of ${selectedCount} selected permissions were applied.`;
            
            // Don't navigate immediately so user can see the message
            setTimeout(() => {
              this.router.navigate(['/admin/roles'], { state: { refreshRoles: true } });
            }, 2500);
          } else {
            this.router.navigate(['/admin/roles'], { state: { refreshRoles: true } });
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
          
          // Check if all permissions were saved
          if (updatedRole.permissionIds && 
              permissionIds.length !== updatedRole.permissionIds.length) {
            
            const notSaved = permissionIds.filter(id => 
              !updatedRole.permissionIds?.includes(id)
            );
            
            console.log('Permissions not saved by backend:', notSaved);
            
            // Show warning
            const savedCount = updatedRole.permissionIds.length;
            const selectedCount = permissionIds.length;
            this.errorMessage = `Note: Only ${savedCount} of ${selectedCount} selected permissions were applied.`;
            
            // Don't navigate immediately so user can see the message
            setTimeout(() => {
              this.router.navigate(['/admin/roles'], { state: { refreshRoles: true } });
            }, 2500);
          } else {
            this.router.navigate(['/admin/roles'], { state: { refreshRoles: true } });
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
      this.errorMessage = 'You do not have permission to perform this action, or this is a protected system role.';
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
    return permissionsGroup?.get(id.toString());
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
      if (!permissionsGroup.get(permission.id.toString())) {
        permissionsGroup.addControl(permission.id.toString(), this.fb.control(true));
      } else {
        permissionsGroup.get(permission.id.toString())?.setValue(true);
      }
    });
  }
  
  deselectAllInCategory(category: string): void {
    const permissions = this.permissionsByCategory[category] || [];
    const permissionsGroup = this.roleForm.get('permissions') as FormGroup;
    
    permissions.forEach(permission => {
      if (!permissionsGroup.get(permission.id.toString())) {
        permissionsGroup.addControl(permission.id.toString(), this.fb.control(false));
      } else {
        permissionsGroup.get(permission.id.toString())?.setValue(false);
      }
    });
  }
  
  cancel(): void {
    this.router.navigate(['/admin/roles']);
  }
}