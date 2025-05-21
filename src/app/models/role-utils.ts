import { Role } from './role.model';

export function isRoleObject(role: any): role is Role {
  return typeof role === 'object' && role !== null && 'id' in role;
}

export function getRoleCode(role: Role | number): string {
  if (isRoleObject(role)) {
    return role.code;
  }
  return 'unknown';
}