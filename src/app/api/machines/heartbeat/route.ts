import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Tablet stuurt elke minuut een ping met connection_code
// Geen auth nodig — connection_code is uniek en niet gevoelig
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { connection_code } = body

  if (!connection_code || typeof connection_code !== 'string') {
    return NextResponse.json({ error: 'connection_code verplicht' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  const { data, error } = await adminSupabase
    .from('machines')
    .update({
      is_online: true,
      last_seen_at: new Date().toISOString(),
    })
    .eq('connection_code', connection_code)
    .select('id, name')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Machine niet gevonden' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, machine: data.name })
}

// GET: check en markeer offline machines (last_seen_at > 3 min geleden)
export async function GET() {
  const adminSupabase = createAdminClient()

  const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString()

  // Markeer machines als offline als ze langer dan 3 minuten geen heartbeat stuurden
  await adminSupabase
    .from('machines')
    .update({ is_online: false })
    .eq('is_online', true)
    .lt('last_seen_at', threeMinAgo)

  // Return huidige status van alle machines
  const { data: machines } = await adminSupabase
    .from('machines')
    .select('id, is_online, last_seen_at')

  return NextResponse.json({ machines: machines || [] })
}
