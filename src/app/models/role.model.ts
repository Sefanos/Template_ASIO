export interface Role {
  id: number;
  name: string;
  description?: string;
  permissionIds: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
}