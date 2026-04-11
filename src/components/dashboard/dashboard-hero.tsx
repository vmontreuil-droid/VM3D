import Link from 'next/link'

type HeroAction = {
  label: string
  href: string
  variant?: 'primary' | 'secondary'
}

type DashboardHeroProps = {
  eyebrow: string
  title: string
  description: string
  totalLabel: string
  totalValue: number
  activeLabel: string
  activeValue: number
  actions?: HeroAction[]
}

export default function DashboardHero({
  eyebrow,
  title,
  description,
  totalLabel,
  totalValue,
  activeLabel,
  activeValue,
  actions = [],
}: DashboardHeroProps) {
  return (
    <section className="sticky top-0 z-30 overflow-hidden rounded-b-[20px] border-x border-b border-[var(--border-soft)] bg-[linear-gradient(90deg,#1c2a3a_0%,#13263f_50%,#1d2b3b_100%)] shadow-[0_8px_22px_rgba(0,0,0,0.18)] md:rounded-b-[24px]">
      <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-3 md:px-5 md:py-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] sm:text-xs">
            {eyebrow}
          </p>

          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl md:mt-2 md:text-3xl">
            {title}
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-[var(--text-soft)]">
            {description}
          </p>

          {actions.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
              {actions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={
                    action.variant === 'secondary'
                      ? 'btn-secondary sm:min-h-[42px] sm:px-4 sm:py-2.5'
                      : 'btn-primary sm:min-h-[42px] sm:px-4 sm:py-2.5'
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[300px]">
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.04)] p-4">
            <p className="text-[11px] font-semibold uppercase text-[var(--text-soft)] sm:text-xs">
              {totalLabel}
            </p>
            <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {totalValue}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.04)] p-4">
            <p className="text-[11px] font-semibold uppercase text-[var(--text-soft)] sm:text-xs">
              {activeLabel}
            </p>
            <p className="mt-2 text-2xl font-bold text-[#9cc3ff] sm:text-3xl">
              {activeValue}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}