import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Plus, RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { FormField, SelectInput, TextInput } from '../components/ui/FormField'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import {
  createPallet,
  getPallets,
  movePallet,
  updatePalletStatus,
} from '../api/pallets'
import { getItems } from '../api/items'
import { getWorkOrders } from '../api/workOrders'
import { getWarehouseLocations } from '../api/warehouse'
import { getErrorMessage } from '../api/client'
import { buildLookup, mapPallet } from '../utils/mappers'
import {
  BACKEND_PALLET_STATUS,
  BACKEND_WORK_ORDER_STATUS,
  PALLET_STATUS_LABELS,
} from '../constants'

const statusColors = {
  [BACKEND_PALLET_STATUS.IN_PRODUCTION]: 'bg-amber-100 text-amber-700',
  [BACKEND_PALLET_STATUS.IN_WAREHOUSE]: 'bg-blue-100 text-blue-700',
  [BACKEND_PALLET_STATUS.SHIPPED]: 'bg-emerald-100 text-emerald-700',
}

const emptyCreateForm = {
  work_order_id: '',
  item_id: '',
  quantity: '',
  warehouse_location_id: '',
}

export default function Pallets() {
  const queryClient = useQueryClient()
  const { isManagerOrAdmin } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const [moveTarget, setMoveTarget] = useState(null)
  const [moveLocationId, setMoveLocationId] = useState('')
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [formError, setFormError] = useState('')

  const palletsQuery = useQuery({
    queryKey: ['pallets'],
    queryFn: () => getPallets(),
  })

  const itemsQuery = useQuery({
    queryKey: ['items'],
    queryFn: () => getItems({ active_only: true }),
  })

  const workOrdersQuery = useQuery({
    queryKey: ['work-orders'],
    queryFn: () => getWorkOrders(),
  })

  const locationsQuery = useQuery({
    queryKey: ['warehouse', 'locations'],
    queryFn: getWarehouseLocations,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createPallet({
        work_order_id: createForm.work_order_id,
        item_id: createForm.item_id,
        quantity: parseFloat(createForm.quantity),
        warehouse_location_id: createForm.warehouse_location_id || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pallets'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse'] })
      setCreateOpen(false)
      setCreateForm(emptyCreateForm)
      setFormError('')
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const moveMutation = useMutation({
    mutationFn: () => movePallet(moveTarget.palletId, moveLocationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pallets'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse'] })
      setMoveTarget(null)
      setMoveLocationId('')
      setFormError('')
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updatePalletStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pallets'] }),
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const eligibleWorkOrders = useMemo(
    () =>
      (workOrdersQuery.data ?? []).filter(
        (wo) =>
          wo.status === BACKEND_WORK_ORDER_STATUS.IN_PRODUCTION ||
          wo.status === BACKEND_WORK_ORDER_STATUS.PRODUCTION_COMPLETE
      ),
    [workOrdersQuery.data]
  )

  const pallets = useMemo(() => {
    const itemsMap = buildLookup(itemsQuery.data ?? [])
    const locationsMap = buildLookup(locationsQuery.data ?? [])
    return (palletsQuery.data ?? []).map((pallet) =>
      mapPallet(pallet, itemsMap, locationsMap)
    )
  }, [palletsQuery.data, itemsQuery.data, locationsQuery.data])

  const handleWorkOrderChange = (workOrderId) => {
    const wo = eligibleWorkOrders.find((order) => order.id === workOrderId)
    setCreateForm({
      ...createForm,
      work_order_id: workOrderId,
      item_id: wo?.item_id ?? '',
    })
  }

  const columns = [
    { key: 'id', label: 'Pallet #' },
    { key: 'itemName', label: 'Item' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'location', label: 'Location' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            statusColors[row.status] || 'bg-slate-100 text-slate-600'
          }`}
        >
          {PALLET_STATUS_LABELS[row.status] ?? row.status}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Created' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          {row.status !== BACKEND_PALLET_STATUS.SHIPPED && (
            <button
              type="button"
              onClick={() => {
                setMoveTarget(row)
                setMoveLocationId('')
                setFormError('')
              }}
              className="rounded p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
              title="Move pallet"
            >
              <MapPin className="h-4 w-4" />
            </button>
          )}
          {isManagerOrAdmin && row.status === BACKEND_PALLET_STATUS.IN_WAREHOUSE && (
            <button
              type="button"
              onClick={() =>
                statusMutation.mutate({
                  id: row.palletId,
                  status: BACKEND_PALLET_STATUS.SHIPPED,
                })
              }
              className="rounded p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
              title="Mark as shipped"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  const isLoading =
    palletsQuery.isLoading ||
    itemsQuery.isLoading ||
    workOrdersQuery.isLoading ||
    locationsQuery.isLoading

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const error =
    palletsQuery.error ||
    itemsQuery.error ||
    workOrdersQuery.error ||
    locationsQuery.error

  if (error) {
    return <ErrorMessage message={getErrorMessage(error)} />
  }

  return (
    <div>
      <PageHeader
        title="Pallet Tracking"
        description="Track pallets from production through warehouse storage"
        action={
          <Button
            onClick={() => {
              const firstWo = eligibleWorkOrders[0]
              setCreateForm({
                ...emptyCreateForm,
                work_order_id: firstWo?.id ?? '',
                item_id: firstWo?.item_id ?? '',
              })
              setFormError('')
              setCreateOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Create Pallet
          </Button>
        }
      />

      {formError && !createOpen && !moveTarget && (
        <ErrorMessage message={formError} className="mb-4" />
      )}

      {pallets.length > 0 ? (
        <DataTable columns={columns} data={pallets} delay={100} />
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No pallets found.
        </p>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Pallet"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          <FormField label="Work Order" htmlFor="pallet-wo">
            <SelectInput
              id="pallet-wo"
              value={createForm.work_order_id}
              onChange={(e) => handleWorkOrderChange(e.target.value)}
            >
              <option value="">Select work order...</option>
              {eligibleWorkOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                  {wo.work_order_number}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Quantity" htmlFor="pallet-qty">
            <TextInput
              id="pallet-qty"
              type="number"
              min="0.01"
              step="any"
              required
              value={createForm.quantity}
              onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
            />
          </FormField>
          <FormField label="Warehouse Location (optional)" htmlFor="pallet-loc">
            <SelectInput
              id="pallet-loc"
              value={createForm.warehouse_location_id}
              onChange={(e) =>
                setCreateForm({ ...createForm, warehouse_location_id: e.target.value })
              }
            >
              <option value="">None — in production</option>
              {(locationsQuery.data ?? []).map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.location_code} ({loc.current_pallet_count}/{loc.capacity})
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      </Modal>

      <Modal
        open={Boolean(moveTarget)}
        onClose={() => setMoveTarget(null)}
        title={`Move Pallet ${moveTarget?.id ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setMoveTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => moveMutation.mutate()}
              disabled={moveMutation.isPending || !moveLocationId}
            >
              {moveMutation.isPending ? 'Moving...' : 'Move'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          <FormField label="Destination Location" htmlFor="move-loc">
            <SelectInput
              id="move-loc"
              value={moveLocationId}
              onChange={(e) => setMoveLocationId(e.target.value)}
            >
              <option value="">Select location...</option>
              {(locationsQuery.data ?? []).map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.location_code} — {loc.zone ?? 'No zone'}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      </Modal>
    </div>
  )
}
