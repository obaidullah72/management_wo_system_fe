import { Plus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import { workOrders } from '../data/mockData'

export default function WorkOrders() {
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
      key: 'priority',
      label: 'Priority',
      render: (row) => (
        <span
          className={`text-xs font-medium ${
            row.priority === 'High'
              ? 'text-red-600'
              : row.priority === 'Medium'
                ? 'text-amber-600'
                : 'text-slate-500'
          }`}
        >
          {row.priority}
        </span>
      ),
    },
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

  return (
    <div>
      <PageHeader
        title="Work Order Management"
        description="Create, assign, and track production work orders"
        action={
          <Button>
            <Plus className="h-4 w-4" />
            Create Work Order
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {['All', 'Staged', 'Scheduled', 'In Production', 'Production Complete', 'Finalized'].map(
          (filter) => (
            <button
              key={filter}
              type="button"
              className={`filter-chip rounded-lg px-3 py-1.5 text-xs font-medium ${
                filter === 'All'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {filter}
            </button>
          )
        )}
      </div>

      <DataTable columns={columns} data={workOrders} delay={100} />
    </div>
  )
}
