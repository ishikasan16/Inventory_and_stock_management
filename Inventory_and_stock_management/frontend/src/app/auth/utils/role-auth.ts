import { Task, TaskTargetType } from '../../services/task.service';
import { currentUser } from './auth-state';
import {ALL_ROLES,AppRole,INVENTORY_MANAGER_ROLE,INVENTORY_STAFF_ROLE,MANAGER_ROLES,ORDER_MANAGER_ROLE,ORDER_STAFF_ROLE,STAFF_ROLES,SUPER_ADMIN_ROLE} from './role-model';

export {
  ALL_ROLES,
  AppRole,
  INVENTORY_MANAGER_ROLE,
  INVENTORY_STAFF_ROLE,
  MANAGER_ROLES,
  ORDER_MANAGER_ROLE,
  ORDER_STAFF_ROLE,
  STAFF_ROLES,
  SUPER_ADMIN_ROLE,
  parseRole
} from './role-model';

export const ROUTE_ROLES: Record<string, AppRole[]> = {
  superAdmin: [SUPER_ADMIN_ROLE],
  managers: [SUPER_ADMIN_ROLE, ...MANAGER_ROLES],
  inventory: [SUPER_ADMIN_ROLE, INVENTORY_MANAGER_ROLE, INVENTORY_STAFF_ROLE],
  orders: [SUPER_ADMIN_ROLE, ORDER_MANAGER_ROLE, ORDER_STAFF_ROLE, INVENTORY_MANAGER_ROLE],
  predictions: [SUPER_ADMIN_ROLE, ORDER_MANAGER_ROLE, ORDER_STAFF_ROLE, INVENTORY_MANAGER_ROLE],
  products: [SUPER_ADMIN_ROLE, INVENTORY_MANAGER_ROLE, INVENTORY_STAFF_ROLE, ORDER_MANAGER_ROLE],
  everyone: ALL_ROLES
};

export function currentRole(): AppRole | null {
  return currentUser()?.role ?? null;
}

export function hasRoles(...roles: AppRole[]): boolean {

  const role = currentRole();

  return role !== null && roles.includes(role);
}

export function isSuperAdmin(): boolean {
  return currentRole() === SUPER_ADMIN_ROLE;
}

export function isInventoryManager(): boolean {
  return currentRole() === INVENTORY_MANAGER_ROLE;
}

export function isOrderManager(): boolean {
  return currentRole() === ORDER_MANAGER_ROLE;
}

export function isInventoryStaff(): boolean {
  return currentRole() === INVENTORY_STAFF_ROLE;
}

export function isOrderStaff(): boolean {
  return currentRole() === ORDER_STAFF_ROLE;
}

export function isManager(): boolean {
  return hasRoles(SUPER_ADMIN_ROLE, ...MANAGER_ROLES);
}

export function isStaff(): boolean {
  return hasRoles(...STAFF_ROLES);
}

// Whether the current user is a worker (staff) or a manager (super admin or manager role)
export function isWorker(): boolean {
  return isStaff();
}

// Portfolio-wide inventory write access
export function canManageInventory(): boolean {
  return isSuperAdmin() || isInventoryManager();
}

// View the products catalog (order staff excluded)
export function canViewProducts(): boolean {
  return isSuperAdmin() || isInventoryManager() || isInventoryStaff() || isOrderManager();
}

export function canViewCategories(): boolean {
  return isSuperAdmin() || isInventoryManager() || isInventoryStaff();
}

export function canManageCategories(): boolean {
  return isSuperAdmin() || isInventoryManager();
}

export function canViewSuppliers(): boolean {
  return isSuperAdmin() || isInventoryManager() || isInventoryStaff();
}

export function canManageSuppliers(): boolean {
  return isSuperAdmin() || isInventoryManager();
}

export function canManageOrders(): boolean {
  return isSuperAdmin() || isOrderManager();
}

export function canViewOrders(): boolean {
  return isSuperAdmin() || isOrderManager() || isOrderStaff() || isInventoryManager();
}

export function canTransitionOrderStatus(): boolean {
  return isSuperAdmin() || isOrderManager() || isOrderStaff();
}

export function canViewCustomers(): boolean {
  return isSuperAdmin() || isOrderManager() || isOrderStaff();
}

export function canManageCustomers(): boolean {
  return isSuperAdmin() || isOrderManager();
}

export function canManageTasks(): boolean {
  return isSuperAdmin() || isManager();
}

export function canViewPredictions(): boolean {
  return isSuperAdmin() || isOrderManager() || isOrderStaff() || isInventoryManager();
}

export function hasFullInventoryAccess(): boolean {
  return canManageInventory();
}

export function roleLabel(role: string): string {
  return (role || '').toUpperCase().replace(/_/g, ' ');
}


// Active (non-COMPLETED) tasks that reference a specific record
function activeTargets(tasks: Task[]): Set<string> {
  const set = new Set<string>();

  tasks.forEach((task) => {
    if (
      task.status === 'COMPLETED' ||
      !task.target_id ||
      task.target_type === 'NONE'
    ) {
      return;
    }

    set.add(`${task.target_type}:${task.target_id}`);
  });

  return set;
}

// Active tasks that authorize creating a record of the given type
function activeCreateTypes(tasks: Task[]): Set<string> {
  const set = new Set<string>();

  tasks.forEach((task) => {
    if (
      task.status === 'COMPLETED' ||
      task.target_type === 'NONE'
    ) {
      return;
    }

    set.add(task.target_type);
  });

  return set;
}

// Whether a worker may edit / delete / adjust the given record.
// Staff must be covered by an active task; managers use canManage instead.
export function canEditRecord(
  tasks: Task[],
  targetType: TaskTargetType,
  targetId: string
): boolean {
  if (!isWorker()) {
    return false;
  }

  return activeTargets(tasks).has(`${targetType}:${targetId}`);
}


export function canCreateRecord(
  tasks: Task[],
  targetType: TaskTargetType
): boolean {
  if (!isWorker()) {
    return false;
  }

  return activeCreateTypes(tasks).has(targetType);
}