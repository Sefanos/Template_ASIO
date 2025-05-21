import { Role } from './role.model';

export function isRoleObject(role: any): role is Role {
  const result = typeof role === 'object' && role !== null && 'id' in role;
  console.log(`isRoleObject check: ${role} is ${result ? 'a role object' : 'not a role object'}`);
  return result;
}

export function getRoleCode(role: Role | number | string): string {
  if (typeof role === 'string') {
    console.log(`getRoleCode: Role is already a string code: ${role}`);
    return role;
  }
  
  if (isRoleObject(role)) {
    console.log(`getRoleCode: Extracted code ${role.code} from role object`);
    return role.code;
  }
  
  console.log(`getRoleCode: Role is a number ID: ${role}, returning 'unknown'`);
  return 'unknown';
}