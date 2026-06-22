import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calculator, Pencil, Plus, Trash2 } from 'lucide-react'
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
  createBom,
  deleteBom,
  getBoms,
  getMaterialRequirements,
  updateBom,
} from '../api/bom'
import { getItems } from '../api/items'
import { getErrorMessage } from '../api/client'
import { buildLookup, mapBom } from '../utils/mappers'
import { BACKEND_ITEM_TYPES } from '../constants'

const emptyLine = { item_id: '', quantity_per_unit: '1', waste_percent: '0' }

export default function Bom() {
  const queryClient = useQueryClient()
  const { isAdmin, isManagerOrAdmin } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [calcOpen, setCalcOpen] = useState(false)
  const [form, setForm] = useState({ finished_good_id: '', lines: [{ ...emptyLine }] })
  const [calcForm, setCalcForm] = useState({ finished_good_id: '', quantity: '1' })
  const [calcResult, setCalcResult] = useState(null)
  const [formError, setFormError] = useState('')

  const bomsQuery = useQuery({
    queryKey: ['bom'],
    queryFn: () => getBoms(),
  })

  const itemsQuery = useQuery({
    queryKey: ['items'],
    queryFn: () => getItems({ active_only: true }),
  })

  const finishedGoods = useMemo(
    () => (itemsQuery.data ?? []).filter((i) => i.item_type === BACKEND_ITEM_TYPES.FINISHED_GOOD),
    [itemsQuery.data]
  )

  const rawMaterials = useMemo(
    () => (itemsQuery.data ?? []).filter((i) => i.item_type === BACKEND_ITEM_TYPES.RAW_MATERIAL),
    [itemsQuery.data]
  )

  const itemsMap = buildLookup(itemsQuery.data ?? [])

  const boms = useMemo(
    () => (bomsQuery.data ?? []).map((bom) => mapBom(bom, itemsMap)),
    [bomsQuery.data, itemsMap]
  )

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        finished_good_id: form.finished_good_id,
        lines: form.lines.map((line) => ({
          item_id: line.item_id,
          quantity_per_unit: parseFloat(line.quantity_per_unit),
          waste_percent: parseFloat(line.waste_percent) || 0,
        })),
      }

      if (editTarget) {
        return updateBom(editTarget.id, { lines: payload.lines })
      }

      return createBom(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom'] })
      setCreateOpen(false)
      setEditTarget(null)
      setForm({ finished_good_id: '', lines: [{ ...emptyLine }] })
      setFormError('')
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom'] })
      setDeleteTarget(null)
    },
  })

  const calcMutation = useMutation({
    mutationFn: () =>
      getMaterialRequirements({
        finished_good_id: calcForm.finished_good_id,
        quantity: parseFloat(calcForm.quantity),
      }),
    onSuccess: (data) => setCalcResult(data),
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const openEdit = (bom) => {
    setEditTarget(bom)
    setForm({
      finished_good_id: bom.finishedGoodId,
      lines: bom.lines.map((line) => ({
        item_id: line.itemId,
        quantity_per_unit: String(line.quantityPerUnit),
        waste_percent: String(line.wastePercent),
      })),
    })
    setFormError('')
    setCreateOpen(true)
  }

  const addLine = () => {
    setForm({ ...form, lines: [...form.lines, { ...emptyLine }] })
  }

  const removeLine = (index) => {
    setForm({ ...form, lines: form.lines.filter((_, i) => i !== index) })
  }

  const updateLine = (index, field, value) => {
    const lines = [...form.lines]
    lines[index] = { ...lines[index], [field]: value }
    setForm({ ...form, lines })
  }

  const columns = [
    { key: 'id', label: 'BOM ID' },
    { key: 'finishedGoodName', label: 'Finished Good' },
    { key: 'finishedGoodSku', label: 'SKU' },
    { key: 'version', label: 'Version' },
    { key: 'lineCount', label: 'Materials' },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
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
                  title="Edit BOM"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    title="Delete BOM"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ]

  const isLoading = bomsQuery.isLoading || itemsQuery.isLoading

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (bomsQuery.error) {
    return <ErrorMessage message={getErrorMessage(bomsQuery.error)} />
  }

  return (
    <div>
      <PageHeader
        title="Bill of Materials"
        description="Define raw material requirements for finished goods"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCalcOpen(true)}>
              <Calculator className="h-4 w-4" />
              Calculate Requirements
            </Button>
            {isManagerOrAdmin && (
              <Button
                onClick={() => {
                  setEditTarget(null)
                  setForm({
                    finished_good_id: finishedGoods[0]?.id ?? '',
                    lines: [{ ...emptyLine, item_id: rawMaterials[0]?.id ?? '' }],
                  })
                  setFormError('')
                  setCreateOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Create BOM
              </Button>
            )}
          </div>
        }
      />

      {boms.length > 0 ? (
        <DataTable columns={columns} data={boms} delay={100} />
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No bill of materials defined yet.
        </p>
      )}

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          setEditTarget(null)
        }}
        title={editTarget ? 'Edit BOM' : 'Create BOM'}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCreateOpen(false)
                setEditTarget(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editTarget ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          {!editTarget && (
            <FormField label="Finished Good" htmlFor="bom-fg">
              <SelectInput
                id="bom-fg"
                value={form.finished_good_id}
                onChange={(e) => setForm({ ...form, finished_good_id: e.target.value })}
              >
                <option value="">Select finished good...</option>
                {finishedGoods.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.sku})
                  </option>
                ))}
              </SelectInput>
            </FormField>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Raw Material Lines</p>
              <Button size="sm" variant="secondary" onClick={addLine}>
                <Plus className="h-3.5 w-3.5" />
                Add Line
              </Button>
            </div>
            <div className="space-y-3">
              {form.lines.map((line, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-4"
                >
                  <SelectInput
                    value={line.item_id}
                    onChange={(e) => updateLine(index, 'item_id', e.target.value)}
                  >
                    <option value="">Material...</option>
                    {rawMaterials.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </SelectInput>
                  <TextInput
                    type="number"
                    min="0.01"
                    step="any"
                    placeholder="Qty/unit"
                    value={line.quantity_per_unit}
                    onChange={(e) => updateLine(index, 'quantity_per_unit', e.target.value)}
                  />
                  <TextInput
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Waste %"
                    value={line.waste_percent}
                    onChange={(e) => updateLine(index, 'waste_percent', e.target.value)}
                  />
                  {form.lines.length > 1 && (
                    <Button size="sm" variant="danger" onClick={() => removeLine(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={calcOpen}
        onClose={() => {
          setCalcOpen(false)
          setCalcResult(null)
          setFormError('')
        }}
        title="Material Requirements Calculator"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCalcOpen(false)
                setCalcResult(null)
              }}
            >
              Close
            </Button>
            <Button
              onClick={() => calcMutation.mutate()}
              disabled={calcMutation.isPending || !calcForm.finished_good_id}
            >
              {calcMutation.isPending ? 'Calculating...' : 'Calculate'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && calcOpen && <ErrorMessage message={formError} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Finished Good" htmlFor="calc-fg">
              <SelectInput
                id="calc-fg"
                value={calcForm.finished_good_id}
                onChange={(e) =>
                  setCalcForm({ ...calcForm, finished_good_id: e.target.value })
                }
              >
                <option value="">Select...</option>
                {finishedGoods.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Production Quantity" htmlFor="calc-qty">
              <TextInput
                id="calc-qty"
                type="number"
                min="0.01"
                step="any"
                value={calcForm.quantity}
                onChange={(e) => setCalcForm({ ...calcForm, quantity: e.target.value })}
              />
            </FormField>
          </div>

          {calcResult && (
            <ScrollReveal>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-medium text-slate-800">
                  Requirements for {calcResult.quantity} × {calcResult.finished_good_name}
                </p>
                <ul className="space-y-2">
                  {(calcResult.lines ?? []).map((line) => (
                    <li
                      key={line.item_id}
                      className="flex justify-between text-sm text-slate-600"
                    >
                      <span>
                        {line.item_name} ({line.sku})
                      </span>
                      <span className="font-medium">
                        {line.total_quantity_required} {line.unit_of_measure}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title="Delete BOM"
        message={`Delete BOM for "${deleteTarget?.finishedGoodName}"?`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
