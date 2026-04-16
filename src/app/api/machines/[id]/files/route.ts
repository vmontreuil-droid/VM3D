import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const FILE_AGENT_PORT = 6081

async function getMachine(machineId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const adminSupabase = createAdminClient()

  if (profile?.role === 'admin') {
    // Admin can access any machine
    const { data } = await adminSupabase
      .from('machines')
      .select('id, connection_host, connection_port')
      .eq('id', machineId)
      .single()
    return data
  } else {
    // Customer can only access their own machines
    const { data } = await adminSupabase
      .from('machines')
      .select('id, connection_host, connection_port')
      .eq('id', machineId)
      .eq('user_id', user.id)
      .single()
    return data
  }
}

// GET /api/machines/[id]/files — list files or download
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machine = await getMachine(id)
  if (!machine) {
    return NextResponse.json({ error: 'Machine niet gevonden' }, { status: 404 })
  }
  if (!machine.connection_host) {
    return NextResponse.json({ error: 'Machine heeft geen host geconfigureerd' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'list'
  const path = searchParams.get('path') || ''
  const agentUrl = `http://${machine.connection_host}:${FILE_AGENT_PORT}`

  try {
    if (action === 'tree') {
      const depth = searchParams.get('depth') || '3'
      const res = await fetch(`${agentUrl}/files/tree?path=${encodeURIComponent(path)}&depth=${depth}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json({ error: text }, { status: res.status })
      }
      return NextResponse.json(await res.json())

    } else if (action === 'download') {
      const res = await fetch(`${agentUrl}/files/download?path=${encodeURIComponent(path)}`, {
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) {
        return NextResponse.json({ error: 'Download mislukt' }, { status: res.status })
      }
      const blob = await res.blob()
      return new NextResponse(blob, {
        headers: {
          'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
          'Content-Disposition': res.headers.get('Content-Disposition') || 'attachment',
        },
      })

    } else if (action === 'health') {
      const res = await fetch(`${agentUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) {
        return NextResponse.json({ error: 'Agent niet bereikbaar' }, { status: 503 })
      }
      return NextResponse.json(await res.json())

    } else {
      // Default: list files
      const res = await fetch(`${agentUrl}/files?path=${encodeURIComponent(path)}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json({ error: text }, { status: res.status })
      }
      return NextResponse.json(await res.json())
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout'
    if (message.includes('timeout') || message.includes('TIMEOUT')) {
      return NextResponse.json({ error: 'Machine agent niet bereikbaar (timeout)' }, { status: 504 })
    }
    return NextResponse.json({ error: `Verbinding mislukt: ${message}` }, { status: 502 })
  }
}

// POST /api/machines/[id]/files — upload file or create directory
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machine = await getMachine(id)
  if (!machine) {
    return NextResponse.json({ error: 'Machine niet gevonden' }, { status: 404 })
  }
  if (!machine.connection_host) {
    return NextResponse.json({ error: 'Machine heeft geen host geconfigureerd' }, { status: 400 })
  }

  const agentUrl = `http://${machine.connection_host}:${FILE_AGENT_PORT}`
  const contentType = request.headers.get('content-type') || ''

  try {
    if (contentType.includes('application/json')) {
      // Create directory
      const body = await request.json()
      const res = await fetch(`${agentUrl}/files/mkdir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json({ error: text }, { status: res.status })
      }
      return NextResponse.json(await res.json())

    } else {
      // Upload file(s)
      const formData = await request.formData()
      const agentForm = new FormData()

      // Forward all form fields
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          agentForm.append(key, value)
        } else {
          agentForm.append(key, value)
        }
      }

      const files = formData.getAll('files')
      const endpoint = files.length > 1 ? '/files/upload-multiple' : '/files/upload'

      // For single file upload, rename field to 'file'
      if (files.length === 1) {
        const singleForm = new FormData()
        singleForm.append('file', files[0])
        const path = formData.get('path')
        if (path) singleForm.append('path', path as string)
        const overwrite = formData.get('overwrite')
        if (overwrite) singleForm.append('overwrite', overwrite as string)

        const res = await fetch(`${agentUrl}${endpoint}`, {
          method: 'POST',
          body: singleForm,
          signal: AbortSignal.timeout(60000),
        })
        if (!res.ok) {
          const text = await res.text()
          return NextResponse.json({ error: text }, { status: res.status })
        }
        return NextResponse.json(await res.json())
      } else {
        const res = await fetch(`${agentUrl}${endpoint}`, {
          method: 'POST',
          body: agentForm,
          signal: AbortSignal.timeout(60000),
        })
        if (!res.ok) {
          const text = await res.text()
          return NextResponse.json({ error: text }, { status: res.status })
        }
        return NextResponse.json(await res.json())
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout'
    return NextResponse.json({ error: `Upload mislukt: ${message}` }, { status: 502 })
  }
}

// DELETE /api/machines/[id]/files — delete a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const machine = await getMachine(id)
  if (!machine) {
    return NextResponse.json({ error: 'Machine niet gevonden' }, { status: 404 })
  }
  if (!machine.connection_host) {
    return NextResponse.json({ error: 'Machine heeft geen host geconfigureerd' }, { status: 400 })
  }

  const agentUrl = `http://${machine.connection_host}:${FILE_AGENT_PORT}`

  try {
    const body = await request.json()
    const res = await fetch(`${agentUrl}/files/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout'
    return NextResponse.json({ error: `Verwijderen mislukt: ${message}` }, { status: 502 })
  }
}
