import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import ScrollReveal from '../components/ui/ScrollReveal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import { getProductionHistory } from '../api/production'
import { getWorkOrders } from '../api/workOrders'
import { getItems } from '../api/items'
import { getUsers } from '../api/users'
import { getErrorMessage } from '../api/client'
import {
  buildLookup,
  mapProductionRecord,
  mapWorkOrder,
} from '../utils/mappers'
import { BACKEND_WORK_ORDER_STATUS } from '../constants'

export default function ProductionTracking() {
  const { isManagerOrAdmin } = useAuth()

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

  const itemsMap = buildLookup(itemsQuery.data ?? [])
  const usersMap = buildLookup(usersQuery.data ?? [])
  const workOrdersRawMap = buildLookup(workOrdersQuery.data ?? [])

  const inProduction = useMemo(() => {
    return (workOrdersQuery.data ?? [])
      .filter((wo) => wo.status === BACKEND_WORK_ORDER_STATUS.IN_PRODUCTION)
      .map((wo) => mapWorkOrder(wo, itemsMap, usersMap))
  }, [workOrdersQuery.data, itemsMap, usersMap])

  const productionRecords = useMemo(() => {
    return (productionQuery.data ?? []).map((record) =>
      mapProductionRecord(record, workOrdersRawMap, itemsMap, usersMap)
    )
  }, [productionQuery.data, workOrdersRawMap, itemsMap, usersMap])

  const recordColumns = [
    { key: 'id', label: 'Record ID' },
    { key: 'workOrderId', label: 'Work Order' },
    { key: 'itemName', label: 'Item' },
    { key: 'productionLine', label: 'Line' },
    {
      key: 'quantityProduced',
      label: 'Qty Produced',
      render: (row) => (
        <span className="font-medium text-emerald-700 transition-transform hover:scale-110">
          +{row.quantityProduced}
        </span>
      ),
    },
    { key: 'shift', label: 'Shift' },
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
          <ScrollReveal delay={120}>
            <p className="hover-lift rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              No work orders currently in production.
            </p>
          </ScrollReveal>
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
    </div>
  )
}
