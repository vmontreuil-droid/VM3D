import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (typeof value === 'string') {
      query.set(key, value)
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) query.append(key, item)
      }
    }
  }

  const queryString = query.toString()
  redirect(
    queryString
      ? `/admin/customers/${id}/edit?${queryString}`
      : `/admin/customers/${id}/edit`
  )
}
