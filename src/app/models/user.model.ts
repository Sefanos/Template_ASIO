import { Role } from './role.model';

export interface User {
  id: number;
  name: string;
  email: string;
  status: string;
  phoneNumber?: string;
  phone?: string; 
  roles: Role[] | number[];
  created_at?: string;
  updated_at?: string;
}

export interface UserCreationDto {
  name: string;
  email: string;
  status: string;
  phoneNumber?: string;
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