import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import ScrollReveal from '../components/ui/ScrollReveal'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { FormField, SelectInput, TextArea, TextInput } from '../components/ui/FormField'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import { getProductionHistory, recordProduction } from '../api/production'
import { getWorkOrders } from '../api/workOrders'
import { getItems } from '../api/items'
import { getUsers } from '../api/users'
import { getErrorMessage } from '../api/client'
import {
  buildLookup,
  mapProductionRecord,
  mapWorkOrder,
} from '../utils/mappers'
import { buildRawMaterialRows } from '../utils/productionHelpers'
import { BACKEND_WORK_ORDER_STATUS } from '../constants'

export default function ProductionTracking() {
  const queryClient = useQueryClient()
  const { isManagerOrAdmin } = useAuth()
  const [recordOpen, setRecordOpen] = useState(false)
  const [form, setForm] = useState({
    work_order_id: '',
    quantity_produced: '',
    notes: '',
  })
  const [rawMaterials, setRawMaterials] = useState([])
  const [formError, setFormError] = useState('')

  const productionQuery = useQuery({
    queryKey: ['production', 'history'],
    queryFn: () => getProductionHistory(),
  })

  const workOrdersQuery = useQuery({
    queryKey: ['work-orders'],
    queryFn: () => getWorkOrders(),
  })

  const itemsQuery = useQuery({
    queryKey: ['items'],
    queryFn: () => getItems({ active_only: true }),
  })

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
    enabled: isManagerOrAdmin,
  })

  const itemsMap = buildLookup(itemsQuery.data ?? [])
  const usersMap = buildLookup(usersQuery.data ?? [])
  const workOrdersRawMap = buildLookup(workOrdersQuery.data ?? [])

  const inProductionOrders = useMemo(
    () =>
      (workOrdersQuery.data ?? []).filter(
        (wo) => wo.status === BACKEND_WORK_ORDER_STATUS.IN_PRODUCTION
      ),
    [workOrdersQuery.data]
  )

  const selectedWorkOrder = workOrdersRawMap[form.work_order_id]

  useEffect(() => {
    if (!selectedWorkOrder) {
      setRawMaterials([])
      return
    }
    const lookup = buildLookup(itemsQuery.data ?? [])
    setRawMaterials(
      buildRawMaterialRows(selectedWorkOrder, form.quantity_produced, lookup)
    )
  }, [selectedWorkOrder, form.quantity_produced, itemsQuery.data])

  const recordMutation = useMutation({
    mutationFn: () => {
      const payload = {
        work_order_id: form.work_order_id,
        quantity_produced: parseFloat(form.quantity_produced),
        notes: form.notes.trim() || null,
      }

      if (rawMaterials.length > 0) {
        payload.raw_materials_consumed = rawMaterials
          .filter((row) => parseFloat(row.quantity) > 0)
          .map((row) => ({
            item_id: row.item_id,
            quantity: parseFloat(row.quantity),
          }))
      }

      return recordProduction(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production'] })
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setRecordOpen(false)
      setForm({ work_order_id: '', quantity_produced: '', notes: '' })
      setRawMaterials([])
      setFormError('')
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const isLoading =
    productionQuery.isLoading ||
    workOrdersQuery.isLoading ||
    itemsQuery.isLoading ||
    (isManagerOrAdmin && usersQuery.isLoading)

  const error =
    productionQuery.error ||
    workOrdersQuery.error ||
    itemsQuery.error ||
    (isManagerOrAdmin ? usersQuery.error : null)

  const inProduction = useMemo(() => {
    return inProductionOrders.map((wo) => mapWorkOrder(wo, itemsMap, usersMap))
  }, [inProductionOrders, itemsMap, usersMap])

  const productionRecords = useMemo(() => {
    return (productionQuery.data ?? []).map((record) =>
      mapProductionRecord(record, workOrdersRawMap, itemsMap, usersMap)
    )
  }, [productionQuery.data, workOrdersRawMap, itemsMap, usersMap])

  const openRecordModal = () => {
    const firstWo = inProductionOrders[0]
    setForm({
      work_order_id: firstWo?.id ?? '',
      quantity_produced: '',
      notes: '',
    })
    setFormError('')
    setRecordOpen(true)
  }

  const handleWorkOrderChange = (workOrderId) => {
    setForm((prev) => ({ ...prev, work_order_id: workOrderId, quantity_produced: '' }))
  }

  const updateRawMaterialQuantity = (index, quantity) => {
    setRawMaterials((rows) =>
      rows.map((row, i) => (i === index ? { ...row, quantity } : row))
    )
  }

  const recordColumns = [
    { key: 'id', label: 'Record ID' },
    { key: 'workOrderId', label: 'Work Order' },
    { key: 'itemName', label: 'Item' },
    { key: 'productionLine', label: 'Line' },
    {
      key: 'quantityProduced',
      label: 'Qty Produced',
      render: (row) => (
        <span className="font-medium text-emerald-700">+{row.quantityProduced}</span>
      ),
    },
    { key: 'recordedBy', label: 'Recorded By' },
    { key: 'timestamp', label: 'Timestamp' },
  ]

  const activeColumns = [
    { key: 'id', label: 'Work Order' },
    { key: 'itemName', label: 'Item' },
    { key: 'productionLine', label: 'Line' },
    {
      key: 'progress',
      label: 'Progress',
      render: (row) => {
        const pct = row.quantity ? Math.round((row.produced / row.quantity) * 100) : 0
        return (
          <div>
            <div className="mb-1 h-2 w-32 overflow-hidden rounded-full bg-slate-200">
              <div
                className="progress-fill h-full rounded-full bg-emerald-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">
              {row.produced}/{row.quantity} ({pct}%)
            </span>
          </div>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return <ErrorMessage message={getErrorMessage(error)} />
  }

  return (
    <div>
      <PageHeader
        title="Production Tracking"
        description="Monitor production output, progress, and completion history"
        action={
          <Button
            onClick={openRecordModal}
            disabled={inProductionOrders.length === 0}
            title={
              inProductionOrders.length === 0
                ? 'No work orders in production'
                : 'Record production output'
            }
          >
            <Plus className="h-4 w-4" />
            Record Production
          </Button>
        }
      />

      <div className="mb-6">
        <ScrollReveal delay={80}>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Currently In Production
          </h2>
        </ScrollReveal>
        {inProduction.length > 0 ? (
          <DataTable columns={activeColumns} data={inProduction} delay={120} />
        ) : (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No work orders currently in production.
          </p>
        )}
      </div>

      <div>
        <ScrollReveal delay={160}>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Production History
          </h2>
        </ScrollReveal>
        {productionRecords.length > 0 ? (
          <DataTable columns={recordColumns} data={productionRecords} delay={200} />
        ) : (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No production records yet.
          </p>
        )}
      </div>

      <Modal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        title="Record Production"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRecordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => recordMutation.mutate()} disabled={recordMutation.isPending}>
              {recordMutation.isPending ? 'Recording...' : 'Record'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          <FormField label="Work Order" htmlFor="prod-wo">
            <SelectInput
              id="prod-wo"
              value={form.work_order_id}
              onChange={(e) => handleWorkOrderChange(e.target.value)}
            >
              <option value="">Select work order...</option>
              {inProductionOrders.map((wo) => {
                const item = itemsMap[wo.item_id]
                return (
                  <option key={wo.id} value={wo.id}>
                    {wo.work_order_number} — {item?.name ?? wo.item_id} (
                    {wo.quantity_completed}/{wo.quantity_ordered})
                  </option>
                )
              })}
            </SelectInput>
          </FormField>
          <FormField label="Quantity Produced" htmlFor="prod-qty">
            <TextInput
              id="prod-qty"
              type="number"
              min="0.01"
              step="any"
              required
              value={form.quantity_produced}
              onChange={(e) => setForm({ ...form, quantity_produced: e.target.value })}
            />
          </FormField>

          {rawMaterials.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                Raw Material Consumption (from BOM)
              </p>
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                {rawMaterials.map((row, index) => (
                  <div
                    key={row.item_id}
                    className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3"
                  >
                    <span className="text-sm text-slate-700">
                      {row.itemName}
                      <span className="ml-1 text-xs text-slate-400">
                        (plan: {row.plannedTotal} {row.unit})
                      </span>
                    </span>
                    <TextInput
                      type="number"
                      min="0"
                      step="any"
                      value={row.quantity}
                      onChange={(e) => updateRawMaterialQuantity(index, e.target.value)}
                      placeholder="Qty consumed"
                    />
                    <span className="text-xs text-slate-500">{row.unit}</span>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Quantities auto-calculated from BOM based on units produced. Adjust if needed.
              </p>
            </div>
          )}

          <FormField label="Notes" htmlFor="prod-notes">
            <TextArea
              id="prod-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  )
}
