'use client'

import { useState, useMemo } from 'react'
import {
  BookOpen,
  ChevronDown,
  Euro,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { landmeterDiensten, dienstCategorieen, type LandmeterDienst } from '@/lib/landmeter-diensten'

type Customer = {
  id: string
  full_name: string | null
  company_name: string | null
  email: string | null
  phone: string | null
  vat_number: string | null
  iban: string | null
  bic: string | null
  address: string | null
  payment_term_days: string | null
  currency: string | null
  vat_rate: string | null
}

type Project = {
  id: number
  name: string | null
  address: string | null
  user_id: string | null
}

type LineItem = {
  id: number
  description: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: number
}

type Props = {
  action?: (formData: FormData) => void
  customers: Customer[]
  projects: Project[]
  preselectedCustomer?: string
}

const fieldLabelClass =
  'text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]'
const sectionHeaderClass =
  'flex items-start gap-3 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5'
const sectionBodyClass = 'space-y-4 px-4 py-4 sm:px-5'
const sectionClass =
  'overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm'
const softSelectClass =
  'w-full appearance-none rounded-xl border border-[var(--accent)]/45 bg-[var(--bg-card)] px-3 py-2.5 pr-10 text-sm text-[var(--text-main)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15'
const softSelectIconClass =
  'pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-[var(--accent)]/85'

function getCustomerLabel(c: Customer) {
  return c.company_name || c.full_name || c.email || 'Onbekende klant'
}

let lineIdCounter = 1

export default function OfferteForm({
  action,
  customers,
  projects,
  preselectedCustomer = '',
}: Props) {
  // --- Klant state ---
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>(
    preselectedCustomer ? 'existing' : 'existing'
  )
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomer)
  const [customerSearch, setCustomerSearch] = useState('')

  // --- Offerte state ---
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [vatRate, setVatRate] = useState('21%')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [notes, setNotes] = useState('')

  // --- Nieuwe klant state ---
  const [newCustomerCompany, setNewCustomerCompany] = useState('')
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerVat, setNewCustomerVat] = useState('')
  const [newCustomerStreet, setNewCustomerStreet] = useState('')
  const [newCustomerPostalCode, setNewCustomerPostalCode] = useState('')
  const [newCustomerCity, setNewCustomerCity] = useState('')
  const [newCustomerCountry, setNewCustomerCountry] = useState('')

  // --- BTW lookup state ---
  const [vatLookupLoading, setVatLookupLoading] = useState(false)
  const [vatLookupMessage, setVatLookupMessage] = useState('')
  const [vatLookupSuccess, setVatLookupSuccess] = useState(false)

  // --- Catalogus state ---
  const [showCatalog, setShowCatalog] = useState(false)
  const [catalogCategory, setCatalogCategory] = useState<string>('Alle')
  const [catalogSearch, setCatalogSearch] = useState('')

  // --- Line items ---
  const defaultVat = parseFloat(vatRate) || 21
  const [lines, setLines] = useState<LineItem[]>([
    { id: lineIdCounter++, description: '', quantity: 1, unit: 'stuk', unitPrice: 0, vatRate: defaultVat },
  ])

  // --- Berekeningen ---
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0)
  const totalVat = lines.reduce((sum, l) => {
    const lineSubtotal = l.quantity * l.unitPrice
    return sum + Math.round(lineSubtotal * (l.vatRate / 100) * 100) / 100
  }, 0)
  const total = subtotal + totalVat

  // --- Geselecteerde klant ---
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null

  // --- Klantfilter ---
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers
    const q = customerSearch.toLowerCase()
    return customers.filter(
      (c) =>
        (c.company_name ?? '').toLowerCase().includes(q) ||
        (c.full_name ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.vat_number ?? '').toLowerCase().includes(q)
    )
  }, [customers, customerSearch])

  // --- Projecten gefilterd op klant ---
  const filteredProjects = useMemo(() => {
    if (selectedCustomerId) {
      const customerProjects = projects.filter((p) => p.user_id === selectedCustomerId)
      return customerProjects.length > 0 ? customerProjects : projects
    }
    return projects
  }, [projects, selectedCustomerId])

  // --- Auto-fill bij klant selectie ---
  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id)
    const c = customers.find((cust) => cust.id === id)
    if (c) {
      if (c.currency) setCurrency(c.currency)
      if (c.vat_rate) setVatRate(c.vat_rate)
      if (c.payment_term_days) setPaymentTerms(`${c.payment_term_days} dagen`)
    }
  }

  // --- BTW lookup handler ---
  const handleVatLookup = async () => {
    if (!newCustomerVat.trim()) {
      setVatLookupMessage('Voer eerst een BTW-nummer in.')
      setVatLookupSuccess(false)
      return
    }
    setVatLookupLoading(true)
    setVatLookupMessage('')
    setVatLookupSuccess(false)
    try {
      const res = await fetch('/api/vat-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vatNumber: newCustomerVat.trim() }),
      })
      const text = await res.text()
      let data: Record<string, unknown>
      try { data = JSON.parse(text) } catch { data = { error: text } }

      if (!res.ok) {
        setVatLookupMessage(String(data.error || data.details || 'Fout bij opzoeken.'))
        return
      }
      if (!data.valid) {
        setVatLookupMessage('BTW-nummer is niet geldig volgens VIES.')
        return
      }
      if (data.companyName) setNewCustomerCompany(String(data.companyName))
      if (data.street) setNewCustomerStreet(String(data.street))
      if (data.postalCode) setNewCustomerPostalCode(String(data.postalCode))
      if (data.city) setNewCustomerCity(String(data.city))
      if (data.country) setNewCustomerCountry(String(data.country))
      if (data.vatNumber && data.countryCode) {
        setNewCustomerVat(`${data.countryCode}${data.vatNumber}`)
      }
      setVatLookupMessage(`Gegevens opgehaald voor ${data.companyName || 'bedrijf'}`)
      setVatLookupSuccess(true)
    } catch {
      setVatLookupMessage('Netwerkfout bij opzoeken BTW-nummer.')
    } finally {
      setVatLookupLoading(false)
    }
  }

  // --- Line item handlers ---
  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: lineIdCounter++, description: '', quantity: 1, unit: 'stuk', unitPrice: 0, vatRate: defaultVat },
    ])
  }

  const removeLine = (id: number) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev))
  }

  const addDienst = (d: LandmeterDienst) => {
    setLines((prev) => [
      ...prev,
      { id: lineIdCounter++, description: d.beschrijving, quantity: 1, unit: d.eenheid, unitPrice: d.prijs, vatRate: defaultVat },
    ])
  }

  // --- Catalogus filter ---
  const filteredDiensten = useMemo(() => {
    let items = landmeterDiensten
    if (catalogCategory !== 'Alle') {
      items = items.filter((d) => d.categorie === catalogCategory)
    }
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase()
      items = items.filter((d) => d.beschrijving.toLowerCase().includes(q))
    }
    return items
  }, [catalogCategory, catalogSearch])

  const updateLine = (id: number, field: keyof LineItem, value: string | number) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    )
  }

  return (
    <form action={action} className="space-y-4">
      {/* Hidden fields */}
      <input type="hidden" name="is_new_customer" value={customerMode === 'new' ? 'yes' : 'no'} />
      <input type="hidden" name="customer_id" value={customerMode === 'existing' ? selectedCustomerId : ''} />
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="vat_rate" value={vatRate} />

      {/* ===== KLANT SELECTIE ===== */}
      <div className={sectionClass}>
        <div className={sectionHeaderClass}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-main)]">Klant</h2>
            <p className="mt-1 text-xs text-[var(--text-soft)]">
              Selecteer een bestaande klant of maak direct een nieuwe aan.
            </p>
          </div>
        </div>

        <div className={sectionBodyClass}>
          {/* Toggle bestaande / nieuwe klant */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCustomerMode('existing')}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                customerMode === 'existing'
                  ? 'border-[var(--accent)]/50 bg-[var(--accent)]/12 text-[var(--accent)]'
                  : 'border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-soft)] hover:border-[var(--accent)]/30'
              }`}
            >
              <Users className="h-3 w-3" />
              Bestaande klant
            </button>
            <button
              type="button"
              onClick={() => setCustomerMode('new')}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                customerMode === 'new'
                  ? 'border-[var(--accent)]/50 bg-[var(--accent)]/12 text-[var(--accent)]'
                  : 'border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-soft)] hover:border-[var(--accent)]/30'
              }`}
            >
              <UserPlus className="h-3 w-3" />
              Nieuwe klant
            </button>
          </div>

          {customerMode === 'existing' ? (
            <div className="space-y-3">
              {/* Zoekbalk */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="input-dark w-full py-2.5 pl-9 pr-3 text-sm"
                  placeholder="Zoek op naam, bedrijf, e-mail of btw-nummer..."
                />
              </div>

              {/* Klantenlijst — alleen tonen bij zoekterm of selectie */}
              {(customerSearch.trim() || selectedCustomerId) && (
              <div className="max-h-[240px] overflow-y-auto rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
                {filteredCustomers.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-[var(--text-soft)]">Geen klanten gevonden.</p>
                ) : (
                  <div className="divide-y divide-[var(--border-soft)]">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleCustomerSelect(c.id)}
                        className={`w-full px-4 py-2.5 text-left transition ${
                          selectedCustomerId === c.id
                            ? 'bg-[var(--accent)]/8'
                            : 'hover:bg-[var(--bg-card-2)]'
                        }`}
                      >
                        <p className="text-sm font-semibold text-[var(--text-main)]">
                          {getCustomerLabel(c)}
                          {selectedCustomerId === c.id && (
                            <span className="ml-2 text-[10px] text-[var(--accent)]">✓ geselecteerd</span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                          {c.email}
                          {c.vat_number ? ` · ${c.vat_number}` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              )}

              {/* Geselecteerde klant details */}
              {selectedCustomer && (
                <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Geselecteerde klant
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">Bedrijf</p>
                      <p className="text-sm font-semibold text-[var(--text-main)]">
                        {selectedCustomer.company_name || selectedCustomer.full_name || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">E-mail</p>
                      <p className="text-sm text-[var(--text-main)]">{selectedCustomer.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">BTW-nummer</p>
                      <p className="text-sm text-[var(--text-main)]">{selectedCustomer.vat_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">Telefoon</p>
                      <p className="text-sm text-[var(--text-main)]">{selectedCustomer.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">IBAN</p>
                      <p className="text-sm text-[var(--text-main)]">{selectedCustomer.iban || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">Adres</p>
                      <p className="text-sm text-[var(--text-main)]">{selectedCustomer.address || '—'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ===== NIEUWE KLANT FORMULIER ===== */
            <div className="space-y-3">
              {/* BTW opzoeking */}
              <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.03] p-3">
                <label className={fieldLabelClass}>BTW-opzoeking</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCustomerVat}
                    onChange={(e) => setNewCustomerVat(e.target.value)}
                    className="input-dark flex-1 px-3 py-2.5 text-sm"
                    placeholder="BE0123456789"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleVatLookup() } }}
                  />
                  <button
                    type="button"
                    onClick={handleVatLookup}
                    disabled={vatLookupLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/12 px-3 py-2 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/20 disabled:opacity-50"
                  >
                    {vatLookupLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                    Zoek via BTW
                  </button>
                </div>
                {vatLookupMessage && (
                  <p className={`mt-2 text-xs ${
                    vatLookupSuccess ? 'text-green-400' : 'text-[var(--text-soft)]'
                  }`}>
                    {vatLookupMessage}
                  </p>
                )}
              </div>

              <input type="hidden" name="new_customer_vat" value={newCustomerVat} />
              <input type="hidden" name="new_customer_street" value={newCustomerStreet} />
              <input type="hidden" name="new_customer_postal_code" value={newCustomerPostalCode} />
              <input type="hidden" name="new_customer_city" value={newCustomerCity} />
              <input type="hidden" name="new_customer_country" value={newCustomerCountry} />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className={fieldLabelClass}>Bedrijfsnaam</label>
                  <input
                    name="new_customer_company"
                    type="text"
                    value={newCustomerCompany}
                    onChange={(e) => setNewCustomerCompany(e.target.value)}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="Bijv. Bakkerij Janssens"
                  />
                </div>
                <div className="grid gap-2">
                  <label className={fieldLabelClass}>Contactpersoon</label>
                  <input
                    name="new_customer_name"
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="Volledige naam"
                  />
                </div>
                <div className="grid gap-2">
                  <label className={fieldLabelClass}>E-mailadres *</label>
                  <input
                    name="new_customer_email"
                    type="email"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="klant@bedrijf.be"
                    required={customerMode === 'new'}
                  />
                </div>
                <div className="grid gap-2">
                  <label className={fieldLabelClass}>Telefoon</label>
                  <input
                    name="new_customer_phone"
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="+32 ..."
                  />
                </div>
                <div className="grid gap-2">
                  <label className={fieldLabelClass}>Straat + nummer</label>
                  <input
                    type="text"
                    value={newCustomerStreet}
                    onChange={(e) => setNewCustomerStreet(e.target.value)}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="Kerkstraat 12"
                  />
                </div>
                <div className="grid gap-2">
                  <label className={fieldLabelClass}>Postcode + Stad</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCustomerPostalCode}
                      onChange={(e) => setNewCustomerPostalCode(e.target.value)}
                      className="input-dark w-24 px-3 py-2.5 text-sm"
                      placeholder="1000"
                    />
                    <input
                      type="text"
                      value={newCustomerCity}
                      onChange={(e) => setNewCustomerCity(e.target.value)}
                      className="input-dark flex-1 px-3 py-2.5 text-sm"
                      placeholder="Brussel"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== OFFERTE GEGEVENS ===== */}
      <div className={sectionClass}>
        <div className={sectionHeaderClass}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-main)]">Offerte details</h2>
            <p className="mt-1 text-xs text-[var(--text-soft)]">
              Omschrijving, geldigheid en betaalcondities van de offerte.
            </p>
          </div>
        </div>

        <div className={sectionBodyClass}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <label className={fieldLabelClass}>Onderwerp *</label>
              <input
                name="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-dark w-full px-3 py-2.5 text-sm"
                placeholder="Bijv. Renovatie badkamer"
                required
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <label className={fieldLabelClass}>Beschrijving</label>
              <textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-dark min-h-[100px] w-full resize-none px-3 py-2.5 text-sm"
                placeholder="Bijkomende details over het werk..."
              />
            </div>

            <div className="grid gap-2">
              <label className={fieldLabelClass}>Project / werf</label>
              <div className="relative">
                <select
                  name="project_id"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={softSelectClass}
                  style={{ colorScheme: 'dark' as const }}
                >
                  <option value="">Geen project gekoppeld</option>
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.address || `Project #${p.id}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className={softSelectIconClass} size={16} />
              </div>
            </div>

            <div className="grid gap-2">
              <label className={fieldLabelClass}>Geldig tot</label>
              <input
                name="valid_until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="input-dark w-full px-3 py-2.5 text-sm"
                style={{ colorScheme: 'dark' as const }}
              />
            </div>

            <div className="grid gap-2">
              <label className={fieldLabelClass}>BTW-tarief</label>
              <div className="relative">
                <select
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className={softSelectClass}
                  style={{ colorScheme: 'dark' as const }}
                >
                  <option value="21%">21%</option>
                  <option value="12%">12%</option>
                  <option value="6%">6%</option>
                  <option value="0%">0% (vrijgesteld)</option>
                </select>
                <ChevronDown className={softSelectIconClass} size={16} />
              </div>
            </div>

            <div className="grid gap-2">
              <label className={fieldLabelClass}>Betalingsvoorwaarden</label>
              <input
                name="payment_terms"
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="input-dark w-full px-3 py-2.5 text-sm"
                placeholder="Bijv. 30 dagen na factuurdatum"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className={fieldLabelClass}>Interne opmerkingen</label>
            <textarea
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-dark min-h-[80px] w-full resize-none px-3 py-2.5 text-sm"
              placeholder="Opmerkingen die niet op de offerte komen..."
            />
          </div>
        </div>
      </div>

      {/* ===== OFFERTE REGELS (LINE ITEMS) ===== */}
      <div className={sectionClass}>
        <div className={sectionHeaderClass}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
            <Euro className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-main)]">Prijslijnen</h2>
            <p className="mt-1 text-xs text-[var(--text-soft)]">
              Kies diensten uit de catalogus of voeg handmatig regels toe.
            </p>
          </div>
        </div>

        <div className={sectionBodyClass}>
          {/* ── Catalogus browser ── */}
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setShowCatalog(!showCatalog)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                showCatalog
                  ? 'border-[var(--accent)]/50 bg-[var(--accent)]/12 text-[var(--accent)]'
                  : 'border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-soft)] hover:border-[var(--accent)]/30'
              }`}
            >
              <BookOpen className="h-3 w-3" />
              Dienstencatalogus
              <ChevronDown className={`h-3 w-3 transition ${showCatalog ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showCatalog && (
            <div className="mb-4 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.03] p-3 space-y-3">
              {/* Zoek + categoriefilter */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="input-dark w-full py-2 pl-9 pr-3 text-sm"
                    placeholder="Zoek een dienst..."
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setCatalogCategory('Alle')}
                    className={`rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                      catalogCategory === 'Alle'
                        ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-soft)]'
                    }`}
                  >
                    Alle
                  </button>
                  {dienstCategorieen.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCatalogCategory(cat)}
                      className={`rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                        catalogCategory === cat
                          ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-soft)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diensten grid */}
              <div className="max-h-[320px] overflow-y-auto space-y-1">
                {filteredDiensten.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-[var(--text-soft)]">Geen diensten gevonden.</p>
                ) : (
                  filteredDiensten.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => addDienst(d)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-[var(--accent)]/8"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[var(--text-main)] truncate">{d.beschrijving}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {d.categorie} · {d.eenheid}
                        </p>
                      </div>
                      <div className="ml-3 flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-[var(--accent)]">€{d.prijs.toFixed(2)}</span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                          <Plus className="h-3 w-3" />
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* Header */}
            <div className="hidden grid-cols-[1fr_70px_70px_95px_70px_80px_95px_36px] gap-2 sm:grid">
              <p className={fieldLabelClass}>Omschrijving</p>
              <p className={fieldLabelClass}>Aantal</p>
              <p className={fieldLabelClass}>Eenheid</p>
              <p className={fieldLabelClass}>Prijs/eenheid</p>
              <p className={fieldLabelClass}>BTW %</p>
              <p className={`${fieldLabelClass} text-right`}>BTW bedrag</p>
              <p className={`${fieldLabelClass} text-right`}>Totaal</p>
              <p />
            </div>

            {/* Lines */}
            {lines.map((line, idx) => {
              const lineSubtotal = line.quantity * line.unitPrice
              const lineVat = Math.round(lineSubtotal * (line.vatRate / 100) * 100) / 100
              const lineTotal = lineSubtotal + lineVat
              return (
              <div
                key={line.id}
                className="grid grid-cols-1 gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3 sm:grid-cols-[1fr_70px_70px_95px_70px_80px_95px_36px] sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
              >
                <div>
                  <label className="mb-1 block text-[10px] text-[var(--text-muted)] sm:hidden">
                    Omschrijving
                  </label>
                  <input
                    name="line_description"
                    type="text"
                    value={line.description}
                    onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                    className="input-dark w-full px-3 py-2 text-sm"
                    placeholder={`Regel ${idx + 1}`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-[var(--text-muted)] sm:hidden">
                    Aantal
                  </label>
                  <input
                    name="line_quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.quantity}
                    onChange={(e) => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="input-dark w-full px-2 py-2 text-center text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-[var(--text-muted)] sm:hidden">
                    Eenheid
                  </label>
                  <input
                    name="line_unit"
                    type="text"
                    value={line.unit}
                    onChange={(e) => updateLine(line.id, 'unit', e.target.value)}
                    className="input-dark w-full px-2 py-2 text-center text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-[var(--text-muted)] sm:hidden">
                    Prijs/eenheid
                  </label>
                  <input
                    name="line_unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="input-dark w-full px-2 py-2 text-right text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-[var(--text-muted)] sm:hidden">
                    BTW %
                  </label>
                  <select
                    name="line_vat_rate"
                    value={line.vatRate}
                    onChange={(e) => updateLine(line.id, 'vatRate', parseFloat(e.target.value))}
                    className="input-dark w-full px-1 py-2 text-center text-sm"
                    style={{ colorScheme: 'dark' as const }}
                  >
                    <option value={21}>21%</option>
                    <option value={12}>12%</option>
                    <option value={6}>6%</option>
                    <option value={0}>0%</option>
                  </select>
                </div>
                <div className="flex items-center justify-between sm:justify-end">
                  <label className="text-[10px] text-[var(--text-muted)] sm:hidden">BTW bedrag</label>
                  <p className="text-sm text-[var(--text-soft)]">
                    €{lineVat.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end">
                  <label className="text-[10px] text-[var(--text-muted)] sm:hidden">Totaal</label>
                  <p className="text-sm font-semibold text-[var(--text-main)]">
                    €{lineTotal.toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-red-500/10 hover:text-red-400"
                    title="Verwijder regel"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              )
            })}

            {/* Regel toevoegen */}
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--border-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-soft)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            >
              <Plus className="h-3 w-3" />
              Regel toevoegen
            </button>
          </div>

          {/* Totalen */}
          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-[300px] space-y-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-soft)]">Subtotaal excl. BTW</span>
                <span className="font-semibold text-[var(--text-main)]">
                  €{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-soft)]">Totaal BTW</span>
                <span className="font-semibold text-[var(--text-main)]">
                  €{totalVat.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-[var(--border-soft)] pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--accent)]">Totaal incl. BTW</span>
                  <span className="text-lg font-bold text-[var(--accent)]">
                    €{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SUBMIT ===== */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
        >
          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
          <span className="flex items-start gap-2.5 pr-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
              <FileText className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                Offerte aanmaken
              </span>
              <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                {customerMode === 'new' ? 'Klant aanmaken & offerte opslaan als concept' : 'Opslaan als concept'}
              </span>
            </span>
          </span>
        </button>
      </div>
    </form>
  )
}
