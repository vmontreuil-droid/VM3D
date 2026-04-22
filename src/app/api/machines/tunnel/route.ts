import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Tablet meldt zijn Cloudflare-Tunnel URL voor in-browser remote view.
// Auth via connection_code (zelfde patroon als /api/machines/heartbeat).
//
// Body: { connection_code: string, tunnel_url: string | null }
//   tunnel_url null => verwijder de tunnel (tablet is afgesloten / restart)
export async function POST(req: NextRequest) {
  let body: { connection_code?: unknown; tunnel_url?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const connectionCode = typeof body.connection_code === 'string' ? body.connection_code.trim() : ''
  if (!connectionCode) {
    return NextResponse.json({ error: 'connection_code verplicht' }, { status: 400 })
  }

  let tunnelUrl: string | null = null
  if (body.tunnel_url !== null && body.tunnel_url !== undefined) {
    if (typeof body.tunnel_url !== 'string') {
      return NextResponse.json({ error: 'tunnel_url moet een string zijn of null' }, { status: 400 })
    }
    const trimmed = body.tunnel_url.trim()
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      return NextResponse.json({ error: 'tunnel_url moet beginnen met http(s)://' }, { status: 400 })
    }
    tunnelUrl = trimmed || null
  }

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('machines')
    .update({
      tunnel_url: tunnelUrl,
      tunnel_seen_at: tunnelUrl ? new Date().toISOString() : null,
    })
    .eq('connection_code', connectionCode)
    .select('id, name')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Machine niet gevonden' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, machine: data.name, tunnel_url: tunnelUrl })
}
