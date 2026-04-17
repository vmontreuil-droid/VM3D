import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: download all files in a werf as a zip archive
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; name: string }> },
) {
  const { id, name } = await params
  const machineId = parseInt(id)
  if (isNaN(machineId))
    return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })

  const werfName = decodeURIComponent(name)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const adminSupabase = createAdminClient()

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  const machineQuery = adminSupabase
    .from('machines')
    .select('id, user_id')
    .eq('id', machineId)
  if (!isAdmin) machineQuery.eq('user_id', user.id)

  const { data: machine } = await machineQuery.single()
  if (!machine)
    return NextResponse.json({ error: 'Machine niet gevonden' }, { status: 404 })

  const prefix = `machine-${machineId}/${werfName}`
  const { data: files, error } = await adminSupabase.storage
    .from('machine-files')
    .list(prefix, { limit: 1000 })
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 })

  const zip = new JSZip()
  for (const f of files || []) {
    if (!f.name || f.name.endsWith('/')) continue
    const { data, error: dlError } = await adminSupabase.storage
      .from('machine-files')
      .download(`${prefix}/${f.name}`)
    if (dlError || !data) continue
    const buf = Buffer.from(await data.arrayBuffer())
    zip.file(f.name, buf)
  }

  const content = await zip.generateAsync({ type: 'nodebuffer' })
  // Use Uint8Array to ensure Next.js accepts it in a Response
  const body = new Uint8Array(content)
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${werfName}.zip"`,
    },
  })
}
