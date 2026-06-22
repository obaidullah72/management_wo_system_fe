import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Boxes, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ScrollReveal from '../components/ui/ScrollReveal'
import { FormField, SelectInput, TextInput } from '../components/ui/FormField'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import {
  createWarehouseLocation,
  deleteWarehouseLocation,
  getLocationPallets,
  getWarehouseLocations,
  updateWarehouseLocation,
} from '../api/warehouse'
import { getItems } from '../api/items'
import { getErrorMessage } from '../api/client'
import { buildLookup, mapPallet, mapWarehouseLocation } from '../utils/mappers'

const summaryCards = [
  { label: 'Total Locations', key: 'total', color: 'text-slate-900' },
  { label: 'Active', key: 'active', color: 'text-emerald-600' },
  { label: 'Total Pallets Stored', key: 'pallets', color: 'text-blue-600' },
]

const emptyForm = {
  location_code: '',
  zone: '',
  aisle: '',
  rack: '',
  capacity: '10',
}

export default function Warehouse() {
  const queryClient = useQueryClient()
  const { isManagerOrAdmin } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [palletsTarget, setPalletsTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const locationsQuery = useQuery({
    queryKey: ['warehouse', 'locations'],
    queryFn: () => getWarehouseLocations({ active_only: false }),
  })

  const itemsQuery = useQuery({
    queryKey: ['items'],
    queryFn: () => getItems({ active_only: true }),
  })

  const locationPalletsQuery = useQuery({
    queryKey: ['warehouse', 'location-pallets', palletsTarget?.id],
    queryFn: () => getLocationPallets(palletsTarget.id),
    enabled: Boolean(palletsTarget?.id),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        zone: form.zone.trim() || null,
        aisle: form.aisle.trim() || null,
        rack: form.rack.trim() || null,
        capacity: parseInt(form.capacity, 10) || 0,
      }

      if (editingLocation) {
        return updateWarehouseLocation(editingLocation.id, {
          ...payload,
          is_active: editingLocation.raw.is_active,
        })
      }

      return createWarehouseLocation({
        location_code: form.location_code.trim(),
        ...payload,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse'] })
      closeModal()
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteWarehouseLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse'] })
      setDeleteTarget(null)
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (location) =>
      updateWarehouseLocation(location.id, {
        is_active: !location.raw.is_active,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['warehouse'] }),
  })

  const locations = useMemo(
    () => (locationsQuery.data ?? []).map(mapWarehouseLocation),
    [locationsQuery.data]
  )

  const itemsMap = buildLookup(itemsQuery.data ?? [])

  const locationPallets = useMemo(
    () =>
      (locationPalletsQuery.data ?? []).map((pallet) => mapPallet(pallet, itemsMap, {})),
    [locationPalletsQuery.data, itemsMap]
  )

  const counts = useMemo(
    () => ({
      total: locations.length,
      active: locations.filter((l) => l.status === 'Active').length,
      pallets: locations.reduce((sum, l) => sum + (l.palletCount || 0), 0),
    }),
    [locations]
  )

  const openCreate = () => {
    setEditingLocation(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (location) => {
    setEditingLocation(location)
    setForm({
      location_code: location.locationCode,
      zone: location.zone === '—' ? '' : location.zone,
      aisle: location.aisle === '—' ? '' : location.aisle,
      rack: location.rack === '—' ? '' : location.rack,
      capacity: String(location.capacity),
    })
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingLocation(null)
    setFormError('')
  }

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
    {
      key: 'viewPallets',
      label: 'Pallets',
      render: (row) => (
        <button
          type="button"
          onClick={() => setPalletsTarget(row)}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
          title="View pallets at location"
        >
          <Boxes className="h-3.5 w-3.5" />
          View ({row.palletCount})
        </button>
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
                  title="Edit location"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleActiveMutation.mutate(row)}
                  className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                  title="Toggle active status"
                >
                  {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(row)}
                  className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  title="Delete location"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]
      : []),
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
          isManagerOrAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Location
            </Button>
          ) : null
        }
      />

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

      {locations.length > 0 ? (
        <DataTable columns={columns} data={locations} delay={150} />
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No warehouse locations configured.
        </p>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingLocation ? 'Edit Location' : 'Add Warehouse Location'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editingLocation ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          <FormField label="Location Code" htmlFor="loc-code">
            <TextInput
              id="loc-code"
              required
              disabled={Boolean(editingLocation)}
              value={form.location_code}
              onChange={(e) => setForm({ ...form, location_code: e.target.value })}
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Zone" htmlFor="loc-zone">
              <TextInput
                id="loc-zone"
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
              />
            </FormField>
            <FormField label="Aisle" htmlFor="loc-aisle">
              <TextInput
                id="loc-aisle"
                value={form.aisle}
                onChange={(e) => setForm({ ...form, aisle: e.target.value })}
              />
            </FormField>
            <FormField label="Rack" htmlFor="loc-rack">
              <TextInput
                id="loc-rack"
                value={form.rack}
                onChange={(e) => setForm({ ...form, rack: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Capacity (pallets)" htmlFor="loc-cap">
            <TextInput
              id="loc-cap"
              type="number"
              min="0"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title="Delete Location"
        message={`Delete location "${deleteTarget?.locationCode}"? Pallets must be moved first.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />

      <Modal
        open={Boolean(palletsTarget)}
        onClose={() => setPalletsTarget(null)}
        title={`Pallets at ${palletsTarget?.locationCode ?? 'Location'}`}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setPalletsTarget(null)}>
            Close
          </Button>
        }
      >
        {locationPalletsQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : locationPalletsQuery.error ? (
          <ErrorMessage message={getErrorMessage(locationPalletsQuery.error)} />
        ) : locationPallets.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {locationPallets.map((pallet) => (
              <li key={pallet.palletId} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{pallet.id}</p>
                  <p className="text-xs text-slate-500">
                    {pallet.itemName} · Qty {pallet.quantity}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {pallet.status?.replace(/_/g, ' ')}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">
            No pallets stored at this location.
          </p>
        )}
      </Modal>
    </div>
  )
}
