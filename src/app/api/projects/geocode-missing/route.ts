import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Niet ingelogd.' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Geen toegang.' },
        { status: 403 }
      )
    }

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, address, latitude, longitude')
      .or('latitude.is.null,longitude.is.null')
      .not('address', 'is', null)

    if (projectsError) {
      return NextResponse.json(
        { error: projectsError.message },
        { status: 500 }
      )
    }

    const results: {
      updated: number
      skipped: number
      failed: number
      details: string[]
    } = {
      updated: 0,
      skipped: 0,
      failed: 0,
      details: [],
    }

    for (const project of projects ?? []) {
      const address = String(project.address || '').trim()

      if (!address) {
        results.skipped++
        results.details.push(`Project ${project.id}: geen adres`)
        continue
      }

      try {
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
          results.failed++
          results.details.push(`Project ${project.id}: geocoding mislukt`)
          continue
        }

        const geoResults = await response.json()

        if (!Array.isArray(geoResults) || geoResults.length === 0) {
          results.failed++
          results.details.push(`Project ${project.id}: geen resultaat`)
          continue
        }

        const first = geoResults[0]
        const latitude = Number(first.lat)
        const longitude = Number(first.lon)

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
          results.failed++
          results.details.push(`Project ${project.id}: ongeldige coördinaten`)
          continue
        }

        const { error: updateError } = await supabase
          .from('projects')
          .update({
            latitude,
            longitude,
          })
          .eq('id', project.id)

        if (updateError) {
          results.failed++
          results.details.push(`Project ${project.id}: update mislukt`)
          continue
        }

        results.updated++
        results.details.push(`Project ${project.id}: opgeslagen`)
      } catch (error) {
        console.error(error)
        results.failed++
        results.details.push(`Project ${project.id}: onverwachte fout`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Bulk geocode error:', error)

    return NextResponse.json(
      { error: 'Interne fout bij bulk geocoding.' },
      { status: 500 }
    )
  }
}