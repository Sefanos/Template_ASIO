import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Role, Permission } from '../../models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = 'api/roles'; // Replace with your actual API endpoint
  
  // Dummy data for development
  private roles: Role[] = [
    { 
      id: 1, 
      name: 'Administrator', 
      description: 'Full system access',
      permissionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      createdAt: '2023-01-10 08:00',
      updatedAt: '2023-05-01 14:30'
    },
    { 
      id: 2, 
      name: 'Doctor', 
      description: 'Medical staff with patient management access',
      permissionIds: [1, 3, 5, 6, 8, 9],
      createdAt: '2023-01-15 09:20',
      updatedAt: '2023-04-18 11:45'
    },
    { 
      id: 3, 
      name: 'Nurse', 
      description: 'Medical staff with limited access',
      permissionIds: [1, 3, 5, 8],
      createdAt: '2023-01-20 10:15',
      updatedAt: '2023-03-25 09:30'
    },
    { 
      id: 4, 
      name: 'Receptionist', 
      description: 'Front desk staff',
      permissionIds: [1, 3, 7],
      createdAt: '2023-02-01 08:30',
      updatedAt: '2023-04-10 15:20'
    },
    { 
      id: 5, 
      name: 'Finance', 
      description: 'Billing and payments access',
      permissionIds: [1, 10, 11, 12],
      createdAt: '2023-02-05 11:00',
      updatedAt: '2023-05-03 14:15'
    },
    { 
      id: 6, 
      name: 'Pharmacist', 
      description: 'Medication management access',
      permissionIds: [1, 5, 6],
      createdAt: '2023-02-10 09:45',
      updatedAt: '2023-04-20 16:30'
    },
    { 
      id: 7, 
      name: 'Technician', 
      description: 'Lab and equipment access',
      permissionIds: [1, 8, 9],
      createdAt: '2023-02-15 10:30',
      updatedAt: '2023-03-30 13:45'
    },
    { 
      id: 8, 
      name: 'Intern', 
      description: 'Limited access for training',
      permissionIds: [1, 3],
      createdAt: '2023-03-01 08:15',
      updatedAt: '2023-05-05 10:00'
    }
  ];

  private permissions: Permission[] = [
    { id: 1, name: 'view_dashboard', description: 'View dashboard statistics and analytics', category: 'System' },
    { id: 2, name: 'manage_users', description: 'Create, update and delete user accounts', category: 'Administration' },
    { id: 3, name: 'view_patients', description: 'View patient listings and basic information', category: 'Patients' },
    { id: 4, name: 'manage_roles', description: 'Create, update and delete roles and permissions', category: 'Administration' },
    { id: 5, name: 'view_medical_records', description: 'View patient medical history and records', category: 'Patients' },
    { id: 6, name: 'manage_prescriptions', description: 'Create and update prescriptions', category: 'Medical' },
    { id: 7, name: 'manage_appointments', description: 'Schedule and manage patient appointments', category: 'Calendar' },
    { id: 8, name: 'view_lab_results', description: 'View patient laboratory results', category: 'Medical' },
    { id: 9, name: 'order_lab_tests', description: 'Order new laboratory tests for patients', category: 'Medical' },
    { id: 10, name: 'view_billing', description: 'View billing information and payment history', category: 'Finance' },
    { id: 11, name: 'process_payments', description: 'Process patient payments', category: 'Finance' },
    { id: 12, name: 'manage_insurance', description: 'Manage insurance claims and verification', category: 'Finance' }
  ];

  constructor(private http: HttpClient) { }

  // Get all roles
  getRoles(): Observable<Role[]> {
    // For production, use HTTP: return this.http.get<Role[]>(this.apiUrl);
    return of(this.roles);
  }

  // Get a role by ID
  getRole(id: number): Observable<Role | undefined> {
    // For production: return this.http.get<Role>(`${this.apiUrl}/${id}`);
    const role = this.roles.find(r => r.id === id);
    return of(role);
  }

  // Add a new role
  addRole(role: Role): Observable<Role> {
    // For production: return this.http.post<Role>(this.apiUrl, role);
    const newRole = {
      ...role,
      id: this.getNextId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.roles.push(newRole);
    return of(newRole);
  }

  // Update an existing role
  updateRole(role: Role): Observable<Role> {
    // For production: return this.http.put<Role>(`${this.apiUrl}/${role.id}`, role);
    const index = this.roles.findIndex(r => r.id === role.id);
    if (index !== -1) {
      const updatedRole = {
        ...role,
        updatedAt: new Date().toISOString()
      };
      this.roles[index] = updatedRole;
      return of(updatedRole);
    }
    return of(role);
  }

  // Delete a role
  deleteRole(id: number): Observable<boolean> {
    // For production: return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
    const index = this.roles.findIndex(r => r.id === id);
    if (index !== -1) {
      this.roles.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  // Get all permissions
  getPermissions(): Observable<Permission[]> {
    // For production: return this.http.get<Permission[]>('api/permissions');
    return of(this.permissions);
  }

  // Get permissions by category
  getPermissionsByCategory(): Observable<{[category: string]: Permission[]}> {
    const groupedPermissions: {[category: string]: Permission[]} = {};
    
    this.permissions.forEach(permission => {
      if (!groupedPermissions[permission.category]) {
        groupedPermissions[permission.category] = [];
      }
      groupedPermissions[permission.category].push(permission);
    });
    
    return of(groupedPermissions);
  }

  // Helper method to get next available ID
  private getNextId(): number {
    return Math.max(...this.roles.map(role => role.id)) + 1;
  }

  // Check if role name already exists
  checkRoleNameExists(name: string, excludeId?: number): Observable<boolean> {
    const exists = this.roles.some(role => 
      role.name.toLowerCase() === name.toLowerCase() && 
      (!excludeId || role.id !== excludeId)
    );
    return of(exists);
  }
}