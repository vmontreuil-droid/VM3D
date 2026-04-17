'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, MapPin, TrendingUp, Calendar, Zap, Clock } from 'lucide-react'
import ProjectsMap from '@/components/projects/projects-map'
import AppShell from '@/components/app-shell'
import { useT } from '@/i18n/context'

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
  'offerte_aangevraagd': 'bg-slate-500/20 text-slate-500 border-slate-500/30',
  'offerte_verstuurd': 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  'in_behandeling': 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  'facturatie': 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  'factuur_verstuurd': 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  'afgerond': 'bg-green-500/20 text-green-500 border-green-500/30',
}

export default function ProjectStatisticsPage() {
  const { t, locale } = useT()
  const tt = t.adminStats
  const intlLocale = locale === 'fr' ? 'fr-BE' : locale === 'en' ? 'en-US' : 'nl-BE'
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
        const completed = projects.filter((p: any) => p.status === 'afgerond').length
        const active = projects.filter((p: any) => 
          p.status !== 'afgerond' && p.status !== null
        ).length

        const statusLabelMap: Record<string, string> = {
          offerte_aangevraagd: t.status.offerte_aangevraagd,
          offerte_verstuurd: t.status.offerte_verstuurd,
          in_behandeling: t.status.in_behandeling,
          facturatie: t.status.facturatie,
          factuur_verstuurd: t.status.factuur_verstuurd,
          afgerond: t.status.afgerond,
        }

        const projectsByStatus = [
          {
            status: t.status.offerte_aangevraagd,
            count: projects.filter((p: any) => p.status === 'offerte_aangevraagd').length,
            color: 'bg-slate-500',
          },
          {
            status: t.status.offerte_verstuurd,
            count: projects.filter((p: any) => p.status === 'offerte_verstuurd').length,
            color: 'bg-amber-500',
          },
          {
            status: t.status.in_behandeling,
            count: projects.filter((p: any) => p.status === 'in_behandeling').length,
            color: 'bg-blue-500',
          },
          {
            status: t.status.facturatie,
            count: projects.filter((p: any) => p.status === 'facturatie').length,
            color: 'bg-purple-500',
          },
          {
            status: t.status.factuur_verstuurd,
            count: projects.filter((p: any) => p.status === 'factuur_verstuurd').length,
            color: 'bg-orange-500',
          },
          {
            status: t.status.afgerond,
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
              created: new Date(p.created_at).toLocaleDateString(intlLocale),
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
  }, [t, intlLocale])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--border-soft)] border-t-[var(--accent)]"></div>
          <p className="mt-4 text-sm text-[var(--text-muted)]">{tt.loading}</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[var(--text-muted)]">{tt.cantLoad}</p>
      </div>
    )
  }

  return (
    <AppShell isAdmin>
      <div className="min-h-screen bg-[var(--bg-main)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-main)]">{tt.title}</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {tt.subtitle}
          </p>
        </div>

        {/* Main Stats Cards */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Projects */}
          <div className="group overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] p-6 transition hover:border-[var(--accent)]/50 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)]">{tt.totalSites}</p>
                <p className="mt-2 text-4xl font-bold text-[var(--accent)]">{stats.totalProjects}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <FileText className="h-8 w-8 text-[var(--accent)]" />
              </div>
            </div>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              {Math.round((stats.completedProjects / stats.totalProjects) * 100)}% {tt.completed}
            </p>
          </div>

          {/* Active Projects */}
          <div className="group overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(76,175,80,0.08),rgba(76,175,80,0.02))] p-6 transition hover:border-green-500/50 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)]">{tt.activeSites}</p>
                <p className="mt-2 text-4xl font-bold text-green-500">{stats.activeProjects}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-green-500/10">
                <Zap className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              {Math.round((stats.activeProjects / stats.totalProjects) * 100)}% {tt.inProgress}
            </p>
          </div>

          {/* Completed Projects */}
          <div className="group overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(33,150,243,0.08),rgba(33,150,243,0.02))] p-6 transition hover:border-blue-500/50 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)]">{tt.completedSites}</p>
                <p className="mt-2 text-4xl font-bold text-blue-500">{stats.completedProjects}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-500/10">
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              {tt.successRate} {Math.round((stats.completedProjects / stats.totalProjects) * 100)}%
            </p>
          </div>

          {/* Average Price */}
          <div className="group overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(156,39,176,0.08),rgba(156,39,176,0.02))] p-6 transition hover:border-purple-500/50 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)]">{tt.avgPrice}</p>
                <p className="mt-2 text-3xl font-bold text-purple-500">€{stats.averagePrice.toFixed(0)}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-purple-500/10">
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <p className="mt-4 text-xs text-[var(--text-muted)]">{tt.perProject}</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10">
              <Clock className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-main)]">{tt.sitesByStatus}</h3>
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
                  {Math.round((status.count / stats.totalProjects) * 100)}% {tt.ofTotal}
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
            <h3 className="text-lg font-semibold text-[var(--text-main)]">{tt.newestSites}</h3>
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
                    €{project.price.toLocaleString(intlLocale)}
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
            <h3 className="text-lg font-semibold text-[var(--text-main)]">{tt.siteLocations}</h3>
          </div>
          <ProjectsMap locations={stats.projectLocations} />
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-[var(--accent)]/30 bg-[linear-gradient(135deg,rgba(245,140,55,0.1),rgba(245,140,55,0.02))] p-8">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
              {tt.totalValue}
            </h3>
            <p className="text-3xl font-bold text-[var(--text-main)]">
              €{(stats.averagePrice * stats.totalProjects).toLocaleString(intlLocale)}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{tt.ofAllSites}</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--accent)]/30 bg-[linear-gradient(135deg,rgba(245,140,55,0.1),rgba(245,140,55,0.02))] p-8">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
              {tt.avgDuration}
            </h3>
            <p className="text-3xl font-bold text-[var(--text-main)]">{stats.averageDuration}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{tt.daysPerProject}</p>
          </div>
        </div>
      </div>
      </div>
    </AppShell>
  )
}
