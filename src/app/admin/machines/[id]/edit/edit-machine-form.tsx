'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Trash2,
  Copy,
  Check,
  Wifi,
  WifiOff,
  Radio,
  Construction,
  Hash,
  Calendar,
  Building2,
  QrCode,
  MessageCircle,
  Mail,
  MapPin,
} from 'lucide-react'
import CustomerSelect, { type Customer } from '@/components/customers/customer-select'
import MachineTransferPanel from '@/components/machines/machine-transfer-panel'
import MachinesMap from '@/components/machines/machines-map'
import {
  MachineIcon,
  BRAND_COLORS,
  GUIDANCE_COLORS,
  formatTonnage,
} from '@/components/machines/machine-icons'

type Project = { id: number; name: string; address?: string | null }

type Machine = {
  id: number
  user_id: string
  project_id: number | null
  name: string
  machine_type: 'excavator' | 'bulldozer' | 'grader'
  brand: string
  model: string
  tonnage: number | string | null
  year: number | null
  guidance_system: string | null
  serial_number: string | null
  connection_code: string
  connection_password: string | null
  is_online?: boolean
  last_seen_at?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
  location_accuracy?: number | string | null
  location_updated_at?: string | null
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
  const [machineType, setMachineType] = useState<'excavator' | 'bulldozer' | 'grader'>(machine.machine_type)
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

  const brandColor = BRAND_COLORS[brand] || '#888'
  const guidanceStyle = guidance ? GUIDANCE_COLORS[guidance] : null
  const lastSeen = machine.last_seen_at ? new Date(machine.last_seen_at) : null

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `Installatielink voor ${brand} ${model} (${name}):\n${setupUrl}`,
  )}`
  const emailHref = `mailto:${customer?.email || ''}?subject=${encodeURIComponent(
    `Installatielink voor ${brand} ${model}`,
  )}&body=${encodeURIComponent(
    `Hallo,\n\nHier is de installatielink voor ${brand} ${model} (${name}):\n${setupUrl}\n\n— VM Plan & Consult`,
  )}`

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link href="/admin" className="hover:text-[var(--text-main)]">
          Admin
        </Link>
        <span>/</span>
        <Link href="/admin/machines" className="hover:text-[var(--text-main)]">
          Machines
        </Link>
        <span>/</span>
        <span className="text-[var(--text-main)]">
          {brand} {model}
        </span>
      </div>

      {/* Hero — uniform dashboard style */}
      <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="absolute inset-0 opacity-30">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
          </div>
          <div className="relative flex flex-wrap items-center justify-between gap-2">
            <Link href="/admin/machines" className="btn-secondary text-xs">
              <ArrowLeft className="inline h-3 w-3 mr-1" /> Terug
            </Link>
          </div>
          <div className="relative mt-3 flex flex-wrap items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${brandColor}22` }}
            >
              <MachineIcon type={machineType} size={32} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-400">
                Machine
              </p>
              <h1 className="mt-0.5 flex flex-wrap items-center gap-2 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                <span>
                  {brand} {model}
                </span>
                <span className="font-normal text-[var(--text-soft)]">
                  · {name}
                </span>
                {guidanceStyle && guidance && (
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${guidanceStyle.bg} ${guidanceStyle.text}`}
                  >
                    {guidance}
                  </span>
                )}
                {machine.is_online ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <Wifi className="h-3 w-3" /> Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-card-2)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                    <WifiOff className="h-3 w-3" /> Offline
                  </span>
                )}
              </h1>
              <p className="mt-1 text-xs text-[var(--text-soft)]">
                {machineType === 'bulldozer' ? 'Bulldozer' : 'Kraan'}
                {tonnage ? ` · ${formatTonnage(Number(tonnage))}` : ''}
                {year ? ` · Bouwjaar ${year}` : ''}
                {lastSeen
                  ? ` · Laatst gezien ${lastSeen.toLocaleString()}`
                  : ''}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            <Hash className="h-3 w-3" /> Code
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-emerald-400">
            {machine.connection_code}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            <Building2 className="h-3 w-3" /> Klant
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-[var(--text-main)]">
            {customer?.company_name || customer?.full_name || '—'}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            <Radio className="h-3 w-3" /> Besturing
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
            {guidance || '—'}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            <Construction className="h-3 w-3" /> Tonnage
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
            {tonnage ? formatTonnage(Number(tonnage)) : '—'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
        {/* Main column */}
        <div className="space-y-4">
          <form onSubmit={handleSave} className="space-y-4" id="machine-form">
            {/* Klant */}
            <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
              <header className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2.5">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)]">
                  <Building2 className="h-4 w-4 text-[var(--accent)]" />
                  Klant
                  <span className="ml-auto text-[10px] font-normal text-[var(--text-muted)]">
                    optioneel
                  </span>
                </h2>
              </header>
              <div className="space-y-3 p-4">
                <CustomerSelect
                  value={customer?.id}
                  onChange={(_, c) => setCustomer(c || null)}
                  placeholder="Zoek klant..."
                />
                {customer && (
                  <div className="flex items-start justify-between rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3 text-xs">
                    <div>
                      <p className="font-semibold text-[var(--text-main)]">
                        {customer.company_name || customer.full_name}
                      </p>
                      <p className="text-[var(--text-soft)]">
                        {customer.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomer(null)}
                      className="text-[10px] text-[var(--text-muted)] hover:text-red-400"
                    >
                      Ontkoppel
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Machine */}
            <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
              <header className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2.5">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)]">
                  <Construction className="h-4 w-4 text-[var(--accent)]" />
                  Machine
                </h2>
              </header>
              <div className="space-y-3 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Naam" required>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Type" required>
                    <select
                      value={machineType}
                      onChange={(e) =>
                        setMachineType(
                          e.target.value as 'excavator' | 'bulldozer' | 'grader',
                        )
                      }
                      className={inputCls}
                    >
                      <option value="excavator">Kraan</option>
                      <option value="bulldozer">Bulldozer</option>
                      <option value="grader">Grader</option>
                    </select>
                  </Field>
                  <Field label="Merk" required>
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className={inputCls}
                    >
                      {!BRANDS.includes(brand) && brand && (
                        <option value={brand}>{brand}</option>
                      )}
                      {BRANDS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Model" required>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      required
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Tonnage" required>
                    <input
                      type="number"
                      step="0.1"
                      value={tonnage}
                      onChange={(e) => setTonnage(e.target.value)}
                      required
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Bouwjaar">
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Besturing">
                    <select
                      value={guidance}
                      onChange={(e) => setGuidance(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">— Geen —</option>
                      {GUIDANCE.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Serienummer">
                    <input
                      type="text"
                      value={serial}
                      onChange={(e) => setSerial(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="Werf (optioneel)">
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    disabled={!customer || loadingProjects}
                    className={`${inputCls} disabled:opacity-50`}
                  >
                    <option value="">
                      {!customer
                        ? 'Kies eerst een klant'
                        : loadingProjects
                          ? 'Werven laden...'
                          : projects.length === 0
                            ? 'Geen werven bij deze klant'
                            : '— Geen werf gekoppeld —'}
                    </option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.address ? ` — ${p.address}` : ''}
                      </option>
                    ))}
                  </select>
                </Field>

                {error && (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
                    {error}
                  </p>
                )}
                {saved && !error && (
                  <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
                    ✓ Opgeslagen
                  </p>
                )}
              </div>
            </section>
          </form>

          {/* GPS-locatie */}
          <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 shadow-sm">
            {(machine.latitude != null && machine.longitude != null) ? (
              <>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15">
                    <MapPin className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-400">GPS-locatie</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">
                      {Number(machine.latitude).toFixed(6)}, {Number(machine.longitude).toFixed(6)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">
                      {machine.location_accuracy != null && `±${Math.round(Number(machine.location_accuracy))} m · `}
                      {machine.location_updated_at
                        ? `Gerapporteerd ${new Date(machine.location_updated_at).toLocaleString()}`
                        : ''}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${machine.latitude},${machine.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-purple-500/15 px-3 py-1.5 text-xs font-semibold text-purple-400 hover:bg-purple-500/25"
                  >
                    <MapPin className="h-3 w-3" /> Open in Google Maps
                  </a>
                </div>
                <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border-soft)]">
                  <MachinesMap
                    points={[{
                      id: machine.id,
                      name: machine.name,
                      brand: machine.brand,
                      model: machine.model,
                      latitude: Number(machine.latitude),
                      longitude: Number(machine.longitude),
                      is_online: !!machine.is_online,
                      location_updated_at: machine.location_updated_at ?? null,
                    }]}
                    height={320}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15">
                  <MapPin className="h-5 w-5 text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-400">GPS-locatie</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">Nog geen locatie ontvangen</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-soft)]">
                    De tablet stuurt GPS-coördinaten door zodra <code className="rounded bg-[var(--bg-card-2)] px-1">termux-location</code> werkt. Vereist:
                  </p>
                  <ul className="mt-1 list-inside list-disc text-[11px] leading-relaxed text-[var(--text-soft)]">
                    <li>Termux:API APK geïnstalleerd (F-Droid) naast Termux</li>
                    <li>Uitvoeren: <code className="rounded bg-[var(--bg-card-2)] px-1">pkg install termux-api</code></li>
                    <li>Locatie-permissie toegestaan voor Termux:API in Android-instellingen</li>
                    <li>Herinstalleer het sync-script om de nieuwe GPS-logica op te pikken</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Werf & bestanden panel */}
          <MachineTransferPanel
            machineId={machine.id}
            guidanceSystem={guidance || machine.guidance_system}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:h-fit">
          {/* Installation link */}
          <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
            <header className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2.5">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)]">
                <QrCode className="h-4 w-4 text-[var(--accent)]" />
                Tablet-installatie
              </h2>
            </header>
            <div className="space-y-3 p-4 text-xs">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Code
                </p>
                <p className="mt-0.5 rounded bg-black/30 px-2 py-1 font-mono text-sm font-bold text-emerald-400">
                  {machine.connection_code}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Setup-URL
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-2 py-1.5">
                  <code className="flex-1 truncate text-[10px]">{setupUrl}</code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded bg-[var(--accent)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/25"
                  >
                    {copied ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1 rounded-lg bg-emerald-500 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-600"
                >
                  <MessageCircle className="h-3 w-3" /> WhatsApp
                </a>
                <a
                  href={emailHref}
                  className="flex items-center justify-center gap-1 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-2 py-1.5 text-[11px] font-semibold text-[var(--text-main)] hover:bg-[var(--bg-card)]"
                >
                  <Mail className="h-3 w-3" /> E-mail
                </a>
              </div>
            </div>
          </section>

          {/* Status card */}
          <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
            <header className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2.5">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)]">
                <Calendar className="h-4 w-4 text-[var(--accent)]" />
                Status
              </h2>
            </header>
            <div className="space-y-2 p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-soft)]">Verbinding</span>
                {machine.is_online ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <Wifi className="h-3 w-3" /> Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                    <WifiOff className="h-3 w-3" /> Offline
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-soft)]">Laatst gezien</span>
                <span className="text-[var(--text-main)]">
                  {lastSeen ? lastSeen.toLocaleString() : 'Nooit'}
                </span>
              </div>
              {serial && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-soft)]">Serienummer</span>
                  <span className="font-mono text-[var(--text-main)]">
                    {serial}
                  </span>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border-soft)] bg-[var(--bg-main)]/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2">
          <Link
            href="/admin/machines"
            className="flex items-center gap-1 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-card-2)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Terug
          </Link>
          <span className="ml-2 text-xs text-[var(--text-muted)]">
            {saved && !error ? '✓ Opgeslagen' : 'Wijzigingen worden pas opgeslagen bij klik op “Opslaan”.'}
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="ml-auto flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? 'Verwijderen...' : 'Verwijder'}
          </button>
          <button
            type="submit"
            form="machine-form"
            disabled={saving || deleting}
            className="flex items-center gap-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--text-soft)]">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  )
}
