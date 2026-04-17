'use client'

import { type FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useT } from '@/i18n/context'
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  CreditCard,
  Mail,
  MapPinned,
  MessageSquare,
  Search,
  ShieldCheck,
} from 'lucide-react'
import CustomerMap from '@/components/customers/customer-map'
import CustomerLogoUpload from '@/components/customers/customer-logo-upload'

type Props = {
  action: (formData: FormData) => void
  logoPreviewUrl?: string | null
  customer: {
    id: string
    full_name: string | null
    company_name: string | null
    email: string | null
    vat_number: string | null
    enterprise_number: string | null
    reference: string | null
    salutation: string | null
    director_first_name: string | null
    director_last_name: string | null
    rpr: string | null
    invoice_email: string | null
    website: string | null
    phone: string | null
    mobile: string | null
    fax: string | null
    language: string | null
    iban?: string | null
    bic?: string | null
    logo_path?: string | null
    payment_term_days: number | null
    quote_validity_days: number | null
    payment_method: string | null
    currency: string | null
    vat_rate: string | null
    invoice_send_method: string | null
    send_xml: boolean | null
    xml_format: string | null
    send_pdf: boolean | null
    auto_reminders: boolean | null
    street: string | null
    house_number: string | null
    bus: string | null
    postal_code: string | null
    city: string | null
    country: string | null
    comments: string | null
    latitude: number | null
    longitude: number | null
  }
}

type LookupResult = {
  valid: boolean
  countryCode: string
  vatNumber: string
  companyName: string
  addressRaw: string
  street: string
  postalCode: string
  city: string
  country: string
  latitude: number | null
  longitude: number | null
  mapLabel?: string
}

export default function CustomerEditForm({ action, customer, logoPreviewUrl }: Props) {
  const { t } = useT()
  const tt = t.customerForm
  const INVITE_COOLDOWN_SECONDS = 90
  const INVITE_COOLDOWN_MS = INVITE_COOLDOWN_SECONDS * 1000
  const inviteCooldownStorageKey = `invite-cooldown:customer-edit:${customer.id}`

  const [vatNumber, setVatNumber] = useState(customer.vat_number || '')
  const [companyName, setCompanyName] = useState(customer.company_name || '')
  const [fullName] = useState(customer.full_name || '')
  const fallbackNameParts = (customer.full_name || '').trim().split(/\s+/).filter(Boolean)
  const [email, setEmail] = useState(customer.email || '')
  const [enterpriseNumber, setEnterpriseNumber] = useState(
    customer.enterprise_number || ''
  )
  const [reference, setReference] = useState(customer.reference || '')
  const [salutation, setSalutation] = useState(customer.salutation || '')
  const [directorFirstName, setDirectorFirstName] = useState(
    customer.director_first_name || fallbackNameParts[0] || ''
  )
  const [directorLastName, setDirectorLastName] = useState(
    customer.director_last_name || fallbackNameParts.slice(1).join(' ')
  )
  const [rpr, setRpr] = useState(customer.rpr || '')
  const [invoiceEmail, setInvoiceEmail] = useState(customer.invoice_email || '')
  const [website, setWebsite] = useState(customer.website || '')
  const [phone, setPhone] = useState(customer.phone || '')
  const [mobile, setMobile] = useState(customer.mobile || '')
  const [fax, setFax] = useState(customer.fax || '')
  const [language, setLanguage] = useState(customer.language || '')
  const [iban, setIban] = useState(customer.iban || '')
  const [bic, setBic] = useState(customer.bic || '')
  const [paymentTermDays, setPaymentTermDays] = useState(
    customer.payment_term_days?.toString() || ''
  )
  const [quoteValidityDays, setQuoteValidityDays] = useState(
    customer.quote_validity_days?.toString() || ''
  )
  const [paymentMethod, setPaymentMethod] = useState(
    customer.payment_method || ''
  )
  const [currency, setCurrency] = useState(customer.currency || 'EUR')
  const [vatRate, setVatRate] = useState(customer.vat_rate || '')
  const [invoiceSendMethod, setInvoiceSendMethod] = useState(
    customer.invoice_send_method || ''
  )
  const [sendXml, setSendXml] = useState(Boolean(customer.send_xml))
  const [xmlFormat, setXmlFormat] = useState(customer.xml_format || '')
  const [sendPdf, setSendPdf] = useState(Boolean(customer.send_pdf))
  const [autoReminders, setAutoReminders] = useState(
    Boolean(customer.auto_reminders)
  )

  const [street, setStreet] = useState(customer.street || '')
  const [houseNumber, setHouseNumber] = useState(customer.house_number || '')
  const [bus, setBus] = useState(customer.bus || '')
  const [postalCode, setPostalCode] = useState(customer.postal_code || '')
  const [city, setCity] = useState(customer.city || '')
  const [country, setCountry] = useState(customer.country || '')
  const [comments, setComments] = useState(customer.comments || '')

  const [latitude, setLatitude] = useState<number | null>(
    customer.latitude ?? null
  )
  const [longitude, setLongitude] = useState<number | null>(
    customer.longitude ?? null
  )

  const [mapLabel, setMapLabel] = useState(
    [
      customer.street,
      customer.house_number,
      customer.bus,
      customer.postal_code,
      customer.city,
      customer.country,
    ]
      .filter(Boolean)
      .join(', ')
  )

  const [lookupMessage, setLookupMessage] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [addressLookupMessage, setAddressLookupMessage] = useState('')
  const [addressLookupLoading, setAddressLookupLoading] = useState(false)
  const [passwordMode, setPasswordMode] = useState<'keep' | 'invite' | 'manual'>('keep')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [inviteCooldownUntil, setInviteCooldownUntil] = useState(0)
  const [nowTs, setNowTs] = useState(Date.now())

  useEffect(() => {
    if (typeof window === 'undefined') return

    const raw = window.localStorage.getItem(inviteCooldownStorageKey)
    if (!raw) return

    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) {
      window.localStorage.removeItem(inviteCooldownStorageKey)
      return
    }

    if (parsed > Date.now()) {
      setInviteCooldownUntil(parsed)
      return
    }

    window.localStorage.removeItem(inviteCooldownStorageKey)
  }, [inviteCooldownStorageKey])

  useEffect(() => {
    if (!(passwordMode === 'invite' && inviteCooldownUntil > Date.now())) return

    const intervalId = window.setInterval(() => {
      setNowTs(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [passwordMode, inviteCooldownUntil])

  const handleVatLookup = async () => {
    if (!vatNumber.trim()) {
      setLookupMessage(tt.vatLookupEmpty)
      return
    }

    try {
      setLookupLoading(true)
      setLookupMessage('')

      const response = await fetch('/api/vat-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vatNumber }),
      })

      const rawText = await response.text()

      let data: LookupResult | { error: string; details?: string }

      try {
        data = JSON.parse(rawText) as LookupResult | {
          error: string
          details?: string
        }
      } catch {
        console.error('VAT lookup returned non-JSON:', rawText)
        setLookupMessage(tt.vatLookupInvalidResponse)
        return
      }

      if (!response.ok || 'error' in data) {
        const message =
          'error' in data
            ? data.details
              ? `${data.error} (${data.details})`
              : data.error
            : tt.vatLookupFailed

        setLookupMessage(message)
        return
      }

      if (!data.valid) {
        setLookupMessage(tt.vatNumberInvalidVies)
        return
      }

      setVatNumber(`${data.countryCode}${data.vatNumber}`)

      if (data.companyName) setCompanyName(data.companyName)
      if (data.street) setStreet(data.street)
      if (data.postalCode) setPostalCode(data.postalCode)
      if (data.city) setCity(data.city)
      if (data.country) setCountry(data.country)
      if (data.latitude != null) setLatitude(data.latitude)
      if (data.longitude != null) setLongitude(data.longitude)
      if (data.mapLabel) setMapLabel(data.mapLabel)

      setLookupMessage(tt.updateVatSuccess)
    } catch (error) {
      console.error('VAT lookup fetch error:', error)
      setLookupMessage(tt.vatLookupError)
    } finally {
      setLookupLoading(false)
    }
  }

  function buildAddressLabel() {
    return [street, houseNumber, bus, postalCode, city, country]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(', ')
  }

  const handleAddressLookup = async (silent = false) => {
    const address = buildAddressLabel()

    if (!street.trim() || (!postalCode.trim() && !city.trim()) || !country.trim()) {
      setLatitude(null)
      setLongitude(null)
      setMapLabel(address)

      if (!silent) {
        setAddressLookupMessage(
          tt.addressLookupIncomplete
        )
      }
      return
    }

    try {
      setAddressLookupLoading(true)
      if (!silent) setAddressLookupMessage(tt.addressLookupSearching)

      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || tt.geocodeNoResults)
      }

      setLatitude(data.latitude ?? null)
      setLongitude(data.longitude ?? null)
      setMapLabel(data.display_name || address)
      setAddressLookupMessage(tt.addressLookupSuccess)
    } catch (error) {
      setLatitude(null)
      setLongitude(null)
      setMapLabel(address)
      setAddressLookupMessage(
        error instanceof Error
          ? error.message
          : tt.addressLookupError
      )
    } finally {
      setAddressLookupLoading(false)
    }
  }

  useEffect(() => {
    const address = buildAddressLabel()

    if (!street.trim() || (!postalCode.trim() && !city.trim()) || !country.trim()) {
      if (!address) {
        setLatitude(null)
        setLongitude(null)
        setMapLabel('')
      }
      return
    }

    const timeoutId = window.setTimeout(() => {
      void handleAddressLookup(true)
    }, 700)

    return () => window.clearTimeout(timeoutId)
  }, [street, houseNumber, bus, postalCode, city, country])

  useEffect(() => {
    if (!invoiceEmail.trim() && email.trim()) {
      setInvoiceEmail(email.trim())
    }
  }, [email])

  const shellClass =
    'overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm'
  const sectionClass =
    'flex h-full flex-col overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm'
  const sectionBodyClass = 'flex-1 space-y-4 px-4 py-4 sm:px-5'
  const actionCardClass =
    'group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80'
  const compactActionClass =
    'group relative inline-flex h-[46px] shrink-0 items-center overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80 disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-[230px]'
  const softSelectClass =
    'w-full appearance-none rounded-xl border border-[var(--accent)]/45 bg-[var(--bg-card)] px-3 py-2.5 pr-10 text-sm text-[var(--text-main)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15'
  const softSelectIconClass =
    'pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-[var(--accent)]/85'
  const fieldLabelClass =
    'text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]'
  const nativeSelectStyle = { colorScheme: 'dark' as const }
  const validationLabels: Record<string, string> = {
    vat_number: tt.valLabelVatNumber,
    company_name: tt.valLabelCompanyName,
    email: tt.valLabelEmail,
    invoice_email: tt.valLabelInvoiceEmail,
    salutation: tt.valLabelSalutation,
    director_first_name: tt.valLabelFirstName,
    director_last_name: tt.valLabelLastName,
    mobile: tt.valLabelMobile,
    language: tt.valLabelLanguage,
    iban: tt.valLabelIban,
    bic: tt.valLabelBic,
    payment_term_days: tt.valLabelPaymentTerm,
    quote_validity_days: tt.valLabelQuoteValidity,
    payment_method: tt.valLabelPaymentMethod,
    currency: tt.valLabelCurrency,
    vat_rate: tt.valLabelVatRate,
  }
  const handleFormValidation = (event: FormEvent<HTMLFormElement>) => {
    const target = event.target

    if (
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLSelectElement) &&
      !(target instanceof HTMLTextAreaElement)
    ) {
      return
    }

    const fieldLabel = validationLabels[target.name] || tt.thisField

    if (target.validity.valueMissing) {
      target.setCustomValidity(`${tt.requiredFieldPrefix}${fieldLabel}${tt.requiredFieldSuffix}`)
      return
    }

    if (target.validity.typeMismatch && target instanceof HTMLInputElement && target.type === 'email') {
      target.setCustomValidity(tt.invalidEmail)
      return
    }

    target.setCustomValidity(tt.checkField)
  }
  const clearFormValidationMessage = (event: FormEvent<HTMLFormElement>) => {
    const target = event.target

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ) {
      target.setCustomValidity('')
    }
  }
  const resolvedFullName =
    [directorFirstName, directorLastName]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' ') || fullName.trim()
  const resolvedInvoiceEmail = invoiceEmail.trim() || email.trim()
  const addressPreview = buildAddressLabel()
  const hasLookupDetails = Boolean(
    companyName || street || postalCode || city || country || latitude != null || longitude != null
  )
  const inviteCooldownRemainingSec = Math.max(
    0,
    Math.ceil((inviteCooldownUntil - nowTs) / 1000)
  )
  const inviteCooldownActive =
    passwordMode === 'invite' && inviteCooldownRemainingSec > 0
  const handleInviteSubmitCapture = () => {
    if (passwordMode !== 'invite') return

    const nextCooldown = Date.now() + INVITE_COOLDOWN_MS
    setInviteCooldownUntil(nextCooldown)
    setNowTs(Date.now())

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        inviteCooldownStorageKey,
        String(nextCooldown)
      )
    }
  }

  return (
    <form
      action={action}
      className="space-y-4"
      onSubmitCapture={handleInviteSubmitCapture}
      onInvalidCapture={handleFormValidation}
      onInputCapture={clearFormValidationMessage}
    >
      <input type="hidden" name="id" value={customer.id} />
      <input type="hidden" name="latitude" value={latitude ?? ''} />
      <input type="hidden" name="longitude" value={longitude ?? ''} />
      <input
        type="hidden"
        name="send_invite"
        value={passwordMode === 'invite' ? 'yes' : 'no'}
      />
      <input type="hidden" name="send_xml" value={sendXml ? 'yes' : 'no'} />
      <input type="hidden" name="send_pdf" value={sendPdf ? 'yes' : 'no'} />
      <input
        type="hidden"
        name="auto_reminders"
        value={autoReminders ? 'yes' : 'no'}
      />
      <input type="hidden" name="enterprise_number" value={enterpriseNumber} />
      <input type="hidden" name="reference" value={reference} />
      <input type="hidden" name="full_name" value={resolvedFullName} />
      <input type="hidden" name="rpr" value={rpr} />
      <input type="hidden" name="website" value={website} />
      <input
        type="hidden"
        name="invoice_send_method"
        value={invoiceSendMethod}
      />
      <input type="hidden" name="xml_format" value={xmlFormat} />
      <input type="hidden" name="street" value={street} />
      <input type="hidden" name="house_number" value={houseNumber} />
      <input type="hidden" name="bus" value={bus} />
      <input type="hidden" name="postal_code" value={postalCode} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="country" value={country} />

      <div className={shellClass}>
        <div className="space-y-4 px-3 py-3 sm:px-4 sm:py-4">
          <div className="grid items-stretch gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <section className={sectionClass}>
              <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
                    <Search className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">
                      {tt.vatLookupSection}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      {tt.vatEditDesc}
                    </p>
                  </div>
                </div>
              </div>

              <div className={sectionBodyClass}>
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      name="vat_number"
                      type="text"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      placeholder={tt.vatNumberPlaceholder}
                      className="input-dark min-w-0 flex-1 px-3 py-2.5 text-sm"
                      required
                    />

                    <button
                      type="button"
                      onClick={handleVatLookup}
                      disabled={lookupLoading}
                      className={compactActionClass}
                    >
                      <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                      <span className="flex items-center gap-2.5 pr-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                          <Search className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                          {lookupLoading ? tt.searching : tt.vatSearchBtn}
                        </span>
                      </span>
                    </button>
                  </div>

                  {lookupMessage && (
                    <div className="mt-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-3 text-sm text-blue-200">
                      {lookupMessage}
                    </div>
                  )}
                </div>

                {hasLookupDetails && (
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          {tt.lookupResults}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-soft)]">
                          {tt.lookupResultsEditDesc}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          {tt.company}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                          {companyName || tt.notFound}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          {tt.vatNumber}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                          {vatNumber || '—'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          {tt.country}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                          {country || '—'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5 sm:col-span-2 xl:col-span-2">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          {tt.streetAddress}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                          {[street, houseNumber, bus].filter(Boolean).join(' ') || tt.notFound}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5 sm:col-span-2 xl:col-span-1">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          {tt.postalCity}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                          {[postalCode, city].filter(Boolean).join(' · ') || tt.notFound}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className={`${sectionClass} flex h-full flex-col`}>
              <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
                    <MapPinned className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">
                      {tt.addressMap}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      {tt.mapEditDesc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex min-h-[320px] flex-1 px-4 py-4 sm:px-5">
                <CustomerMap
                  latitude={latitude}
                  longitude={longitude}
                  label={mapLabel || addressPreview}
                  height="100%"
                />
              </div>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className={sectionClass}>
              <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">
                      {tt.customerContact}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      {tt.customerContactEditDesc}
                    </p>
                  </div>
                </div>
              </div>

              <div className={sectionBodyClass}>
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      {tt.contactShipping}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      {tt.contactShippingDesc}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.company}</label>
                    <input
                      name="company_name"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder={tt.companyExample}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.email}</label>
                    <input
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder={tt.emailExample}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.salutation}</label>
                    <div className="relative">
                      <select
                        name="salutation"
                        value={salutation}
                        onChange={(e) => setSalutation(e.target.value)}
                        className={softSelectClass}
                        style={nativeSelectStyle}
                        required
                      >
                        <option value="">{tt.selectSalutation}</option>
                        <option value="Dhr.">{tt.salutationMr}</option>
                        <option value="Mevr.">{tt.salutationMrs}</option>
                        <option value="Dr.">{tt.salutationDr}</option>
                        <option value="Familie">{tt.salutationFamily}</option>
                        <option value="Team">{tt.salutationTeam}</option>
                      </select>
                      <ChevronDown className={softSelectIconClass} size={16} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.invoiceEmail}</label>
                    <input
                      type="email"
                      value={invoiceEmail}
                      onChange={(e) => setInvoiceEmail(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder={email ? tt.sameAs.replace('{email}', email) : tt.invoiceEmailExample}
                    />
                    <input
                      type="hidden"
                      name="invoice_email"
                      value={resolvedInvoiceEmail}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.firstName}</label>
                    <input
                      name="director_first_name"
                      type="text"
                      value={directorFirstName}
                      onChange={(e) => setDirectorFirstName(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder={tt.firstNameExample}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.phone}</label>
                    <input
                      name="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder={tt.phoneExample}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.lastName}</label>
                    <input
                      name="director_last_name"
                      type="text"
                      value={directorLastName}
                      onChange={(e) => setDirectorLastName(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder={tt.lastNameExample}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.mobile}</label>
                    <input
                      name="mobile"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder={tt.mobileExample}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.fax}</label>
                    <input
                      name="fax"
                      type="tel"
                      value={fax}
                      onChange={(e) => setFax(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder={tt.faxExample}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.language}</label>
                    <div className="relative">
                      <select
                        name="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className={softSelectClass}
                        style={nativeSelectStyle}
                        required
                      >
                        <option value="">{tt.selectLanguage}</option>
                        <option value="NL">NL</option>
                        <option value="FR">FR</option>
                        <option value="ENG">ENG</option>
                      </select>
                      <ChevronDown className={softSelectIconClass} size={16} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                      <MapPinned className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {tt.address}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">
                        {tt.addressFromVatEdit}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                      <label className={fieldLabelClass}>{tt.street}</label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="input-dark w-full px-3 py-2.5 text-sm"
                        placeholder={tt.streetExample}
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className={fieldLabelClass}>{tt.houseNumber}</label>
                      <input
                        type="text"
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        className="input-dark w-full px-3 py-2.5 text-sm"
                        placeholder={tt.houseNumberExample}
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className={fieldLabelClass}>{tt.bus}</label>
                      <input
                        type="text"
                        value={bus}
                        onChange={(e) => setBus(e.target.value)}
                        className="input-dark w-full px-3 py-2.5 text-sm"
                        placeholder={tt.busExample}
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className={fieldLabelClass}>{tt.postalCode}</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="input-dark w-full px-3 py-2.5 text-sm"
                        placeholder={tt.postalCodeExample}
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className={fieldLabelClass}>{tt.city}</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="input-dark w-full px-3 py-2.5 text-sm"
                        placeholder={tt.cityExample}
                      />
                    </div>

                    <div className="grid gap-2 sm:col-span-2">
                      <label className={fieldLabelClass}>{tt.countryField}</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="input-dark w-full px-3 py-2.5 text-sm"
                        placeholder={tt.countryExample}
                      />
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-3">
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      {addressPreview || tt.noAddress}
                    </p>

                    {addressLookupMessage && (
                      <p className="mt-2 text-xs text-[var(--text-soft)]">
                        {addressLookupMessage}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleAddressLookup(false)}
                      disabled={addressLookupLoading}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Search className="h-4 w-4 text-[var(--accent)]" />
                      {addressLookupLoading ? tt.addressSearching : tt.recomputeMapPosition}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className={sectionClass}>
              <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">
                      {tt.billing}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      {tt.billingEditDesc}
                    </p>
                  </div>
                </div>
              </div>

              <div className={sectionBodyClass}>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {tt.billingTerms}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    {tt.billingTermsDesc}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.paymentTerm}</label>
                    <div className="relative">
                      <select
                        name="payment_term_days"
                        value={paymentTermDays}
                        onChange={(e) => setPaymentTermDays(e.target.value)}
                        className={softSelectClass}
                        style={nativeSelectStyle}
                      >
                        <option value="">{tt.selectPaymentTerm}</option>
                        <option value="0">{tt.paymentTermImmediate}</option>
                        <option value="7">7 {tt.days}</option>
                        <option value="14">14 {tt.days}</option>
                        <option value="21">21 {tt.days}</option>
                        <option value="30">30 {tt.days}</option>
                        <option value="45">45 {tt.days}</option>
                        <option value="60">60 {tt.days}</option>
                        <option value="90">90 {tt.days}</option>
                      </select>
                      <ChevronDown className={softSelectIconClass} size={16} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.quoteValidity}</label>
                    <div className="relative">
                      <select
                        name="quote_validity_days"
                        value={quoteValidityDays}
                        onChange={(e) => setQuoteValidityDays(e.target.value)}
                        className={softSelectClass}
                        style={nativeSelectStyle}
                      >
                        <option value="">{tt.selectQuoteValidity}</option>
                        <option value="7">7 {tt.days}</option>
                        <option value="14">14 {tt.days}</option>
                        <option value="15">15 {tt.days}</option>
                        <option value="30">30 {tt.days}</option>
                        <option value="45">45 {tt.days}</option>
                        <option value="60">60 {tt.days}</option>
                        <option value="90">90 {tt.days}</option>
                      </select>
                      <ChevronDown className={softSelectIconClass} size={16} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.paymentMethod}</label>
                    <div className="relative">
                      <select
                        name="payment_method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className={softSelectClass}
                        style={nativeSelectStyle}
                      >
                        <option value="">{tt.selectPaymentMethod}</option>
                        <option value="overschrijving">{tt.paymentMethodTransfer}</option>
                        <option value="bancontact">{tt.paymentMethodBancontact}</option>
                        <option value="kredietkaart">{tt.paymentMethodCreditCard}</option>
                        <option value="domiciliëring">{tt.paymentMethodDirectDebit}</option>
                        <option value="contant">{tt.paymentMethodCash}</option>
                        <option value="paypal">{tt.paymentMethodPaypal}</option>
                      </select>
                      <ChevronDown className={softSelectIconClass} size={16} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.currency}</label>
                    <div className="relative">
                      <select
                        name="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className={softSelectClass}
                        style={nativeSelectStyle}
                      >
                        <option value="EUR">{tt.currencyEur}</option>
                        <option value="USD">{tt.currencyUsd}</option>
                        <option value="GBP">{tt.currencyGbp}</option>
                        <option value="CHF">{tt.currencyChf}</option>
                      </select>
                      <ChevronDown className={softSelectIconClass} size={16} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.vatNumber}</label>
                    <input
                      type="text"
                      value={vatNumber}
                      readOnly
                      className="input-dark w-full px-3 py-2.5 text-sm opacity-90"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>{tt.vatRate}</label>
                    <div className="relative">
                      <select
                        name="vat_rate"
                        value={vatRate}
                        onChange={(e) => setVatRate(e.target.value)}
                        className={softSelectClass}
                        style={nativeSelectStyle}
                      >
                        <option value="">{tt.selectVatRate}</option>
                        <option value="21%">21%</option>
                        <option value="12%">12%</option>
                        <option value="6%">6%</option>
                        <option value="0%">0%</option>
                        <option value="vrijgesteld">{tt.vatExempt}</option>
                        <option value="btw verlegd">{tt.vatReverseCharge}</option>
                        <option value="intracommunautair">{tt.vatIntraCommunity}</option>
                      </select>
                      <ChevronDown className={softSelectIconClass} size={16} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {tt.bankDetails}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">
                        {tt.bankDetailsDesc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className={fieldLabelClass}>{tt.iban}</label>
                      <input
                        name="iban"
                        type="text"
                        value={iban}
                        onChange={(e) => setIban(e.target.value)}
                        className="input-dark w-full px-3 py-2.5 text-sm"
                        placeholder={tt.ibanExample}
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className={fieldLabelClass}>{tt.bic}</label>
                      <input
                        name="bic"
                        type="text"
                        value={bic}
                        onChange={(e) => setBic(e.target.value)}
                        className="input-dark w-full px-3 py-2.5 text-sm"
                        placeholder={tt.bicExample}
                      />
                    </div>
                  </div>
                </div>

                <CustomerLogoUpload
                  customerId={customer.id}
                  initialPath={customer.logo_path || ''}
                  initialPreviewUrl={logoPreviewUrl || ''}
                />
              </div>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className={sectionClass}>
              <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">
                      {tt.commentsSection}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      {tt.commentsDesc}
                    </p>
                  </div>
                </div>
              </div>

              <div className={sectionBodyClass}>
                <textarea
                  name="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="input-dark min-h-[320px] w-full flex-1 resize-none px-3 py-2.5 text-sm"
                  placeholder={tt.commentsPlaceholder}
                />
              </div>
            </section>

            <section className={sectionClass}>
              <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">
                      {tt.accessPortalTitle}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      {tt.accessPortalDesc}
                    </p>
                  </div>
                </div>
              </div>

              <div className={sectionBodyClass}>
                <div className="space-y-2 text-sm text-[var(--text-soft)]">
                  <label
                    className={`flex items-start gap-3 rounded-xl border px-3 py-3 transition ${
                      passwordMode === 'keep'
                        ? 'border-[var(--accent)]/50 bg-[var(--accent)]/8 text-[var(--text-main)]'
                        : 'border-[var(--border-soft)] bg-[var(--bg-card)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="password_mode"
                      value="keep"
                      checked={passwordMode === 'keep'}
                      onChange={() => setPasswordMode('keep')}
                      className="mt-1 accent-[var(--accent)]"
                    />
                    <span>{tt.modeKeep}</span>
                  </label>

                  <label
                    className={`flex items-start gap-3 rounded-xl border px-3 py-3 transition ${
                      passwordMode === 'invite'
                        ? 'border-[var(--accent)]/50 bg-[var(--accent)]/8 text-[var(--text-main)]'
                        : 'border-[var(--border-soft)] bg-[var(--bg-card)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="password_mode"
                      value="invite"
                      checked={passwordMode === 'invite'}
                      onChange={() => setPasswordMode('invite')}
                      className="mt-1 accent-[var(--accent)]"
                    />
                    <span>{tt.modeInviteEdit}</span>
                  </label>

                  <label
                    className={`flex items-start gap-3 rounded-xl border px-3 py-3 transition ${
                      passwordMode === 'manual'
                        ? 'border-[var(--accent)]/50 bg-[var(--accent)]/8 text-[var(--text-main)]'
                        : 'border-[var(--border-soft)] bg-[var(--bg-card)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="password_mode"
                      value="manual"
                      checked={passwordMode === 'manual'}
                      onChange={() => setPasswordMode('manual')}
                      className="mt-1 accent-[var(--accent)]"
                    />
                    <span>{tt.modeManualEdit}</span>
                  </label>
                </div>

                {passwordMode === 'manual' ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className={fieldLabelClass}>{tt.newTempPassword}</label>
                      <input
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required={passwordMode === 'manual'}
                        className="input-dark w-full px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className={fieldLabelClass}>{tt.confirmPasswordShort}</label>
                      <input
                        name="password_confirm"
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        minLength={8}
                        required={passwordMode === 'manual'}
                        className="input-dark w-full px-3 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                ) : passwordMode === 'invite' ? (
                  <p className="mt-3 text-xs text-[var(--text-soft)]">
                    {tt.inviteAfterSave}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-[var(--text-soft)]">
                    {tt.loginUnchanged}
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <Link href={`/admin/customers/${customer.id}`} className={actionCardClass}>
          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
          <span className="flex items-start gap-2.5 pr-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                {tt.customerFile}
              </span>
              <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                {tt.backWithoutChanges}
              </span>
            </span>
          </span>
        </Link>

        <button
          type="submit"
          className={`${actionCardClass} disabled:cursor-not-allowed disabled:opacity-60`}
          disabled={inviteCooldownActive}
        >
          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
          <span className="flex items-start gap-2.5 pr-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                {inviteCooldownActive
                  ? tt.waitSeconds.replace('{count}', String(inviteCooldownRemainingSec))
                  : passwordMode === 'manual'
                  ? tt.saveWithPasswordShort
                  : passwordMode === 'invite'
                    ? tt.saveAndInvite
                    : tt.saveChanges}
              </span>
              <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                {passwordMode === 'manual'
                  ? tt.saveManualDesc
                  : passwordMode === 'invite'
                    ? tt.saveInviteDesc
                    : tt.saveDefaultDesc}
              </span>
            </span>
          </span>
        </button>
      </div>

      {inviteCooldownActive && (
        <p className="text-xs text-[var(--text-soft)]">
          {tt.inviteCooldownActive.replace('{count}', String(inviteCooldownRemainingSec))}
        </p>
      )}
    </form>
  )
}