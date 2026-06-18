import { WORK_ORDER_STATUS_COLORS } from '../../constants'

export default function StatusBadge({ status, className = '' }) {
  const colorClass =
    WORK_ORDER_STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-transform duration-200 hover:scale-105 ${colorClass} ${className}`}
    >
      {status}
    </span>
  )
}
