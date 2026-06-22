import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { FormField, SelectInput, TextArea, TextInput } from '../components/ui/FormField'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import { createItem, deleteItem, getItems, updateItem } from '../api/items'
import { getErrorMessage } from '../api/client'
import { itemTypeToBackend, mapItem } from '../utils/mappers'
import { BACKEND_ITEM_TYPES, ITEM_TYPES, UNITS_OF_MEASURE } from '../constants'

const TYPE_FILTERS = ['All Items', 'Raw Materials', 'Finished Goods']

const emptyForm = {
  name: '',
  sku: '',
  description: '',
  item_type: BACKEND_ITEM_TYPES.RAW_MATERIAL,
  quantity_available: '0',
  unit_of_measure: 'pcs',
  reorder_level: '0',
}

export default function Items() {
  const queryClient = useQueryClient()
  const { isManagerOrAdmin } = useAuth()
  const [typeFilter, setTypeFilter] = useState('All Items')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        description: form.description.trim() || null,
        item_type: form.item_type,
        unit_of_measure: form.unit_of_measure,
        reorder_level: parseFloat(form.reorder_level) || 0,
      }

      if (editingItem) {
        return updateItem(editingItem.id, payload)
      }

      return createItem({
        ...payload,
        quantity_available: parseFloat(form.quantity_available) || 0,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      closeModal()
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setDeleteTarget(null)
    },
  })

  const items = useMemo(
    () => (itemsQuery.data ?? []).map(mapItem),
    [itemsQuery.data]
  )

  const openCreate = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      sku: item.sku,
      description: item.description === '—' ? '' : item.description,
      item_type: item.raw.item_type,
      quantity_available: String(item.quantity),
      unit_of_measure: item.raw.unit_of_measure,
      reorder_level: String(item.reorderLevel),
    })
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingItem(null)
    setFormError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setFormError('')
    saveMutation.mutate()
  }

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
    ...(isManagerOrAdmin
      ? [
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  title="Edit item"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(row)}
                  className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  title="Delete item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]
      : []),
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
          isManagerOrAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add New Item
            </Button>
          ) : null
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

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Item' : 'Add New Item'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Item Name" htmlFor="item-name">
              <TextInput
                id="item-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>
            <FormField label="SKU" htmlFor="item-sku">
              <TextInput
                id="item-sku"
                required
                disabled={Boolean(editingItem)}
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Description" htmlFor="item-desc">
            <TextArea
              id="item-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Type" htmlFor="item-type">
              <SelectInput
                id="item-type"
                value={form.item_type}
                onChange={(e) => setForm({ ...form, item_type: e.target.value })}
              >
                <option value={BACKEND_ITEM_TYPES.RAW_MATERIAL}>Raw Material</option>
                <option value={BACKEND_ITEM_TYPES.FINISHED_GOOD}>Finished Good</option>
              </SelectInput>
            </FormField>
            <FormField label="Unit of Measure" htmlFor="item-unit">
              <SelectInput
                id="item-unit"
                value={form.unit_of_measure}
                onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })}
              >
                {UNITS_OF_MEASURE.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {!editingItem && (
              <FormField label="Initial Quantity" htmlFor="item-qty">
                <TextInput
                  id="item-qty"
                  type="number"
                  min="0"
                  step="any"
                  value={form.quantity_available}
                  onChange={(e) => setForm({ ...form, quantity_available: e.target.value })}
                />
              </FormField>
            )}
            <FormField label="Reorder Level" htmlFor="item-reorder">
              <TextInput
                id="item-reorder"
                type="number"
                min="0"
                step="any"
                value={form.reorder_level}
                onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
              />
            </FormField>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
