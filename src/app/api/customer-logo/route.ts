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

    const formData = await request.formData()
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

    // Get existing logo path to clean up
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('logo_url')
      .eq('id', user.id)
      .single()

    const safeName = safeFileName(fileEntry.name)
    const filePath = `customer-logos/${user.id}/logo-${Date.now()}-${safeName}`

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

    // Store just the storage path (bucket is private, signed URLs are used to display)
    const logoUrl = filePath

    // Update profile with new logo_url
    await adminSupabase
      .from('profiles')
      .update({ logo_url: logoUrl })
      .eq('id', user.id)

    // Remove old logo file if it was in storage
    if (profile?.logo_url && profile.logo_url.includes('customer-logos/')) {
      // Handle both full URLs (legacy) and plain paths
      const oldPath = profile.logo_url.includes('/storage/v1/')
        ? profile.logo_url.split('/storage/v1/object/public/project-files/').pop()
        : profile.logo_url
      if (oldPath && oldPath !== filePath) {
        await adminSupabase.storage.from(BUCKET_NAME).remove([oldPath])
      }
    }

    return NextResponse.json({
      success: true,
      logoUrl,
    })
  } catch (error) {
    console.error('customer logo upload error:', error)
    return NextResponse.json(
      { error: 'Logo upload mislukt door een onverwachte serverfout.' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('logo_url')
      .eq('id', user.id)
      .single()

    // Remove file from storage
    if (profile?.logo_url && profile.logo_url.includes('customer-logos/')) {
      const oldPath = profile.logo_url.includes('/storage/v1/')
        ? profile.logo_url.split('/storage/v1/object/public/project-files/').pop()
        : profile.logo_url
      if (oldPath) {
        await adminSupabase.storage.from(BUCKET_NAME).remove([oldPath])
      }
    }

    // Clear logo_url in profile
    await adminSupabase
      .from('profiles')
      .update({ logo_url: null })
      .eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('customer logo delete error:', error)
    return NextResponse.json(
      { error: 'Logo verwijderen mislukt.' },
      { status: 500 }
    )
  }
}
