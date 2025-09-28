// User role enum matching the database user_role type
export enum UserRole {
  USER = 'user',
  EXPERT = 'expert', 
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Permission interface
export interface Permission {
  resource: string;
  actions: string[];
}

// Define permissions for each role
export const PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    { resource: 'conversations', actions: ['read', 'create', 'update'] },
    { resource: 'messages', actions: ['read', 'create'] },
    { resource: 'profile', actions: ['read', 'update'] }
  ],
  [UserRole.EXPERT]: [
    { resource: 'conversations', actions: ['read', 'create', 'update'] },
    { resource: 'messages', actions: ['read', 'create'] },
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'knowledge', actions: ['read', 'create', 'update'] }
  ],
  [UserRole.ADMIN]: [
    { resource: 'conversations', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'messages', actions: ['read', 'create', 'delete'] },
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'users', actions: ['read', 'update'] },
    { resource: 'knowledge', actions: ['read', 'create', 'update', 'delete'] }
  ],
  [UserRole.SUPER_ADMIN]: [
    { resource: 'conversations', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'messages', actions: ['read', 'create', 'delete'] },
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'users', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'knowledge', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'system', actions: ['read', 'create', 'update', 'delete'] }
  ]
};

// Helper function to check if a role has permission
export function hasPermission(userRole: UserRole, resource: string, action: string): boolean {
  const rolePermissions = PERMISSIONS[userRole] || [];
  return rolePermissions.some(permission => 
    permission.resource === resource && permission.actions.includes(action)
  );
}

// Helper function to get all permissions for a role
export function getRolePermissions(role: UserRole): Permission[] {
  return PERMISSIONS[role] || [];
}

// Helper function to get all resources a role has access to
export function getRoleResources(role: UserRole): string[] {
  const permissions = getRolePermissions(role);
  const resources = permissions.map(p => p.resource);
  return Array.from(new Set(resources));
}
