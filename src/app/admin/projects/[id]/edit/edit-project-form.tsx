'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Customer = {
  id: string
  full_name?: string | null
  company_name?: string | null
  email?: string | null
}

type Project = {
  id: number | string
  user_id: string | null
  title: string | null
  description: string | null
  address: string | null
  price: number | null
  currency: string | null
  status: string | null
}

export default function EditProjectForm({
  project,
  customers,
}: {
  project: Project
  customers: Customer[]
}) {
  const router = useRouter()

  const [userId, setUserId] = useState(project.user_id ?? '')
  const [title, setTitle] = useState(project.title ?? '')
  const [description, setDescription] = useState(project.description ?? '')
  const [address, setAddress] = useState(project.address ?? '')
  const [price, setPrice] = useState(
    project.price !== null && project.price !== undefined
      ? String(project.price)
      : ''
  )
  const [currency, setCurrency] = useState(project.currency ?? 'EUR')
  const [status, setStatus] = useState(project.status ?? 'ingediend')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!userId) {
        throw new Error('Geen klant geselecteerd.')
      }

      if (!title.trim()) {
        throw new Error('Projecttitel is verplicht.')
      }

      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title,
          description,
          address,
          price,
          currency,
          status,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Er ging iets mis.')
      }

      setSuccess('Project succesvol bijgewerkt.')

      setTimeout(() => {
        router.push('/admin')
        router.refresh()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 shadow-sm md:p-5"
    >
      <div className="grid gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-white">
            Klant
          </label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input-dark w-full px-3 py-2.5 text-sm"
            required
          >
            <option value="">Selecteer een klant</option>
            {customers.map((customer) => {
              const company = customer.company_name?.trim() || ''
              const name = customer.full_name?.trim() || ''
              const email = customer.email?.trim() || ''

              let label = ''
              if (company && name) label = `${company} — ${name}`
              else if (company) label = company
              else if (name) label = name
              else if (email) label = email
              else label = customer.id

              return (
                <option key={customer.id} value={customer.id}>
                  {label}
                </option>
              )
            })}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white">
            Projecttitel
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-dark w-full px-3 py-2.5 text-sm"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white">
            Beschrijving
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="input-dark w-full px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white">
            Locatie
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input-dark w-full px-3 py-2.5 text-sm"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Prijs
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Munt
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input-dark w-full px-3 py-2.5 text-sm"
          >
            <option value="ingediend">Ingediend</option>
            <option value="in_behandeling">In behandeling</option>
            <option value="klaar_voor_betaling">Klaar voor betaling</option>
            <option value="afgerond">Afgerond</option>
          </select>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
            {success}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Project wordt opgeslagen...' : 'Project opslaan'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="inline-flex rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a3745]"
          >
            Annuleren
          </button>
        </div>
      </div>
    </form>
  )
}
