import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'api/users'; // Replace with your actual API endpoint
  
  // Dummy data for development
  private users: User[] = [
    { id: 1, username: 'admin', email: 'admin@hospital.com', role: 'Administrator', status: 'active', firstName: 'Admin', lastName: 'User', lastLogin: '2023-05-10 09:25' },
    { id: 2, username: 'doctor1', email: 'smith@hospital.com', role: 'Doctor', status: 'active', firstName: 'John', lastName: 'Smith', lastLogin: '2023-05-09 15:40' },
    { id: 3, username: 'nurse1', email: 'jones@hospital.com', role: 'Nurse', status: 'active', firstName: 'Emily', lastName: 'Jones', lastLogin: '2023-05-10 08:15' },
    { id: 4, username: 'reception1', email: 'williams@hospital.com', role: 'Receptionist', status: 'active', firstName: 'Robert', lastName: 'Williams', lastLogin: '2023-05-10 08:00' },
    { id: 5, username: 'pharmacy1', email: 'taylor@hospital.com', role: 'Pharmacist', status: 'pending', firstName: 'Sarah', lastName: 'Taylor', lastLogin: 'Never' },
    { id: 6, username: 'finance1', email: 'brown@hospital.com', role: 'Finance', status: 'suspended', firstName: 'Michael', lastName: 'Brown', lastLogin: '2023-05-01 13:20' },
    { id: 7, username: 'doctor2', email: 'miller@hospital.com', role: 'Doctor', status: 'active', firstName: 'Lisa', lastName: 'Miller', lastLogin: '2023-05-09 16:30' },
    { id: 8, username: 'nurse2', email: 'davis@hospital.com', role: 'Nurse', status: 'pending', firstName: 'James', lastName: 'Davis', lastLogin: 'Never' },
    { id: 9, username: 'tech1', email: 'wilson@hospital.com', role: 'Technician', status: 'suspended', firstName: 'David', lastName: 'Wilson', lastLogin: '2023-04-28 10:45' },
    { id: 10, username: 'admin2', email: 'evans@hospital.com', role: 'Administrator', status: 'active', firstName: 'Jennifer', lastName: 'Evans', lastLogin: '2023-05-10 09:00' },
    { id: 11, username: 'doctor3', email: 'thomas@hospital.com', role: 'Doctor', status: 'active', firstName: 'Richard', lastName: 'Thomas', lastLogin: '2023-05-10 11:20' },
    { id: 12, username: 'nurse3', email: 'roberts@hospital.com', role: 'Nurse', status: 'suspended', firstName: 'Mary', lastName: 'Roberts', lastLogin: '2023-04-15 09:30' },
    { id: 13, username: 'doctor4', email: 'johnson@hospital.com', role: 'Doctor', status: 'active', firstName: 'William', lastName: 'Johnson', lastLogin: '2023-05-10 10:15' },
    { id: 14, username: 'intern1', email: 'adams@hospital.com', role: 'Intern', status: 'pending', firstName: 'Daniel', lastName: 'Adams', lastLogin: 'Never' },
    { id: 15, username: 'reception2', email: 'lewis@hospital.com', role: 'Receptionist', status: 'active', firstName: 'Nancy', lastName: 'Lewis', lastLogin: '2023-05-09 08:45' }
  ];

  constructor(private http: HttpClient) { }

  // Get all users - with fallback to dummy data if http fails
  getUsers(): Observable<User[]> {
    // For development, use dummy data
    // In production, you would use: return this.http.get<User[]>(this.apiUrl);
    return of(this.users);
  }

  // Get a user by ID
  getUser(id: number): Observable<User | undefined> {
    // For production: return this.http.get<User>(`${this.apiUrl}/${id}`);
    const user = this.users.find(u => u.id === id);
    return of(user);
  }

  // Add a new user
  addUser(user: User): Observable<User> {
    // For production: return this.http.post<User>(this.apiUrl, user);
    const newUser = {
      ...user,
      id: this.getNextId()
    };
    this.users.push(newUser);
    return of(newUser);
  }

  // Update an existing user
  updateUser(user: User): Observable<User> {
    // For production: return this.http.put<User>(`${this.apiUrl}/${user.id}`, user);
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index] = user;
    }
    return of(user);
  }

  // Delete a user
  deleteUser(id: number): Observable<boolean> {
    // For production: return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  // Get available roles
  getRoles(): Observable<string[]> {
    return of([
      'Administrator',
      'Doctor',
      'Nurse',
      'Receptionist',
      'Pharmacist',
      'Technician',
      'Finance',
      'Intern'
    ]);
  }

  // Get available statuses
  getStatuses(): Observable<string[]> {
    return of(['active', 'pending', 'suspended']);
  }

  // Helper method to get next available ID
  private getNextId(): number {
    return Math.max(...this.users.map(user => user.id)) + 1;
  }
}