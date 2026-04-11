import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function AdminCustomerDetailPage({ params }: Props) {
  const { id } = await params
  redirect(`/admin/customers/${id}/edit`)
}
