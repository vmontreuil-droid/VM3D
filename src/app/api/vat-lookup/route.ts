import { NextResponse } from 'next/server'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function normalizeVat(vat: string) {
  const cleaned = vat.toUpperCase().replace(/[^A-Z0-9]/g, '')

  if (cleaned.length < 3) return null

  const countryCode = cleaned.slice(0, 2)
  const vatNumber = cleaned.slice(2)

  if (!/^[A-Z]{2}$/.test(countryCode)) return null
  if (!/^[A-Z0-9]+$/.test(vatNumber)) return null

  return { countryCode, vatNumber }
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function extractTag(xml: string, tag: string) {
  const regex = new RegExp(`<[^:>]*:?${tag}>([\\s\\S]*?)</[^:>]*:?${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? decodeXmlEntities(match[1].trim()) : ''
}

function cleanText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function splitAddress(address: string) {
  const raw = address.replace(/\r/g, '').trim()

  if (!raw || raw === '---') {
    return {
      street: '',
      postalCode: '',
      city: '',
      fullAddress: '',
    }
  }

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const fullAddress = lines.join(', ')
  const street = lines[0] || ''
  const secondLine = lines[1] || ''

  let postalCode = ''
  let city = ''

  if (secondLine) {
    const patterns = [
      /^([A-Z]{1,3}-?\d{3,10})\s+(.+)$/i,
      /^(\d{3,10})\s+(.+)$/i,
      /^([A-Z0-9\-]{3,10})\s+(.+)$/i,
      /^(.+?)\s+(\d{3,10})$/i,
    ]

    for (const pattern of patterns) {
      const match = secondLine.match(pattern)

      if (match) {
        if (pattern === patterns[3]) {
          city = match[1].trim()
          postalCode = match[2].trim()
        } else {
          postalCode = match[1].trim()
          city = match[2].trim()
        }
        break
      }
    }

    if (!postalCode && !city) {
      city = secondLine
    }
  }

  return {
    street,
    postalCode,
    city,
    fullAddress,
  }
}

async function geocodeAddress(address: string) {
  if (!address) return null

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', address)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'MV3D-Cloud/1.0',
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) return null

  const results = (await response.json()) as Array<{
    lat: string
    lon: string
    display_name: string
  }>

  if (!Array.isArray(results) || results.length === 0) {
    return null
  }

  return {
    latitude: Number(results[0].lat),
    longitude: Number(results[0].lon),
    displayName: results[0].display_name,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const vatInput = String(body?.vatNumber || '').trim()

    const normalized = normalizeVat(vatInput)

    if (!normalized) {
      return NextResponse.json(
        { error: 'Ongeldig btw-nummerformaat.' },
        { status: 400 }
      )
    }

    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:checkVat>
      <urn:countryCode>${escapeXml(normalized.countryCode)}</urn:countryCode>
      <urn:vatNumber>${escapeXml(normalized.vatNumber)}</urn:vatNumber>
    </urn:checkVat>
  </soapenv:Body>
</soapenv:Envelope>`

    const viesResponse = await fetch(
      'https://ec.europa.eu/taxation_customs/vies/services/checkVatService',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: '',
        },
        body: envelope,
        cache: 'no-store',
      }
    )

    const xml = await viesResponse.text()

    if (
      !viesResponse.ok ||
      xml.includes('SOAP-ENV:Fault') ||
      xml.includes('soap:Fault')
    ) {
      return NextResponse.json(
        { error: 'VIES kon dit btw-nummer momenteel niet verwerken.' },
        { status: 502 }
      )
    }

    const countryCode = cleanText(extractTag(xml, 'countryCode'))
    const vatNumber = cleanText(extractTag(xml, 'vatNumber'))
    const valid = cleanText(extractTag(xml, 'valid')).toLowerCase() === 'true'
    const companyName = cleanText(extractTag(xml, 'name'))
    const addressRaw = extractTag(xml, 'address')
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n')

    const split = splitAddress(addressRaw)
    const geocoded = await geocodeAddress(split.fullAddress || addressRaw)

    return NextResponse.json({
      valid,
      countryCode,
      vatNumber,
      companyName: companyName && companyName !== '---' ? companyName : '',
      addressRaw: addressRaw && addressRaw !== '---' ? addressRaw : '',
      street: split.street,
      postalCode: split.postalCode,
      city: split.city,
      country: countryCode || '',
      latitude: geocoded?.latitude ?? null,
      longitude: geocoded?.longitude ?? null,
      mapLabel: geocoded?.displayName ?? split.fullAddress ?? '',
    })
  } catch (error) {
    console.error('VAT lookup error:', error)

    return NextResponse.json(
      {
        error: 'Onverwachte fout bij btw-opzoeking.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
