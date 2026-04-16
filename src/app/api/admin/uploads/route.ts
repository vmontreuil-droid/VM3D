import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET_NAME = 'project-files'

function safeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
    }

    const formData = await request.formData()
    const projectIdRaw = String(formData.get('projectId') || '').trim()
    const uploadType = String(formData.get('uploadType') || '').trim()
    const fileEntry = formData.get('file')

    const projectId = Number(projectIdRaw)

    if (Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Ongeldig dossier gekozen.' },
        { status: 400 }
      )
    }

    if (uploadType !== 'client_upload' && uploadType !== 'final_file') {
      return NextResponse.json(
        { error: 'Ongeldig uploadtype.' },
        { status: 400 }
      )
    }

    if (!(fileEntry instanceof File) || fileEntry.size === 0) {
      return NextResponse.json(
        { error: 'Kies eerst een bestand.' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    const { data: project, error: projectError } = await adminSupabase
      .from('projects')
      .select('id, user_id, name')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Dossier niet gevonden.' },
        { status: 404 }
      )
    }

    const safeName = safeFileName(fileEntry.name)
    const prefix = uploadType === 'client_upload' ? 'client' : 'final'
    const filePath = `${project.user_id}/${project.id}/${prefix}-${Date.now()}-${safeName}`

    const arrayBuffer = await fileEntry.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: storageError } = await adminSupabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: fileEntry.type || 'application/octet-stream',
        upsert: false,
      })

    if (storageError) {
      return NextResponse.json(
        { error: `Upload mislukt: ${storageError.message}` },
        { status: 400 }
      )
    }

    const { error: dbError } = await adminSupabase.from('project_files').insert({
      project_id: project.id,
      user_id: project.user_id,
      file_name: fileEntry.name,
      file_path: filePath,
      file_size: fileEntry.size,
      mime_type: fileEntry.type || null,
      file_type: uploadType,
    })

    if (dbError) {
      await adminSupabase.storage.from(BUCKET_NAME).remove([filePath])

      return NextResponse.json(
        { error: `Upload mislukt: ${dbError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message:
        uploadType === 'client_upload'
          ? 'Upload geslaagd: klantbestand staat nu in het gekozen dossier.'
          : 'Upload geslaagd: opleverbestand staat nu in het gekozen dossier.',
    })
  } catch (error) {
    console.error('admin upload route error:', error)

    return NextResponse.json(
      { error: 'Upload mislukt door een onverwachte serverfout.' },
      { status: 500 }
    )
  }
}
