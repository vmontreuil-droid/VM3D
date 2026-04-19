import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

async function createAgentFactuur(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role, commission_rate, company_name, full_name').eq('id', user.id).single()
  if (profile?.role !== 'agent') redirect('/agent')

  const adminSupabase = createAdminClient()
  const customerId = String(formData.get('customer_id') || '')
  const subject    = String(formData.get('subject') || '').trim()
  const notes      = String(formData.get('notes') || '').trim()
  const dueDate    = String(formData.get('due_date') || '')

  // Lijngegevens
  const descriptions = formData.getAll('description').map(String)
  const quantities   = formData.getAll('quantity').map(v => parseFloat(String(v)) || 0)
  const unitPrices   = formData.getAll('unit_price').map(v => parseFloat(String(v)) || 0)
  const units        = formData.getAll('unit').map(String)
  const vatRates     = formData.getAll('vat_rate').map(String)

  if (!customerId || descriptions.length === 0) redirect('/agent/facturen/new?error=missing')

  const lines = descriptions.map((desc, i) => ({
    description: desc,
    quantity:    quantities[i] || 1,
    unit_price:  unitPrices[i] || 0,
    unit:        units[i] || 'stuk',
    vat_rate:    vatRates[i] || '21%',
    line_total:  (quantities[i] || 1) * (unitPrices[i] || 0),
  })).filter(l => l.description.trim())

  const vatRate  = parseFloat((lines[0]?.vat_rate || '21%').replace('%', '')) / 100
  const subtotal = lines.reduce((s, l) => s + l.line_total, 0)
  const vatAmt   = subtotal * vatRate
  const total    = subtotal + vatAmt

  // Factuurnummer: agent gebruikt AGENT-prefix
  const year = new Date().getFullYear()
  const { count } = await adminSupabase
    .from('facturen')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', user.id)
    .gte('created_at', `${year}-01-01`)
  const factuurNumber = `AGT-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data: factuur } = await adminSupabase
    .from('facturen')
    .insert({
      factuur_number: factuurNumber,
      agent_id:       user.id,
      customer_id:    customerId || null,
      status:         'concept',
      subject:        subject || null,
      notes:          notes   || null,
      due_date:       dueDate || null,
      subtotal,
      vat_amount:     vatAmt,
      total,
      created_at:     new Date().toISOString(),
    })
    .select('id')
    .single()

  if (!factuur) redirect('/agent/facturen/new?error=create')

  for (let i = 0; i < lines.length; i++) {
    await adminSupabase.from('factuur_lines').insert({
      factuur_id:  factuur.id,
      position:    i + 1,
      ...lines[i],
    })
  }

  redirect('/agent')
}

export default async function AgentNieuweFactuurPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()

  // Toegewezen klanten ophalen
  const { data: assignments } = await adminSupabase
    .from('agent_assignments')
    .select('customer_id')
    .eq('agent_id', user.id)
  const customerIds = [...new Set((assignments || []).map(a => a.customer_id).filter(Boolean))]

  const { data: customers } = customerIds.length > 0
    ? await adminSupabase.from('profiles').select('id, company_name, full_name, email').in('id', customerIds)
    : { data: [] }

  if (customerIds.length === 0) redirect('/agent')

  const inputCls = 'w-full rounded-xl border border-[var(--border-soft,#1e293b)] bg-[var(--bg-main,#0f172a)] px-3 py-2.5 text-sm text-white outline-none focus:border-[#f7941d]/50'
  const labelCls = 'block text-[10px] font-semibold uppercase tracking-wider text-slate-400'

  return (
    <div className="min-h-screen bg-[var(--bg-main,#0f172a)] p-4 pb-12">
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href="/agent" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Terug naar dashboard
        </Link>

        <div className="overflow-hidden rounded-2xl border border-[var(--border-soft,#1e293b)] bg-[var(--bg-card,#1e293b)]">
          <div className="border-b border-[var(--border-soft,#1e293b)] px-5 py-4">
            <h1 className="text-base font-semibold text-white">Nieuwe factuur opmaken</h1>
          </div>

          <form action={createAgentFactuur} className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Klant <span className="text-[#f7941d]">*</span></label>
                <select name="customer_id" required className={inputCls}>
                  <option value="">Selecteer klant…</option>
                  {(customers || []).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company_name || c.full_name || c.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Onderwerp</label>
                <input name="subject" type="text" className={inputCls} placeholder="Beschrijving van de opdracht" />
              </div>
              <div>
                <label className={labelCls}>Vervaldatum</label>
                <input name="due_date" type="date" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Notities</label>
                <input name="notes" type="text" className={inputCls} placeholder="Interne notitie…" />
              </div>
            </div>

            {/* Lijnen */}
            <div>
              <p className={labelCls + ' mb-2'}>Factuurlijnen</p>
              <div className="space-y-2" id="lines">
                {[0, 1, 2].map(i => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <input name="description" type="text" className={inputCls} placeholder="Omschrijving" />
                    </div>
                    <div className="col-span-2">
                      <input name="quantity" type="number" step="0.01" defaultValue="1" className={inputCls} placeholder="Aantal" />
                    </div>
                    <div className="col-span-2">
                      <input name="unit" type="text" defaultValue="stuk" className={inputCls} placeholder="Eenh." />
                    </div>
                    <div className="col-span-2">
                      <input name="unit_price" type="number" step="0.01" className={inputCls} placeholder="Prijs" />
                    </div>
                    <div className="col-span-1">
                      <select name="vat_rate" className={inputCls}>
                        <option value="21%">21%</option>
                        <option value="12%">12%</option>
                        <option value="6%">6%</option>
                        <option value="0%">0%</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-[#f7941d] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                Factuur opslaan als concept
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
