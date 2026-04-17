import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machineId = parseInt(id)
  if (isNaN(machineId)) return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const q = admin.from('machines').select('id, user_id').eq('id', machineId)
  if (!isAdmin) q.eq('user_id', user.id)
  const { data: machine } = await q.single()
  if (!machine) return NextResponse.json({ error: 'Machine niet gevonden' }, { status: 404 })

  // Storage opruimen (best effort)
  try {
    const { data: files } = await admin.storage
      .from('machine-files')
      .list(`machine-${machine.id}`, { limit: 1000 })
    if (files && files.length > 0) {
      const paths = files.map(f => `machine-${machine.id}/${f.name}`)
      await admin.storage.from('machine-files').remove(paths)
    }
    // subfolders (werven)
    const { data: subs } = await admin.storage
      .from('machine-files')
      .list(`machine-${machine.id}`, { limit: 1000 })
    for (const s of subs || []) {
      if (s.id === null) {
        const { data: inner } = await admin.storage
          .from('machine-files')
          .list(`machine-${machine.id}/${s.name}`, { limit: 1000 })
        if (inner && inner.length > 0) {
          await admin.storage.from('machine-files').remove(
            inner.map(f => `machine-${machine.id}/${s.name}/${f.name}`),
          )
        }
      }
    }
  } catch {
    // ignore — cascade in DB verwijdert transfers, commands
  }

  const { error } = await admin.from('machines').delete().eq('id', machine.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
