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

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/work-orders', label: 'Work Orders', icon: 'ClipboardList' },
  { path: '/items', label: 'Items', icon: 'Package' },
  { path: '/inventory', label: 'Inventory', icon: 'Warehouse' },
  { path: '/production', label: 'Production Tracking', icon: 'Factory' },
  { path: '/reports', label: 'Reports', icon: 'FileBarChart' },
  { path: '/users', label: 'User Management', icon: 'Users' },
]
