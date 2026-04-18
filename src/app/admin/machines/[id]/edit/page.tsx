import { redirect } from 'next/navigation'

export default async function AdminEditMachineRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/admin/machines/${id}`)
}
