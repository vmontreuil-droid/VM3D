import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const address = String(body.address || '').trim()

    if (!address) {
      return NextResponse.json(
        { error: 'Adres ontbreekt.' },
        { status: 400 }
      )
    }

    const params = new URLSearchParams({
      q: address,
      format: 'jsonv2',
      limit: '1',
    })

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'montreuil-project-platform/1.0',
          'Accept-Language': 'nl',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Geocoding mislukt.' },
        { status: 500 }
      )
    }

    const results = await response.json()

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: 'Geen coördinaten gevonden.' },
        { status: 404 }
      )
    }

    const first = results[0]

    return NextResponse.json({
      latitude: Number(first.lat),
      longitude: Number(first.lon),
      display_name: first.display_name,
    })
  } catch (error) {
    console.error('Geocode error:', error)

    return NextResponse.json(
      { error: 'Interne fout bij geocoding.' },
      { status: 500 }
    )
  }
}