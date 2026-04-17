import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Helper: auth + machine ownership + admin client
async function auth(req: NextRequest, machineId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const q = admin.from('machines').select('id, user_id, connection_code').eq('id', machineId)
  if (!isAdmin) q.eq('user_id', user.id)
  const { data: machine } = await q.single()
  if (!machine) return { error: NextResponse.json({ error: 'Machine niet gevonden' }, { status: 404 }) }

  return { user, admin, machine }
}

// -----------------------------------------------------------------------------
// POST — maak een nieuw command aan
//   delete : JSON {kind:'delete', path}
//   move   : JSON {kind:'move',   path, new_path}
//   pull   : JSON {kind:'pull',   path}  → tablet upload bestand, download via GET
//   push   : multipart {kind:'push', path, file}  → tablet download + schrijft path
// -----------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machineId = parseInt(id)
  if (isNaN(machineId)) return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })

  const r = await auth(req, machineId)
  if ('error' in r) return r.error
  const { user, admin, machine } = r

  const ct = req.headers.get('content-type') || ''

  // ---- push (multipart) -----------------------------------------------------
  if (ct.startsWith('multipart/form-data')) {
    const form = await req.formData()
    const kind = String(form.get('kind') || 'push')
    if (kind !== 'push') {
      return NextResponse.json({ error: 'Alleen push ondersteunt multipart' }, { status: 400 })
    }
    const path = String(form.get('path') || '').trim()
    const file = form.get('file') as File | null
    if (!path || !file) return NextResponse.json({ error: 'path + file verplicht' }, { status: 400 })

    const ts = Date.now()
    const safe = file.name.replace(/[^\w.\-]+/g, '_')
    const storagePath = `machine-${machine.id}/commands/push-${ts}-${safe}`
    const buf = Buffer.from(await file.arrayBuffer())
    const { error: upErr } = await admin.storage
      .from('machine-files')
      .upload(storagePath, buf, { contentType: file.type || 'application/octet-stream', upsert: true })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    const { data: cmd, error } = await admin
      .from('machine_commands')
      .insert({
        machine_id: machine.id,
        requested_by: user.id,
        kind: 'push',
        path,
        storage_path: storagePath,
        file_name: file.name,
        file_size: buf.length,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, command: cmd })
  }

  // ---- json (delete / move / pull) ------------------------------------------
  const body = await req.json().catch(() => ({}))
  const kind = String(body.kind || '')
  const path = String(body.path || '').trim()
  if (!path) return NextResponse.json({ error: 'path verplicht' }, { status: 400 })

  if (kind === 'delete') {
    const { data, error } = await admin.from('machine_commands')
      .insert({ machine_id: machine.id, requested_by: user.id, kind, path, file_name: path.split('/').pop() })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, command: data })
  }

  if (kind === 'move') {
    const new_path = String(body.new_path || '').trim()
    if (!new_path) return NextResponse.json({ error: 'new_path verplicht' }, { status: 400 })
    const { data, error } = await admin.from('machine_commands')
      .insert({ machine_id: machine.id, requested_by: user.id, kind, path, new_path, file_name: path.split('/').pop() })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, command: data })
  }

  if (kind === 'pull') {
    const ts = Date.now()
    const safe = path.split('/').pop()!.replace(/[^\w.\-]+/g, '_')
    const storagePath = `machine-${machine.id}/commands/pull-${ts}-${safe}`
    const { data, error } = await admin.from('machine_commands')
      .insert({
        machine_id: machine.id,
        requested_by: user.id,
        kind,
        path,
        storage_path: storagePath,
        file_name: path.split('/').pop(),
      })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, command: data })
  }

  return NextResponse.json({ error: `Onbekend kind: ${kind}` }, { status: 400 })
}

// -----------------------------------------------------------------------------
// GET — lijst commands (of poll enkel command met ?command_id=..)
//   Voor pull-commands met status=done: download_url wordt meegestuurd.
// -----------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machineId = parseInt(id)
  if (isNaN(machineId)) return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })

  const r = await auth(req, machineId)
  if ('error' in r) return r.error
  const { admin, machine } = r

  const url = new URL(req.url)
  const cmdId = url.searchParams.get('command_id')

  const q = admin.from('machine_commands')
    .select('*')
    .eq('machine_id', machine.id)
    .order('created_at', { ascending: false })
    .limit(50)
  if (cmdId) q.eq('id', parseInt(cmdId))

  const { data } = await q
  const commands = await Promise.all((data || []).map(async (c) => {
    let download_url: string | null = null
    if (c.kind === 'pull' && c.status === 'done' && c.storage_path) {
      const { data: signed } = await admin.storage
        .from('machine-files')
        .createSignedUrl(c.storage_path, 600)
      download_url = signed?.signedUrl || null
    }
    return { ...c, download_url }
  }))

  return NextResponse.json({ commands })
}

// -----------------------------------------------------------------------------
// DELETE — annuleer een pending command
// -----------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machineId = parseInt(id)
  if (isNaN(machineId)) return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })

  const r = await auth(req, machineId)
  if ('error' in r) return r.error
  const { admin, machine } = r

  const url = new URL(req.url)
  const cmdId = url.searchParams.get('command_id')
  if (!cmdId) return NextResponse.json({ error: 'command_id verplicht' }, { status: 400 })

  await admin.from('machine_commands')
    .delete()
    .eq('id', parseInt(cmdId))
    .eq('machine_id', machine.id)
    .eq('status', 'pending')

  return NextResponse.json({ ok: true })
}
