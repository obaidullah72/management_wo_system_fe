import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import ScrollReveal from '../components/ui/ScrollReveal'
import { inventory } from '../data/mockData'
import { INVENTORY_STATUS, ITEM_TYPES } from '../constants'

const statusColors = {
  [INVENTORY_STATUS.IN_STOCK]: 'bg-emerald-100 text-emerald-700',
  [INVENTORY_STATUS.LOW_STOCK]: 'bg-amber-100 text-amber-700',
  [INVENTORY_STATUS.OUT_OF_STOCK]: 'bg-red-100 text-red-700',
}

const summaryCards = [
  { label: 'Total Items Tracked', key: 'total', color: 'text-slate-900' },
  { label: 'In Stock', key: 'inStock', color: 'text-emerald-600' },
  { label: 'Low Stock', key: 'lowStock', color: 'text-amber-600' },
]

export default function Inventory() {
  const columns = [
    { key: 'id', label: 'Inventory ID' },
    { key: 'itemName', label: 'Item' },
    { key: 'sku', label: 'SKU' },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium transition-transform hover:scale-105 ${
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
      label: 'Quantity',
      render: (row) => (
        <span className="font-medium">
          {row.quantity.toLocaleString()} {row.unit}
        </span>
      ),
    },
    { key: 'warehouseLocation', label: 'Warehouse Location' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium transition-transform hover:scale-105 ${statusColors[row.status]}`}
        >
          {row.status}
        </span>
      ),
    },
    { key: 'lastUpdated', label: 'Last Updated' },
  ]

  const counts = {
    total: inventory.length,
    inStock: inventory.filter((i) => i.status === INVENTORY_STATUS.IN_STOCK).length,
    lowStock: inventory.filter((i) => i.status === INVENTORY_STATUS.LOW_STOCK).length,
  }

  return (
    <div>
      <PageHeader
        title="Inventory Management"
        description="Track raw materials, finished goods, and warehouse locations"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card, index) => (
          <ScrollReveal key={card.key} delay={index * 80}>
            <div className="group hover-lift cursor-default rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500 transition-colors group-hover:text-slate-700">
                {card.label}
              </p>
              <p className={`mt-1 text-2xl font-bold transition-transform duration-300 group-hover:scale-105 ${card.color}`}>
                {counts[card.key]}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <DataTable columns={columns} data={inventory} delay={150} />
    </div>
  )
}
