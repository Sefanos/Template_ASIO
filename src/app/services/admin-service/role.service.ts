import { HttpClient, HttpParams } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
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
  private apiUrl = `${environment.apiUrl}/roles`;
  private permissionsUrl = `${environment.apiUrl}/permissions`;
  
  // Add cache system but exclude permissions
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  constructor(private http: HttpClient) { }

  // Add a property to store the last updated role
  private lastUpdatedRole: Role | null = null;

  // Add an event emitter to broadcast role changes
  public roleChanged = new EventEmitter<number | null>();

  /**
   * Cache utility methods
   */
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const isValid = (Date.now() - cached.timestamp) < this.cacheTimeout;
    if (!isValid) {
      this.cache.delete(key); // Clean up expired cache
    }
    return isValid;
  }

  private getCachedData<T>(key: string): T | null {
    if (this.isCacheValid(key)) {
      console.log(`🔄 Using cached data for: ${key}`);
      const cached = this.cache.get(key);
      return cached?.data || null;
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    console.log(`💾 Caching data for: ${key}`);
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Public method to clear cache
   */
  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      console.log(`🗑️ Cleared cache for: ${key}`);
    } else {
      this.cache.clear();
      console.log('🗑️ Cleared all role service cache');
    }
  }

  /**
   * Clear all role-related caches
   */
  public clearAllRoleCaches(): void {
    this.clearCache();
    console.log('🗑️ Cleared all role-related caches');
  }

  /**
   * Get all roles with pagination (ALWAYS fresh data for roles list)
   */
  getRoles(
    page: number = 1, 
    perPage: number = 15,
    search?: string,
    sortBy: string = 'name',
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Observable<PaginatedRolesResponse> {
    console.log('🔄 Loading fresh roles data...');
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString())
      .set('sort_by', sortBy)
      .set('sort_direction', sortDirection)
      .set('_t', Date.now().toString()); // Cache busting
      
    if (search) {
      params = params.append('search', search);
    }
    
    return this.http.get<any>(`${this.apiUrl}`, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          const rolesData = {
            items: response.data.items.map((role: any) => this.mapRoleFromApi(role)),
            pagination: response.data.pagination
          };
          
          return rolesData;
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

  /**
   * Get a role by ID (ALWAYS fresh data)
   */
  getRole(id: number): Observable<Role | undefined> {
    console.log(`🔄 Loading fresh data for role ID ${id}...`);
    
    // Add cache-busting query parameter
    const timestamp = Date.now();
    const url = `${this.apiUrl}/${id}?_t=${timestamp}`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        console.log('API response for getRole:', response);
        if (response.success && response.data) {
          const roleData = this.mapRoleFromApi(response.data);
          return roleData;
        }
        return undefined;
      })
    );
  }

  /**
   * Add a new role
   */
  addRole(role: Role): Observable<Role> {
    const roleData = this.mapRoleForApi(role);
    
    console.log('Sending new role to API:', roleData);
    
    return this.http.post<any>(this.apiUrl, roleData).pipe(
      map(response => {
        console.log('API response for role creation:', response);
        if (response.success && response.data) {
          const newRole = this.mapRoleFromApi(response.data);
          this.lastUpdatedRole = newRole;
          
          // Clear caches and emit event
          this.clearAllRoleCaches();
          this.roleChanged.emit(newRole.id);
          
          return newRole;
        }
        throw new Error(response.message || 'Failed to create role');
      })
    );
  }

  /**
   * Update an existing role
   */
  updateRole(role: Role): Observable<Role> {
    const roleData = this.mapRoleForApi(role);
    
    console.log('Sending role update to API:', roleData);
    
    return this.http.put<any>(`${this.apiUrl}/${role.id}`, roleData).pipe(
      map(response => {
        console.log('API response for role update:', response);
        if (response.success && response.data) {
          const updatedRole = this.mapRoleFromApi(response.data);
          this.lastUpdatedRole = updatedRole;
          
          // Clear caches and emit event
          this.clearAllRoleCaches();
          this.roleChanged.emit(updatedRole.id);
          
          return updatedRole;
        }
        throw new Error(response.message || 'Failed to update role');
      })
    );
  }

  /**
   * Delete a role
   */
  deleteRole(id: number): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (response.success) {
          this.clearAllRoleCaches();
          this.roleChanged.emit(null);
        }
        return response.success || false;
      })
    );
  }

  /**
   * Get all permissions (ALWAYS fresh data)
   */
  getPermissions(): Observable<Permission[]> {
    console.log('🔄 Loading fresh permissions data...');
    
    const params = new HttpParams()
      .set('per_page', '200')
      .set('_t', Date.now().toString()); // Cache busting
    
    return this.http.get<any>(`${this.permissionsUrl}`, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          const permissions = Array.isArray(response.data) ? 
            response.data : (response.data.items || []);
          
          console.log(`Loaded ${permissions.length} permissions from API`);
          return permissions;
        }
        return [];
      })
    );
  }

  /**
   * Get permissions grouped by category (ALWAYS fresh data)
   */
  getPermissionsByCategory(): Observable<{[group: string]: Permission[]}> {
    console.log('🔄 Loading fresh permission categories data...');
    
    const params = new HttpParams().set('_t', Date.now().toString());
    
    return this.http.get<any>(`${this.permissionsUrl}/groups`, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return {};
      })
    );
  }

  /**
   * Check if role name already exists
   */
  checkRoleNameExists(name: string, excludeId?: number): Observable<boolean> {
    let params = new HttpParams()
      .set('name', name)
      .set('_t', Date.now().toString());
      
    if (excludeId) {
      params = params.append('excludeId', excludeId.toString());
    }
    
    return this.http.get<any>(`${this.apiUrl}/check-name`, { params }).pipe(
      map(response => {
        return response.exists || false;
      })
    );
  }
  
  /**
   * Refresh permissions data
   */
  refreshPermissions(): Observable<Permission[]> {
    return this.getPermissions();
  }
  
  // Helper method to map frontend Role model to API format
  private mapRoleForApi(role: Role): any {
    return {
      name: role.name,
      code: role.code,
      description: role.description,
      permissions: role.permissionIds
    };
  }
  
  // Helper method to map API response to frontend Role model
  private mapRoleFromApi(apiRole: any): Role {
    let permissionIds: number[] = [];
    
    if (apiRole.permissions && Array.isArray(apiRole.permissions)) {
      permissionIds = apiRole.permissions.map((p: any) => p.id);
      console.log(`Extracted ${permissionIds.length} permission IDs from role`);
    }
    
    return {
      id: apiRole.id,
      name: apiRole.name,
      code: apiRole.code || '',
      description: apiRole.description || '',
      permissionIds: permissionIds,
      permissionsCount: permissionIds.length,
      createdAt: apiRole.created_at,
      updatedAt: apiRole.updated_at
    };
  }
  
  // Check if a role is a protected system role
  isProtectedRole(roleCode: string): boolean {
    const protectedRoles = ['admin', 'patient', 'doctor', 'receptionist', 'nurse'];
    return protectedRoles.includes(roleCode);
  }
  
  // Add a method to get the last updated role
  getLastUpdatedRole(): Role | null {
    return this.lastUpdatedRole;
  }
}