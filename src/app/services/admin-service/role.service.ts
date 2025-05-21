import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Permission, Role } from '../../models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`; // Using environment API URL
  private permissionsUrl = `${environment.apiUrl}/permissions`;
  
  constructor(private http: HttpClient) { }

  // Get all roles
  getRoles(): Observable<Role[]> {
    return this.http.get<any>(`${this.apiUrl}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  // Get a role by ID
  getRole(id: number): Observable<Role | undefined> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return undefined;
      })
    );
  }

  // Add a new role
  addRole(role: Role): Observable<Role> {
    return this.http.post<any>(this.apiUrl, role).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to create role');
      })
    );
  }

  // Update an existing role
  updateRole(role: Role): Observable<Role> {
    return this.http.put<any>(`${this.apiUrl}/${role.id}`, role).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to update role');
      })
    );
  }

  // Delete a role
  deleteRole(id: number): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        return response.success || false;
      })
    );
  }

  // Get all permissions
  getPermissions(): Observable<Permission[]> {
    return this.http.get<any>(`${this.permissionsUrl}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  // Get permissions by group (renamed from category to match backend)
  getPermissionsByCategory(): Observable<{[group: string]: Permission[]}> {
    return this.getPermissions().pipe(
      map(permissions => {
        const groupedPermissions: {[group: string]: Permission[]} = {};
        
        permissions.forEach(permission => {
          // Fixed: Changed permission.category to permission.group
          if (!groupedPermissions[permission.group]) {
            groupedPermissions[permission.group] = [];
          }
          groupedPermissions[permission.group].push(permission);
        });
        
        return groupedPermissions;
      })
    );
  }

  // Check if role name already exists
  checkRoleNameExists(name: string, excludeId?: number): Observable<boolean> {
    return this.http.get<any>(`${this.apiUrl}/check-name?name=${encodeURIComponent(name)}&excludeId=${excludeId || 0}`).pipe(
      map(response => {
        return response.exists || false;
      })
    );
  }
}