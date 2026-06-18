import { UserPlus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import ScrollReveal from '../components/ui/ScrollReveal'
import { users } from '../data/mockData'
import { USER_ROLES } from '../constants'

const roleColors = {
  [USER_ROLES.ADMIN]: 'bg-violet-100 text-violet-700',
  [USER_ROLES.MANAGER]: 'bg-blue-100 text-blue-700',
  [USER_ROLES.WORKER]: 'bg-slate-100 text-slate-700',
}

export default function Users() {
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
    {
      key: 'actions',
      label: 'Actions',
      render: () => (
        <div className="flex gap-2">
          <button type="button" className="text-xs text-slate-600 transition-colors hover:text-slate-900 hover:underline">
            Edit
          </button>
          <button type="button" className="text-xs text-slate-600 transition-colors hover:text-slate-900 hover:underline">
            Reset Password
          </button>
        </div>
      ),
    },
  ]

  const roleCounts = {
    [USER_ROLES.ADMIN]: users.filter((u) => u.role === USER_ROLES.ADMIN).length,
    [USER_ROLES.MANAGER]: users.filter((u) => u.role === USER_ROLES.MANAGER).length,
    [USER_ROLES.WORKER]: users.filter((u) => u.role === USER_ROLES.WORKER).length,
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage authentication, roles, and access control"
        action={
          <Button>
            <UserPlus className="h-4 w-4" />
            Register User
          </Button>
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

      <DataTable columns={columns} data={users} delay={150} />
    </div>
  )
}
