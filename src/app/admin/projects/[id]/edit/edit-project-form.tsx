'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '@/i18n/context'

type Customer = {
  id: string
  full_name?: string | null
  company_name?: string | null
  email?: string | null
}

type Project = {
  id: number | string
  user_id: string | null
  name: string | null
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
  const { t } = useT()
  const tt = t.editProject
  const router = useRouter()

  const [userId, setUserId] = useState(project.user_id ?? '')
  const [title, setTitle] = useState(project.name ?? '')
  const [description, setDescription] = useState('')
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
        throw new Error(tt.noCustomer)
      }

      if (!title.trim()) {
        throw new Error(tt.titleRequired)
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
        throw new Error(result.error || tt.genericError)
      }

      setSuccess(tt.successMessage)

      setTimeout(() => {
        router.push('/admin')
        router.refresh()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : tt.genericError)
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
            {tt.customer}
          </label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input-dark w-full px-3 py-2.5 text-sm"
            required
          >
            <option value="">{tt.selectCustomer}</option>
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
            {tt.projectTitle}
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
            {tt.description}
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
            {tt.location}
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
              {tt.price}
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
              {tt.currency}
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
            {tt.status}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input-dark w-full px-3 py-2.5 text-sm"
          >
            <option value="ingediend">{tt.statusSubmitted}</option>
            <option value="in_behandeling">{tt.statusInProgress}</option>
            <option value="klaar_voor_betaling">{tt.statusReadyForPayment}</option>
            <option value="afgerond">{tt.statusDone}</option>
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
            className="btn-primary rounded-2xl px-4 py-2.5 text-sm"
          >
            {loading ? tt.saving : tt.save}
          </button>

          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="btn-secondary rounded-2xl px-4 py-2.5 text-sm"
          >
            {tt.cancel}
          </button>
        </div>
      </div>
    </form>
  )
}
