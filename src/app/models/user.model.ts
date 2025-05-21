import { Role } from './role.model';

export interface User {
  id: number;
  name: string;
  email: string;
  roles: (Role | number)[] | Role[] | number[];
  status: string;
  phone?: string;
  phoneNumber?: string; // Keep for backward compatibility, but use phone
  created_at?: string;
  updated_at?: string;
}

export interface UserCreationDto {
  name: string;
  email: string;
  status: string;
  phone?: string; // This matches what your Laravel backend expects
  roles: number[];
  password: string;
  password_confirmation: string;
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