'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Copy, Check } from 'lucide-react'
import CustomerSelect, { type Customer } from '@/components/customers/customer-select'

type Project = { id: number; name: string; address?: string | null }

type Machine = {
  id: number
  user_id: string
  project_id: number | null
  name: string
  machine_type: 'excavator' | 'bulldozer'
  brand: string
  model: string
  tonnage: number | string | null
  year: number | null
  guidance_system: string | null
  serial_number: string | null
  connection_code: string
  connection_password: string | null
}

const BRANDS = [
  'CAT', 'KOMATSU', 'HITACHI', 'DEVELON', 'VOLVO', 'LIEBHERR',
  'HYUNDAI', 'KOBELCO', 'JCB', 'CASE', 'TAKEUCHI', 'KUBOTA', 'SANY', 'ZOOMLION',
]

const GUIDANCE = ['UNICONTROL', 'TRIMBLE', 'TOPCON', 'LEICA', 'CHCNAV']

export default function EditMachineForm({
  machine,
  owner,
}: {
  machine: Machine
  owner: Customer | null
}) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(owner)

  const [name, setName] = useState(machine.name || '')
  const [machineType, setMachineType] = useState<'excavator' | 'bulldozer'>(machine.machine_type)
  const [brand, setBrand] = useState((machine.brand || 'CAT').toUpperCase())
  const [model, setModel] = useState(machine.model || '')
  const [tonnage, setTonnage] = useState(
    machine.tonnage === null || machine.tonnage === undefined ? '' : String(machine.tonnage),
  )
  const [year, setYear] = useState(machine.year ? String(machine.year) : '')
  const [guidance, setGuidance] = useState((machine.guidance_system || '').toUpperCase())
  const [serial, setSerial] = useState(machine.serial_number || '')
  const [projectId, setProjectId] = useState<string>(
    machine.project_id ? String(machine.project_id) : '',
  )
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!customer?.id) {
      setProjects([])
      return
    }
    let abort = false
    setLoadingProjects(true)
    fetch(`/api/admin/projects/by-customer?userId=${encodeURIComponent(customer.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!abort) setProjects(Array.isArray(data.projects) ? data.projects : [])
      })
      .catch(() => {
        if (!abort) setProjects([])
      })
      .finally(() => {
        if (!abort) setLoadingProjects(false)
      })
    return () => {
      abort = true
    }
  }, [customer?.id])

  const setupUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/machines/setup/${machine.connection_code}`
  }, [machine.connection_code])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    if (!customer) {
      setError('Selecteer een klant.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/machines/${machine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: customer.id,
          name,
          machine_type: machineType,
          brand,
          model,
          tonnage,
          year: year || null,
          guidance_system: guidance || null,
          serial_number: serial || null,
          project_id: projectId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Kon machine niet opslaan.')
      } else {
        setSaved(true)
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Weet je zeker dat je ${machine.brand} ${machine.model} (${machine.name}) wil verwijderen?`)) {
      return
    }
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/machines/${machine.id}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Kon machine niet verwijderen.')
        setDeleting(false)
      } else {
        router.push('/admin/machines')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout.')
      setDeleting(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(setupUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/machines"
          className="flex items-center gap-1 text-xs text-[var(--text-soft)] hover:text-[var(--text-main)]"
        >
          <ArrowLeft className="h-3 w-3" /> Terug
        </Link>
        <h1 className="text-lg font-semibold text-[var(--text-main)]">
          Machine bewerken
        </h1>
        <span className="w-12" />
      </div>

      {/* Connection info */}
      <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Verbindingsgegevens
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--text-soft)]">Code:</span>
          <span className="rounded bg-black/40 px-2 py-0.5 font-mono font-bold text-emerald-400">
            {machine.connection_code}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2">
          <code className="flex-1 truncate text-xs text-[var(--text-main)]">
            {setupUrl}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded bg-[var(--accent)]/15 px-2 py-1 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/25"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Gekopieerd' : 'Kopieer'}
          </button>
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-4">
        <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">Klant</h2>
          <CustomerSelect
            value={customer?.id}
            onChange={(_, c) => setCustomer(c || null)}
            placeholder="Zoek klant..."
          />
          {customer && (
            <div className="rounded-lg bg-[var(--bg-card-2)] border border-[var(--border-soft)] p-2 text-xs">
              <p className="font-semibold text-[var(--text-main)]">
                {customer.company_name || customer.full_name}
              </p>
              <p className="text-[var(--text-soft)]">{customer.email}</p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">Machine</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">Naam *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">Type *</label>
              <select
                value={machineType}
                onChange={(e) => setMachineType(e.target.value as 'excavator' | 'bulldozer')}
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              >
                <option value="excavator">Kraan</option>
                <option value="bulldozer">Bulldozer</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">Merk *</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              >
                {!BRANDS.includes(brand) && brand && <option value={brand}>{brand}</option>}
                {BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">Model *</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">Tonnage *</label>
              <input
                type="number"
                step="0.1"
                value={tonnage}
                onChange={(e) => setTonnage(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">Bouwjaar</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">Besturing</label>
              <select
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              >
                <option value="">— Geen —</option>
                {GUIDANCE.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">Serienummer</label>
              <input
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--text-soft)]">Werf (optioneel)</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!customer || loadingProjects}
              className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">
                {loadingProjects
                  ? 'Werven laden...'
                  : projects.length === 0
                    ? 'Geen werven'
                    : '— Geen werf gekoppeld —'}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.address ? ` — ${p.address}` : ''}
                </option>
              ))}
            </select>
          </div>
        </section>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </p>
        )}
        {saved && !error && (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            ✓ Opgeslagen
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Verwijderen...' : 'Verwijder'}
          </button>
          <button
            type="submit"
            disabled={saving || deleting}
            className="ml-auto flex items-center gap-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </form>
    </div>
  )
}
