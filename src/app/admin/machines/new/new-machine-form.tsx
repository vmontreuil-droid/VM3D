'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageCircle, Copy, Check, Plus, UserPlus } from 'lucide-react'
import CustomerSelect, { type Customer } from '@/components/customers/customer-select'

type Project = {
  id: number
  name: string
  address?: string | null
}

type CreatedMachine = {
  id: number
  name: string
  brand: string
  model: string
  connection_code: string
  project_id: number | null
}

const BRANDS = [
  'CAT',
  'KOMATSU',
  'HITACHI',
  'DEVELON',
  'VOLVO',
  'LIEBHERR',
  'HYUNDAI',
  'KOBELCO',
  'JCB',
  'CASE',
  'TAKEUCHI',
  'KUBOTA',
  'SANY',
  'ZOOMLION',
]

const GUIDANCE = ['UNICONTROL', 'TRIMBLE', 'TOPCON', 'LEICA', 'CHCNAV']

export default function NewMachineForm() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [showQuickCreate, setShowQuickCreate] = useState(false)

  const [name, setName] = useState('')
  const [machineType, setMachineType] = useState<'excavator' | 'bulldozer'>('excavator')
  const [brand, setBrand] = useState('CAT')
  const [model, setModel] = useState('')
  const [tonnage, setTonnage] = useState('')
  const [year, setYear] = useState('')
  const [guidance, setGuidance] = useState('')
  const [serial, setSerial] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedMachine | null>(null)

  // Share state
  const [shareMethod, setShareMethod] = useState<'whatsapp' | 'email' | null>(null)
  const [shareEmail, setShareEmail] = useState('')
  const [sharePhone, setSharePhone] = useState('')
  const [shareSending, setShareSending] = useState(false)
  const [shareResult, setShareResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Quick create customer state
  const [qcFullName, setQcFullName] = useState('')
  const [qcCompany, setQcCompany] = useState('')
  const [qcEmail, setQcEmail] = useState('')
  const [qcPhone, setQcPhone] = useState('')
  const [qcMobile, setQcMobile] = useState('')
  const [qcSubmitting, setQcSubmitting] = useState(false)
  const [qcError, setQcError] = useState('')

  useEffect(() => {
    if (!customer?.id) {
      setProjects([])
      setProjectId('')
      return
    }
    let abort = false
    setLoadingProjects(true)
    fetch(`/api/admin/projects/by-customer?userId=${encodeURIComponent(customer.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (abort) return
        setProjects(Array.isArray(data.projects) ? data.projects : [])
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
    if (!created) return ''
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/machines/setup/${created.connection_code}`
  }, [created])

  async function handleQuickCreate(e: React.FormEvent) {
    e.preventDefault()
    setQcError('')
    setQcSubmitting(true)
    try {
      const res = await fetch('/api/admin/customers/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: qcFullName,
          companyName: qcCompany,
          email: qcEmail,
          phone: qcPhone,
          mobile: qcMobile,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setQcError(data.error || 'Kon klant niet aanmaken.')
      } else {
        setCustomer(data.customer)
        setShareEmail(data.customer.email || '')
        setShowQuickCreate(false)
        setQcFullName('')
        setQcCompany('')
        setQcEmail('')
        setQcPhone('')
        setQcMobile('')
      }
    } catch (err) {
      setQcError(err instanceof Error ? err.message : 'Onbekende fout.')
    } finally {
      setQcSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: customer?.id || null,
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
        setError(data.error || 'Kon machine niet aanmaken.')
      } else {
        setCreated(data.machine)
        setShareEmail(customer?.email || '')
        setShareMethod(null)
        setShareResult(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSendEmail() {
    if (!created || !shareEmail.trim()) {
      setShareResult({ ok: false, msg: 'Vul een e-mailadres in.' })
      return
    }
    setShareSending(true)
    setShareResult(null)
    try {
      const res = await fetch('/api/admin/machines/share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machineId: created.id, email: shareEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setShareResult({ ok: false, msg: data.error || 'Kon mail niet versturen.' })
      } else {
        setShareResult({ ok: true, msg: `Mail verstuurd naar ${data.to}.` })
      }
    } catch (err) {
      setShareResult({
        ok: false,
        msg: err instanceof Error ? err.message : 'Onbekende fout.',
      })
    } finally {
      setShareSending(false)
    }
  }

  function buildWhatsAppUrl() {
    if (!created) return ''
    const msg = `Hallo, hier is de installatielink voor ${created.brand} ${created.model} (${created.name}):\n${setupUrl}`
    const phone = sharePhone.replace(/[^0-9]/g, '')
    if (phone) {
      return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    }
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(setupUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (created) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <h2 className="text-lg font-bold text-emerald-400">
            ✓ Machine aangemaakt
          </h2>
          <p className="mt-1 text-sm text-[var(--text-soft)]">
            {created.brand} {created.model} — {created.name}
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Connection code:{' '}
            <span className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-emerald-400">
              {created.connection_code}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-main)]">
              Installatielink
            </h3>
            <p className="mt-0.5 text-xs text-[var(--text-soft)]">
              Deel deze link met de chauffeur / monteur om de installatie op de
              tablet te starten.
            </p>
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

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setShareMethod(shareMethod === 'whatsapp' ? null : 'whatsapp')
              }
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                shareMethod === 'whatsapp'
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                  : 'border-[var(--border-soft)] text-[var(--text-main)] hover:border-emerald-500/50'
              }`}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </button>
            <button
              type="button"
              onClick={() =>
                setShareMethod(shareMethod === 'email' ? null : 'email')
              }
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                shareMethod === 'email'
                  ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                  : 'border-[var(--border-soft)] text-[var(--text-main)] hover:border-[var(--accent)]/50'
              }`}
            >
              <Mail className="h-4 w-4" /> E-mail
            </button>
          </div>

          {shareMethod === 'whatsapp' && (
            <div className="space-y-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
              <label className="block text-xs font-semibold text-[var(--text-soft)]">
                Gsm-nummer (optioneel, met landcode, bv. 32470123456)
              </label>
              <input
                type="tel"
                value={sharePhone}
                onChange={(e) => setSharePhone(e.target.value)}
                placeholder="32470123456"
                className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm"
              />
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg bg-emerald-500 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Open WhatsApp
              </a>
              <p className="text-[10px] text-[var(--text-muted)]">
                Laat leeg om een contact te kiezen nadat WhatsApp opent.
              </p>
            </div>
          )}

          {shareMethod === 'email' && (
            <div className="space-y-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
              <label className="block text-xs font-semibold text-[var(--text-soft)]">
                E-mailadres
              </label>
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="naam@bedrijf.be"
                className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm"
              />
              <p className="text-[10px] text-[var(--text-muted)]">
                Vooraf ingevuld met het adres van de klant. Wijzig gerust naar
                bv. de chauffeur of monteur.
              </p>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={shareSending}
                className="w-full rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                {shareSending ? 'Versturen...' : 'Verstuur link per e-mail'}
              </button>
              {shareResult && (
                <p
                  className={`text-xs ${
                    shareResult.ok ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {shareResult.msg}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/machines"
            className="flex-1 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-center text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--bg-card-2)]"
          >
            Terug naar machines
          </Link>
          <button
            type="button"
            onClick={() => {
              setCreated(null)
              setName('')
              setModel('')
              setTonnage('')
              setYear('')
              setSerial('')
              setShareMethod(null)
              setShareResult(null)
            }}
            className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2 text-center text-sm font-semibold text-white hover:brightness-110"
          >
            Nog een machine
          </button>
        </div>
      </div>
    )
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
          Nieuwe machine
        </h1>
        <span className="w-12" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer section */}
        <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">
            1. Klant <span className="text-[10px] font-normal text-[var(--text-muted)]">(optioneel)</span>
          </h2>
          {!showQuickCreate ? (
            <>
              <CustomerSelect
                value={customer?.id}
                onChange={(_, c) => setCustomer(c || null)}
                placeholder="Zoek klant op naam, bedrijf, e-mail..."
                onCreateNew={() => setShowQuickCreate(true)}
              />
              <button
                type="button"
                onClick={() => setShowQuickCreate(true)}
                className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                <UserPlus className="h-3 w-3" /> Snel nieuwe klant aanmaken
              </button>
            </>
          ) : (
            <div className="space-y-2 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--accent)]">
                  Nieuwe klant
                </p>
                <button
                  type="button"
                  onClick={() => setShowQuickCreate(false)}
                  className="text-xs text-[var(--text-soft)] hover:underline"
                >
                  Annuleer
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={qcCompany}
                  onChange={(e) => setQcCompany(e.target.value)}
                  placeholder="Bedrijfsnaam *"
                  className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={qcFullName}
                  onChange={(e) => setQcFullName(e.target.value)}
                  placeholder="Contactpersoon *"
                  className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm"
                />
                <input
                  type="email"
                  value={qcEmail}
                  onChange={(e) => setQcEmail(e.target.value)}
                  placeholder="E-mail *"
                  className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm"
                />
                <input
                  type="tel"
                  value={qcPhone}
                  onChange={(e) => setQcPhone(e.target.value)}
                  placeholder="Telefoon"
                  className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm"
                />
                <input
                  type="tel"
                  value={qcMobile}
                  onChange={(e) => setQcMobile(e.target.value)}
                  placeholder="Gsm"
                  className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm sm:col-span-2"
                />
              </div>
              {qcError && (
                <p className="text-xs text-red-400">{qcError}</p>
              )}
              <button
                type="button"
                onClick={handleQuickCreate}
                disabled={qcSubmitting}
                className="w-full rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                {qcSubmitting ? 'Aanmaken...' : 'Klant aanmaken'}
              </button>
            </div>
          )}

          {customer && !showQuickCreate && (
            <div className="rounded-lg bg-[var(--bg-card-2)] border border-[var(--border-soft)] p-2 text-xs">
              <p className="font-semibold text-[var(--text-main)]">
                {customer.company_name || customer.full_name}
              </p>
              <p className="text-[var(--text-soft)]">{customer.email}</p>
            </div>
          )}
        </section>

        {/* Machine section */}
        <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">
            2. Machine
          </h2>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">
                Naam *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bijv. Kraan werf 12"
                required
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">
                Type *
              </label>
              <select
                value={machineType}
                onChange={(e) =>
                  setMachineType(e.target.value as 'excavator' | 'bulldozer')
                }
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              >
                <option value="excavator">Kraan</option>
                <option value="bulldozer">Bulldozer</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">
                Merk *
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              >
                {BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">
                Model *
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Bijv. 320 GC"
                required
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">
                Tonnage *
              </label>
              <input
                type="number"
                step="0.1"
                value={tonnage}
                onChange={(e) => setTonnage(e.target.value)}
                placeholder="22.5"
                required
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">
                Bouwjaar
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2022"
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">
                Besturing
              </label>
              <select
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              >
                <option value="">— Geen —</option>
                {GUIDANCE.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--text-soft)]">
                Serienummer
              </label>
              <input
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--text-soft)]">
              Werf (optioneel)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!customer || loadingProjects}
              className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">
                {!customer
                  ? 'Selecteer eerst een klant'
                  : loadingProjects
                    ? 'Werven laden...'
                    : projects.length === 0
                      ? 'Geen werven — laat leeg'
                      : '— Geen werf gekoppeld —'}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.address ? ` — ${p.address}` : ''}
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

        <button
          type="submit"
          disabled={submitting || showQuickCreate}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="mr-1 inline h-4 w-4" />
          {submitting ? 'Aanmaken...' : 'Machine aanmaken'}
        </button>
      </form>
    </div>
  )
}
