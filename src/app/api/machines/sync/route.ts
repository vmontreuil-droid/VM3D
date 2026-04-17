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

  // Generate signed download URLs
  const files = await Promise.all(
    (transfers || []).map(async (t) => {
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

  // Pending commands (delete/move/pull/push) — met signed URLs waar nodig
  const { data: rawCmds } = await adminSupabase
    .from('machine_commands')
    .select('id, kind, path, new_path, storage_path, file_name')
    .eq('machine_id', machine.id)
    .eq('status', 'pending')
    .order('created_at')
    .limit(25)

  const commands = await Promise.all((rawCmds || []).map(async (c) => {
    let upload_url: string | null = null
    let download_url: string | null = null
    if (c.kind === 'pull' && c.storage_path) {
      const { data } = await adminSupabase.storage
        .from('machine-files')
        .createSignedUploadUrl(c.storage_path)
      upload_url = data?.signedUrl || null
    } else if (c.kind === 'push' && c.storage_path) {
      const { data } = await adminSupabase.storage
        .from('machine-files')
        .createSignedUrl(c.storage_path, 600)
      download_url = data?.signedUrl || null
    }
    return { id: c.id, kind: c.kind, path: c.path, new_path: c.new_path, file_name: c.file_name, upload_url, download_url }
  }))

  // Markeer uitgestuurde commands als "running" zodat ze niet opnieuw verstuurd worden
  if (commands.length > 0) {
    await adminSupabase
      .from('machine_commands')
      .update({ status: 'running' })
      .in('id', commands.map(c => c.id))
  }

  return NextResponse.json({
    files: files.filter(f => f.url),
    guidance_system: machine.guidance_system,
    commands,
  })
}

// Tablet bevestigt dat een bestand gesynct is, of meldt command-resultaten
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { connection_code, transfer_ids, command_results } = body

  if (!connection_code) {
    return NextResponse.json({ error: 'Ongeldige data' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  const { data: machine } = await adminSupabase
    .from('machines')
    .select('id')
    .eq('connection_code', connection_code)
    .single()

  if (!machine) {
    return NextResponse.json({ error: 'Machine niet gevonden' }, { status: 404 })
  }

  if (Array.isArray(transfer_ids) && transfer_ids.length > 0) {
    await adminSupabase
      .from('machine_file_transfers')
      .update({ status: 'synced', synced_at: new Date().toISOString() })
      .eq('machine_id', machine.id)
      .in('id', transfer_ids)
  }

  if (Array.isArray(command_results)) {
    for (const r of command_results) {
      if (!r?.id) continue
      const ok = r.status === 'done' || r.ok === true
      await adminSupabase
        .from('machine_commands')
        .update({
          status: ok ? 'done' : 'failed',
          error: ok ? null : (r.error || null),
          executed_at: new Date().toISOString(),
        })
        .eq('machine_id', machine.id)
        .eq('id', r.id)
    }
  }

  return NextResponse.json({ ok: true })
}
