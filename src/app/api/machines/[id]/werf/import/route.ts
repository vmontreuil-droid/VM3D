import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST: import a werf from a zip file.
// Form field: file (the .zip), name (optional werf name — defaults to zip basename)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const machineId = parseInt(id)
  if (isNaN(machineId))
    return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })

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

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file)
    return NextResponse.json({ error: 'Geen zip-bestand' }, { status: 400 })

  const rawName = (formData.get('name') as string | null)?.trim() || ''
  const fallback = file.name.replace(/\.zip$/i, '')
  const werfName = (rawName || fallback)
    .replace(/[<>:"/\\|?*]/g, '_')
    .trim()
  if (!werfName)
    return NextResponse.json({ error: 'Ongeldige werfnaam' }, { status: 400 })

  const buf = Buffer.from(await file.arrayBuffer())
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(buf)
  } catch {
    return NextResponse.json({ error: 'Ongeldige zip-file' }, { status: 400 })
  }

  const entries = Object.values(zip.files).filter((f) => !f.dir)
  if (!entries.length)
    return NextResponse.json({ error: 'Zip is leeg' }, { status: 400 })

  const uploaded: { name: string; path: string; size: number }[] = []
  const errors: string[] = []

  for (const entry of entries) {
    // Strip any leading top-level folder inside the zip so files land directly in /werfName/
    const parts = entry.name.split('/').filter(Boolean)
    const fileName = parts[parts.length - 1]
    if (!fileName) continue
    const data = await entry.async('nodebuffer')
    const storagePath = `machine-${machineId}/${werfName}/${fileName}`
    const { error } = await adminSupabase.storage
      .from('machine-files')
      .upload(storagePath, data, {
        contentType: 'application/octet-stream',
        upsert: true,
      })
    if (error) {
      errors.push(`${fileName}: ${error.message}`)
    } else {
      uploaded.push({ name: fileName, path: storagePath, size: data.length })
    }
  }

  if (uploaded.length > 0) {
    await adminSupabase.from('machine_file_transfers').insert(
      uploaded.map((f) => ({
        machine_id: machineId,
        uploaded_by: user.id,
        file_name: f.name,
        storage_path: f.path,
        file_size: f.size,
        subfolder: werfName,
        status: 'pending',
      })),
    )
  }

  return NextResponse.json({
    werf: werfName,
    uploaded: uploaded.length,
    errors,
  })
}
