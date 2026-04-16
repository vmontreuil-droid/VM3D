import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import SetupClient from './setup-client'

export default async function MachineSetupPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const adminSupabase = createAdminClient()

  const { data: machine } = await adminSupabase
    .from('machines')
    .select('id, name, brand, model, guidance_system, connection_code')
    .eq('connection_code', code)
    .single()

  if (!machine) notFound()

  return <SetupClient machine={machine} />
}
