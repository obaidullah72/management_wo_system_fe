import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import ScrollReveal from '../components/ui/ScrollReveal'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { FormField, SelectInput, TextArea, TextInput } from '../components/ui/FormField'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import {
  adjustInventory,
  getInventorySummary,
  getInventoryTransactions,
} from '../api/inventory'
import { getItems } from '../api/items'
import { getErrorMessage } from '../api/client'
import { buildLookup, mapInventoryRow, mapInventoryTransaction } from '../utils/mappers'
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

const TABS = ['Summary', 'Transactions']

export default function Inventory() {
  const queryClient = useQueryClient()
  const { isManagerOrAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('Summary')
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [form, setForm] = useState({ item_id: '', quantity_change: '', notes: '' })
  const [formError, setFormError] = useState('')

  const inventoryQuery = useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: getInventorySummary,
  })

  const transactionsQuery = useQuery({
    queryKey: ['inventory', 'transactions'],
    queryFn: () => getInventoryTransactions(),
    enabled: activeTab === 'Transactions',
  })

  const itemsQuery = useQuery({
    queryKey: ['items'],
    queryFn: () => getItems({ active_only: true }),
  })

  const adjustMutation = useMutation({
    mutationFn: () =>
      adjustInventory({
        item_id: form.item_id,
        quantity_change: parseFloat(form.quantity_change),
        notes: form.notes.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setAdjustOpen(false)
      setForm({ item_id: '', quantity_change: '', notes: '' })
      setFormError('')
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const inventory = useMemo(
    () => (inventoryQuery.data ?? []).map(mapInventoryRow),
    [inventoryQuery.data]
  )

  const itemsMap = buildLookup(itemsQuery.data ?? [])

  const transactions = useMemo(
    () => (transactionsQuery.data ?? []).map((tx) => mapInventoryTransaction(tx, itemsMap)),
    [transactionsQuery.data, itemsMap]
  )

  const counts = useMemo(
    () => ({
      total: inventory.length,
      inStock: inventory.filter((i) => i.status === INVENTORY_STATUS.IN_STOCK).length,
      lowStock: inventory.filter((i) => i.status === INVENTORY_STATUS.LOW_STOCK).length,
    }),
    [inventory]
  )

  const summaryColumns = [
    { key: 'id', label: 'Inventory ID' },
    { key: 'itemName', label: 'Item' },
    { key: 'sku', label: 'SKU' },
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
      label: 'Quantity',
      render: (row) => (
        <span className="font-medium">
          {row.quantity.toLocaleString()} {row.unit}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[row.status]}`}
        >
          {row.status}
        </span>
      ),
    },
  ]

  const transactionColumns = [
    { key: 'id', label: 'Transaction ID' },
    { key: 'itemName', label: 'Item' },
    { key: 'sku', label: 'SKU' },
    { key: 'transactionType', label: 'Type' },
    {
      key: 'quantityChange',
      label: 'Change',
      render: (row) => (
        <span className={row.quantityChange >= 0 ? 'text-emerald-700' : 'text-red-600'}>
          {row.quantityChange >= 0 ? '+' : ''}
          {row.quantityChange}
        </span>
      ),
    },
    { key: 'quantityAfter', label: 'Qty After' },
    { key: 'notes', label: 'Notes' },
    { key: 'createdAt', label: 'Date' },
  ]

  const isLoading =
    inventoryQuery.isLoading ||
    (activeTab === 'Transactions' && transactionsQuery.isLoading)

  if (inventoryQuery.isLoading && activeTab === 'Summary') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (inventoryQuery.error) {
    return <ErrorMessage message={getErrorMessage(inventoryQuery.error)} />
  }

  return (
    <div>
      <PageHeader
        title="Inventory Management"
        description="Track raw materials, finished goods, and stock adjustments"
        action={
          isManagerOrAdmin ? (
            <Button
              onClick={() => {
                setForm({
                  item_id: itemsQuery.data?.[0]?.id ?? '',
                  quantity_change: '',
                  notes: '',
                })
                setFormError('')
                setAdjustOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Adjust Stock
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`filter-chip rounded-lg px-3 py-1.5 text-xs font-medium ${
              tab === activeTab
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Summary' && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {summaryCards.map((card, index) => (
              <ScrollReveal key={card.key} delay={index * 80}>
                <div className="group hover-lift cursor-default rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${card.color}`}>{counts[card.key]}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {inventory.length > 0 ? (
            <DataTable columns={summaryColumns} data={inventory} delay={150} />
          ) : (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              No inventory data available.
            </p>
          )}
        </>
      )}

      {activeTab === 'Transactions' && (
        <>
          {isLoading ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : transactionsQuery.error ? (
            <ErrorMessage message={getErrorMessage(transactionsQuery.error)} />
          ) : transactions.length > 0 ? (
            <DataTable columns={transactionColumns} data={transactions} delay={150} />
          ) : (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              No inventory transactions recorded yet.
            </p>
          )}
        </>
      )}

      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Adjust Inventory"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => adjustMutation.mutate()} disabled={adjustMutation.isPending}>
              {adjustMutation.isPending ? 'Saving...' : 'Apply Adjustment'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          <FormField label="Item" htmlFor="adj-item">
            <SelectInput
              id="adj-item"
              value={form.item_id}
              onChange={(e) => setForm({ ...form, item_id: e.target.value })}
            >
              <option value="">Select item...</option>
              {(itemsQuery.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku}) — {item.quantity_available} {item.unit_of_measure}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField
            label="Quantity Change"
            htmlFor="adj-qty"
            hint="Positive to add stock, negative to remove"
          >
            <TextInput
              id="adj-qty"
              type="number"
              step="any"
              required
              value={form.quantity_change}
              onChange={(e) => setForm({ ...form, quantity_change: e.target.value })}
            />
          </FormField>
          <FormField label="Notes" htmlFor="adj-notes">
            <TextArea
              id="adj-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  )
}
