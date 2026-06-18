import ScrollReveal from './ScrollReveal'

export default function StatCard({ title, value, subtitle, icon: Icon, trend, delay = 0 }) {
  return (
    <ScrollReveal delay={delay}>
      <div className="group hover-lift cursor-default rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 transition-colors group-hover:text-slate-700">
              {title}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 transition-transform duration-300 group-hover:scale-105">
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className="rounded-lg bg-slate-100 p-2.5 transition-colors duration-300 group-hover:bg-slate-800">
              <Icon className="icon-hover-bounce h-5 w-5 text-slate-600 transition-colors duration-300 group-hover:text-white" />
            </div>
          )}
        </div>
        {trend && (
          <p className="mt-3 text-xs font-medium text-emerald-600">{trend}</p>
        )}
      </div>
    </ScrollReveal>
  )
}
