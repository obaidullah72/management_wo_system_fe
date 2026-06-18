import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList,
  Activity,
  Package,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import ScrollReveal from '../components/ui/ScrollReveal'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import { getDashboardSummary } from '../api/dashboard'
import { getWorkOrders } from '../api/workOrders'
import { getItems } from '../api/items'
import { getUsers } from '../api/users'
import { getErrorMessage } from '../api/client'
import {
  buildLookup,
  mapDashboardSummary,
  mapWorkOrder,
} from '../utils/mappers'
import { WORK_ORDER_STATUS } from '../constants'

export default function Dashboard() {
  const { isManagerOrAdmin } = useAuth()

  const summaryQuery = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary,
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
    summaryQuery.isLoading ||
    workOrdersQuery.isLoading ||
    itemsQuery.isLoading ||
    (isManagerOrAdmin && usersQuery.isLoading)

  const error =
    summaryQuery.error ||
    workOrdersQuery.error ||
    itemsQuery.error ||
    (isManagerOrAdmin ? usersQuery.error : null)

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

  const stats = mapDashboardSummary(summaryQuery.data)
  const itemsMap = buildLookup(itemsQuery.data ?? [])
  const usersMap = buildLookup(usersQuery.data ?? [])

  const activeOrders = (workOrdersQuery.data ?? [])
    .map((wo) => mapWorkOrder(wo, itemsMap, usersMap))
    .filter(
      (wo) =>
        wo.status === WORK_ORDER_STATUS.IN_PRODUCTION ||
        wo.status === WORK_ORDER_STATUS.SCHEDULED
    )

  const workOrderColumns = [
    { key: 'id', label: 'Work Order' },
    { key: 'itemName', label: 'Item' },
    { key: 'productionLine', label: 'Line' },
    {
      key: 'progress',
      label: 'Progress',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
            <div
              className="progress-fill h-full rounded-full bg-slate-700"
              style={{
                width: `${row.quantity ? (row.produced / row.quantity) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-xs text-slate-500">
            {row.produced}/{row.quantity}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of manufacturing operations and recent activity"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Work Orders"
          value={stats.totalWorkOrders}
          icon={ClipboardList}
          delay={0}
        />
        <StatCard
          title="Active Work Orders"
          value={stats.activeWorkOrders}
          icon={Activity}
          delay={80}
        />
        <StatCard
          title="Inventory Items"
          value={stats.inventoryItems}
          subtitle={`${stats.lowStockItems} low stock`}
          icon={Package}
          delay={160}
        />
        <StatCard
          title="Production Output"
          value={stats.productionOutput}
          subtitle="units this period"
          icon={TrendingUp}
          delay={240}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ScrollReveal delay={100}>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Active Work Orders
            </h2>
          </ScrollReveal>
          {activeOrders.length > 0 ? (
            <DataTable columns={workOrderColumns} data={activeOrders} delay={150} />
          ) : (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              No active work orders at the moment.
            </p>
          )}
        </div>

        <div>
          <ScrollReveal delay={200}>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Recent Activities
            </h2>
            <div className="hover-lift overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <ul className="divide-y divide-slate-100">
                {stats.recentActivities.map((activity) => (
                  <li key={activity.id} className="activity-item cursor-default px-4 py-3">
                    <p className="text-sm text-slate-700">{activity.action}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {activity.user} · {activity.time}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {stats.lowStockItems > 0 && (
            <ScrollReveal delay={300}>
              <div className="hover-lift mt-4 flex cursor-default items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:border-amber-300 hover:bg-amber-100/80">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Low Stock Alert</p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    {stats.lowStockItems} item(s) below reorder level
                  </p>
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </div>
  )
}
