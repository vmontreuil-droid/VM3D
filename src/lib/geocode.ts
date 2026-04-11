type GeocodeResult = {
  latitude: number | null
  longitude: number | null
}

async function tryGeocode(query: string): Promise<GeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
    query
  )}`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'montreuil-platform/1.0',
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    return { latitude: null, longitude: null }
  }

  const results = await response.json()

  if (!Array.isArray(results) || results.length === 0) {
    return { latitude: null, longitude: null }
  }

  const first = results[0]
  const latitude = first?.lat ? Number(first.lat) : null
  const longitude = first?.lon ? Number(first.lon) : null

  if (
    latitude === null ||
    longitude === null ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    return { latitude: null, longitude: null }
  }

  return { latitude, longitude }
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const query = address.trim()

  if (!query) {
    return { latitude: null, longitude: null }
  }

  try {
    let result = await tryGeocode(query)

    if (result.latitude !== null && result.longitude !== null) {
      return result
    }

    result = await tryGeocode(`${query}, Belgium`)

    if (result.latitude !== null && result.longitude !== null) {
      return result
    }

    return { latitude: null, longitude: null }
  } catch (error) {
    console.error('geocodeAddress fout:', error)
    return { latitude: null, longitude: null }
  }
}