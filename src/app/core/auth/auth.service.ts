import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
    constructor(private router: Router) {
    // Check if we have a stored user in localStorage
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
  public getUserRole(): string {
    return this.currentUserSubject.value?.role || '';
  }

  public hasRole(allowedRoles: string[]): boolean {
    const userRole = this.getUserRole();
    return allowedRoles.includes(userRole);
  }
  
  public getCurrentUser(): Observable<User | null> {
    return this.currentUser;
  }  public login(username: string, password: string): Promise<boolean> {
    // Here you would normally make an API call to authenticate the user
    // For demo purposes, we'll use some hardcoded users
    console.log('AuthService: login attempt for', username);
    
    return new Promise((resolve) => {
      // We'll make this synchronous to avoid potential timing issues
      try {
        if (username === 'doctor' && password === 'password') {
          const user: User = {
            id: 1,
            username: 'doctor',
            email: 'doctor@example.com',
            firstName: 'John',
            lastName: 'Smith',
            role: 'doctor',
            status: 'active'
          };
          
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
          console.log('AuthService: doctor login successful');
          resolve(true);
        } else if (username === 'admin' && password === 'password') {
          const user: User = {
            id: 2,
            username: 'admin',
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            status: 'active'
          };
          
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
          console.log('AuthService: admin login successful');
          resolve(true);
        } else {
          console.log('AuthService: login failed - invalid credentials');
          resolve(false);
        }
      } catch (error) {
        console.error('AuthService: login error', error);
        resolve(false);
      }
    });
  }

  public logout(): void {
  console.log('AuthService: logging out user');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('currentRole');
  localStorage.removeItem('authToken');
  
  // Navigate to login page
  this.router.navigate(['/login']);
}
}