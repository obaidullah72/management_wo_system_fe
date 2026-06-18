import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { getItems } from '../api/items'
import { getErrorMessage } from '../api/client'
import { itemTypeToBackend, mapItem } from '../utils/mappers'
import { ITEM_TYPES } from '../constants'

const TYPE_FILTERS = ['All Items', 'Raw Materials', 'Finished Goods']

export default function Items() {
  const [typeFilter, setTypeFilter] = useState('All Items')

  const itemTypeParam =
    typeFilter === 'All Items' ? undefined : itemTypeToBackend(typeFilter)

  const itemsQuery = useQuery({
    queryKey: ['items', itemTypeParam],
    queryFn: () =>
      getItems({
        active_only: true,
        ...(itemTypeParam ? { item_type: itemTypeParam } : {}),
      }),
  })

  const items = useMemo(
    () => (itemsQuery.data ?? []).map(mapItem),
    [itemsQuery.data]
  )

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
  ]

  if (itemsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (itemsQuery.error) {
    return <ErrorMessage message={getErrorMessage(itemsQuery.error)} />
  }

  return (
    <div>
      <PageHeader
        title="Item Management"
        description="Manage products and materials used in manufacturing"
        action={
          <Button disabled title="Create form coming soon">
            <Plus className="h-4 w-4" />
            Add New Item
          </Button>
        }
      />

      <div className="mb-4 flex gap-2">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setTypeFilter(filter)}
            className={`filter-chip rounded-lg px-3 py-1.5 text-xs font-medium ${
              filter === typeFilter
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {items.length > 0 ? (
        <DataTable columns={columns} data={items} delay={100} />
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No items found.
        </p>
      )}
    </div>
  )
}
