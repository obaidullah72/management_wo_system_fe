import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { FormField, SelectInput, TextInput } from '../components/ui/FormField'
import ScrollReveal from '../components/ui/ScrollReveal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import { createUser, deleteUser, getUsers, updateUser } from '../api/users'
import { getErrorMessage } from '../api/client'
import { mapUser } from '../utils/mappers'
import { BACKEND_ROLES, USER_ROLES } from '../constants'

const roleColors = {
  [USER_ROLES.ADMIN]: 'bg-violet-100 text-violet-700',
  [USER_ROLES.MANAGER]: 'bg-blue-100 text-blue-700',
  [USER_ROLES.WORKER]: 'bg-slate-100 text-slate-700',
}

const emptyCreateForm = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  password: '',
  role: BACKEND_ROLES.WORKER,
}

export default function Users() {
  const queryClient = useQueryClient()
  const { isAdmin, user: currentUser } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    role: BACKEND_ROLES.WORKER,
    is_active: true,
  })
  const [formError, setFormError] = useState('')

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  })

  const createMutation = useMutation({
    mutationFn: () => createUser(createForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setCreateOpen(false)
      setCreateForm(emptyCreateForm)
      setFormError('')
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateUser(editTarget.raw.id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        username: editForm.username,
        role: editForm.role,
        is_active: editForm.is_active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditTarget(null)
      setFormError('')
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteTarget(null)
    },
  })

  const users = useMemo(
    () => (usersQuery.data ?? []).map(mapUser),
    [usersQuery.data]
  )

  const roleCounts = useMemo(
    () => ({
      [USER_ROLES.ADMIN]: users.filter((u) => u.role === USER_ROLES.ADMIN).length,
      [USER_ROLES.MANAGER]: users.filter((u) => u.role === USER_ROLES.MANAGER).length,
      [USER_ROLES.WORKER]: users.filter((u) => u.role === USER_ROLES.WORKER).length,
    }),
    [users]
  )

  const openEdit = (user) => {
    setEditTarget(user)
    setEditForm({
      first_name: user.raw.first_name,
      last_name: user.raw.last_name,
      username: user.raw.username,
      role: user.raw.role,
      is_active: user.raw.is_active,
    })
    setFormError('')
  }

  const columns = [
    { key: 'id', label: 'User ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[row.role]}`}
        >
          {row.role}
        </span>
      ),
    },
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
    { key: 'lastLogin', label: 'Last Login' },
    ...(isAdmin
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
                  title="Edit user"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {row.raw.id !== currentUser?.id && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    title="Delete user"
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

  if (usersQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (usersQuery.error) {
    return <ErrorMessage message={getErrorMessage(usersQuery.error)} />
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage authentication, roles, and access control"
        action={
          isAdmin ? (
            <Button
              onClick={() => {
                setCreateForm(emptyCreateForm)
                setFormError('')
                setCreateOpen(true)
              }}
            >
              <UserPlus className="h-4 w-4" />
              Register User
            </Button>
          ) : null
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Object.entries(roleCounts).map(([role, count], index) => (
          <ScrollReveal key={role} delay={index * 80}>
            <div className="group hover-lift cursor-default rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500 transition-colors group-hover:text-slate-700">
                {role}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 transition-transform duration-300 group-hover:scale-105">
                {count}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {users.length > 0 ? (
        <DataTable columns={columns} data={users} delay={150} />
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No users found.
        </p>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Register New User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="First Name" htmlFor="user-first">
              <TextInput
                id="user-first"
                required
                value={createForm.first_name}
                onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
              />
            </FormField>
            <FormField label="Last Name" htmlFor="user-last">
              <TextInput
                id="user-last"
                required
                value={createForm.last_name}
                onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Username" htmlFor="user-username">
            <TextInput
              id="user-username"
              required
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
            />
          </FormField>
          <FormField label="Email" htmlFor="user-email">
            <TextInput
              id="user-email"
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
          </FormField>
          <FormField label="Password" htmlFor="user-password" hint="Minimum 8 characters">
            <TextInput
              id="user-password"
              type="password"
              required
              minLength={8}
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            />
          </FormField>
          <FormField label="Role" htmlFor="user-role">
            <SelectInput
              id="user-role"
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
            >
              <option value={BACKEND_ROLES.WORKER}>Production Worker</option>
              <option value={BACKEND_ROLES.MANAGER}>Production Manager</option>
              <option value={BACKEND_ROLES.ADMIN}>Administrator</option>
            </SelectInput>
          </FormField>
        </div>
      </Modal>

      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={`Edit ${editTarget?.name ?? 'User'}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="First Name" htmlFor="edit-first">
              <TextInput
                id="edit-first"
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
              />
            </FormField>
            <FormField label="Last Name" htmlFor="edit-last">
              <TextInput
                id="edit-last"
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Username" htmlFor="edit-username">
            <TextInput
              id="edit-username"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
            />
          </FormField>
          <FormField label="Role" htmlFor="edit-role">
            <SelectInput
              id="edit-role"
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
            >
              <option value={BACKEND_ROLES.WORKER}>Production Worker</option>
              <option value={BACKEND_ROLES.MANAGER}>Production Manager</option>
              <option value={BACKEND_ROLES.ADMIN}>Administrator</option>
            </SelectInput>
          </FormField>
          <FormField label="Status" htmlFor="edit-active">
            <SelectInput
              id="edit-active"
              value={editForm.is_active ? 'active' : 'inactive'}
              onChange={(e) =>
                setEditForm({ ...editForm, is_active: e.target.value === 'active' })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </SelectInput>
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.raw.id)}
        title="Delete User"
        message={`Delete user "${deleteTarget?.name}"? They will no longer be able to sign in.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
