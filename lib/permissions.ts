type Permission = string;
type Role = string;

export const PERMISSIONS: { [key: string]: Permission } = {
  // Droplet permissions
  VIEW_DROPLETS: "view_droplets",
  CREATE_DROPLET: "create_droplet",
  EDIT_DROPLET: "edit_droplet",
  DELETE_DROPLET: "delete_droplet",
  POWER_DROPLET: "power_droplet",

  // Firewall permissions
  VIEW_FIREWALLS: "view_firewalls",
  CREATE_FIREWALL: "create_firewall",
  EDIT_FIREWALL: "edit_firewall",
  DELETE_FIREWALL: "delete_firewall",

  // User permissions
  VIEW_USERS: "view_users",
  CREATE_USER: "create_user",
  EDIT_USER: "edit_user",
  DELETE_USER: "delete_user",

  // Role permissions
  VIEW_ROLES: "view_roles",
  CREATE_ROLE: "create_role",
  EDIT_ROLE: "edit_role",
  DELETE_ROLE: "delete_role",

  // Settings permissions
  VIEW_SETTINGS: "view_settings",
  EDIT_SETTINGS: "edit_settings",
  
  // Server configuration permissions
  VIEW_SERVER_CONFIGS: "view_server_configs",
  EDIT_SERVER_CONFIGS: "edit_server_configs",
};

export const ROLES: { [key: string]: Role } = {
  ADMIN: "admin",
  USER: "user",
  SUPPORT: "support",
  READONLY: "readonly",
};

export const DEFAULT_ROLE_PERMISSIONS: { [key: string]: Permission[] } = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.USER]: [
    PERMISSIONS.VIEW_DROPLETS,
    PERMISSIONS.CREATE_DROPLET,
    PERMISSIONS.EDIT_DROPLET,
    PERMISSIONS.POWER_DROPLET,
    PERMISSIONS.VIEW_FIREWALLS,
    PERMISSIONS.CREATE_FIREWALL,
    PERMISSIONS.EDIT_FIREWALL,
  ],
  [ROLES.SUPPORT]: [
    PERMISSIONS.VIEW_DROPLETS,
    PERMISSIONS.POWER_DROPLET,
    PERMISSIONS.VIEW_FIREWALLS,
    PERMISSIONS.VIEW_USERS,
  ],
  [ROLES.READONLY]: [PERMISSIONS.VIEW_DROPLETS, PERMISSIONS.VIEW_FIREWALLS],
};

export function hasPermission(userPermissions: string, permission: string): boolean {
  if (!userPermissions) return false;
  try {
    const permissions = JSON.parse(userPermissions) as string[];
    return permissions.includes(permission);
  } catch (e) {
    return false;
  }
}

export function hasAnyPermission(userPermissions: string, permissions: string[]): boolean {
  if (!userPermissions) return false;
  try {
    const userPerms = JSON.parse(userPermissions) as string[];
    return permissions.some((permission) => userPerms.includes(permission));
  } catch (e) {
    return false;
  }
}

export function hasAllPermissions(userPermissions: string, permissions: string[]): boolean {
  if (!userPermissions) return false;
  try {
    const userPerms = JSON.parse(userPermissions) as string[];
    return permissions.every((permission) => userPerms.includes(permission));
  } catch (e) {
    return false;
  }
}

