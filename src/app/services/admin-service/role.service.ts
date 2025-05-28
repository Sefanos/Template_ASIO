import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Permission, Role } from '../../models/role.model';

export interface PaginatedRolesResponse {
  items: Role[];
  pagination: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`; // Using environment API URL
  private permissionsUrl = `${environment.apiUrl}/permissions`;
  
  constructor(private http: HttpClient) { }

  // Add a property to store the last updated role
  private lastUpdatedRole: Role | null = null;

  // Get all roles with pagination
  getRoles(
    page: number = 1, 
    perPage: number = 15,
    search?: string,
    sortBy: string = 'name',
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Observable<PaginatedRolesResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString())
      .set('sort_by', sortBy)
      .set('sort_direction', sortDirection);
      
    if (search) {
      params = params.append('search', search);
    }
    
    return this.http.get<any>(`${this.apiUrl}`, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return {
            items: response.data.items.map((role: any) => this.mapRoleFromApi(role)),
            pagination: response.data.pagination
          };
        }
        return {
          items: [],
          pagination: {
            total: 0,
            count: 0,
            per_page: perPage,
            current_page: page,
            total_pages: 0
          }
        };
      })
    );
  }

  // Get a role by ID
  getRole(id: number): Observable<Role | undefined> {
    // Add cache-busting query parameter
    const timestamp = new Date().getTime();
    const url = `${this.apiUrl}/${id}?_=${timestamp}`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        console.log('API response for getRole:', response);
        if (response.success && response.data) {
          return this.mapRoleFromApi(response.data);
        }
        return undefined;
      })
    );
  }

  // Add a new role
  addRole(role: Role): Observable<Role> {
    const roleData = this.mapRoleForApi(role);
    
    console.log('Sending new role to API:', roleData);
    
    return this.http.post<any>(this.apiUrl, roleData).pipe(
      map(response => {
        console.log('API response for role creation:', response);
        if (response.success && response.data) {
          return this.mapRoleFromApi(response.data);
        }
        throw new Error(response.message || 'Failed to create role');
      })
    );
  }

  // Update an existing role
  updateRole(role: Role): Observable<Role> {
    const roleData = this.mapRoleForApi(role);
    
    console.log('Sending role update to API:', roleData);
    
    return this.http.put<any>(`${this.apiUrl}/${role.id}`, roleData).pipe(
      map(response => {
        console.log('API response for role update:', response);
        if (response.success && response.data) {
          return this.mapRoleFromApi(response.data);
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
          // Handle both direct data and paginated data
          const permissions = Array.isArray(response.data) ? 
            response.data : (response.data.items || []);
          return permissions;
        }
        return [];
      })
    );
  }

  // Get permissions grouped by category - now using the groups endpoint
  getPermissionsByCategory(): Observable<{[group: string]: Permission[]}> {
    return this.http.get<any>(`${this.permissionsUrl}/groups`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return {};
      })
    );
  }

  // Check if role name already exists
  checkRoleNameExists(name: string, excludeId?: number): Observable<boolean> {
    let params = new HttpParams()
      .set('name', name);
      
    if (excludeId) {
      params = params.append('excludeId', excludeId.toString());
    }
    
    return this.http.get<any>(`${this.apiUrl}/check-name`, { params }).pipe(
      map(response => {
        return response.exists || false;
      })
    );
  }
  
  // Helper method to map frontend Role model to API format
  private mapRoleForApi(role: Role): any {
    // Make sure we're sending the data in the format the API expects
    return {
      name: role.name,
      code: role.code,
      description: role.description,
      permissions: role.permissionIds  // Make sure the key is 'permissions'
    };
  }
  
  // Helper method to map API response to frontend Role model
  private mapRoleFromApi(apiRole: any): Role {
    return {
      id: apiRole.id,
      name: apiRole.name,
      code: apiRole.code || '',
      description: apiRole.description || '',
      // Handle both direct permissionIds and nested permissions array
      permissionIds: apiRole.permissionIds || 
        (apiRole.permissions ? apiRole.permissions.map((p: any) => p.id) : []),
      createdAt: apiRole.created_at,
      updatedAt: apiRole.updated_at
    };
  }

  // Check if a role is a protected system role
  isProtectedRole(roleCode: string): boolean {
  const protectedRoles = ['admin', 'patient', 'doctor', 'receptionist', 'guest'];
  return protectedRoles.includes(roleCode);
  }

  // Add a method to get the last updated role
  getLastUpdatedRole(): Role | null {
    return this.lastUpdatedRole;
  }
}