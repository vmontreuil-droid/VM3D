'use client'

import { type FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
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

  const handleVatLookup = async () => {
    if (!vatNumber.trim()) {
      setLookupMessage('Vul eerst een btw-nummer in.')
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
        setLookupMessage('De btw-opzoeking gaf geen geldig antwoord terug.')
        return
      }

      if (!response.ok || 'error' in data) {
        const message =
          'error' in data
            ? data.details
              ? `${data.error} (${data.details})`
              : data.error
            : 'Lookup mislukt.'

        setLookupMessage(message)
        return
      }

      if (!data.valid) {
        setLookupMessage('BTW-nummer is niet geldig volgens VIES.')
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

      setLookupMessage('Gegevens succesvol opnieuw opgehaald via btw-nummer.')
    } catch (error) {
      console.error('VAT lookup fetch error:', error)
      setLookupMessage('Er liep iets fout bij het ophalen van btw-gegevens.')
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
          'Vul minstens straat, postcode of gemeente, en land in voor de kaartpositie.'
        )
      }
      return
    }

    try {
      setAddressLookupLoading(true)
      if (!silent) setAddressLookupMessage('Adres op kaart zoeken...')

      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Geen coördinaten gevonden.')
      }

      setLatitude(data.latitude ?? null)
      setLongitude(data.longitude ?? null)
      setMapLabel(data.display_name || address)
      setAddressLookupMessage('Adres op kaart gevonden.')
    } catch (error) {
      setLatitude(null)
      setLongitude(null)
      setMapLabel(address)
      setAddressLookupMessage(
        error instanceof Error
          ? error.message
          : 'Er liep iets fout bij het zoeken van de kaartpositie.'
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
    vat_number: 'het btw-nummer',
    company_name: 'de bedrijfsnaam',
    email: 'het e-mailadres',
    invoice_email: 'het facturatie e-mailadres',
    salutation: 'de aanspreektitel',
    director_first_name: 'de voornaam',
    director_last_name: 'de familienaam',
    mobile: 'het mobiele nummer',
    language: 'de taal',
    iban: 'de IBAN',
    bic: 'de BIC',
    payment_term_days: 'de betalingstermijn',
    quote_validity_days: 'de geldigheid van de offerte',
    payment_method: 'de betaalwijze',
    currency: 'de munteenheid',
    vat_rate: 'het btw-tarief',
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

    const fieldLabel = validationLabels[target.name] || 'dit veld'

    if (target.validity.valueMissing) {
      target.setCustomValidity(`Gelieve ${fieldLabel} in te vullen.`)
      return
    }

    if (target.validity.typeMismatch && target instanceof HTMLInputElement && target.type === 'email') {
      target.setCustomValidity('Gelieve een geldig e-mailadres in te vullen.')
      return
    }

    target.setCustomValidity('Controleer dit veld.')
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

  return (
    <form
      action={action}
      className="space-y-4"
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
                      BTW-opzoeking
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Werk het btw-nummer bij om bedrijfs- en adresgegevens snel te verversen.
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
                      placeholder="Bijv. BE0123456789 of DE123456789"
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
                          {lookupLoading ? 'Zoeken...' : 'Zoek via btw'}
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
                          Resultaten van opzoeking
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-soft)]">
                          De gevonden gegevens worden hier samengevat en blijven meteen bewerkbaar.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          Bedrijf
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                          {companyName || 'Niet gevonden'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          BTW-nummer
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                          {vatNumber || '—'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          Land
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                          {country || '—'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5 sm:col-span-2 xl:col-span-2">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          Straat / adres
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                          {[street, houseNumber, bus].filter(Boolean).join(' ') || 'Niet gevonden'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5 sm:col-span-2 xl:col-span-1">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          Postcode / plaats
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                          {[postalCode, city].filter(Boolean).join(' · ') || 'Niet gevonden'}
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
                      Adreskaartje
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Live kaartpositie van dit klantadres.
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
                      Klant & contact
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Dezelfde verzorgde basisweergave als bij een nieuwe klant.
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
                      Contact & verzending
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Alle kerngegevens netjes uitgelijnd in één gelijkmatig overzicht.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>Bedrijf</label>
                    <input
                      name="company_name"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder="Bijv. Atelier Nova BV"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>E-mail</label>
                    <input
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder="bijv. info@bedrijf.be"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>Aanspreektitel</label>
                    <div className="relative">
                      <select
                        name="salutation"
                        value={salutation}
                        onChange={(e) => setSalutation(e.target.value)}
                        className={softSelectClass}
                        style={nativeSelectStyle}
                        required
                      >
                        <option value="">Selecteer aanspreking</option>
                        <option value="Dhr.">Dhr.</option>
                        <option value="Mevr.">Mevr.</option>
                        <option value="Dr.">Dr.</option>
                        <option value="Familie">Familie</option>
                        <option value="Team">Team</option>
                      </select>
                      <ChevronDown className={softSelectIconClass} size={16} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>Facturatie e-mail</label>
                    <input
                      type="email"
                      value={invoiceEmail}
                      onChange={(e) => setInvoiceEmail(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder={email ? `Zelfde als ${email}` : 'bijv. administratie@ateliernova.be'}
                    />
                    <input
                      type="hidden"
                      name="invoice_email"
                      value={resolvedInvoiceEmail}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>Voornaam</label>
                    <input
                      name="director_first_name"
                      type="text"
                      value={directorFirstName}
                      onChange={(e) => setDirectorFirstName(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder="Bijv. Sophie"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>Vast nummer</label>
                    <input
                      name="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder="Bijv. 02 123 45 67"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>Familienaam</label>
                    <input
                      name="director_last_name"
                      type="text"
                      value={directorLastName}
                      onChange={(e) => setDirectorLastName(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder="Bijv. Peeters"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>Mobiel nummer</label>
                    <input
                      name="mobile"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder="Bijv. 0470 12 34 56"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>Faxnummer</label>
                    <input
                      name="fax"
                      type="tel"
                      value={fax}
                      onChange={(e) => setFax(e.target.value)}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                      placeholder="Bijv. 02 123 45 68"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>Taal</label>
                    <div className="relative">
                      <select
                        name="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className={softSelectClass}
                        style={nativeSelectStyle}
                        required
                      >
                        <option value="">Selecteer taal</option>
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
                        Adres
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">
                        Automatisch overgenomen of bijgewerkt via de btw-opzoeking.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-3">
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      {addressPreview || 'Nog geen adres beschikbaar'}
                    </p>

                    {addressLookupMessage && (
                      <p className="mt-2 text-xs text-[var(--text-soft)]">
                        {addressLookupMessage}
                      </p>
                    )}
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
                      Facturatie
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Betaalinstellingen en voorwaarden in hetzelfde verfijnde blok.
                    </p>
                  </div>
                </div>
              </div>

              <div className={sectionBodyClass}>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Facturatie & voorwaarden
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Standaard betaal- en offerte-instellingen voor deze klant.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>Betalingstermijn (dagen)</label>
                    <div className="relative">
                      <select
                        name="payment_term_days"
                        value={paymentTermDays}
                        onChange={(e) => setPaymentTermDays(e.target.value)}
                        className={softSelectClass}
                        style={nativeSelectStyle}
                      >
                        <option value="">Selecteer betalingstermijn</option>
                        <option value="0">Contant / onmiddellijk</option>
                        <option value="7">7 dagen</option>
                        <option value="14">14 dagen</option>
                        <option value="21">21 dagen</option>
                        <option value="30">30 dagen</option>
                        <option value="45">45 dagen</option>
                        <option value="60">60 dagen</option>
                        <option value="90">90 dagen</option>
                      </select>
                      <ChevronDown className={softSelectIconClass} size={16} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>Geldigheid offerte (dagen)</label>
                    <div className="relative">
                      <select
                        name="quote_validity_days"
                        value={quoteValidityDays}
                        onChange={(e) => setQuoteValidityDays(e.target.value)}
                        className={softSelectClass}
                        style={nativeSelectStyle}
                      >
                        <option value="">Selecteer geldigheid</option>
                        <option value="7">7 dagen</option>
                        <option value="14">14 dagen</option>
                        <option value="15">15 dagen</option>
                        <option value="30">30 dagen</option>
                        <option value="45">45 dagen</option>
                        <option value="60">60 dagen</option>
                        <option value="90">90 dagen</option>
                      </select>
                      <ChevronDown className={softSelectIconClass} size={16} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>Betaalwijze</label>
                    <div className="relative">
                      <select
                        name="payment_method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className={softSelectClass}
                        style={nativeSelectStyle}
                      >
                        <option value="">Selecteer betaalwijze</option>
                        <option value="overschrijving">Overschrijving</option>
                        <option value="bancontact">Bancontact</option>
                        <option value="kredietkaart">Kredietkaart</option>
                        <option value="domiciliëring">Domiciliëring</option>
                        <option value="contant">Contant</option>
                        <option value="paypal">PayPal</option>
                      </select>
                      <ChevronDown className={softSelectIconClass} size={16} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>Munteenheid</label>
                    <div className="relative">
                      <select
                        name="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className={softSelectClass}
                        style={nativeSelectStyle}
                      >
                        <option value="EUR">EUR — Euro</option>
                        <option value="USD">USD — US Dollar</option>
                        <option value="GBP">GBP — Britse pond</option>
                        <option value="CHF">CHF — Zwitserse frank</option>
                      </select>
                      <ChevronDown className={softSelectIconClass} size={16} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>BTW-nummer</label>
                    <input
                      type="text"
                      value={vatNumber}
                      readOnly
                      className="input-dark w-full px-3 py-2.5 text-sm opacity-90"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className={fieldLabelClass}>BTW-tarief</label>
                    <div className="relative">
                      <select
                        name="vat_rate"
                        value={vatRate}
                        onChange={(e) => setVatRate(e.target.value)}
                        className={softSelectClass}
                        style={nativeSelectStyle}
                      >
                        <option value="">Selecteer btw-tarief</option>
                        <option value="21%">21%</option>
                        <option value="12%">12%</option>
                        <option value="6%">6%</option>
                        <option value="0%">0%</option>
                        <option value="vrijgesteld">Vrijgesteld</option>
                        <option value="btw verlegd">Btw verlegd</option>
                        <option value="intracommunautair">Intracommunautair</option>
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
                        Bankgegevens
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">
                        Voor facturen en betalingen. Vul hier de IBAN en BIC van de klant in.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className={fieldLabelClass}>IBAN</label>
                      <input
                        name="iban"
                        type="text"
                        value={iban}
                        onChange={(e) => setIban(e.target.value)}
                        className="input-dark w-full px-3 py-2.5 text-sm"
                        placeholder="Bijv. BE68 5390 0754 7034"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className={fieldLabelClass}>BIC</label>
                      <input
                        name="bic"
                        type="text"
                        value={bic}
                        onChange={(e) => setBic(e.target.value)}
                        className="input-dark w-full px-3 py-2.5 text-sm"
                        placeholder="Bijv. GKCCBEBB"
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
                      Commentaar
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Interne notities of extra opmerkingen voor dit klantdossier.
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
                  placeholder="Extra opmerkingen of interne notities"
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
                      Toegang klantportaal
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Kies of je niets wijzigt, een uitnodiging stuurt, of zelf een tijdelijk wachtwoord instelt.
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
                    <span>Geen wijziging aan login of wachtwoord</span>
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
                    <span>Klant kiest zelf een wachtwoord via uitnodigingsmail</span>
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
                    <span>Ik stel nu zelf een tijdelijk wachtwoord in</span>
                  </label>
                </div>

                {passwordMode === 'manual' ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className={fieldLabelClass}>Nieuw tijdelijk wachtwoord</label>
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
                      <label className={fieldLabelClass}>Bevestig wachtwoord</label>
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
                    Na opslaan ontvangt de klant een e-mail om zelf een nieuw wachtwoord te kiezen.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-[var(--text-soft)]">
                    De bestaande login van deze klant blijft ongewijzigd.
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
                Klantfiche
              </span>
              <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                Terug zonder wijzigingen
              </span>
            </span>
          </span>
        </Link>

        <button type="submit" className={actionCardClass}>
          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
          <span className="flex items-start gap-2.5 pr-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                {passwordMode === 'manual'
                  ? 'Opslaan met wachtwoord'
                  : passwordMode === 'invite'
                    ? 'Opslaan & uitnodigen'
                    : 'Wijzigingen opslaan'}
              </span>
              <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                {passwordMode === 'manual'
                  ? 'Update klant en stel meteen een tijdelijk wachtwoord in'
                  : passwordMode === 'invite'
                    ? 'Sla op en verstuur een uitnodigingsmail'
                    : 'Bewaar de aangepaste klantfiche'}
              </span>
            </span>
          </span>
        </button>
      </div>
    </form>
  )
}