import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

async function createFactuurFromOfferte(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminSupabase = createAdminClient()
  const offerteId = formData.get('offerte_id') as string
  const dueDateRaw = formData.get('due_date') as string
  const notes = formData.get('notes') as string

  // Haal offerte + regels op
  const { data: offerte } = await adminSupabase
    .from('offertes')
    .select('*')
    .eq('id', Number(offerteId))
    .single()

  if (!offerte) redirect('/admin/offerte?error=not_found')

  const { data: lines } = await adminSupabase
    .from('offerte_lines')
    .select('*')
    .eq('offerte_id', offerte.id)
    .order('position')

  // Factuurnummer genereren
  const year = new Date().getFullYear()
  const { count } = await adminSupabase
    .from('facturen')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)

  const factuurNumber = `FAC-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  // Factuur aanmaken
  const { data: factuur, error: factuurError } = await adminSupabase
    .from('facturen')
    .insert({
      factuur_number: factuurNumber,
      offerte_id: offerte.id,
      customer_id: offerte.customer_id,
      project_id: offerte.project_id,
      created_by: user.id,
      status: 'concept',
      subject: offerte.subject,
      description: offerte.description,
      due_date: dueDateRaw || null,
      currency: offerte.currency,
      vat_rate: offerte.vat_rate,
      payment_terms: offerte.payment_terms,
      notes: notes || offerte.notes,
      subtotal: offerte.subtotal,
      vat_amount: offerte.vat_amount,
      total: offerte.total,
    })
    .select('id')
    .single()

  if (factuurError || !factuur) {
    console.error('createFactuur error:', factuurError)
    redirect(`/admin/facturen/from-offerte/${offerteId}?error=save`)
  }

  // Regels kopiëren
  if (lines && lines.length > 0) {
    const lineInserts = lines.map((line: any) => ({
      factuur_id: factuur.id,
      position: line.position,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unit_price: line.unit_price,
      vat_rate: line.vat_rate,
      line_total: line.line_total,
    }))

    await adminSupabase.from('factuur_lines').insert(lineInserts)
  }

  // Update project status to facturatie
  if (offerte.project_id) {
    await adminSupabase
      .from('projects')
      .update({ status: 'facturatie' })
      .eq('id', offerte.project_id)
  }

  redirect(`/admin/facturen?created=${factuur.id}`)
}

type Props = {
  params?: Promise<{ offerteId: string }>
  searchParams?: Promise<{ error?: string }>
}

export default async function FactuurFromOffertePage({ params, searchParams }: Props) {
  const resolvedParams = params ? await params : { offerteId: '' }
  const resolvedSearchParams = searchParams ? await searchParams : {}

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminSupabase = createAdminClient()

  const { data: offerte } = await adminSupabase
    .from('offertes')
    .select('*')
    .eq('id', Number(resolvedParams.offerteId))
    .single()

  if (!offerte) redirect('/admin/offerte')

  // Klantnaam ophalen
  let customerName = 'Onbekende klant'
  if (offerte.customer_id) {
    const { data: customer } = await adminSupabase
      .from('profiles')
      .select('company_name, full_name, email')
      .eq('id', offerte.customer_id)
      .single()
    if (customer) {
      customerName = customer.company_name || customer.full_name || customer.email || 'Onbekend'
    }
  }

  // Offerte regels ophalen
  const { data: lines } = await adminSupabase
    .from('offerte_lines')
    .select('*')
    .eq('offerte_id', offerte.id)
    .order('position')

  const safeLines = lines ?? []

  // Default vervaldatum: 30 dagen
  const defaultDueDate = new Date()
  defaultDueDate.setDate(defaultDueDate.getDate() + 30)
  const dueDateStr = defaultDueDate.toISOString().split('T')[0]

  return (
    <AppShell isAdmin>
      <div className="space-y-4">
        <Link
          href="/admin/offerte"
          className="group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
        >
          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
          <span className="flex items-start gap-2.5 pr-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">Offertes</span>
              <span className="block text-[11px] leading-4 text-[var(--text-soft)]">Terug naar offerteoverzicht</span>
            </span>
          </span>
        </Link>

        {resolvedSearchParams.error === 'save' && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Er ging iets mis bij het aanmaken van de factuur.
          </div>
        )}

        <form action={createFactuurFromOfferte} className="space-y-4">
          <input type="hidden" name="offerte_id" value={offerte.id} />

          {/* Offerte samenvatting */}
          <div className="overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm">
            <div className="flex items-start gap-3 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-main)]">Factuur opmaken vanuit offerte</h2>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Alle gegevens en regels worden overgenomen van offerte {offerte.offerte_number}.
                </p>
              </div>
            </div>

            <div className="space-y-4 px-4 py-4 sm:px-5">
              {/* Offerte info */}
              <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Bronofferte
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)]">Offertenummer</p>
                    <p className="text-sm font-semibold text-[var(--text-main)]">{offerte.offerte_number}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)]">Klant</p>
                    <p className="text-sm font-semibold text-[var(--text-main)]">{customerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)]">Onderwerp</p>
                    <p className="text-sm text-[var(--text-main)]">{offerte.subject || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Regels preview */}
              {safeLines.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Regels die worden overgenomen
                  </p>
                  <div className="space-y-1">
                    {safeLines.map((line: any, i: number) => (
                      <div key={line.id} className="flex items-center justify-between rounded-lg bg-[var(--bg-card)] px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-[var(--text-main)] truncate">{line.description}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            {line.quantity} × €{Number(line.unit_price).toFixed(2)} · {line.vat_rate} BTW
                          </p>
                        </div>
                        <p className="ml-3 text-sm font-semibold text-[var(--text-main)]">
                          €{Number(line.line_total).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totalen */}
              <div className="flex justify-end">
                <div className="w-full max-w-[300px] space-y-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-soft)]">Subtotaal</span>
                    <span className="font-semibold text-[var(--text-main)]">€{Number(offerte.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-soft)]">BTW</span>
                    <span className="font-semibold text-[var(--text-main)]">€{Number(offerte.vat_amount).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[var(--border-soft)] pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--accent)]">Totaal</span>
                      <span className="text-lg font-bold text-[var(--accent)]">€{Number(offerte.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra velden */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Vervaldatum
                  </label>
                  <input
                    name="due_date"
                    type="date"
                    defaultValue={dueDateStr}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    style={{ colorScheme: 'dark' as const }}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Opmerkingen
                  </label>
                  <textarea
                    name="notes"
                    className="input-dark min-h-[80px] w-full resize-none px-3 py-2.5 text-sm"
                    placeholder="Extra opmerkingen voor de factuur..."
                    defaultValue={offerte.notes || ''}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
            >
              <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
              <span className="flex items-start gap-2.5 pr-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                    Factuur aanmaken
                  </span>
                  <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                    Opslaan als concept factuur
                  </span>
                </span>
              </span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
