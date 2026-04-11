type DashboardStatCardProps = {
  title: string
  value: number
  className?: string
  valueClassName?: string
}

export default function DashboardStatCard({
  title,
  value,
  className = '',
  valueClassName = 'text-[var(--text-main)]',
}: DashboardStatCardProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5 shadow-sm ${className}`}
    >
      <p className="text-sm text-[var(--text-soft)]">{title}</p>
      <p className={`mt-3 text-5xl font-semibold leading-none ${valueClassName}`}>
        {value}
      </p>
    </div>
  )
}