import { NextRequest } from 'next/server'
export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Supabase admin configuratie ontbreekt.' }, { status: 500 })
    }
    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''

    let query = supabaseAdmin
      .from('profiles')
      .select('id, company_name, full_name, email')
      .eq('role', 'client')
      .order('company_name', { ascending: true })
      .limit(20)

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: customers, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ customers })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Onbekende serverfout.' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function generateTemporaryPassword(length = 16) {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  let result = ''

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authSessionError,
    } = await supabase.auth.getUser()

    if (authSessionError || !user) {
      return NextResponse.json(
        { error: 'Niet ingelogd.' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Kon adminprofiel niet ophalen.' },
        { status: 500 }
      )
    }

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Geen toegang.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const fullName = String(body.fullName || '').trim()
    const companyName = String(body.companyName || '').trim()
    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    const phone = String(body.phone || '').trim()

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase admin configuratie ontbreekt.' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createAdminClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const temporaryPassword = generateTemporaryPassword()

    const { data: authUserData, error: authCreateError } =
      await supabaseAdmin.auth.admin.createUser({
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
            authCreateError?.message || 'Kon auth gebruiker niet aanmaken.',
        },
        { status: 400 }
      )
    }

    const newUserId = authUserData.user.id

    const { error: insertProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        full_name: fullName,
        company_name: companyName,
        email,
        phone: phone || null,
        role: 'client',
        is_active: true,
      })

    if (insertProfileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId)

      return NextResponse.json(
        {
          error:
            insertProfileError.message || 'Kon klantprofiel niet opslaan.',
        },
        { status: 400 }
      )
    }

    const baseSiteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
    const redirectTo = baseSiteUrl
      ? `${baseSiteUrl.replace(/\/$/, '')}/login`
      : undefined

    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      email,
      redirectTo ? { redirectTo } : undefined
    )

    if (resetError) {
      return NextResponse.json(
        {
          error:
            `Klant aangemaakt, maar resetlink kon niet verstuurd worden: ${resetError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message:
        'Klant succesvol aangemaakt. De resetlink werd per e-mail verstuurd.',
      customer: {
        id: newUserId,
        full_name: fullName,
        company_name: companyName,
        email,
        phone,
        role: 'client',
        is_active: true,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Onbekende serverfout.',
      },
      { status: 500 }
    )
  }
}