import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import ScrollReveal from '../components/ui/ScrollReveal'
import { productionRecords, workOrders } from '../data/mockData'
import { WORK_ORDER_STATUS } from '../constants'

export default function ProductionTracking() {
  const inProduction = workOrders.filter(
    (wo) => wo.status === WORK_ORDER_STATUS.IN_PRODUCTION
  )

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
        <DataTable columns={recordColumns} data={productionRecords} delay={200} />
      </div>
    </div>
  )
}
