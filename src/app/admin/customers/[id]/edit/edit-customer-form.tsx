'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CustomerMap from '@/components/customers/customer-map'

type Props = {
  action: (formData: FormData) => void
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

export default function CustomerEditForm({ action, customer }: Props) {
  const [vatNumber, setVatNumber] = useState(customer.vat_number || '')
  const [companyName, setCompanyName] = useState(customer.company_name || '')
  const [fullName, setFullName] = useState(customer.full_name || '')
  const [email, setEmail] = useState(customer.email || '')
  const [enterpriseNumber, setEnterpriseNumber] = useState(
    customer.enterprise_number || ''
  )
  const [reference, setReference] = useState(customer.reference || '')
  const [salutation, setSalutation] = useState(customer.salutation || '')
  const [directorFirstName, setDirectorFirstName] = useState(
    customer.director_first_name || ''
  )
  const [directorLastName, setDirectorLastName] = useState(
    customer.director_last_name || ''
  )
  const [rpr, setRpr] = useState(customer.rpr || '')
  const [invoiceEmail, setInvoiceEmail] = useState(customer.invoice_email || '')
  const [website, setWebsite] = useState(customer.website || '')
  const [phone, setPhone] = useState(customer.phone || '')
  const [mobile, setMobile] = useState(customer.mobile || '')
  const [fax, setFax] = useState(customer.fax || '')
  const [language, setLanguage] = useState(customer.language || '')
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

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={customer.id} />
      <input type="hidden" name="latitude" value={latitude ?? ''} />
      <input type="hidden" name="longitude" value={longitude ?? ''} />
      <input type="hidden" name="send_xml" value={sendXml ? 'yes' : 'no'} />
      <input type="hidden" name="send_pdf" value={sendPdf ? 'yes' : 'no'} />
      <input
        type="hidden"
        name="auto_reminders"
        value={autoReminders ? 'yes' : 'no'}
      />

      <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
        <div className="border-b border-[var(--border-soft)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">
            Bedrijf
          </h2>
          <p className="mt-1 text-xs text-[var(--text-soft)]">
            Basisgegevens en btw-opzoeking.
          </p>
        </div>

        <div className="px-4 py-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-[var(--text-main)]">
                BTW-nummer
              </label>
              <input
                name="vat_number"
                type="text"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="Bijv. BE0123456789 of DE123456789"
                className="input-dark w-full px-3 py-2.5 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleVatLookup}
              disabled={lookupLoading}
              className="btn-primary h-10 px-4 text-sm"
            >
              {lookupLoading ? 'Zoeken...' : 'Zoek via btw'}
            </button>
          </div>

          {lookupMessage && (
            <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-3 text-sm text-blue-200">
              {lookupMessage}
            </div>
          )}

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <label className="text-sm font-medium text-[var(--text-main)]">
                Bedrijf
              </label>
              <input
                name="company_name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input-dark w-full px-3 py-2.5 text-sm"
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <label className="text-sm font-medium text-[var(--text-main)]">
                Contactpersoon
              </label>
              <input
                name="full_name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-dark w-full px-3 py-2.5 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-[var(--text-main)]">
                Ondernemingsnummer
              </label>
              <input
                name="enterprise_number"
                type="text"
                value={enterpriseNumber}
                onChange={(e) => setEnterpriseNumber(e.target.value)}
                className="input-dark w-full px-3 py-2.5 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-[var(--text-main)]">
                Referentie
              </label>
              <input
                name="reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="input-dark w-full px-3 py-2.5 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-[var(--text-main)]">
                Aanspreking
              </label>
              <input
                name="salutation"
                type="text"
                value={salutation}
                onChange={(e) => setSalutation(e.target.value)}
                className="input-dark w-full px-3 py-2.5 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-[var(--text-main)]">
                RPR
              </label>
              <input
                name="rpr"
                type="text"
                value={rpr}
                onChange={(e) => setRpr(e.target.value)}
                className="input-dark w-full px-3 py-2.5 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-[var(--text-main)]">
                Voornaam bestuurder
              </label>
              <input
                name="director_first_name"
                type="text"
                value={directorFirstName}
                onChange={(e) => setDirectorFirstName(e.target.value)}
                className="input-dark w-full px-3 py-2.5 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-[var(--text-main)]">
                Achternaam bestuurder
              </label>
              <input
                name="director_last_name"
                type="text"
                value={directorLastName}
                onChange={(e) => setDirectorLastName(e.target.value)}
                className="input-dark w-full px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
        <div className="border-b border-[var(--border-soft)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">
            Contact & verzending
          </h2>
          <p className="mt-1 text-xs text-[var(--text-soft)]">
            Bereikbaarheid, e-mail en verzendinstellingen.
          </p>
        </div>

        <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              Facturatie e-mail
            </label>
            <input
              name="invoice_email"
              type="text"
              value={invoiceEmail}
              onChange={(e) => setInvoiceEmail(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              Website
            </label>
            <input
              name="website"
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              Telefoon
            </label>
            <input
              name="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              Mobiel
            </label>
            <input
              name="mobile"
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              Fax
            </label>
            <input
              name="fax"
              type="text"
              value={fax}
              onChange={(e) => setFax(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              Taal
            </label>
            <input
              name="language"
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              Verstuurmethode
            </label>
            <input
              name="invoice_send_method"
              type="text"
              value={invoiceSendMethod}
              onChange={(e) => setInvoiceSendMethod(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              XML-formaat
            </label>
            <input
              name="xml_format"
              type="text"
              value={xmlFormat}
              onChange={(e) => setXmlFormat(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--text-soft)]">
            <input
              type="checkbox"
              checked={sendXml}
              onChange={(e) => setSendXml(e.target.checked)}
            />
            Verstuur XML
          </label>

          <label className="flex items-center gap-2 text-sm text-[var(--text-soft)]">
            <input
              type="checkbox"
              checked={sendPdf}
              onChange={(e) => setSendPdf(e.target.checked)}
            />
            Verstuur PDF
          </label>

          <label className="flex items-center gap-2 text-sm text-[var(--text-soft)] sm:col-span-2">
            <input
              type="checkbox"
              checked={autoReminders}
              onChange={(e) => setAutoReminders(e.target.checked)}
            />
            Automatische herinneringen
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
        <div className="border-b border-[var(--border-soft)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">
            Facturatie
          </h2>
          <p className="mt-1 text-xs text-[var(--text-soft)]">
            Standaardvoorwaarden en betaalinstellingen.
          </p>
        </div>

        <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              Betalingstermijn (dagen)
            </label>
            <input
              name="payment_term_days"
              type="number"
              value={paymentTermDays}
              onChange={(e) => setPaymentTermDays(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              Geldigheid offerte (dagen)
            </label>
            <input
              name="quote_validity_days"
              type="number"
              value={quoteValidityDays}
              onChange={(e) => setQuoteValidityDays(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              Betaalwijze
            </label>
            <input
              name="payment_method"
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              Munteenheid
            </label>
            <input
              name="currency"
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm font-medium text-[var(--text-main)]">
              BTW-tarief
            </label>
            <input
              name="vat_rate"
              type="text"
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              className="input-dark w-full px-3 py-2.5 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1fr_0.85fr]">
        <div className="space-y-3">
          <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-main)]">
                    Adres
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Volledig adres met kaartpositie.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleAddressLookup()}
                  disabled={addressLookupLoading}
                  className="btn-secondary px-3 py-2 text-xs"
                >
                  {addressLookupLoading ? 'Zoeken...' : 'Zoek adres op kaart'}
                </button>
              </div>
            </div>

            <div className="px-4 py-3">
              <div className="grid gap-3 sm:grid-cols-[1.3fr_0.7fr_0.6fr]">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Straat
                  </label>
                  <input
                    name="street"
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Nr
                  </label>
                  <input
                    name="house_number"
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Bus
                  </label>
                  <input
                    name="bus"
                    type="text"
                    value={bus}
                    onChange={(e) => setBus(e.target.value)}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[0.7fr_1fr_1fr]">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Postcode
                  </label>
                  <input
                    name="postal_code"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Gemeente
                  </label>
                  <input
                    name="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Land
                  </label>
                  <input
                    name="country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              {addressLookupMessage && (
                <p className="mt-3 text-xs text-[var(--text-soft)]">{addressLookupMessage}</p>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <h2 className="text-sm font-semibold text-[var(--text-main)]">
                Commentaar
              </h2>
              <p className="mt-1 text-xs text-[var(--text-soft)]">
                Interne notities en opmerkingen.
              </p>
            </div>

            <div className="space-y-3 px-4 py-3">
              <textarea
                name="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="input-dark min-h-[160px] w-full px-3 py-2.5 text-sm"
              />

              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                <p className="text-sm font-semibold text-[var(--text-main)]">
                  Toegang klantportaal
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Kies of je niets wijzigt, een uitnodigingsmail stuurt, of zelf een nieuw wachtwoord instelt.
                </p>

                <div className="mt-3 space-y-2 text-sm text-[var(--text-soft)]">
                  <label className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="password_mode"
                      value="keep"
                      checked={passwordMode === 'keep'}
                      onChange={() => setPasswordMode('keep')}
                    />
                    <span>Geen wijziging aan login</span>
                  </label>

                  <label className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="password_mode"
                      value="invite"
                      checked={passwordMode === 'invite'}
                      onChange={() => setPasswordMode('invite')}
                    />
                    <span>Klant kiest zelf een nieuw wachtwoord via e-mail</span>
                  </label>

                  <label className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="password_mode"
                      value="manual"
                      checked={passwordMode === 'manual'}
                      onChange={() => setPasswordMode('manual')}
                    />
                    <span>Ik stel nu zelf een nieuw wachtwoord in</span>
                  </label>
                </div>

                {passwordMode === 'manual' ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[var(--text-main)]">
                        Nieuw wachtwoord
                      </label>
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
                      <label className="text-sm font-medium text-[var(--text-main)]">
                        Bevestig wachtwoord
                      </label>
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
                    Na opslaan ontvangt de klant een mail om zelf een nieuw wachtwoord te kiezen.
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
          <div className="border-b border-[var(--border-soft)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">
              Kaart
            </h2>
            <p className="mt-1 text-xs text-[var(--text-soft)]">
              Live kaartweergave van het huidige adres.
            </p>
          </div>

          <div className="px-4 py-3">
            <CustomerMap
              latitude={latitude}
              longitude={longitude}
              label={mapLabel}
            />
          </div>
        </section>
      </section>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          type="submit"
          className="btn-primary px-4 py-2 text-sm"
        >
          Wijzigingen opslaan
        </button>

        <Link href={`/admin/customers/${customer.id}`} className="btn-secondary">
          Annuleren
        </Link>
      </div>
    </form>
  )
}