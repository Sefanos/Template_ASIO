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
  permissionsByCategory: {[category: string]: Permission[]} = {};
  categories: string[] = [];
  formSubmitted = false;
  currentRole: Role | null = null;
  
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
        nameControl?.setErrors({ ...nameControl.errors, nameExists: true });
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
      },
      error: (error) => {
        console.error('Error loading permissions:', error);
      }
    });
  }
  
  // Load role with permissions for editing
  loadRoleWithPermissions(roleId: number): void {
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
          // Initialize all permissions controls first
          const permissionGroup = this.roleForm.get('permissions') as FormGroup;
          this.permissions.forEach(permission => {
            // Add null check for permissionIds
            const isChecked = this.currentRole?.permissionIds ? 
              this.currentRole.permissionIds.includes(permission.id) : 
              false;
            permissionGroup.addControl(permission.id.toString(), this.fb.control(isChecked));
          });
          
          // Then set the form values
          this.roleForm.patchValue({
            name: this.currentRole.name,
            description: this.currentRole.description || ''
          });
        } else {
          this.router.navigate(['/admin/roles']);
        }
      },
      error: (error) => {
        console.error('Error loading role data:', error);
        this.router.navigate(['/admin/roles']);
      }
    });
  }
  
  onSubmit(): void {
    this.formSubmitted = true;
    
    if (this.roleForm.invalid) {
      return;
    }
    
    const formValues = this.roleForm.value;
    const permissionsObj = formValues.permissions || {};
    
    // Convert permissions object to array of IDs
    const permissionIds = Object.keys(permissionsObj)
      .filter(key => permissionsObj[key])
      .map(key => parseInt(key, 10));
    
    // Generate a code from the name (lowercase, no spaces)
    // You might want to implement a more sophisticated code generation logic
    const roleCode = formValues.name.toLowerCase().replace(/\s+/g, '_');
    
    const roleData: Role = {
      id: this.roleId || 0,
      name: formValues.name,
      code: this.currentRole?.code || roleCode, // Use existing code or generate new one
      description: formValues.description,
      permissionIds: permissionIds,
      createdAt: this.currentRole?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (this.isNewRole) {
      this.roleService.addRole(roleData).subscribe({
        next: () => {
          this.router.navigate(['/admin/roles']);
        },
        error: (error) => {
          console.error('Error creating role:', error);
        }
      });
    } else {
      this.roleService.updateRole(roleData).subscribe({
        next: () => {
          this.router.navigate(['/admin/roles']);
        },
        error: (error) => {
          console.error('Error updating role:', error);
        }
      });
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