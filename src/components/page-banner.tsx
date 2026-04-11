import Link from 'next/link'

type PageBannerAction = {
  label: string
  href: string
  variant?: 'primary' | 'secondary'
}

type PageBannerProps = {
  eyebrow: string
  title: string
  description?: string
  actions?: PageBannerAction[]
}

export default function PageBanner({
  eyebrow,
  title,
  description,
  actions = [],
}: PageBannerProps) {
  return (
    <section className="sticky top-0 z-30 overflow-hidden rounded-b-[20px] border-x border-b border-[var(--border-soft)] bg-[linear-gradient(90deg,#1c2a3a_0%,#13263f_50%,#1d2b3b_100%)] shadow-[0_8px_22px_rgba(0,0,0,0.18)] md:rounded-b-[24px]">
      <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-3 md:px-5 md:py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] sm:text-xs">
            {eyebrow}
          </p>

          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl md:mt-2 md:text-3xl">
            {title}
          </h1>

          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-soft)]">
              {description}
            </p>
          ) : null}
        </div>

        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2 sm:gap-3">
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
    </section>
  )
}