import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import { getWorkOrders } from '../api/workOrders'
import { getItems } from '../api/items'
import { getUsers } from '../api/users'
import { getErrorMessage } from '../api/client'
import { buildLookup, mapWorkOrder, workOrderStatusToBackend } from '../utils/mappers'
import { WORK_ORDER_STATUS } from '../constants'

const STATUS_FILTERS = [
  'All',
  WORK_ORDER_STATUS.STAGED,
  WORK_ORDER_STATUS.SCHEDULED,
  WORK_ORDER_STATUS.IN_PRODUCTION,
  WORK_ORDER_STATUS.PRODUCTION_COMPLETE,
  WORK_ORDER_STATUS.FINALIZED,
]

export default function WorkOrders() {
  const { isManagerOrAdmin } = useAuth()
  const [statusFilter, setStatusFilter] = useState('All')

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
          <Button disabled title="Create form coming soon">
            <Plus className="h-4 w-4" />
            Create Work Order
          </Button>
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

      {workOrders.length > 0 ? (
        <DataTable columns={columns} data={workOrders} delay={100} />
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No work orders found{statusFilter !== 'All' ? ` with status "${statusFilter}"` : ''}.
        </p>
      )}
    </div>
  )
}
