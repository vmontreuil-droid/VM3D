import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { token, signatureData, signerName } = await req.json()

    if (!token || !signatureData || !signerName?.trim()) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    const { data: offerte, error: findErr } = await adminSupabase
      .from('offertes')
      .select('id, status, signed_at')
      .eq('signature_token', token)
      .single()

    if (findErr || !offerte) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    if (offerte.signed_at) {
      return NextResponse.json({ error: 'already_signed' }, { status: 409 })
    }
    if (offerte.status === 'afgekeurd') {
      return NextResponse.json({ error: 'rejected' }, { status: 400 })
    }

    const { error: updateErr } = await adminSupabase
      .from('offertes')
      .update({
        signature_data: signatureData,
        signer_name:    signerName.trim(),
        signed_at:      new Date().toISOString(),
        status:         'goedgekeurd',
      })
      .eq('id', offerte.id)

    if (updateErr) {
      console.error('sign offerte error:', updateErr)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }

    // Cascade project status
    const { data: full } = await adminSupabase
      .from('offertes')
      .select('project_id')
      .eq('id', offerte.id)
      .single()

    if (full?.project_id) {
      await adminSupabase
        .from('projects')
        .update({ status: 'in_behandeling' })
        .eq('id', full.project_id)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('sign route error:', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
