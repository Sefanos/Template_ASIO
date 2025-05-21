import { Role } from './role.model';

export interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
  roles: Role[];
  username?: string; // Keeping for backward compatibility
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  lastLogin?: string;
  created_at?: string;
  updated_at?: string;
}

// Add this interface to your existing user.model.ts file
export interface UserCreationDto extends Omit<User, 'id'> {
  id?: number;
  password?: string;
}

// Authentication response from backend
export interface AuthResponse {
  success: boolean;
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// Error response structure
export interface ErrorResponse {
  success: boolean;
  message: string;
  errors: {
    [key: string]: string[];
  };
}