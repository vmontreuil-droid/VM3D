import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET_NAME = 'project-files'

async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 }),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return {
      error: NextResponse.json({ error: 'Geen toegang.' }, { status: 403 }),
    }
  }

  return { adminSupabase: createAdminClient() }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params
    const body = await request.json()
    const isActive = Boolean(body.isActive)

    if (!id) {
      return NextResponse.json(
        { error: 'Klant-ID ontbreekt.' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    const { data: customer, error } = await adminSupabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', id)
      .neq('role', 'admin')
      .select('id, full_name, company_name, email, is_active')
      .single()

    if (error || !customer) {
      return NextResponse.json(
        { error: error?.message || 'Klant niet gevonden.' },
        { status: 404 }
      )
    }

    const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(
      id,
      {
        user_metadata: {
          is_active: isActive,
        },
      }
    )

    if (authUpdateError) {
      console.warn('Kon auth metadata niet bijwerken:', authUpdateError.message)
    }

    return NextResponse.json({
      success: true,
      message: isActive ? 'Klant staat nu actief.' : 'Klant staat nu inactief.',
      customer,
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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin()
    if (adminCheck.error) return adminCheck.error

    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Klant-ID ontbreekt.' }, { status: 400 })
    }

    const adminSupabase = adminCheck.adminSupabase

    const { data: customer, error: customerError } = await adminSupabase
      .from('profiles')
      .select('id, email, company_name, full_name, role')
      .eq('id', id)
      .neq('role', 'admin')
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: customerError?.message || 'Klant niet gevonden.' },
        { status: 404 }
      )
    }

    const { data: projects, error: projectsError } = await adminSupabase
      .from('projects')
      .select('id')
      .eq('user_id', id)

    if (projectsError) {
      return NextResponse.json(
        { error: projectsError.message || 'Kon gekoppelde werven niet ophalen.' },
        { status: 500 }
      )
    }

    const projectIds = (projects ?? []).map((project) => project.id)

    if (projectIds.length > 0) {
      const { data: files, error: filesLookupError } = await adminSupabase
        .from('project_files')
        .select('file_path')
        .in('project_id', projectIds)

      if (filesLookupError) {
        return NextResponse.json(
          { error: filesLookupError.message || 'Kon bestanden niet ophalen.' },
          { status: 500 }
        )
      }

      const filePaths = (files ?? [])
        .map((file) => file.file_path)
        .filter(Boolean)

      if (filePaths.length > 0) {
        const { error: storageError } = await adminSupabase.storage
          .from(BUCKET_NAME)
          .remove(filePaths)

        if (storageError) {
          console.warn(
            'Kon storagebestanden niet volledig verwijderen:',
            storageError.message
          )
        }
      }

      const { error: timelineError } = await adminSupabase
        .from('project_timeline')
        .delete()
        .in('project_id', projectIds)

      if (timelineError) {
        return NextResponse.json(
          { error: timelineError.message || 'Kon projecthistoriek niet verwijderen.' },
          { status: 500 }
        )
      }

      const { error: filesError } = await adminSupabase
        .from('project_files')
        .delete()
        .in('project_id', projectIds)

      if (filesError) {
        return NextResponse.json(
          { error: filesError.message || 'Kon projectbestanden niet verwijderen.' },
          { status: 500 }
        )
      }

      const { error: projectDeleteError } = await adminSupabase
        .from('projects')
        .delete()
        .in('id', projectIds)

      if (projectDeleteError) {
        return NextResponse.json(
          { error: projectDeleteError.message || 'Kon gekoppelde werven niet verwijderen.' },
          { status: 500 }
        )
      }
    }

    const { error: profileDeleteError } = await adminSupabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileDeleteError) {
      return NextResponse.json(
        { error: profileDeleteError.message || 'Kon klantprofiel niet verwijderen.' },
        { status: 500 }
      )
    }

    const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(id)

    if (authDeleteError) {
      console.warn(
        'Auth gebruiker kon niet volledig verwijderd worden:',
        authDeleteError.message
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Klant succesvol verwijderd.',
      deletedCustomer: {
        id: customer.id,
        email: customer.email,
        company_name: customer.company_name,
        full_name: customer.full_name,
        deleted_projects: projectIds.length,
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