import { Plus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import { items } from '../data/mockData'
import { ITEM_TYPES } from '../constants'

export default function Items() {
  const columns = [
    { key: 'id', label: 'Item ID' },
    { key: 'name', label: 'Item Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'description', label: 'Description' },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            row.type === ITEM_TYPES.RAW_MATERIAL
              ? 'bg-orange-100 text-orange-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {row.type}
        </span>
      ),
    },
    {
      key: 'quantity',
      label: 'Qty Available',
      render: (row) => (
        <span>
          {row.quantity.toLocaleString()} {row.unit}
        </span>
      ),
    },
    { key: 'unit', label: 'Unit' },
    {
      key: 'reorderLevel',
      label: 'Reorder Level',
      render: (row) => (
        <span className="text-slate-500">
          {row.reorderLevel.toLocaleString()} {row.unit}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: () => (
        <div className="flex gap-2">
          <button type="button" className="text-xs text-slate-600 hover:text-slate-900">
            Edit
          </button>
          <button type="button" className="text-xs text-red-500 hover:text-red-700">
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Item Management"
        description="Manage products and materials used in manufacturing"
        action={
          <Button>
            <Plus className="h-4 w-4" />
            Add New Item
          </Button>
        }
      />

      <div className="mb-4 flex gap-2">
        {['All Items', 'Raw Materials', 'Finished Goods'].map((filter, i) => (
          <button
            key={filter}
            type="button"
            className={`filter-chip rounded-lg px-3 py-1.5 text-xs font-medium ${
              i === 0
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={items} delay={100} />
    </div>
  )
}
