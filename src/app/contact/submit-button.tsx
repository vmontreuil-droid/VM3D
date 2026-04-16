'use client'

import { useFormStatus } from 'react-dom'
import { Mail, Hourglass } from 'lucide-react'
import { useT } from '@/i18n/context'

export default function SubmitButton() {
  const { pending } = useFormStatus()
  const { t } = useT()

  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/45 hover:bg-[var(--bg-card)]/80 disabled:pointer-events-none disabled:opacity-60"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
        {pending ? (
          <Hourglass className="h-3 w-3 animate-pulse" />
        ) : (
          <Mail className="h-3 w-3" />
        )}
      </span>
      <span className="pr-1">{pending ? t.contact.submitting : t.contact.submitBtn}</span>
      <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
    </button>
  )
}
