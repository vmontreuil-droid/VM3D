import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import AppShell from '@/components/app-shell'
import Link from 'next/link'
import { Bell, Send, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'

async function sendReminderAction(factuurId: number) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminSupabase = createAdminClient()

  const { data: factuur } = await adminSupabase
    .from('facturen')
    .select('*, profiles!facturen_customer_id_fkey(email, company_name, full_name)')
    .eq('id', factuurId)
    .single()

  if (!factuur) return

  const customerEmail = (factuur as any).profiles?.email
  if (!customerEmail) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { sendTicketNotificationEmail } = await import('@/lib/ticket-notifications')

  const dueDate = factuur.due_date
    ? new Date(factuur.due_date).toLocaleDateString('nl-BE')
    : '—'

  const total = Number(factuur.total).toFixed(2).replace('.', ',')

  await sendTicketNotificationEmail({
    to: [customerEmail],
    subject: `Herinnering: Factuur ${factuur.factuur_number} — openstaand bedrag € ${total}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#f7941d;padding:4px 0"></div>
        <div style="padding:32px 24px">
          <h2 style="color:#0f172a;margin:0 0 8px">Herinnering betaling</h2>
          <p style="color:#64748b;font-size:14px;margin:0 0 24px">
            Dit is een vriendelijke herinnering voor de openstaande factuur.
          </p>
          <table style="width:100%;border-collapse:collapse;background:#fffaf5;border-radius:8px;overflow:hidden">
            <tr><td style="padding:10px 16px;color:#64748b;font-size:13px">Factuurnummer</td>
                <td style="padding:10px 16px;font-weight:600;text-align:right">${factuur.factuur_number}</td></tr>
            <tr style="background:#fff4e0"><td style="padding:10px 16px;color:#64748b;font-size:13px">Vervaldatum</td>
                <td style="padding:10px 16px;font-weight:600;text-align:right;color:#dc2626">${dueDate}</td></tr>
            <tr><td style="padding:10px 16px;color:#64748b;font-size:13px">Openstaand bedrag</td>
                <td style="padding:10px 16px;font-weight:700;font-size:16px;text-align:right;color:#f7941d">€ ${total}</td></tr>
          </table>
          ${factuur.company_iban ? `<p style="margin:20px 0 4px;font-size:13px;color:#64748b">Gelieve te betalen op:</p>
          <p style="font-weight:600;color:#0f172a">${factuur.company_iban}</p>` : ''}
          <p style="margin-top:24px;font-size:12px;color:#94a3b8">
            Heeft u reeds betaald? Dan kunt u deze herinnering negeren.
          </p>
        </div>
      </div>
    `,
    text: `Herinnering: Factuur ${factuur.factuur_number} van € ${total} is vervallen op ${dueDate}.`,
  })

  await adminSupabase
    .from('facturen')
    .update({ last_reminder_at: new Date().toISOString() })
    .eq('id', factuurId)

  revalidatePath('/admin/herinneringen')
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-BE')
}
function fmt(n: number) {
  const [i, dec] = n.toFixed(2).split('.')
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`
}
function daysOverdue(due: string) {
  const days = Math.floor((Date.now() - new Date(due).getTime()) / 86400000)
  return days
}

export default async function HerinneringenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminSupabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const in7days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  // Vervallen facturen (unpaid, past due)
  const { data: overdue } = await adminSupabase
    .from('facturen')
    .select('id, factuur_number, due_date, total, last_reminder_at, customer_id')
    .eq('status', 'verstuurd')
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  // Bijna vervallen (binnen 7 dagen)
  const { data: upcoming } = await adminSupabase
    .from('facturen')
    .select('id, factuur_number, due_date, total, last_reminder_at, customer_id')
    .eq('status', 'verstuurd')
    .gte('due_date', today)
    .lte('due_date', in7days)
    .order('due_date', { ascending: true })

  // Klantnamen ophalen
  const allIds = [...(overdue || []), ...(upcoming || [])].map(f => f.customer_id).filter(Boolean)
  const uniqueIds = [...new Set(allIds)]
  const customerMap: Record<string, string> = {}
  if (uniqueIds.length > 0) {
    const { data: customers } = await adminSupabase
      .from('profiles')
      .select('id, company_name, full_name, email')
      .in('id', uniqueIds)
    customers?.forEach(c => {
      customerMap[c.id] = c.company_name || c.full_name || c.email || 'Onbekend'
    })
  }

  return (
    <AppShell isAdmin>
      <div className="space-y-4">
        <div className="group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3">
          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
          <span className="flex items-start gap-2.5 pr-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
              <Bell className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">Herinneringen</span>
              <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                Stuur betalingsherinneringen naar klanten
              </span>
            </span>
          </span>
        </div>

        {/* Vervallen */}
        {(overdue?.length ?? 0) > 0 && (
          <div className="overflow-hidden rounded-[18px] border border-red-500/20 bg-[var(--bg-card-2)]/80 shadow-sm">
            <div className="flex items-center gap-3 border-b border-red-500/15 bg-red-500/5 px-4 py-3.5 sm:px-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/12 text-red-400">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-main)]">Vervallen facturen</h2>
                <p className="text-xs text-[var(--text-soft)]">{overdue!.length} facturen zijn vervallen en nog niet betaald</p>
              </div>
            </div>
            <div className="divide-y divide-[var(--border-soft)]">
              {overdue!.map(f => {
                const days = daysOverdue(f.due_date)
                const lastSent = f.last_reminder_at
                return (
                  <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/facturen/${f.id}`} className="text-sm font-semibold text-[var(--text-main)] hover:text-[var(--accent)]">
                          {f.factuur_number}
                        </Link>
                        <span className="rounded-full bg-red-500/12 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                          {days}d vervallen
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                        {customerMap[f.customer_id] || '—'} · Vervallen: {fmtDate(f.due_date)} · <strong>€ {fmt(Number(f.total))}</strong>
                      </p>
                      {lastSent && (
                        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                          Laatste herinnering: {fmtDate(lastSent)}
                        </p>
                      )}
                    </div>
                    <form action={sendReminderAction.bind(null, f.id)}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/8 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/15"
                      >
                        <Send className="h-3 w-3" />
                        Stuur herinnering
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Bijna vervallen */}
        {(upcoming?.length ?? 0) > 0 && (
          <div className="overflow-hidden rounded-[18px] border border-amber-500/20 bg-[var(--bg-card-2)]/80 shadow-sm">
            <div className="flex items-center gap-3 border-b border-amber-500/15 bg-amber-500/5 px-4 py-3.5 sm:px-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/12 text-amber-400">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-main)]">Bijna vervallen</h2>
                <p className="text-xs text-[var(--text-soft)]">{upcoming!.length} facturen vervallen binnen 7 dagen</p>
              </div>
            </div>
            <div className="divide-y divide-[var(--border-soft)]">
              {upcoming!.map(f => {
                const days = Math.ceil((new Date(f.due_date).getTime() - Date.now()) / 86400000)
                const lastSent = f.last_reminder_at
                return (
                  <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/facturen/${f.id}`} className="text-sm font-semibold text-[var(--text-main)] hover:text-[var(--accent)]">
                          {f.factuur_number}
                        </Link>
                        <span className="rounded-full bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                          nog {days}d
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                        {customerMap[f.customer_id] || '—'} · Vervalt: {fmtDate(f.due_date)} · <strong>€ {fmt(Number(f.total))}</strong>
                      </p>
                      {lastSent && (
                        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                          Laatste herinnering: {fmtDate(lastSent)}
                        </p>
                      )}
                    </div>
                    <form action={sendReminderAction.bind(null, f.id)}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/15"
                      >
                        <Send className="h-3 w-3" />
                        Stuur herinnering
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(overdue?.length ?? 0) === 0 && (upcoming?.length ?? 0) === 0 && (
          <div className="flex flex-col items-center justify-center rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 py-12 text-center shadow-sm">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="mt-3 text-sm font-semibold text-[var(--text-main)]">Geen openstaande herinneringen</p>
            <p className="mt-1 text-xs text-[var(--text-soft)]">Alle facturen zijn betaald of hebben nog ruim tijd.</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
