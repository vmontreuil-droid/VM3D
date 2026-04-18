import { redirect, notFound } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import EditMachineForm from './edit/edit-machine-form'

export default async function AdminMachinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const machineId = parseInt(id, 10)
  if (Number.isNaN(machineId)) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: machine } = await adminSupabase
    .from('machines')
    .select('*')
    .eq('id', machineId)
    .maybeSingle()
  if (!machine) notFound()

  const { data: owner } = await adminSupabase
    .from('profiles')
    .select('id, company_name, full_name, email')
    .eq('id', machine.user_id)
    .maybeSingle()

  return (
    <AppShell isAdmin>
      <EditMachineForm machine={machine} owner={owner || null} />
    </AppShell>
  )
}
