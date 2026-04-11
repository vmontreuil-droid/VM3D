import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET_NAME = 'project-files'
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
])

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
    const customerId = String(formData.get('customerId') || '').trim()
    const existingPath = String(formData.get('existingPath') || '').trim()
    const fileEntry = formData.get('file')

    if (!(fileEntry instanceof File) || fileEntry.size === 0) {
      return NextResponse.json(
        { error: 'Kies eerst een logo-bestand.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.has(fileEntry.type)) {
      return NextResponse.json(
        { error: 'Gebruik PNG, JPG, WEBP of SVG voor het logo.' },
        { status: 400 }
      )
    }

    if (fileEntry.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Het logo mag maximaal 2 MB groot zijn.' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()
    const safeName = safeFileName(fileEntry.name)
    const ownerFolder = customerId || 'draft'
    const filePath = `customer-logos/${ownerFolder}/logo-${Date.now()}-${safeName}`

    const arrayBuffer = await fileEntry.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminSupabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: fileEntry.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Logo upload mislukt: ${uploadError.message}` },
        { status: 400 }
      )
    }

    if (existingPath && existingPath !== filePath) {
      await adminSupabase.storage.from(BUCKET_NAME).remove([existingPath])
    }

    const { data: signedData } = await adminSupabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 60 * 60 * 24 * 7)

    return NextResponse.json({
      success: true,
      filePath,
      previewUrl: signedData?.signedUrl || null,
    })
  } catch (error) {
    console.error('customer logo upload route error:', error)

    return NextResponse.json(
      { error: 'Logo upload mislukt door een onverwachte serverfout.' },
      { status: 500 }
    )
  }
}
