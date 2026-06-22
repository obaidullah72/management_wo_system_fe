import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { FormField, SelectInput, TextArea, TextInput } from '../components/ui/FormField'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import {
  assignWorkOrder,
  createWorkOrder,
  deleteWorkOrder,
  getWorkOrders,
  updateWorkOrderStatus,
} from '../api/workOrders'
import { getItems } from '../api/items'
import { getUsers } from '../api/users'
import { getErrorMessage } from '../api/client'
import {
  buildLookup,
  mapWorkOrder,
  mapWorkOrderStatus,
  workOrderStatusToBackend,
} from '../utils/mappers'
import {
  BACKEND_ITEM_TYPES,
  BACKEND_WORK_ORDER_STATUS,
  NEXT_WORK_ORDER_STATUS,
  PRODUCTION_LINES,
  WORK_ORDER_STATUS,
} from '../constants'

const STATUS_FILTERS = [
  'All',
  WORK_ORDER_STATUS.STAGED,
  WORK_ORDER_STATUS.SCHEDULED,
  WORK_ORDER_STATUS.IN_PRODUCTION,
  WORK_ORDER_STATUS.PRODUCTION_COMPLETE,
  WORK_ORDER_STATUS.FINALIZED,
]

const emptyCreateForm = {
  item_id: '',
  quantity_ordered: '',
  production_line: PRODUCTION_LINES[0],
  scheduled_date: '',
  notes: '',
}

export default function WorkOrders() {
  const queryClient = useQueryClient()
  const { isManagerOrAdmin } = useAuth()
  const [statusFilter, setStatusFilter] = useState('All')
  const [createOpen, setCreateOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [assignUserId, setAssignUserId] = useState('')
  const [formError, setFormError] = useState('')

  const statusParam =
    statusFilter === 'All' ? undefined : workOrderStatusToBackend(statusFilter)

  const workOrdersQuery = useQuery({
    queryKey: ['work-orders', statusParam],
    queryFn: () => getWorkOrders(statusParam ? { status: statusParam } : {}),
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

  const finishedGoods = useMemo(
    () => (itemsQuery.data ?? []).filter((item) => item.item_type === BACKEND_ITEM_TYPES.FINISHED_GOOD),
    [itemsQuery.data]
  )

  const createMutation = useMutation({
    mutationFn: () =>
      createWorkOrder({
        item_id: createForm.item_id,
        quantity_ordered: parseFloat(createForm.quantity_ordered),
        production_line: createForm.production_line || null,
        scheduled_date: createForm.scheduled_date
          ? new Date(createForm.scheduled_date).toISOString()
          : null,
        notes: createForm.notes.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setCreateOpen(false)
      setCreateForm(emptyCreateForm)
      setFormError('')
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const assignMutation = useMutation({
    mutationFn: () => assignWorkOrder(assignTarget.workOrderId, assignUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      setAssignTarget(null)
      setAssignUserId('')
      setFormError('')
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateWorkOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteWorkOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDeleteTarget(null)
    },
  })

  const isLoading =
    workOrdersQuery.isLoading ||
    itemsQuery.isLoading ||
    (isManagerOrAdmin && usersQuery.isLoading)

  const error =
    workOrdersQuery.error ||
    itemsQuery.error ||
    (isManagerOrAdmin ? usersQuery.error : null)

  const workOrders = useMemo(() => {
    const itemsMap = buildLookup(itemsQuery.data ?? [])
    const usersMap = buildLookup(usersQuery.data ?? [])
    return (workOrdersQuery.data ?? []).map((wo) => mapWorkOrder(wo, itemsMap, usersMap))
  }, [workOrdersQuery.data, itemsQuery.data, usersQuery.data])

  const getNextStatus = (rawStatus) => {
    const next = NEXT_WORK_ORDER_STATUS[rawStatus]
    if (!next) return null
    if (
      rawStatus === BACKEND_WORK_ORDER_STATUS.SCHEDULED &&
      next === BACKEND_WORK_ORDER_STATUS.IN_PRODUCTION
    ) {
      return next
    }
    return next
  }

  const columns = [
    { key: 'id', label: 'Work Order ID' },
    { key: 'itemName', label: 'Item' },
    { key: 'sku', label: 'SKU' },
    { key: 'quantity', label: 'Qty' },
    { key: 'productionLine', label: 'Production Line' },
    { key: 'assignedTo', label: 'Assigned To' },
    { key: 'scheduledDate', label: 'Scheduled' },
    { key: 'dueDate', label: 'Due Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.produced} / {row.quantity}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        const nextStatus = getNextStatus(row.raw.status)
        return (
          <div className="flex flex-wrap gap-1">
            {isManagerOrAdmin && (
              <button
                type="button"
                onClick={() => {
                  setAssignTarget(row)
                  setAssignUserId(row.raw.assigned_to ?? '')
                  setFormError('')
                }}
                className="rounded p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                title="Assign user"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            )}
            {nextStatus && (
              <button
                type="button"
                onClick={() =>
                  statusMutation.mutate({
                    id: row.workOrderId,
                    status: nextStatus,
                  })
                }
                disabled={statusMutation.isPending}
                className="rounded p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                title={`Advance to ${mapWorkOrderStatus(nextStatus)}`}
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {isManagerOrAdmin && row.raw.status !== BACKEND_WORK_ORDER_STATUS.FINALIZED && (
              <button
                type="button"
                onClick={() => setDeleteTarget(row)}
                className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                title="Delete work order"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
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
        title="Work Order Management"
        description="Create, assign, and track production work orders"
        action={
          isManagerOrAdmin ? (
            <Button
              onClick={() => {
                setCreateForm({
                  ...emptyCreateForm,
                  item_id: finishedGoods[0]?.id ?? '',
                })
                setFormError('')
                setCreateOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Create Work Order
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`filter-chip rounded-lg px-3 py-1.5 text-xs font-medium ${
              filter === statusFilter
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {formError && !createOpen && !assignTarget && (
        <ErrorMessage message={formError} className="mb-4" />
      )}

      {workOrders.length > 0 ? (
        <DataTable columns={columns} data={workOrders} delay={100} />
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No work orders found{statusFilter !== 'All' ? ` with status "${statusFilter}"` : ''}.
        </p>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Work Order"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !createForm.item_id}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          <FormField label="Finished Good" htmlFor="wo-item">
            <SelectInput
              id="wo-item"
              value={createForm.item_id}
              onChange={(e) => setCreateForm({ ...createForm, item_id: e.target.value })}
            >
              <option value="">Select item...</option>
              {finishedGoods.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku})
                </option>
              ))}
            </SelectInput>
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Quantity Ordered" htmlFor="wo-qty">
              <TextInput
                id="wo-qty"
                type="number"
                min="0.01"
                step="any"
                required
                value={createForm.quantity_ordered}
                onChange={(e) =>
                  setCreateForm({ ...createForm, quantity_ordered: e.target.value })
                }
              />
            </FormField>
            <FormField label="Production Line" htmlFor="wo-line">
              <SelectInput
                id="wo-line"
                value={createForm.production_line}
                onChange={(e) =>
                  setCreateForm({ ...createForm, production_line: e.target.value })
                }
              >
                {PRODUCTION_LINES.map((line) => (
                  <option key={line} value={line}>
                    {line}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>
          <FormField label="Scheduled Date" htmlFor="wo-date">
            <TextInput
              id="wo-date"
              type="datetime-local"
              value={createForm.scheduled_date}
              onChange={(e) =>
                setCreateForm({ ...createForm, scheduled_date: e.target.value })
              }
            />
          </FormField>
          <FormField label="Notes" htmlFor="wo-notes">
            <TextArea
              id="wo-notes"
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
            />
          </FormField>
        </div>
      </Modal>

      <Modal
        open={Boolean(assignTarget)}
        onClose={() => setAssignTarget(null)}
        title={`Assign ${assignTarget?.id ?? 'Work Order'}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => assignMutation.mutate()}
              disabled={assignMutation.isPending || !assignUserId}
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          <FormField label="Production Worker" htmlFor="assign-user">
            <SelectInput
              id="assign-user"
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
            >
              <option value="">Select user...</option>
              {(usersQuery.data ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.username})
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.workOrderId)}
        title="Delete Work Order"
        message={`Delete work order ${deleteTarget?.id}? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
