import {
  USER_ROLES,
  WORK_ORDER_STATUS,
  ITEM_TYPES,
  INVENTORY_STATUS,
  BACKEND_ROLES,
  BACKEND_WORK_ORDER_STATUS,
  BACKEND_ITEM_TYPES,
} from '../constants'
import { formatDate, formatDateTime, formatRelativeTime } from './format'

export function mapWorkOrderStatus(status) {
  const map = {
    [BACKEND_WORK_ORDER_STATUS.STAGED]: WORK_ORDER_STATUS.STAGED,
    [BACKEND_WORK_ORDER_STATUS.SCHEDULED]: WORK_ORDER_STATUS.SCHEDULED,
    [BACKEND_WORK_ORDER_STATUS.IN_PRODUCTION]: WORK_ORDER_STATUS.IN_PRODUCTION,
    [BACKEND_WORK_ORDER_STATUS.PRODUCTION_COMPLETE]: WORK_ORDER_STATUS.PRODUCTION_COMPLETE,
    [BACKEND_WORK_ORDER_STATUS.FINALIZED]: WORK_ORDER_STATUS.FINALIZED,
  }
  return map[status] || status
}

export function workOrderStatusToBackend(displayStatus) {
  const map = {
    [WORK_ORDER_STATUS.STAGED]: BACKEND_WORK_ORDER_STATUS.STAGED,
    [WORK_ORDER_STATUS.SCHEDULED]: BACKEND_WORK_ORDER_STATUS.SCHEDULED,
    [WORK_ORDER_STATUS.IN_PRODUCTION]: BACKEND_WORK_ORDER_STATUS.IN_PRODUCTION,
    [WORK_ORDER_STATUS.PRODUCTION_COMPLETE]: BACKEND_WORK_ORDER_STATUS.PRODUCTION_COMPLETE,
    [WORK_ORDER_STATUS.FINALIZED]: BACKEND_WORK_ORDER_STATUS.FINALIZED,
    Staged: BACKEND_WORK_ORDER_STATUS.STAGED,
    Scheduled: BACKEND_WORK_ORDER_STATUS.SCHEDULED,
    'In Production': BACKEND_WORK_ORDER_STATUS.IN_PRODUCTION,
    'Production Complete': BACKEND_WORK_ORDER_STATUS.PRODUCTION_COMPLETE,
    Finalized: BACKEND_WORK_ORDER_STATUS.FINALIZED,
  }
  return map[displayStatus] || null
}

export function mapUserRole(role) {
  const map = {
    [BACKEND_ROLES.ADMIN]: USER_ROLES.ADMIN,
    [BACKEND_ROLES.MANAGER]: USER_ROLES.MANAGER,
    [BACKEND_ROLES.WORKER]: USER_ROLES.WORKER,
  }
  return map[role] || role
}

export function userRoleToBackend(displayRole) {
  const map = {
    [USER_ROLES.ADMIN]: BACKEND_ROLES.ADMIN,
    [USER_ROLES.MANAGER]: BACKEND_ROLES.MANAGER,
    [USER_ROLES.WORKER]: BACKEND_ROLES.WORKER,
  }
  return map[displayRole] || displayRole
}

export function mapItemType(itemType) {
  const map = {
    [BACKEND_ITEM_TYPES.RAW_MATERIAL]: ITEM_TYPES.RAW_MATERIAL,
    [BACKEND_ITEM_TYPES.FINISHED_GOOD]: ITEM_TYPES.FINISHED_GOOD,
  }
  return map[itemType] || itemType
}

export function itemTypeToBackend(displayType) {
  const map = {
    [ITEM_TYPES.RAW_MATERIAL]: BACKEND_ITEM_TYPES.RAW_MATERIAL,
    [ITEM_TYPES.FINISHED_GOOD]: BACKEND_ITEM_TYPES.FINISHED_GOOD,
    'Raw Materials': BACKEND_ITEM_TYPES.RAW_MATERIAL,
    'Finished Goods': BACKEND_ITEM_TYPES.FINISHED_GOOD,
  }
  return map[displayType] || null
}

export function buildLookup(items, key = 'id') {
  return Object.fromEntries(items.map((item) => [item[key], item]))
}

export function mapWorkOrder(wo, itemsMap = {}, usersMap = {}) {
  const item = itemsMap[wo.item_id]
  const assignee = usersMap[wo.assigned_to]
  return {
    id: wo.work_order_number || wo.id,
    workOrderId: wo.id,
    itemName: item?.name ?? '—',
    sku: item?.sku ?? '—',
    quantity: wo.quantity_ordered,
    produced: wo.quantity_completed,
    productionLine: wo.production_line ?? '—',
    status: mapWorkOrderStatus(wo.status),
    assignedTo: assignee?.full_name ?? '—',
    scheduledDate: formatDate(wo.scheduled_date),
    dueDate: formatDate(wo.end_date),
    priority: '—',
    raw: wo,
  }
}

export function mapItem(item) {
  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    description: item.description ?? '—',
    type: mapItemType(item.item_type),
    quantity: item.quantity_available,
    unit: item.unit_of_measure,
    reorderLevel: item.reorder_level,
    isActive: item.is_active,
    raw: item,
  }
}

export function mapInventoryRow(row) {
  return {
    id: row.item_id,
    itemName: row.name,
    sku: row.sku,
    type: mapItemType(row.item_type),
    quantity: row.quantity_available,
    unit: row.unit_of_measure,
    warehouseLocation: '—',
    status: row.below_reorder_level
      ? INVENTORY_STATUS.LOW_STOCK
      : row.quantity_available <= 0
        ? INVENTORY_STATUS.OUT_OF_STOCK
        : INVENTORY_STATUS.IN_STOCK,
    lastUpdated: '—',
    raw: row,
  }
}

export function mapProductionRecord(record, workOrdersMap = {}, itemsMap = {}, usersMap = {}) {
  const workOrder = workOrdersMap[record.work_order_id]
  const item = workOrder ? itemsMap[workOrder.item_id] : null
  const recorder = usersMap[record.recorded_by]
  return {
    id: record.id,
    workOrderId: workOrder?.work_order_number ?? record.work_order_id,
    itemName: item?.name ?? '—',
    productionLine: workOrder?.production_line ?? '—',
    quantityProduced: record.quantity_produced,
    shift: '—',
    recordedBy: recorder?.full_name ?? record.recorded_by,
    timestamp: formatDateTime(record.recorded_at),
    raw: record,
  }
}

export function mapUser(user) {
  return {
    id: user.id,
    name: user.full_name,
    username: user.username,
    email: user.email,
    role: mapUserRole(user.role),
    status: user.is_active ? 'Active' : 'Inactive',
    lastLogin: '—',
    raw: user,
  }
}

export function mapDashboardSummary(data) {
  return {
    totalWorkOrders: data.total_work_orders ?? 0,
    activeWorkOrders: data.active_work_orders ?? 0,
    inventoryItems: data.inventory_summary?.total_items ?? 0,
    lowStockItems: data.inventory_summary?.items_below_reorder_level ?? 0,
    productionOutput: data.production_statistics?.total_quantity_produced ?? 0,
    recentActivities: (data.recent_activities ?? []).map((activity, index) => ({
      id: `${activity.activity_type}-${activity.reference_id}-${index}`,
      action: activity.description,
      user: 'System',
      time: formatRelativeTime(activity.timestamp),
    })),
    raw: data,
  }
}

export function mapPallet(pallet, itemsMap = {}, locationsMap = {}) {
  const item = itemsMap[pallet.item_id]
  const location = locationsMap[pallet.warehouse_location_id]
  return {
    id: pallet.pallet_number || pallet.id,
    palletId: pallet.id,
    workOrderId: pallet.work_order_id,
    itemName: item?.name ?? '—',
    quantity: pallet.quantity,
    status: pallet.status,
    location: location?.location_code ?? '—',
    createdAt: formatDateTime(pallet.created_at),
    raw: pallet,
  }
}

export function mapWarehouseLocation(location) {
  return {
    id: location.id,
    locationCode: location.location_code,
    zone: location.zone ?? '—',
    aisle: location.aisle ?? '—',
    rack: location.rack ?? '—',
    capacity: location.capacity,
    palletCount: location.current_pallet_count,
    status: location.is_active ? 'Active' : 'Inactive',
    createdAt: formatDateTime(location.created_at),
    raw: location,
  }
}

export function mapBom(bom, itemsMap = {}) {
  const finishedGood = itemsMap[bom.finished_good_id]
  return {
    id: bom.id,
    finishedGoodId: bom.finished_good_id,
    finishedGoodName: finishedGood?.name ?? bom.finished_good_id,
    finishedGoodSku: finishedGood?.sku ?? '—',
    version: bom.version,
    lineCount: bom.lines?.length ?? 0,
    isActive: bom.is_active,
    lines: (bom.lines ?? []).map((line) => {
      const item = itemsMap[line.item_id]
      return {
        itemId: line.item_id,
        itemName: item?.name ?? line.item_id,
        sku: item?.sku ?? '—',
        quantityPerUnit: line.quantity_per_unit,
        wastePercent: line.waste_percent ?? 0,
      }
    }),
    createdAt: formatDateTime(bom.created_at),
    raw: bom,
  }
}

export function mapInventoryTransaction(tx, itemsMap = {}) {
  const item = itemsMap[tx.item_id]
  return {
    id: tx.id,
    itemName: item?.name ?? tx.item_id,
    sku: item?.sku ?? '—',
    transactionType: tx.transaction_type?.replace(/_/g, ' ') ?? '—',
    quantityChange: tx.quantity_change,
    quantityAfter: tx.quantity_after,
    notes: tx.notes ?? '—',
    createdAt: formatDateTime(tx.created_at),
    raw: tx,
  }
}

