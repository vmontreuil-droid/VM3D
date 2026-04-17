import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function randomPassword(length = 16) {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return out
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
    }

    const body = await req.json()
    const fullName = String(body.fullName || '').trim()
    const companyName = String(body.companyName || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const phone = String(body.phone || '').trim()
    const mobile = String(body.mobile || '').trim()

    if (!fullName) {
      return NextResponse.json(
        { error: 'Naam contactpersoon is verplicht.' },
        { status: 400 }
      )
    }
    if (!companyName) {
      return NextResponse.json(
        { error: 'Bedrijfsnaam is verplicht.' },
        { status: 400 }
      )
    }
    if (!email) {
      return NextResponse.json(
        { error: 'E-mailadres is verplicht.' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()
    const temporaryPassword = randomPassword()

    const { data: authUserData, error: authCreateError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          company_name: companyName,
          phone,
          role: 'client',
          is_active: true,
        },
      })

    if (authCreateError || !authUserData.user) {
      return NextResponse.json(
        {
          error:
            authCreateError?.message ||
            'Kon auth gebruiker niet aanmaken.',
        },
        { status: 400 }
      )
    }

    const newUserId = authUserData.user.id

    const { error: insertError } = await adminSupabase
      .from('profiles')
      .insert({
        id: newUserId,
        full_name: fullName,
        company_name: companyName,
        email,
        phone: phone || null,
        mobile: mobile || null,
        role: 'client',
        is_active: true,
      })

    if (insertError) {
      await adminSupabase.auth.admin.deleteUser(newUserId)
      return NextResponse.json(
        {
          error:
            insertError.message || 'Kon klantprofiel niet opslaan.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      customer: {
        id: newUserId,
        full_name: fullName,
        company_name: companyName,
        email,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Onbekende serverfout.',
      },
      { status: 500 }
    )
  }
}
