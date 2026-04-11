'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CustomerMap from '@/components/customers/customer-map'

type Props = {
  action: (formData: FormData) => void
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

export default function CustomerForm({ action }: Props) {
  const [vatNumber, setVatNumber] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [enterpriseNumber, setEnterpriseNumber] = useState('')
  const [reference, setReference] = useState('')
  const [salutation, setSalutation] = useState('')
  const [directorFirstName, setDirectorFirstName] = useState('')
  const [directorLastName, setDirectorLastName] = useState('')
  const [rpr, setRpr] = useState('')
  const [invoiceEmail, setInvoiceEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [phone, setPhone] = useState('')
  const [mobile, setMobile] = useState('')
  const [fax, setFax] = useState('')
  const [language, setLanguage] = useState('')
  const [paymentTermDays, setPaymentTermDays] = useState('')
  const [quoteValidityDays, setQuoteValidityDays] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [vatRate, setVatRate] = useState('')
  const [invoiceSendMethod, setInvoiceSendMethod] = useState('')
  const [sendXml, setSendXml] = useState(false)
  const [xmlFormat, setXmlFormat] = useState('')
  const [sendPdf, setSendPdf] = useState(false)
  const [autoReminders, setAutoReminders] = useState(false)

  const [street, setStreet] = useState('')
  const [houseNumber, setHouseNumber] = useState('')
  const [bus, setBus] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [comments, setComments] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [mapLabel, setMapLabel] = useState('')
  const [lookupMessage, setLookupMessage] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [addressLookupMessage, setAddressLookupMessage] = useState('')
  const [addressLookupLoading, setAddressLookupLoading] = useState(false)
  const [passwordMode, setPasswordMode] = useState<'invite' | 'manual'>('invite')
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

  return (
    <form action={action} className="grid gap-3 lg:max-w-4xl">
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
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-3 text-sm text-blue-200">
          {lookupMessage}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-\[var\(--border-soft\)\] bg-\[var\(--bg-card\)] p-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">
            Bedrijfsgegevens
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
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

        <div className="space-y-3 rounded-xl border border-\[var\(--border-soft\)\] bg-\[var\(--bg-card\)] p-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">
            Contact & verzending
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
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
                required
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
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-\[var\(--border-soft\)\] bg-\[var\(--bg-card\)] p-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">
            Facturatie & voorwaarden
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
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
        </div>

        <div className="space-y-3 rounded-xl border border-\[var\(--border-soft\)\] bg-\[var\(--bg-card\)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">
              Adres
            </h2>

            <button
              type="button"
              onClick={() => void handleAddressLookup()}
              disabled={addressLookupLoading}
              className="btn-secondary px-3 py-2 text-xs"
            >
              {addressLookupLoading ? 'Zoeken...' : 'Zoek adres op kaart'}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1.3fr_0.7fr_0.6fr]">
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

          <div className="grid gap-4 sm:grid-cols-[0.7fr_1fr_1fr]">
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
            <p className="text-xs text-[var(--text-soft)]">{addressLookupMessage}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3 rounded-xl border border-\[var\(--border-soft\)\] bg-\[var\(--bg-card\)] p-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">
            Commentaar
          </h2>

          <textarea
            name="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="input-dark min-h-[150px] w-full px-3 py-2.5 text-sm"
          />

          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
            <p className="text-sm font-semibold text-[var(--text-main)]">
              Toegang klantportaal
            </p>
            <p className="mt-1 text-xs text-[var(--text-soft)]">
              Kies of jij meteen een wachtwoord instelt, of de klant dit zelf kiest via e-mail.
            </p>

            <div className="mt-3 space-y-2 text-sm text-[var(--text-soft)]">
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="password_mode"
                  value="invite"
                  checked={passwordMode === 'invite'}
                  onChange={() => setPasswordMode('invite')}
                />
                <span>Klant kiest zelf een wachtwoord via uitnodigingsmail</span>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="password_mode"
                  value="manual"
                  checked={passwordMode === 'manual'}
                  onChange={() => setPasswordMode('manual')}
                />
                <span>Ik stel nu zelf een tijdelijk wachtwoord in</span>
              </label>
            </div>

            {passwordMode === 'manual' ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Tijdelijk wachtwoord
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
            ) : (
              <p className="mt-3 text-xs text-[var(--text-soft)]">
                Na opslaan ontvangt de klant een e-mail om zelf een wachtwoord te kiezen.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-\[var\(--border-soft\)\] bg-\[var\(--bg-card\)] p-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">
            Kaart
          </h2>

          <CustomerMap
            latitude={latitude}
            longitude={longitude}
            label={mapLabel}
          />
        </div>
      </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          type="submit"
          className="btn-primary px-4 py-2 text-sm"
        >
          {passwordMode === 'manual'
            ? 'Klant aanmaken met wachtwoord'
            : 'Klantaccount aanmaken'}
        </button>

        <Link href="/admin/customers" className="btn-secondary">
          Annuleren
        </Link>
      </div>
    </form>
  )
}
