import { createAdminClient } from '@/lib/supabase/admin'
import { sendTicketNotificationEmail } from '@/lib/ticket-notifications'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { token, senderName, message } = await req.json()
  if (!token || !message?.trim()) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  const { data: offerte } = await adminSupabase
    .from('offertes')
    .select('id, offerte_number, subject')
    .eq('signature_token', token)
    .single()

  if (!offerte) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  await adminSupabase.from('offerte_messages').insert({
    offerte_id:  offerte.id,
    sender_type: 'customer',
    sender_name: senderName?.trim() || null,
    message:     message.trim(),
  })

  await sendTicketNotificationEmail({
    to:      ['facturatie@mv3d.be'],
    subject: `Vraag over offerte ${offerte.offerte_number}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#f7941d;height:4px;border-radius:4px 4px 0 0"></div>
        <div style="padding:24px;background:#fff;border:1px solid #fde8c8;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#f7941d;text-transform:uppercase">MV3D.CLOUD</p>
          <h2 style="margin:0 0 12px;font-size:16px;color:#0f172a">
            Nieuwe vraag — offerte ${offerte.offerte_number}
          </h2>
          ${offerte.subject ? `<p style="margin:0 0 8px;font-size:13px;color:#64748b">${offerte.subject}</p>` : ''}
          ${senderName?.trim() ? `<p style="font-size:13px;color:#475569;margin:0 0 12px"><strong>Van:</strong> ${senderName.trim()}</p>` : ''}
          <div style="background:#fff9f0;border-left:3px solid #f7941d;padding:12px 16px;border-radius:0 4px 4px 0;margin:0 0 16px">
            <p style="font-size:14px;color:#1e293b;margin:0;line-height:1.6">${message.trim().replace(/\n/g, '<br>')}</p>
          </div>
          <p style="font-size:12px;color:#94a3b8">Beantwoord via het admin portaal.</p>
        </div>
      </div>
    `,
    text: `Nieuwe vraag van ${senderName?.trim() || 'klant'} over offerte ${offerte.offerte_number}:\n\n${message.trim()}`,
  })

  return NextResponse.json({ ok: true })
}
