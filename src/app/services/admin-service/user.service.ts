import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Role } from '../../models/role.model';
import { User, UserCreationDto } from '../../models/user.model';

export interface UserFilters {
  search?: string;
  status?: string;
  role_id?: number;
  per_page?: number;
  page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
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
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  
  constructor(private http: HttpClient) { }

  // Get all users with filtering, pagination, and sorting
  getUsers(filters: UserFilters = {}): Observable<PaginatedResponse<User>> {
    let params = new HttpParams();
    
    // Add filters to params
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status !== undefined) {
      console.log('Applying status filter:', filters.status); 
      params = params.set('status', filters.status);
    }
    if (filters.role_id) params = params.set('role_id', filters.role_id.toString());
    if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.sort_by) params = params.set('sort_by', filters.sort_by);
    if (filters.sort_direction) params = params.set('sort_direction', filters.sort_direction);

    console.log('API request params:', params.toString());
    
    return this.http.get<any>(`${this.apiUrl}`, { params }).pipe(
      map(response => {
        console.log('API response:', response);
        if (response.success && response.data) {
          // Fix here: Map last_page to total_pages
          return {
            items: response.data.items || response.data,
            pagination: {
              total: response.data.pagination?.total || response.data.length,
              count: response.data.pagination?.count || response.data.length,
              per_page: response.data.pagination?.per_page || filters.per_page || 15,
              current_page: response.data.pagination?.current_page || 1,
              // Use last_page instead of total_pages
              total_pages: response.data.pagination?.last_page || 1
            }
          };
        }
        return {
          items: [],
          pagination: {
            total: 0,
            count: 0,
            per_page: filters.per_page || 15,
            current_page: 1,
            total_pages: 0
          }
        };
      }),
      catchError(error => {
        console.error('Error in getUsers:', error);
        throw error;
      })
    );
  }

  // Get user counts by status
  getUserCountsByStatus(): Observable<{[key: string]: number}> {
    return this.http.get<any>(`${this.apiUrl}/counts-by-status`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return { active: 0, pending: 0, inactive: 0 };
      })
    );
  }

  // Get a specific user by ID
  getUser(id: number): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'User not found');
      })
    );
  }

  // Create a new user
  addUser(user: UserCreationDto): Observable<User> {
    return this.http.post<any>(`${this.apiUrl}`, user).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to create user');
      })
    );
  }

  // Update an existing user
  updateUser(userData: User): Observable<User> {
    console.log('Updating user with data:', userData);
    console.log('Roles being sent:', userData.roles);
    
    return this.http.put<any>(`${this.apiUrl}/${userData.id}`, userData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            console.log('Update response:', response);
            return response.data;
          }
          throw new Error(response.message || 'Failed to update user');
        }),
        catchError(error => {
          console.error('Error updating user:', error);
          throw error;
        })
      );
  }

  // Delete a user
  deleteUser(id: number): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        return response.success || false;
      })
    );
  }

  // Assign roles to a user
  assignRoles(userId: number, roles: number[]): Observable<User> {
    console.log('Assigning roles:', { userId, roles });
    
    return this.http.post<any>(`${this.apiUrl}/${userId}/roles`, { roles }).pipe(
      map(response => {
        console.log('Role assignment response:', response);
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to assign roles');
      }),
      catchError(error => {
        console.error('Error assigning roles:', error);
        throw error;
      })
    );
  }

  // Get available roles
  getRoles(): Observable<Role[]> {
    return this.http.get<any>(`${environment.apiUrl}/roles`).pipe(
      map(response => {
        if (response.success && response.data) {
          // Handle both array response and paginated response
          return response.data.items || response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching roles:', error);
        return of([]);
      })
    );
  }

  // Get available statuses
  getStatuses(): Observable<string[]> {
    return this.http.get<any>(`${environment.apiUrl}/users/statuses`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return ['active', 'pending', 'inactive']; // Fallback default
      }),
      catchError(error => {
        console.error('Error fetching statuses:', error);
        // Return an observable of default values instead of throwing
        return of(['active', 'pending', 'inactive']);
      })
    );
  }

  // Reset user password
  resetUserPassword(userId: number, data: { password?: string, force_change?: boolean }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${userId}/reset-password`, data).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to reset user password');
      })
    );
  }
}