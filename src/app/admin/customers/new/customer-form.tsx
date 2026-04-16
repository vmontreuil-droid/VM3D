'use client'

import { type FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPinned,
  MessageSquare,
  Search,
  ShieldCheck,
} from 'lucide-react'
import CustomerMap from '@/components/customers/customer-map'
import CustomerLogoUpload from '@/components/customers/customer-logo-upload'

type CustomerFormData = {
  vatNumber?: string;
  companyName?: string;
  fullName?: string;
  email?: string;
  enterpriseNumber?: string;
  reference?: string;
  salutation?: string;
  directorFirstName?: string;
  directorLastName?: string;
  rpr?: string;
  invoiceEmail?: string;
  website?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  language?: string;
  iban?: string;
  bic?: string;
  paymentTermDays?: string;
  currency?: string;
  vatRate?: string;
  invoiceSendMethod?: string;
  sendXml?: boolean;
  xmlFormat?: string;
  sendPdf?: boolean;
  autoReminders?: boolean;
  street?: string;
  houseNumber?: string;
  bus?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  comments?: string;
  latitude?: number | null;
  longitude?: number | null;
  mapLabel?: string;
  quoteValidityDays?: string;
  paymentMethod?: string;
};

type LookupResult = {
  valid: boolean;
  countryCode?: string;
  vatNumber?: string;
  companyName?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  mapLabel?: string;
};

const INVITE_COOLDOWN_MS = 60_000;
const inviteCooldownStorageKey = 'customer-form:invite-cooldown-until';

type CustomerFormProps = {
  initialData?: Partial<CustomerFormData>;
  action?: (formData: FormData) => void;
  showCommentsAndPortal?: boolean;
  showSubmitAndBackButton?: boolean;
};

export default function CustomerForm({
  initialData = {},
  action,
  showCommentsAndPortal = true,
  showSubmitAndBackButton = true,
}: CustomerFormProps) {

  // --- STATE ---
  const [vatNumber, setVatNumber] = useState(initialData.vatNumber || "");
  const [companyName, setCompanyName] = useState(initialData.companyName || "");
  const [fullName, setFullName] = useState(initialData.fullName || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [salutation, setSalutation] = useState(initialData.salutation || "");
  const [directorFirstName, setDirectorFirstName] = useState(initialData.directorFirstName || "");
  const [directorLastName, setDirectorLastName] = useState(initialData.directorLastName || "");
  const [invoiceEmail, setInvoiceEmail] = useState(initialData.invoiceEmail || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [mobile, setMobile] = useState(initialData.mobile || "");
  const [fax, setFax] = useState(initialData.fax || "");
  const [language, setLanguage] = useState(initialData.language || "");
  const [iban, setIban] = useState(initialData.iban || "");
  const [bic, setBic] = useState(initialData.bic || "");
  const [paymentTermDays, setPaymentTermDays] = useState(initialData.paymentTermDays || "");
  const [currency, setCurrency] = useState(initialData.currency || 'EUR');
  const [vatRate, setVatRate] = useState(initialData.vatRate || '');
  const [invoiceSendMethod, setInvoiceSendMethod] = useState(initialData.invoiceSendMethod || '');
  const [sendXml, setSendXml] = useState(initialData.sendXml || false);
  const [xmlFormat, setXmlFormat] = useState(initialData.xmlFormat || '');
  const [sendPdf, setSendPdf] = useState(initialData.sendPdf || false);
  const [autoReminders, setAutoReminders] = useState(initialData.autoReminders || false);
  const [street, setStreet] = useState(initialData.street || '');
  const [houseNumber, setHouseNumber] = useState(initialData.houseNumber || '');
  const [bus, setBus] = useState(initialData.bus || '');
  const [postalCode, setPostalCode] = useState(initialData.postalCode || '');
  const [city, setCity] = useState(initialData.city || '');
  const [country, setCountry] = useState(initialData.country || '');
  const [comments, setComments] = useState(initialData.comments || '');
  const [latitude, setLatitude] = useState(initialData.latitude ?? null);
  const [longitude, setLongitude] = useState(initialData.longitude ?? null);
  const [mapLabel, setMapLabel] = useState(initialData.mapLabel || '');
  const [lookupMessage, setLookupMessage] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [addressLookupMessage, setAddressLookupMessage] = useState('');
  const [addressLookupLoading, setAddressLookupLoading] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'invite' | 'manual'>('invite');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inviteCooldownUntil, setInviteCooldownUntil] = useState(0);
  const [nowTs, setNowTs] = useState(Date.now());
  const [quoteValidityDays, setQuoteValidityDays] = useState(initialData.quoteValidityDays || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData.paymentMethod || '');

  useEffect(() => {
    if (!(passwordMode === 'invite' && inviteCooldownUntil > Date.now())) return

    const intervalId = window.setInterval(() => {
      setNowTs(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [passwordMode, inviteCooldownUntil])

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

      setLookupMessage('Gegevens succesvol opgehaald via btw-nummer.')
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
    'group relative inline-flex w-full overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto'
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
      <input type="hidden" name="latitude" value={latitude ?? ''} />
      <input type="hidden" name="longitude" value={longitude ?? ''} />
      <input
        type="hidden"
        name="send_invite"
        value={passwordMode === 'invite' ? 'yes' : 'no'}
      />
      <input type="hidden" name="password_mode" value={passwordMode} />
      <input type="hidden" name="full_name" value={resolvedFullName} />
      <input type="hidden" name="send_xml" value={sendXml ? 'yes' : 'no'} />
      <input type="hidden" name="send_pdf" value={sendPdf ? 'yes' : 'no'} />
      <input
        type="hidden"
        name="auto_reminders"
        value={autoReminders ? 'yes' : 'no'}
      />
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
                      Start met het btw-nummer om bedrijfs- en adresgegevens sneller
                      in te vullen.
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
                          Gevonden gegevens worden ook automatisch hieronder in het formulier ingevuld.
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
                      Kaartpositie vanuit de btw-opzoeking.
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

          {showCommentsAndPortal && (
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
                        Alle basis-, contact- en verzendgegevens samen in één overzichtelijk blok.
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
                      <label className={fieldLabelClass}>
                        Bedrijf
                      </label>
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
                      <label className={fieldLabelClass}>
                        E-mail
                      </label>
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
                      <label className={fieldLabelClass}>
                        Aanspreektitel
                      </label>
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
                      <label className={fieldLabelClass}>
                        Facturatie e-mail
                      </label>
                      <input
                        type="email"
                        value={invoiceEmail}
                        onChange={(e) => setInvoiceEmail(e.target.value)}
                        className="input-dark w-full px-3 py-2.5 text-sm"
                        placeholder={email ? `Zelfde als ${email}` : 'bijv. administratie@ateliernova.be'}
                      />
                      <input type="hidden" name="invoice_email" value={resolvedInvoiceEmail} />
                    </div>

                    <div className="grid gap-2">
                      <label className={fieldLabelClass}>
                        Voornaam
                      </label>
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
                      <label className={fieldLabelClass}>
                        Vast nummer
                      </label>
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
                      <label className={fieldLabelClass}>
                        Familienaam
                      </label>
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
                      <label className={fieldLabelClass}>
                        Mobiel nummer
                      </label>
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
                      <label className={fieldLabelClass}>
                        Faxnummer
                      </label>
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
                      <label className={fieldLabelClass}>
                        Taal
                      </label>
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
                          Automatisch overgenomen vanuit de btw-opzoeking.
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
                        <CreditCard className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold text-[var(--text-main)]">
                          Facturatie
                        </h2>
                        <p className="mt-1 text-xs text-[var(--text-soft)]">
                          Betaalinstellingen en voorwaarden in één praktisch blok.
                        </p>
                      </div>
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
                      <label className={fieldLabelClass}>
                        Betalingstermijn (dagen)
                      </label>
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
                      <label className={fieldLabelClass}>
                        Geldigheid offerte (dagen)
                      </label>
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
                      <label className={fieldLabelClass}>
                        Betaalwijze
                      </label>
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
                      <label className={fieldLabelClass}>
                        Munteenheid
                      </label>
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
                      <label className={fieldLabelClass}>
                        BTW-nummer
                      </label>
                      <input
                        type="text"
                        value={vatNumber}
                        readOnly
                        className="input-dark w-full px-3 py-2.5 text-sm opacity-90"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className={fieldLabelClass}>
                        BTW-tarief
                      </label>
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
                        <label className={fieldLabelClass}>
                          IBAN
                        </label>
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
                        <label className={fieldLabelClass}>
                          BIC
                        </label>
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

                  <CustomerLogoUpload />
                </div>
              </section>
            </div>
          )}

          {/* ───── Wachtwoord / Uitnodiging ───── */}
          <section className={sectionClass}>
            <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
                  <KeyRound className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-main)]">
                    Toegang &amp; wachtwoord
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Kies hoe de klant toegang krijgt tot het platform.
                  </p>
                </div>
              </div>
            </div>

            <div className={sectionBodyClass}>
              {/* Mode toggle */}
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPasswordMode('invite')}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                    passwordMode === 'invite'
                      ? 'border-[var(--accent)]/50 bg-[var(--accent)]/[0.06]'
                      : 'border-[var(--border-soft)] bg-[var(--bg-card)] hover:border-[var(--accent)]/30'
                  }`}
                >
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    passwordMode === 'invite' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--bg-card-2)] text-[var(--text-muted)]'
                  }`}>
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[13px] font-semibold leading-5 ${
                      passwordMode === 'invite' ? 'text-[var(--accent)]' : 'text-[var(--text-main)]'
                    }`}>
                      Uitnodiging per e-mail
                    </span>
                    <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                      Klant ontvangt een e-mail om zelf een wachtwoord in te stellen
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPasswordMode('manual')}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                    passwordMode === 'manual'
                      ? 'border-[var(--accent)]/50 bg-[var(--accent)]/[0.06]'
                      : 'border-[var(--border-soft)] bg-[var(--bg-card)] hover:border-[var(--accent)]/30'
                  }`}
                >
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    passwordMode === 'manual' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--bg-card-2)] text-[var(--text-muted)]'
                  }`}>
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[13px] font-semibold leading-5 ${
                      passwordMode === 'manual' ? 'text-[var(--accent)]' : 'text-[var(--text-main)]'
                    }`}>
                      Wachtwoord instellen
                    </span>
                    <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                      Stel zelf een tijdelijk wachtwoord in voor de klant
                    </span>
                  </span>
                </button>
              </div>

              {/* Invite info */}
              {passwordMode === 'invite' && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3">
                  <p className="text-[12px] leading-5 text-blue-300">
                    <strong>Hoe werkt het?</strong> De klant ontvangt een e-mail met een link om een eigen wachtwoord te kiezen. Het account is direct actief zodra het wachtwoord is ingesteld.
                  </p>
                </div>
              )}

              {/* Manual password fields */}
              {passwordMode === 'manual' && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
                    <p className="text-[12px] leading-5 text-amber-300">
                      <strong>Let op:</strong> Deel het wachtwoord veilig met de klant. Er wordt geen automatische e-mail verstuurd.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <label htmlFor="password" className="text-[11px] font-medium text-[var(--text-soft)]">
                        Wachtwoord *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          required
                          minLength={8}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 8 tekens"
                          className="input-dark h-9 w-full px-3 py-1.5 pr-9 text-[12px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-soft)] transition"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <label htmlFor="password_confirm" className="text-[11px] font-medium text-[var(--text-soft)]">
                        Bevestig wachtwoord *
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password_confirm"
                        name="password_confirm"
                        required
                        minLength={8}
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="Herhaal wachtwoord"
                        className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
                      />
                    </div>
                  </div>
                  {password && passwordConfirm && password !== passwordConfirm && (
                    <p className="text-[11px] text-red-400">Wachtwoorden komen niet overeen.</p>
                  )}
                  {password && password.length > 0 && password.length < 8 && (
                    <p className="text-[11px] text-amber-400">Wachtwoord moet minimaal 8 tekens bevatten.</p>
                  )}
                </div>
              )}
            </div>
          </section>

          </div>
        </div>

        {showSubmitAndBackButton && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Link
              href="/admin/customers"
              className="group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
            >
              <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
              <span className="flex items-start gap-2.5 pr-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                    Klanten
                  </span>
                  <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                    Terug naar overzicht
                  </span>
                </span>
              </span>
            </Link>

            <button
              type="submit"
              className="group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80 disabled:cursor-not-allowed disabled:opacity-60"
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
                      ? `Wacht ${inviteCooldownRemainingSec}s`
                      : passwordMode === 'manual'
                        ? 'Klant aanmaken'
                        : 'Klantaccount aanmaken'}
                  </span>
                  <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                    {passwordMode === 'manual'
                      ? 'Account opslaan met tijdelijk wachtwoord'
                      : 'Verstuur uitnodiging voor toegang'}
                  </span>
                </span>
              </span>
            </button>
          </div>
        )}

        {inviteCooldownActive && (
          <p className="text-xs text-[var(--text-soft)]">
            Uitnodigingsmail cooldown actief. Je kan opnieuw uitnodigen over{' '}
            {inviteCooldownRemainingSec}s.
          </p>
        )}
    </form>
  );
}
