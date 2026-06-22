export function buildRawMaterialRows(workOrder, quantityProduced, itemsMap = {}) {
  if (!workOrder?.planned_raw_materials?.length) return []

  const produced = parseFloat(quantityProduced)
  const ratio =
    produced > 0 && workOrder.quantity_ordered > 0
      ? produced / workOrder.quantity_ordered
      : 0

  return workOrder.planned_raw_materials.map((planned) => {
    const calculated =
      ratio > 0
        ? Math.round(planned.total_quantity_required * ratio * 10000) / 10000
        : ''
    return {
      item_id: planned.item_id,
      itemName: itemsMap[planned.item_id]?.name ?? planned.item_id,
      unit: itemsMap[planned.item_id]?.unit_of_measure ?? '',
      plannedTotal: planned.total_quantity_required,
      quantity: calculated === '' ? '' : String(calculated),
    }
  })
}
