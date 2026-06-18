import { Bell, Search } from 'lucide-react'

export default function Header({ title }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors" />
          <input
            type="search"
            placeholder="Search..."
            className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:shadow-sm"
          />
        </div>
        <button
          type="button"
          className="btn-interactive relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <Bell className="h-5 w-5 transition-transform duration-200 hover:rotate-12" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  )
}
