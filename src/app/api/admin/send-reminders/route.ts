import { createAdminClient } from '@/lib/supabase/admin'
import { sendTicketNotificationEmail } from '@/lib/ticket-notifications'
import { NextResponse } from 'next/server'

// Vercel Cron roept dit dagelijks aan om 07:00 (UTC).
// Beveiligd via CRON_SECRET header — stel in als env var.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const adminSupabase = createAdminClient()
  const today  = new Date()
  const todayStr    = today.toISOString().split('T')[0]
  const in3daysStr  = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  const ago3daysStr = new Date(Date.now() - 3 * 86400000).toISOString()
  const ago7daysStr = new Date(Date.now() - 7 * 86400000).toISOString()

  // Facturen die een herinnering nodig hebben:
  // 1. Vervallen (due_date < today) + geen herinnering afgelopen 7 dagen
  // 2. Bijna vervallen (due_date in 3 dagen) + nog geen herinnering afgelopen 3 dagen
  const { data: candidates } = await adminSupabase
    .from('facturen')
    .select('id, factuur_number, due_date, total, customer_id, last_reminder_at')
    .eq('status', 'verstuurd')
    .lte('due_date', in3daysStr)
    .order('due_date', { ascending: true })

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 })
  }

  // Klantemails ophalen
  const customerIds = [...new Set(candidates.map(f => f.customer_id).filter(Boolean))]
  const { data: profiles } = await adminSupabase
    .from('profiles')
    .select('id, email, company_name, full_name')
    .in('id', customerIds)

  const emailMap: Record<string, string> = {}
  const nameMap:  Record<string, string> = {}
  profiles?.forEach(p => {
    if (p.email) emailMap[p.id] = p.email
    nameMap[p.id] = p.company_name || p.full_name || p.email || ''
  })

  let sent = 0, skipped = 0

  for (const f of candidates) {
    const email = emailMap[f.customer_id]
    if (!email) { skipped++; continue }

    const isOverdue  = f.due_date < todayStr
    const cooldown   = isOverdue ? ago7daysStr : ago3daysStr

    // Skip als er al een recente herinnering verstuurd werd
    if (f.last_reminder_at && f.last_reminder_at > cooldown) {
      skipped++
      continue
    }

    const dueDateFormatted = new Date(f.due_date).toLocaleDateString('nl-BE')
    const total = Number(f.total).toFixed(2).replace('.', ',')
    const klant = nameMap[f.customer_id] || ''
    const tag   = isOverdue ? `VERVALLEN` : `Vervalt binnenkort`

    const { error: mailErr } = { error: null } // linter placeholder
    const result = await sendTicketNotificationEmail({
      to: [email],
      subject: `[${tag}] Factuur ${f.factuur_number} — € ${total}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#f7941d;height:4px;border-radius:4px 4px 0 0"></div>
          <div style="padding:28px 24px 24px;background:#fff;border:1px solid #fde8c8;border-top:none;border-radius:0 0 8px 8px">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.08em;color:#f7941d;text-transform:uppercase">
              MV3D.CLOUD
            </p>
            <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a">
              ${isOverdue ? 'Herinnering: openstaande factuur' : 'Uw factuur vervalt binnenkort'}
            </h2>
            ${klant ? `<p style="margin:0 0 12px;font-size:14px;color:#475569">Beste ${klant},</p>` : ''}
            <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6">
              ${isOverdue
                ? `Graag vestigen wij uw aandacht op onderstaande factuur die reeds <strong>vervallen</strong> is. Wij verzoeken u vriendelijk het openstaande bedrag zo snel mogelijk te voldoen.`
                : `Ter herinnering: onderstaande factuur vervalt binnenkort. Gelieve tijdig te betalen.`}
            </p>
            <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #fde8c8">
              <tr style="background:#fff9f0">
                <td style="padding:10px 16px;font-size:13px;color:#94a3b8">Factuurnummer</td>
                <td style="padding:10px 16px;font-weight:600;text-align:right;color:#0f172a">${f.factuur_number}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:13px;color:#94a3b8">Vervaldatum</td>
                <td style="padding:10px 16px;font-weight:600;text-align:right;color:${isOverdue ? '#dc2626' : '#d97706'}">${dueDateFormatted}</td>
              </tr>
              <tr style="background:#fff9f0">
                <td style="padding:10px 16px;font-size:13px;color:#94a3b8">Openstaand bedrag</td>
                <td style="padding:10px 16px;font-weight:700;font-size:16px;text-align:right;color:#f7941d">€ ${total}</td>
              </tr>
            </table>
            <p style="margin:20px 0 8px;font-size:12px;color:#94a3b8">
              Heeft u reeds betaald? Dan kunt u deze herinnering negeren.
              Neem bij vragen contact op via <a href="mailto:facturatie@mv3d.be" style="color:#f7941d">facturatie@mv3d.be</a>.
            </p>
          </div>
        </div>
      `,
      text: `[${tag}] Factuur ${f.factuur_number} — € ${total} — vervaldatum: ${dueDateFormatted}.\nNeem contact op via facturatie@mv3d.be.`,
    })

    if (result.sent) {
      await adminSupabase
        .from('facturen')
        .update({ last_reminder_at: new Date().toISOString() })
        .eq('id', f.id)
      sent++
    } else {
      console.error(`reminder failed for factuur ${f.factuur_number}:`, result)
      skipped++
    }
  }

  console.log(`[send-reminders] sent=${sent} skipped=${skipped} total=${candidates.length}`)
  return NextResponse.json({ sent, skipped, total: candidates.length })
}
