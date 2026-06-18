export const BACKEND_ROLES = {
  ADMIN: 'administrator',
  MANAGER: 'production_manager',
  WORKER: 'production_worker',
}

export const BACKEND_WORK_ORDER_STATUS = {
  STAGED: 'staged',
  SCHEDULED: 'scheduled',
  IN_PRODUCTION: 'in_production',
  PRODUCTION_COMPLETE: 'production_complete',
  FINALIZED: 'finalized',
}

export const BACKEND_ITEM_TYPES = {
  RAW_MATERIAL: 'raw_material',
  FINISHED_GOOD: 'finished_good',
}

export const USER_ROLES = {
  ADMIN: 'Administrator',
  MANAGER: 'Production Manager',
  WORKER: 'Production Worker',
}

export const WORK_ORDER_STATUS = {
  STAGED: 'Staged',
  SCHEDULED: 'Scheduled',
  IN_PRODUCTION: 'In Production',
  PRODUCTION_COMPLETE: 'Production Complete',
  FINALIZED: 'Finalized',
}

export const WORK_ORDER_STATUS_COLORS = {
  [WORK_ORDER_STATUS.STAGED]: 'bg-slate-100 text-slate-700',
  [WORK_ORDER_STATUS.SCHEDULED]: 'bg-blue-100 text-blue-700',
  [WORK_ORDER_STATUS.IN_PRODUCTION]: 'bg-amber-100 text-amber-700',
  [WORK_ORDER_STATUS.PRODUCTION_COMPLETE]: 'bg-emerald-100 text-emerald-700',
  [WORK_ORDER_STATUS.FINALIZED]: 'bg-violet-100 text-violet-700',
}

export const ITEM_TYPES = {
  RAW_MATERIAL: 'Raw Material',
  FINISHED_GOOD: 'Finished Good',
}

export const INVENTORY_STATUS = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
}

export const PRODUCTION_LINES = ['Line A', 'Line B', 'Line C', 'Line D']

export const ROLE_HIERARCHY = {
  [BACKEND_ROLES.ADMIN]: 3,
  [BACKEND_ROLES.MANAGER]: 2,
  [BACKEND_ROLES.WORKER]: 1,
}

export const NAV_ITEMS = [
  {
    path: '/',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    minRole: BACKEND_ROLES.WORKER,
  },
  {
    path: '/work-orders',
    label: 'Work Orders',
    icon: 'ClipboardList',
    minRole: BACKEND_ROLES.WORKER,
  },
  {
    path: '/items',
    label: 'Items',
    icon: 'Package',
    minRole: BACKEND_ROLES.WORKER,
  },
  {
    path: '/inventory',
    label: 'Inventory',
    icon: 'Warehouse',
    minRole: BACKEND_ROLES.WORKER,
  },
  {
    path: '/production',
    label: 'Production Tracking',
    icon: 'Factory',
    minRole: BACKEND_ROLES.WORKER,
  },
  {
    path: '/pallets',
    label: 'Pallets',
    icon: 'Boxes',
    minRole: BACKEND_ROLES.WORKER,
  },
  {
    path: '/warehouse',
    label: 'Warehouse',
    icon: 'MapPin',
    minRole: BACKEND_ROLES.WORKER,
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: 'FileBarChart',
    minRole: BACKEND_ROLES.MANAGER,
  },
  {
    path: '/users',
    label: 'User Management',
    icon: 'Users',
    minRole: BACKEND_ROLES.MANAGER,
  },
]

export const REPORT_DEFINITIONS = [
  {
    id: 'daily-production',
    name: 'Daily Production Report',
    description: 'Summary of units produced across all lines for the current day',
    format: 'JSON',
    fetcher: 'dailyProduction',
  },
  {
    id: 'inventory-status',
    name: 'Inventory Status Report',
    description: 'Current stock levels, locations, and low-stock alerts',
    format: 'JSON',
    fetcher: 'inventoryStatus',
  },
  {
    id: 'completed-work-orders',
    name: 'Completed Work Orders Report',
    description: 'List of finalized and production-complete work orders',
    format: 'JSON',
    fetcher: 'completedWorkOrders',
  },
  {
    id: 'production-activity',
    name: 'Production Activity Report',
    description: 'Detailed production history with shift and operator data',
    format: 'JSON',
    fetcher: 'productionActivity',
  },
]

export function hasMinRole(userRole, minimumRole) {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[minimumRole] ?? 0)
}

export function getNavItemsForRole(userRole) {
  return NAV_ITEMS.filter((item) => hasMinRole(userRole, item.minRole))
}
