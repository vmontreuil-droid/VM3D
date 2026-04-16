import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Upload bestanden voor een specifieke machine
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machineId = parseInt(id)
  if (isNaN(machineId)) return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const adminSupabase = createAdminClient()

  // Check: machine belongs to user OR user is admin
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  const machineQuery = adminSupabase
    .from('machines')
    .select('id, name, user_id, guidance_system')
    .eq('id', machineId)

  if (!isAdmin) {
    machineQuery.eq('user_id', user.id)
  }

  const { data: machine } = await machineQuery.single()
  if (!machine) return NextResponse.json({ error: 'Machine niet gevonden' }, { status: 404 })

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  const subfolder = (formData.get('subfolder') as string) || ''

  if (!files.length) return NextResponse.json({ error: 'Geen bestanden' }, { status: 400 })

  const uploaded: { name: string; path: string; size: number }[] = []
  const errors: string[] = []

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const storagePath = subfolder
      ? `machine-${machineId}/${subfolder}/${file.name}`
      : `machine-${machineId}/${file.name}`

    const { error } = await adminSupabase.storage
      .from('machine-files')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      })

    if (error) {
      errors.push(`${file.name}: ${error.message}`)
    } else {
      uploaded.push({ name: file.name, path: storagePath, size: buffer.length })
    }
  }

  // Log the transfer
  await adminSupabase
    .from('machine_file_transfers')
    .insert(uploaded.map(f => ({
      machine_id: machineId,
      uploaded_by: user.id,
      file_name: f.name,
      storage_path: f.path,
      file_size: f.size,
      subfolder: subfolder || null,
      status: 'pending', // pending = wacht op sync door tablet
    })))

  return NextResponse.json({
    uploaded: uploaded.length,
    errors,
    files: uploaded,
  })
}

// GET: lijst van bestanden voor deze machine (pending + synced)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machineId = parseInt(id)
  if (isNaN(machineId)) return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const adminSupabase = createAdminClient()

  const { data: transfers } = await adminSupabase
    .from('machine_file_transfers')
    .select('*')
    .eq('machine_id', machineId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Get unique werven (subfolders) from transfers
  const werven = [...new Set(
    (transfers || [])
      .map(t => t.subfolder)
      .filter((s): s is string => !!s)
  )]

  return NextResponse.json({ transfers: transfers || [], werven })
}
