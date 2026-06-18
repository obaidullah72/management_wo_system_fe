export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClass = size === 'lg' ? 'h-10 w-10 border-[3px]' : 'h-6 w-6 border-2'

  return (
    <div
      className={`animate-spin rounded-full border-slate-200 border-t-slate-700 ${sizeClass} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
