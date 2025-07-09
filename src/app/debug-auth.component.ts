import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-debug-auth',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; background: #f5f5f5; margin: 10px; border-radius: 8px;">
      <h3>Authentication Debug Info</h3>
      <p><strong>Is Authenticated:</strong> {{ authService.isAuthenticated() }}</p>
      <p><strong>Has Token:</strong> {{ !!authService.token }}</p>
      <p><strong>Token (first 20 chars):</strong> {{ tokenPreview }}</p>
      <p><strong>Current User:</strong> {{ currentUserInfo }}</p>
      <p><strong>User Role:</strong> {{ authService.getUserRole() }}</p>
      
      <div style="margin-top: 20px;">
        <h4>LocalStorage Contents:</h4>
        <p><strong>auth_token:</strong> {{ getStorageItem('auth_token') ? 'Present' : 'Missing' }}</p>
        <p><strong>currentUser:</strong> {{ getStorageItem('currentUser') ? 'Present' : 'Missing' }}</p>
        <p><strong>token_expiry:</strong> {{ getStorageItem('token_expiry') || 'Not set' }}</p>
      </div>
      
      <button (click)="refreshDebugInfo()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Refresh Debug Info
      </button>
    </div>
  `
})
export class DebugAuthComponent {
  tokenPreview = '';
  currentUserInfo = '';

  constructor(public authService: AuthService) {
    this.refreshDebugInfo();
  }

  refreshDebugInfo() {
    const token = this.authService.token;
    this.tokenPreview = token ? token.substring(0, 20) + '...' : 'No token';
    
    const user = this.authService.currentUserValue;
    this.currentUserInfo = user ? `${user.name} (${user.email})` : 'No user';
  }

  getStorageItem(key: string): string | null {
    return localStorage.getItem(key);
  }
}
