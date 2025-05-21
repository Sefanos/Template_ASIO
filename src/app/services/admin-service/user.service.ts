import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Role } from '../../models/role.model';
import { User, UserCreationDto } from '../../models/user.model'; // Added UserCreationDto import

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`; // Using the real API endpoint
  
  constructor(private http: HttpClient) { }

  // Get all users - now using real API
  getUsers(): Observable<User[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  // Get a user by ID
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

  // Add a new user
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
  updateUser(user: User): Observable<User> {
    return this.http.put<any>(`${this.apiUrl}/${user.id}`, user).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to update user');
      })
    );
  }

  // Delete a user
  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        return response.success || false;
      })
    );
  }

  // Get available roles
  getRoles(): Observable<Role[]> {
    return this.http.get<any>(`${environment.apiUrl}/roles`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  // Get available statuses
  getStatuses(): Observable<string[]> {
    // This endpoint might need to be created on your backend
    // For now, return some default statuses
    return new Observable(subscriber => {
      subscriber.next(['active', 'pending', 'suspended']);
      subscriber.complete();
    });
  }
}