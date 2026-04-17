import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTicketNotificationConfig, buildBrandedTicketEmailContent } from '@/lib/ticket-notifications'

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
    }

    const body = await req.json()
    const machineId = body.machineId
    const email = String(body.email || '').trim().toLowerCase()

    if (!machineId || !email) {
      return NextResponse.json(
        { error: 'Machine en e-mailadres zijn verplicht.' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()
    const { data: machine, error } = await adminSupabase
      .from('machines')
      .select('id, name, brand, model, connection_code')
      .eq('id', machineId)
      .single()
    if (error || !machine) {
      return NextResponse.json(
        { error: 'Machine niet gevonden.' },
        { status: 404 }
      )
    }

    const config = getTicketNotificationConfig()
    if (!config.enabled) {
      return NextResponse.json(
        {
          error:
            'E-mailverzending is niet geconfigureerd (Resend API key of afzender ontbreekt).',
        },
        { status: 500 }
      )
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const setupUrl = `${baseUrl.replace(/\/$/, '')}/machines/setup/${machine.connection_code}`

    const title = `${machine.brand} ${machine.model} — ${machine.name}`
    const subject = `Installatielink voor ${title}`
    const text = `Hallo,\n\nHieronder de installatielink voor de machine ${title}.\n\nOpen deze link op de tablet of smartphone in de cabine:\n${setupUrl}\n\nDe wizard leidt je door alle stappen.\n\nMet vriendelijke groet,\nVM Plan & Consult`
    const html = `<p>Hallo,</p>
<p>Hieronder de installatielink voor de machine <strong>${title}</strong>.</p>
<p>Open deze link op de tablet of smartphone in de cabine:</p>
<p><a href="${setupUrl}" style="display:inline-block;padding:10px 18px;background:#f28c3a;color:#fff;border-radius:8px;font-weight:600;text-decoration:none">Open installatie</a></p>
<p style="font-size:12px;color:#666">Of kopieer deze URL: <br/><code>${setupUrl}</code></p>
<p>De wizard leidt je door alle stappen.</p>
<p>Met vriendelijke groet,<br/>VM Plan &amp; Consult</p>`

    const branded = buildBrandedTicketEmailContent({ subject, html, text })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.fromAddress,
        to: [email],
        subject: branded.subject,
        html: branded.html,
        text: branded.text,
      }),
    })

    if (!response.ok) {
      const payload = await response.text()
      return NextResponse.json(
        { error: `Mail niet verzonden: ${payload}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ sent: true, to: email })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Onbekende serverfout.',
      },
      { status: 500 }
    )
  }
}
