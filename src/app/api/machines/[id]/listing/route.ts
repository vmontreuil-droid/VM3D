import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: return the most recent directory listing reported by the tablet.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machineId = parseInt(id, 10)
  if (Number.isNaN(machineId)) {
    return NextResponse.json({ error: 'Ongeldig id.' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  const query = adminSupabase
    .from('machines')
    .select('id, user_id, guidance_system, last_listing, last_listing_at, last_seen_at')
    .eq('id', machineId)
  if (!isAdmin) query.eq('user_id', user.id)

  const { data: machine } = await query.maybeSingle()
  if (!machine) {
    return NextResponse.json({ error: 'Machine niet gevonden.' }, { status: 404 })
  }

  return NextResponse.json({
    guidance_system: machine.guidance_system,
    listing: machine.last_listing || null,
    listing_at: machine.last_listing_at,
    last_seen_at: machine.last_seen_at,
  })
}
