import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    // Check authentication
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/login']);
    }
    
    // Get requirements
    const requiredRoles = route.data['roles'] as Array<string> || [];
    const requiredPermissions = route.data['permissions'] as Array<string> || [];
    
    // Check permissions first (more granular)
    if (requiredPermissions.length > 0) {
      const hasPermissions = this.authService.hasAnyPermission(requiredPermissions);
      if (hasPermissions) {
        return true;
      }
    }
    
    // Fallback to roles
    if (requiredRoles.length > 0) {
      const hasRole = this.authService.hasRole(requiredRoles);
      if (hasRole) {
        return true;
      }
    }
    
    // Default case
    if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
      return true;
    }
    
    return this.router.createUrlTree(['/unauthorized']);
  }
}