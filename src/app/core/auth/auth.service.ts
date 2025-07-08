import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { getRoleCode } from '../../models/role-utils';
import { AuthResponse, User } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
  private tokenExpiryTimer: any;
  
  // New properties for permission handling
  private userPermissions: string[] = [];
  private userInterface: string | null = null;
  private permissionMap: {[key: string]: string[]} = {};
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check if we have stored user and token in localStorage
    this.loadStoredUserData();
    this.loadPermissionsData();
  }

  private loadStoredUserData(): void {
    const userData = localStorage.getItem('currentUser');
    const token = localStorage.getItem('auth_token');
    const tokenExpiry = localStorage.getItem('token_expiry');
    
    if (userData && token) {
      const user = JSON.parse(userData);
      this.currentUserSubject.next(user);
      
      // Set up token refresh if we have an expiry time
      if (tokenExpiry) {
        this.setupTokenExpiryTimer(new Date(tokenExpiry).getTime());
      }
    }
  }
  
  // New method to load permissions data
  private loadPermissionsData(): void {
    const permissionsData = localStorage.getItem('user_permissions');
    const interfaceData = localStorage.getItem('user_interface');
    const permissionMapData = localStorage.getItem('permission_map');
    
    if (permissionsData) {
      this.userPermissions = JSON.parse(permissionsData);
    }
    
    if (interfaceData) {
      this.userInterface = interfaceData;
    }
    
    if (permissionMapData) {
      this.permissionMap = JSON.parse(permissionMapData);
    }
  }
  
  private setupTokenExpiryTimer(expiryTime: number): void {
    // Clear any existing timer
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
    }
    
    const now = new Date().getTime();
    const timeToExpiry = expiryTime - now;
    
    // If token is already expired, force logout
    if (timeToExpiry <= 0) {
      this.logout();
      return;
    }
    
    // Set timer to refresh token 1 minute before expiry
    const refreshBuffer = 60 * 1000; // 1 minute
    const refreshTime = timeToExpiry - refreshBuffer;
    
    // Only set up refresh if the token is valid for more than the buffer
    if (refreshTime > 0) {
      this.tokenExpiryTimer = setTimeout(() => {
        this.refreshToken().subscribe();
      }, refreshTime);
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
  
  public get token(): string | null {
    return localStorage.getItem('auth_token');
  }

  public isAuthenticated(): boolean {
    return !!this.token && !!this.currentUserSubject.value;
  }
  
  public getUserRole(): string {
    if (!this.currentUserSubject.value || !this.currentUserSubject.value.roles || this.currentUserSubject.value.roles.length === 0) {
      return '';
    }
    // Return the code of the first role
    const role = this.currentUserSubject.value.roles[0];
    if (typeof role === 'object' && role !== null && 'code' in role) {
      return getRoleCode(role);
    } 
    return 'unknown'; // or some default value when role is just an ID
  }

  // New method to get user interface
  public getUserInterface(): string {
    // First try to get it from our stored property
    if (this.userInterface) {
      return this.userInterface;
    }
    
    // Then try to get it from the user object
    const user = this.currentUserValue;
    if (user && user.interface) {
      return user.interface;
    }
    
    // Fall back to role
    return this.getUserRole();
  }
  
  // New permission checking methods
  public hasPermission(permission: string): boolean {
    return this.userPermissions.includes(permission);
  }
  
  public hasAnyPermission(permissions: string[]): boolean {
    // Correctly handles empty permissions array
    if (!permissions || permissions.length === 0) {
      return true;
    }
    return permissions.some(permission => this.hasPermission(permission));
  }
  
  public hasAllPermissions(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) {
      return true; // No permissions required
    }
    return permissions.every(permission => this.hasPermission(permission));
  }
  
  // Get permissions for a specific module
  public getModulePermissions(module: string): string[] {
    return this.permissionMap[module] || [];
  }
  
  // Check if user has access to a specific module
  public hasModuleAccess(module: string): boolean {
    return !!this.permissionMap[module] && this.permissionMap[module].length > 0;
  }

  public hasRole(allowedRoles: string[]): boolean {
    const userRole = this.getUserRole();
    return allowedRoles.includes(userRole);
  }
  
  public getCurrentUser(): Observable<User | null> {
    return this.currentUser;
  }
  
  // Login method that integrates with backend
  public login(email: string, password: string): Observable<User> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        map(response => {
          this.handleAuthResponse(response);
          return response.user;
        }),
        catchError(error => {
          console.error('Login error:', error);
          let errorMessage = 'Invalid email or password';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          return throwError(() => new Error(errorMessage));
        })
      );
  }
  
  // Fetch current user data from backend
  public getMe(): Observable<User> {
    return this.http.get<any>(`${environment.apiUrl}/auth/me`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            const user = response.data;
            this.updateStoredUser(user);
            return user;
          }
          throw new Error('Failed to get user data');
        })
      );
  }
  
  // Refresh the token
  public refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {})
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          // If refresh fails, log the user out
          this.logout();
          return this.handleError(error);
        })
      );
  }
  
  // Logout - calls backend and clears local storage
  public logout(): void {
    // Clear the token expiry timer
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
    }
    
    // Call the backend logout endpoint if we have a token
    if (this.token) {
      this.http.post(`${environment.apiUrl}/auth/logout`, {})
        .pipe(
          catchError(() => {
            // Even if the backend logout fails, continue with local logout
            return new Observable(observer => observer.complete());
          })
        )
        .subscribe({
          next: () => this.completeLogout(),
          error: () => this.completeLogout()
        });
    } else {
      this.completeLogout();
    }
  }
  
  private completeLogout(): void {
    // Clear all authentication data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('user_interface');
    localStorage.removeItem('permission_map');
    
    // Clear the class properties
    this.userPermissions = [];
    this.userInterface = null;
    this.permissionMap = {};
    
    // Clear the current user subject
    this.currentUserSubject.next(null);
    
    // Navigate to login page
    window.location.href = '/login';
  }
  
  private handleAuthResponse(response: AuthResponse): void {
    if (response && response.success && response.access_token) {
      // Store token and user data
      localStorage.setItem('auth_token', response.access_token);
      
      // Calculate and store token expiry time
      const expiryTime = new Date().getTime() + (response.expires_in * 1000);
      localStorage.setItem('token_expiry', new Date(expiryTime).toISOString());
      
      // Setup token refresh timer
      this.setupTokenExpiryTimer(expiryTime);
      
      // Store permissions and interface data
      if (response.user && response.user.permissions) {
        localStorage.setItem('user_permissions', JSON.stringify(response.user.permissions));
        this.userPermissions = response.user.permissions;
      }
      
      if (response.permission_map) {
        localStorage.setItem('permission_map', JSON.stringify(response.permission_map));
        this.permissionMap = response.permission_map;
      }
      
      if (response.user && response.user.interface) {
        localStorage.setItem('user_interface', response.user.interface);
        this.userInterface = response.user.interface;
      }
      
      // Update the user
      this.updateStoredUser(response.user);
    }
  }
  
  private updateStoredUser(user: User): void {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
    }
  }
  
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.error && error.error.message) {
      // Backend error with message
      errorMessage = error.error.message;
    } else if (error.status) {
      // HTTP error
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized: Please log in again';
          break;
        case 403:
          errorMessage = 'Forbidden: You do not have permission to access this resource';
          break;
        case 404:
          errorMessage = 'Not found: The requested resource does not exist';
          break;
        case 500:
          errorMessage = 'Server error: Please try again later';
          break;
        default:
          errorMessage = `Server error: ${error.status}`;
      }
    }
    
    console.error('Auth error:', error);
    return throwError(() => new Error(errorMessage));
  }
}