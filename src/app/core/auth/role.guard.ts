import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Get the required roles from the route data
    const requiredRoles = route.data['roles'] as Array<string>;
    console.log('RoleGuard: checking roles', requiredRoles);
    
    if (!requiredRoles) {
      console.warn('RoleGuard: No roles specified in route data');
      return this.router.createUrlTree(['/login']);
    }
    
    // Check if user has the required role
    const hasRole = this.authService.hasRole(requiredRoles);
    console.log('RoleGuard: User has required role?', hasRole);
    
    if (hasRole) {
      return true;
    }
    
    // If user doesn't have the required role, redirect based on their actual role
    const userRole = this.authService.getUserRole();
    console.log('RoleGuard: User role is', userRole);
    
    // Important: Prevent potential infinite redirects
    const currentUrl = this.router.url;
    if ((userRole === 'admin' && currentUrl.startsWith('/admin')) || 
        (userRole === 'doctor' && currentUrl.startsWith('/doctor')) ||
        (userRole === 'patient' && currentUrl.startsWith('/patient')) ||
        (userRole === 'nurse' && currentUrl.startsWith('/receptionist')) ||
        (userRole === 'receptionist' && currentUrl.startsWith('/receptionist'))) {
      console.log('RoleGuard: Already in correct section, allowing access');
      return true;
    }
    
    try {
      // Redirect to appropriate dashboard based on role
      switch (userRole) {
        case 'admin':
          console.log('RoleGuard: Redirecting to admin dashboard');
          return this.router.createUrlTree(['/admin/dashboard']);
        case 'doctor':
          console.log('RoleGuard: Redirecting to doctor dashboard');
          return this.router.createUrlTree(['/doctor/dashboard']);
        case 'patient':
          console.log('RoleGuard: Redirecting to patient dashboard');
          return this.router.createUrlTree(['/patient/dashboard']);
        case 'nurse':
          console.log('RoleGuard: Redirecting to nurse dashboard');
          return this.router.createUrlTree(['/receptionist/dashboard']);
        case 'receptionist':
          console.log('RoleGuard: Redirecting to receptionist dashboard');
          return this.router.createUrlTree(['/receptionist/dashboard']);
        default:
          console.log('RoleGuard: Unknown role, redirecting to login');
          return this.router.createUrlTree(['/login']);
      }
    } catch (error) {
      console.error('RoleGuard: Navigation error', error);
      return this.router.createUrlTree(['/login']);
    }
  }
}