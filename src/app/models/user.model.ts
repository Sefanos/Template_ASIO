export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'suspended';
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  lastLogin?: string;
  createdAt?: string;
}