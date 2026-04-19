import { createAdminClient } from '@/lib/supabase/admin'
import { sendTicketNotificationEmail } from '@/lib/ticket-notifications'
import { NextResponse } from 'next/server'

// Vercel Cron: elke 1e van de maand om 06:00 UTC
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const adminSupabase = createAdminClient()

  // Vorige maand berekenen
  const now       = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const periode   = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`
  const periodeStart = `${periode}-01`
  const periodeEnd   = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const periodeLabel = prevMonth.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })

  // Admin profiel (MV3D.CLOUD) ophalen
  const { data: adminProfile } = await adminSupabase
    .from('profiles')
    .select('id, company_name, full_name, email, vat_number, street, house_number, postal_code, city, iban, bic')
    .eq('role', 'admin')
    .single()

  // Alle actieve agenten ophalen
  const { data: agents } = await adminSupabase
    .from('profiles')
    .select('id, company_name, full_name, email, commission_rate')
    .eq('role', 'agent')
    .eq('agent_active', true)

  if (!agents || agents.length === 0) {
    return NextResponse.json({ generated: 0, skipped: 0, periode })
  }

  let generated = 0, skipped = 0

  for (const agent of agents) {
    // Al gegenereerd voor deze periode?
    const { data: existing } = await adminSupabase
      .from('agent_commission_runs')
      .select('id')
      .eq('agent_id', agent.id)
      .eq('periode', periode)
      .single()

    if (existing) { skipped++; continue }

    const commRate = Number(agent.commission_rate) || 0
    if (commRate <= 0) { skipped++; continue }

    // Facturen van agent vorige maand (verstuurd of betaald)
    const { data: agentFacturen } = await adminSupabase
      .from('facturen')
      .select('id, total, factuur_number')
      .eq('agent_id', agent.id)
      .in('status', ['verstuurd', 'betaald'])
      .gte('created_at', periodeStart)
      .lt('created_at', periodeEnd)

    const basisBedrag = (agentFacturen || []).reduce((sum, f) => sum + Number(f.total), 0)
    if (basisBedrag <= 0) { skipped++; continue }

    const commBedrag = Math.round(basisBedrag * commRate) / 100
    const vatRate    = 0.21
    const subtotal   = Math.round(commBedrag * 100) / 100
    const vatAmount  = Math.round(subtotal * vatRate * 100) / 100
    const total      = subtotal + vatAmount

    // Commissiefactuur nummer genereren
    const year = now.getFullYear()
    const { count } = await adminSupabase
      .from('facturen')
      .select('id', { count: 'exact', head: true })
      .like('factuur_number', `COMM-${year}%`)
    const commNumber = `COMM-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

    // Factuur aanmaken (admin → agent)
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split('T')[0]

    const { data: factuur } = await adminSupabase
      .from('facturen')
      .insert({
        factuur_number: commNumber,
        customer_id:    agent.id,
        status:         'verstuurd',
        subject:        `Commissie ${periodeLabel}`,
        subtotal,
        vat_amount:     vatAmount,
        total,
        due_date:       dueDate,
        payment_terms:  '15 dagen na factuurdatum',
        notes: `Commissie ${commRate}% op ${(agentFacturen || []).length} facturen — basis: € ${basisBedrag.toFixed(2).replace('.', ',')}`,
        created_at:     new Date().toISOString(),
      })
      .select('id')
      .single()

    if (!factuur) { skipped++; continue }

    // Factuurlijn aanmaken
    await adminSupabase.from('factuur_lines').insert({
      factuur_id:  factuur.id,
      position:    1,
      description: `Commissie ${commRate}% op gefactureerde omzet ${periodeLabel}`,
      quantity:    1,
      unit:        'forfait',
      unit_price:  subtotal,
      vat_rate:    '21%',
      line_total:  subtotal,
    })

    // Commission run registreren
    await adminSupabase.from('agent_commission_runs').insert({
      agent_id:         agent.id,
      periode,
      basis_bedrag:     basisBedrag,
      commission_rate:  commRate,
      commission_bedrag: commBedrag,
      factuur_id:       factuur.id,
    })

    // Email naar agent
    const agentName = agent.company_name || agent.full_name || 'Agent'
    const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL || 'https://mv3d.cloud'

    if (agent.email) {
      await sendTicketNotificationEmail({
        to:      [agent.email],
        subject: `Commissiefactuur ${commNumber} — ${periodeLabel}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <div style="background:#f7941d;height:4px;border-radius:4px 4px 0 0"></div>
            <div style="padding:24px;background:#fff;border:1px solid #fde8c8;border-top:none;border-radius:0 0 8px 8px">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#f7941d;text-transform:uppercase">MV3D.CLOUD</p>
              <h2 style="margin:0 0 12px;font-size:16px;color:#0f172a">Commissiefactuur ${commNumber}</h2>
              <p style="font-size:13px;color:#475569;margin:0 0 16px">Beste ${agentName},</p>
              <table style="width:100%;border-collapse:collapse;border:1px solid #fde8c8;border-radius:8px;overflow:hidden">
                <tr style="background:#fff9f0">
                  <td style="padding:10px 16px;font-size:13px;color:#94a3b8">Periode</td>
                  <td style="padding:10px 16px;font-weight:600;text-align:right;color:#0f172a">${periodeLabel}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;font-size:13px;color:#94a3b8">Basis (uw omzet)</td>
                  <td style="padding:10px 16px;font-weight:600;text-align:right;color:#0f172a">€ ${basisBedrag.toFixed(2).replace('.', ',')}</td>
                </tr>
                <tr style="background:#fff9f0">
                  <td style="padding:10px 16px;font-size:13px;color:#94a3b8">Commissie ${commRate}%</td>
                  <td style="padding:10px 16px;font-weight:600;text-align:right;color:#0f172a">€ ${subtotal.toFixed(2).replace('.', ',')}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;font-size:13px;color:#94a3b8">BTW 21%</td>
                  <td style="padding:10px 16px;font-weight:600;text-align:right;color:#0f172a">€ ${vatAmount.toFixed(2).replace('.', ',')}</td>
                </tr>
                <tr style="background:#fff9f0">
                  <td style="padding:10px 16px;font-size:13px;font-weight:700;color:#f7941d">Totaal te betalen</td>
                  <td style="padding:10px 16px;font-weight:700;font-size:16px;text-align:right;color:#f7941d">€ ${total.toFixed(2).replace('.', ',')}</td>
                </tr>
              </table>
              <p style="margin:16px 0 4px;font-size:12px;color:#94a3b8">
                Vervaldatum: ${new Date(dueDate).toLocaleDateString('nl-BE')} ·
                Betalen via <a href="mailto:facturatie@mv3d.be" style="color:#f7941d">facturatie@mv3d.be</a>
              </p>
            </div>
          </div>
        `,
        text: `Commissiefactuur ${commNumber} — ${periodeLabel}\nBasis: € ${basisBedrag.toFixed(2)} | Commissie ${commRate}%: € ${subtotal.toFixed(2)} | Totaal: € ${total.toFixed(2)}\nVervaldatum: ${dueDate}`,
      })
    }

    generated++
    console.log(`[commission] agent=${agent.email} periode=${periode} basis=${basisBedrag} comm=${commBedrag} factuur=${commNumber}`)
  }

  console.log(`[generate-commission-invoices] generated=${generated} skipped=${skipped} periode=${periode}`)
  return NextResponse.json({ generated, skipped, periode })
}
