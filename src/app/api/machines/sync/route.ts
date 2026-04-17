import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Tablet roept dit aan met connection_code
// Geeft lijst van pending bestanden + download URLs
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { connection_code, listing } = body

  if (!connection_code || typeof connection_code !== 'string') {
    return NextResponse.json({ error: 'connection_code verplicht' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Find machine
  const { data: machine } = await adminSupabase
    .from('machines')
    .select('id, guidance_system')
    .eq('connection_code', connection_code)
    .single()

  if (!machine) {
    return NextResponse.json({ error: 'Machine niet gevonden' }, { status: 404 })
  }

  // Update heartbeat (+ optional directory listing)
  const heartbeat: Record<string, unknown> = {
    is_online: true,
    last_seen_at: new Date().toISOString(),
  }
  if (listing && typeof listing === 'object') {
    heartbeat.last_listing = listing
    heartbeat.last_listing_at = new Date().toISOString()
  }
  const { error: hbError } = await adminSupabase
    .from('machines')
    .update(heartbeat)
    .eq('id', machine.id)
  if (hbError) {
    console.error('[machines/sync] heartbeat update failed:', hbError.message)
    // Retry zonder listing-velden — waarschijnlijk ontbreekt de migratie
    if (listing) {
      await adminSupabase
        .from('machines')
        .update({
          is_online: true,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', machine.id)
    }
  }

  // Get pending transfers
  const { data: transfers } = await adminSupabase
    .from('machine_file_transfers')
    .select('id, file_name, storage_path, subfolder')
    .eq('machine_id', machine.id)
    .eq('status', 'pending')
    .order('created_at')

  if (!transfers?.length) {
    return NextResponse.json({ files: [], guidance_system: machine.guidance_system })
  }

  // Generate signed download URLs
  const files = await Promise.all(
    transfers.map(async (t) => {
      const { data } = await adminSupabase.storage
        .from('machine-files')
        .createSignedUrl(t.storage_path, 600) // 10 min

      return {
        id: t.id,
        name: t.file_name,
        url: data?.signedUrl || null,
        subfolder: t.subfolder || null,
      }
    })
  )

  return NextResponse.json({
    files: files.filter(f => f.url),
    guidance_system: machine.guidance_system,
  })
}

// Tablet bevestigt dat een bestand gesynct is
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { connection_code, transfer_ids } = body

  if (!connection_code || !Array.isArray(transfer_ids)) {
    return NextResponse.json({ error: 'Ongeldige data' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Verify machine
  const { data: machine } = await adminSupabase
    .from('machines')
    .select('id')
    .eq('connection_code', connection_code)
    .single()

  if (!machine) {
    return NextResponse.json({ error: 'Machine niet gevonden' }, { status: 404 })
  }

  // Mark as synced
  await adminSupabase
    .from('machine_file_transfers')
    .update({ status: 'synced', synced_at: new Date().toISOString() })
    .eq('machine_id', machine.id)
    .in('id', transfer_ids)

  return NextResponse.json({ ok: true })
}
