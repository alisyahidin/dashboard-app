export const ROLES = ['admin', 'supervisor', 'officer'] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  'users:read',
  'users:write',
  'reports:read',
  'reports:write',
  'reports:approve',
  'reports:edit',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS.filter((permission) => permission !== 'reports:write'),
  supervisor: ['users:read', 'reports:read', 'reports:approve'],
  officer: ['reports:read', 'reports:write', 'reports:edit'],
};
