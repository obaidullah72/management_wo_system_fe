export function FormField({ label, htmlFor, error, children, hint }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-400'

export function TextInput({ id, error, className = '', ...props }) {
  return (
    <input
      id={id}
      className={`${inputClassName} ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''} ${className}`}
      {...props}
    />
  )
}

export function SelectInput({ id, error, children, className = '', ...props }) {
  return (
    <select
      id={id}
      className={`${inputClassName} ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function TextArea({ id, error, className = '', rows = 3, ...props }) {
  return (
    <textarea
      id={id}
      rows={rows}
      className={`${inputClassName} resize-y ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''} ${className}`}
      {...props}
    />
  )
}
