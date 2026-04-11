'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, MapPin, TrendingUp, Calendar, Zap, Clock } from 'lucide-react'
import ProjectsMap from '@/components/projects/projects-map'
import AppShell from '@/components/app-shell'

type ProjectLocation = {
  name: string
  latitude: number
  longitude: number
}

type ProjectStats = {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  averagePrice: number
  projectsByStatus: { status: string; count: number; color: string }[]
  recentProjects: { name: string; location: string; status: string; price: number; created: string }[]
  averageDuration: number
  projectLocations: ProjectLocation[]
}

const statusColorMap: Record<string, string> = {
  'Ingediend': 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  'In behandeling': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  'Klaar voor betaling': 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  'Afgerond': 'bg-green-500/20 text-green-500 border-green-500/30',
}

export default function ProjectStatisticsPage() {
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*', { count: 'exact' })

        const projects = projectsData || []
        const completed = projects.filter((p: any) => p.status === 'Afgerond').length
        const active = projects.filter((p: any) => 
          p.status !== 'Afgerond' && p.status !== null
        ).length

        const projectsByStatus = [
          {
            status: 'Ingediend',
            count: projects.filter((p: any) => p.status === 'Ingediend').length,
            color: 'bg-blue-500',
          },
          {
            status: 'In behandeling',
            count: projects.filter((p: any) => p.status === 'In behandeling').length,
            color: 'bg-yellow-500',
          },
          {
            status: 'Klaar voor betaling',
            count: projects.filter((p: any) => p.status === 'Klaar voor betaling').length,
            color: 'bg-orange-500',
          },
          {
            status: 'Afgerond',
            count: completed,
            color: 'bg-green-500',
          },
        ]

        const totalPrice = projects.reduce((sum, p: any) => sum + (p.price || 0), 0)
        const averagePrice = projects.length > 0 ? totalPrice / projects.length : 0

        // Belgian city coordinates for fallback
        const belgianCities = [
          { name: 'Antwerpen', lat: 51.2195, lng: 4.4025 },
          { name: 'Brussel', lat: 50.8503, lng: 4.3517 },
          { name: 'Gent', lat: 51.0543, lng: 3.7196 },
          { name: 'Charleroi', lat: 50.4108, lng: 4.4446 },
          { name: 'Liège', lat: 50.6292, lng: 5.5693 },
          { name: 'Leuven', lat: 50.8798, lng: 4.7005 },
          { name: 'Mons', lat: 50.4501, lng: 3.9557 },
          { name: 'Tournai', lat: 50.6041, lng: 3.3891 },
          { name: 'Ypres', lat: 50.8769, lng: 2.8849 },
          { name: 'Hasselt', lat: 50.9309, lng: 5.3345 },
        ]

        // Extract project locations with fallback to random Belgian cities
        const projectLocations: ProjectLocation[] = projects
          .map((p: any, idx: number) => {
            // Use project coordinates if available
            if (p.latitude && p.longitude) {
              return {
                name: p.name || 'N/A',
                latitude: parseFloat(p.latitude),
                longitude: parseFloat(p.longitude),
              }
            }
            
            // Fallback to Belgian city with slight random variation
            const city = belgianCities[idx % belgianCities.length]
            const latVariation = (Math.random() - 0.5) * 0.3
            const lngVariation = (Math.random() - 0.5) * 0.3
            
            return {
              name: p.name || 'N/A',
              latitude: city.lat + latVariation,
              longitude: city.lng + lngVariation,
            }
          })
          .filter((loc) => loc.latitude && loc.longitude)

        setStats({
          totalProjects: projects.length,
          activeProjects: active,
          completedProjects: completed,
          averagePrice,
          projectsByStatus: projectsByStatus.filter((s) => s.count > 0),
          recentProjects: projects
            .slice(0, 6)
            .map((p: any) => ({
              name: p.name || 'N/A',
              location: p.location || 'N/A',
              status: p.status || 'Onbekend',
              price: p.price || 0,
              created: new Date(p.created_at).toLocaleDateString('nl-BE'),
            })),
          averageDuration: 45, // Placeholder
          projectLocations,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--border-soft)] border-t-[var(--accent)]"></div>
          <p className="mt-4 text-sm text-[var(--text-muted)]">Statistieken laden...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[var(--text-muted)]">Kon statistieken niet laden</p>
      </div>
    )
  }

  return (
    <AppShell isAdmin>
      <div className="min-h-screen bg-[var(--bg-main)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-main)]">Projecten Statistieken</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Gedetailleerd overzicht van alle projecten en hun prestaties
          </p>
        </div>

        {/* Main Stats Cards */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Projects */}
          <div className="group overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] p-6 transition hover:border-[var(--accent)]/50 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)]">Totale Projecten</p>
                <p className="mt-2 text-4xl font-bold text-[var(--accent)]">{stats.totalProjects}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <FileText className="h-8 w-8 text-[var(--accent)]" />
              </div>
            </div>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              {Math.round((stats.completedProjects / stats.totalProjects) * 100)}% afgerond
            </p>
          </div>

          {/* Active Projects */}
          <div className="group overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(76,175,80,0.08),rgba(76,175,80,0.02))] p-6 transition hover:border-green-500/50 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)]">Actieve Projecten</p>
                <p className="mt-2 text-4xl font-bold text-green-500">{stats.activeProjects}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-green-500/10">
                <Zap className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              {Math.round((stats.activeProjects / stats.totalProjects) * 100)}% in voortgang
            </p>
          </div>

          {/* Completed Projects */}
          <div className="group overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(33,150,243,0.08),rgba(33,150,243,0.02))] p-6 transition hover:border-blue-500/50 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)]">Afgeronde Projecten</p>
                <p className="mt-2 text-4xl font-bold text-blue-500">{stats.completedProjects}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-500/10">
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              Succes rate {Math.round((stats.completedProjects / stats.totalProjects) * 100)}%
            </p>
          </div>

          {/* Average Price */}
          <div className="group overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(156,39,176,0.08),rgba(156,39,176,0.02))] p-6 transition hover:border-purple-500/50 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)]">Gem. Prijs</p>
                <p className="mt-2 text-3xl font-bold text-purple-500">€{stats.averagePrice.toFixed(0)}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-purple-500/10">
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <p className="mt-4 text-xs text-[var(--text-muted)]">Per project</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10">
              <Clock className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-main)]">Projecten per Status</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.projectsByStatus.map((status) => (
              <div
                key={status.status}
                className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4"
              >
                <p className="text-xs font-medium uppercase text-[var(--text-muted)]">{status.status}</p>
                <div className="mt-3 flex items-end gap-3">
                  <p className="text-3xl font-bold text-[var(--text-main)]">{status.count}</p>
                  <div className="mb-1 h-8 w-1 rounded-full bg-gradient-to-t from-[var(--accent)]"></div>
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {Math.round((status.count / stats.totalProjects) * 100)}% van totaal
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10">
              <Calendar className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-main)]">Nieuwste Projecten</h3>
          </div>
          <div className="space-y-3">
            {stats.recentProjects.map((project, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-main)]">{project.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <p className="truncate text-xs text-[var(--text-muted)]">{project.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      statusColorMap[project.status] ||
                      'bg-[var(--bg-card-2)] text-[var(--text-muted)] border-transparent'
                    }`}
                  >
                    {project.status}
                  </div>
                  <p className="whitespace-nowrap text-sm font-semibold text-[var(--accent)]">
                    €{project.price.toLocaleString('nl-BE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projects Map */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10">
              <MapPin className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-main)]">Projectlocaties</h3>
          </div>
          <ProjectsMap locations={stats.projectLocations} />
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-[var(--accent)]/30 bg-[linear-gradient(135deg,rgba(245,140,55,0.1),rgba(245,140,55,0.02))] p-8">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
              Totale Waarde
            </h3>
            <p className="text-3xl font-bold text-[var(--text-main)]">
              €{(stats.averagePrice * stats.totalProjects).toLocaleString('nl-BE')}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">van alle projecten</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--accent)]/30 bg-[linear-gradient(135deg,rgba(245,140,55,0.1),rgba(245,140,55,0.02))] p-8">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
              Gemiddelde Doorlooptijd
            </h3>
            <p className="text-3xl font-bold text-[var(--text-main)]">{stats.averageDuration}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">dagen per project</p>
          </div>
        </div>
      </div>
      </div>
    </AppShell>
  )
}
