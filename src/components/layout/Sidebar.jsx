import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Warehouse,
  Factory,
  FileBarChart,
  Users,
  Boxes,
  MapPin,
  Layers,
  LogOut,
  KeyRound,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getNavItemsForRole } from '../../constants'
import ChangePasswordModal from '../auth/ChangePasswordModal'

const iconMap = {
  LayoutDashboard,
  ClipboardList,
  Package,
  Warehouse,
  Factory,
  FileBarChart,
  Users,
  Boxes,
  MapPin,
  Layers,
}

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Sidebar() {
  const { user, roleLabel, logout } = useAuth()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const navItems = getNavItemsForRole(user?.role)

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-slate-900 text-white">
      <div className="border-b border-slate-700 px-6 py-5">
        <div className="group flex cursor-default items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700 transition-all duration-300 group-hover:scale-110 group-hover:bg-slate-600">
            <Factory className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Manufacturing</p>
            <p className="text-xs text-slate-400">Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon]
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-link-hover group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive
                    ? 'bg-slate-700 text-white shadow-inner'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="icon-hover-bounce h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-slate-700 px-4 py-4">
        <div className="group flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600 text-xs font-bold transition-transform duration-300 group-hover:scale-110">
            {getInitials(user?.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.full_name}</p>
            <p className="truncate text-xs text-slate-400">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => setPasswordOpen(true)}
            title="Change password"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <KeyRound className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </aside>
  )
}
