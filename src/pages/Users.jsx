import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import ScrollReveal from '../components/ui/ScrollReveal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import { getUsers } from '../api/users'
import { getErrorMessage } from '../api/client'
import { mapUser } from '../utils/mappers'
import { USER_ROLES } from '../constants'

const roleColors = {
  [USER_ROLES.ADMIN]: 'bg-violet-100 text-violet-700',
  [USER_ROLES.MANAGER]: 'bg-blue-100 text-blue-700',
  [USER_ROLES.WORKER]: 'bg-slate-100 text-slate-700',
}

export default function Users() {
  const { isAdmin } = useAuth()

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
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
            <Button disabled title="Register form coming soon">
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
    </div>
  )
}
