export interface Role {
  id: number;
  name: string;
  code: string; // Important for role-based routing
  description?: string;
  permissions?: Permission[];
  permissionIds?: number[]; // For role creation/updating
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: number;
  name: string;
  code: string; // Permission code
  group: string; // Using group instead of category to match backend
  description?: string;
}