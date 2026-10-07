export type AppRole =
  | 'SUPER_ADMIN'
  | 'INVENTORY_MANAGER'
  | 'ORDER_MANAGER'
  | 'INVENTORY_STAFF'
  | 'ORDER_STAFF';

export const SUPER_ADMIN_ROLE: AppRole = 'SUPER_ADMIN';
export const INVENTORY_MANAGER_ROLE: AppRole = 'INVENTORY_MANAGER';
export const ORDER_MANAGER_ROLE: AppRole = 'ORDER_MANAGER';
export const INVENTORY_STAFF_ROLE: AppRole = 'INVENTORY_STAFF';
export const ORDER_STAFF_ROLE: AppRole = 'ORDER_STAFF';

export const ALL_ROLES: AppRole[] = [
  SUPER_ADMIN_ROLE,
  INVENTORY_MANAGER_ROLE,
  ORDER_MANAGER_ROLE,
  INVENTORY_STAFF_ROLE,
  ORDER_STAFF_ROLE
];

export const MANAGER_ROLES: AppRole[] = [
  INVENTORY_MANAGER_ROLE,
  ORDER_MANAGER_ROLE
];

export const STAFF_ROLES: AppRole[] = [
  INVENTORY_STAFF_ROLE,
  ORDER_STAFF_ROLE
];


export function parseRole(raw: string | null | undefined): AppRole | null {

  if (!raw) {
    return null;
  }

  const normalised = raw.trim().toUpperCase() as AppRole;

  return ALL_ROLES.includes(normalised) ? normalised : null;
}
