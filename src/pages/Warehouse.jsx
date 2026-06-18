import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import ScrollReveal from '../components/ui/ScrollReveal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { getWarehouseLocations } from '../api/warehouse'
import { getErrorMessage } from '../api/client'
import { mapWarehouseLocation } from '../utils/mappers'

const summaryCards = [
  { label: 'Total Locations', key: 'total', color: 'text-slate-900' },
  { label: 'Active', key: 'active', color: 'text-emerald-600' },
  { label: 'Total Pallets Stored', key: 'pallets', color: 'text-blue-600' },
]

export default function Warehouse() {
  const locationsQuery = useQuery({
    queryKey: ['warehouse', 'locations'],
    queryFn: getWarehouseLocations,
  })

  const locations = useMemo(
    () => (locationsQuery.data ?? []).map(mapWarehouseLocation),
    [locationsQuery.data]
  )

  const counts = useMemo(
    () => ({
      total: locations.length,
      active: locations.filter((l) => l.status === 'Active').length,
      pallets: locations.reduce((sum, l) => sum + (l.palletCount || 0), 0),
    }),
    [locations]
  )

  const columns = [
    { key: 'locationCode', label: 'Location Code' },
    { key: 'zone', label: 'Zone' },
    { key: 'aisle', label: 'Aisle' },
    { key: 'rack', label: 'Rack' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'palletCount', label: 'Pallets' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.status === 'Active'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Created' },
  ]

  if (locationsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (locationsQuery.error) {
    return <ErrorMessage message={getErrorMessage(locationsQuery.error)} />
  }

  return (
    <div>
      <PageHeader
        title="Warehouse Locations"
        description="Manage storage locations and track pallet placement"
        action={
          <Button disabled title="Create form coming soon">
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card, index) => (
          <ScrollReveal key={card.key} delay={index * 80}>
            <div className="group hover-lift cursor-default rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500 transition-colors group-hover:text-slate-700">
                {card.label}
              </p>
              <p
                className={`mt-1 text-2xl font-bold transition-transform duration-300 group-hover:scale-105 ${card.color}`}
              >
                {counts[card.key]}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {locations.length > 0 ? (
        <DataTable columns={columns} data={locations} delay={150} />
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No warehouse locations configured.
        </p>
      )}
    </div>
  )
}
