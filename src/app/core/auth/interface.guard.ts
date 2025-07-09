import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class InterfaceGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/login']);
    }
    
    const requiredInterface = route.data['interface'] as string;
    const userInterface = this.authService.getUserInterface();
    
    if (requiredInterface && userInterface === requiredInterface) {
      return true;
    }
    
    // Redirect to the proper interface
    if (userInterface) {
      return this.router.createUrlTree([`/${userInterface}/dashboard`]);
    }
    
    return this.router.createUrlTree(['/unauthorized']);
  }
}