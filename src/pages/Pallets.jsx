import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { getPallets } from '../api/pallets'
import { getItems } from '../api/items'
import { getWarehouseLocations } from '../api/warehouse'
import { getErrorMessage } from '../api/client'
import { buildLookup, mapPallet } from '../utils/mappers'

const statusColors = {
  in_warehouse: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-amber-100 text-amber-700',
  shipped: 'bg-emerald-100 text-emerald-700',
  quarantined: 'bg-red-100 text-red-700',
}

function formatPalletStatus(status) {
  if (!status) return '—'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function Pallets() {
  const palletsQuery = useQuery({
    queryKey: ['pallets'],
    queryFn: () => getPallets(),
  })

  const itemsQuery = useQuery({
    queryKey: ['items'],
    queryFn: () => getItems({ active_only: true }),
  })

  const locationsQuery = useQuery({
    queryKey: ['warehouse', 'locations'],
    queryFn: getWarehouseLocations,
  })

  const isLoading =
    palletsQuery.isLoading || itemsQuery.isLoading || locationsQuery.isLoading
  const error = palletsQuery.error || itemsQuery.error || locationsQuery.error

  const pallets = useMemo(() => {
    const itemsMap = buildLookup(itemsQuery.data ?? [])
    const locationsMap = buildLookup(locationsQuery.data ?? [])
    return (palletsQuery.data ?? []).map((pallet) =>
      mapPallet(pallet, itemsMap, locationsMap)
    )
  }, [palletsQuery.data, itemsQuery.data, locationsQuery.data])

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
          {formatPalletStatus(row.status)}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Created' },
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
        title="Pallet Tracking"
        description="Track pallets from production through warehouse storage"
        action={
          <Button disabled title="Create form coming soon">
            <Plus className="h-4 w-4" />
            Create Pallet
          </Button>
        }
      />

      {pallets.length > 0 ? (
        <DataTable columns={columns} data={pallets} delay={100} />
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No pallets found.
        </p>
      )}
    </div>
  )
}
