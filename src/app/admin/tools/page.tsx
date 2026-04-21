import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import AppShell from '@/components/app-shell'
import Link from 'next/link'
import {
  UserPlus, Receipt, FolderPlus, Ticket, Construction,
  UserCog, MousePointerClick, Bell, BarChart3,
  Clock, StickyNote, Zap, FileCode2, Globe2,
  ArrowLeft, Sparkles, LayoutList, Rocket,
} from 'lucide-react'
import { locales, defaultLocale, COOKIE_NAME, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

const sections = [
  {
    title: 'Aanmaken',
    color: 'orange',
    items: [
      { label: 'Nieuwe klant',   href: '/admin/customers/new',  icon: UserPlus,        sub: 'Klantfiche aanmaken' },
      { label: 'Nieuwe offerte', href: '/admin/offerte/new',    icon: MousePointerClick, sub: 'Offerte opstellen' },
      { label: 'Nieuwe factuur', href: '/admin/facturen/from-offerte', icon: Receipt,  sub: 'Factuur via offerte' },
      { label: 'Nieuw project',  href: '/admin/projects/new',   icon: FolderPlus,      sub: 'Project/werf starten' },
      { label: 'Nieuwe ticket',  href: '/admin/tickets/new',    icon: Ticket,          sub: 'Ondersteuningsticket' },
      { label: 'Nieuwe machine', href: '/admin/machines/new',   icon: Construction,    sub: 'Machine registreren' },
      { label: 'Nieuwe agent',   href: '/admin/agenten/new',    icon: UserCog,         sub: 'Agent uitnodigen' },
    ],
  },
  {
    title: 'Overzichten',
    color: 'blue',
    items: [
      { label: 'Offertes',        href: '/admin/offerte',          icon: MousePointerClick, sub: 'Offertebeheer' },
      { label: 'Facturen',        href: '/admin/facturen',         icon: Receipt,          sub: 'Facturatiebeheer' },
      { label: 'Tickets',         href: '/admin/tickets',          icon: Ticket,           sub: 'Supporttickets' },
      { label: 'Tijdsregistratie',href: '/admin/tijdsregistratie', icon: Clock,            sub: 'Uren overzicht' },
      { label: 'Notities',        href: '/admin/notities',         icon: StickyNote,       sub: 'Admin notities' },
      { label: 'Agenten',         href: '/admin/agenten',          icon: UserCog,          sub: 'Agentenbeheer' },
    ],
  },
  {
    title: 'Acties',
    color: 'green',
    items: [
      { label: 'Herinneringen',  href: '/admin/herinneringen',         icon: Bell,      sub: 'Betalingsherinneringen' },
      { label: 'Statistieken',   href: '/admin/statistieken',          icon: BarChart3,  sub: 'Rapporten & grafieken' },
      { label: 'Bestandsconverter', href: '/admin/tools/converter',    icon: FileCode2,  sub: 'GPS bestanden omzetten' },
      { label: 'Geo-setup',      href: '/admin/tools/geo-setup',       icon: Globe2,     sub: 'Geoide & coördinaten per regio' },
    ],
  },
]

const colorMap = {
  orange: {
    section: 'border-[var(--accent)]/20 bg-[var(--accent)]/4',
    header:  'text-[var(--accent)]',
    tile:    'border-[var(--border-soft)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/6',
    icon:    'bg-[var(--accent)]/12 text-[var(--accent)]',
  },
  blue: {
    section: 'border-blue-500/20 bg-blue-500/4',
    header:  'text-blue-400',
    tile:    'border-[var(--border-soft)] hover:border-blue-500/40 hover:bg-blue-500/6',
    icon:    'bg-blue-500/12 text-blue-400',
  },
  green: {
    section: 'border-emerald-500/20 bg-emerald-500/4',
    header:  'text-emerald-400',
    tile:    'border-[var(--border-soft)] hover:border-emerald-500/40 hover:bg-emerald-500/6',
    icon:    'bg-emerald-500/12 text-emerald-400',
  },
}

export default async function ToolsPage() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value ?? defaultLocale
  const locale: Locale = (locales as readonly string[]).includes(raw) ? (raw as Locale) : defaultLocale
  const t = getDictionary(locale)
  const tt = t.adminTools

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const createCount = sections.find(s => s.title === 'Aanmaken')?.items.length ?? 0
  const overviewCount = sections.find(s => s.title === 'Overzichten')?.items.length ?? 0
  const actionCount = sections.find(s => s.title === 'Acties')?.items.length ?? 0
  const totalCount = sections.reduce((s, sec) => s + sec.items.length, 0)

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-soft)] transition hover:text-[var(--accent)]"
                >
                  <ArrowLeft className="h-3 w-3" />
                  {tt.dashboard}
                </Link>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  {tt.adminPortal}
                </p>
                <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  {tt.title}
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-[var(--text-soft)]">
                  {tt.description}
                </p>
              </div>

              <div className="w-full xl:ml-auto xl:max-w-[820px]">
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.10),rgba(245,140,55,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiCreate}</p>
                        <p className="mt-1 text-lg font-semibold text-[var(--accent)]">{createCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                        <Sparkles className="h-4.5 w-4.5 text-[var(--accent)]" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(14,165,233,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiOverview}</p>
                        <p className="mt-1 text-lg font-semibold text-sky-400">{overviewCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/10">
                        <LayoutList className="h-4.5 w-4.5 text-sky-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(16,185,129,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiActions}</p>
                        <p className="mt-1 text-lg font-semibold text-emerald-400">{actionCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10">
                        <Rocket className="h-4.5 w-4.5 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(168,85,247,0.10),rgba(168,85,247,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiShortcuts}</p>
                        <p className="mt-1 text-lg font-semibold text-violet-400">{totalCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-400/10">
                        <Zap className="h-4.5 w-4.5 text-violet-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5">
        {sections.map(section => {
          const c = colorMap[section.color as keyof typeof colorMap]
          return (
            <div key={section.title} className={`overflow-hidden rounded-[18px] border ${c.section} shadow-sm`}>
              <div className="px-4 py-3 sm:px-5">
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${c.header}`}>
                  {section.title}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 px-4 pb-4 sm:grid-cols-3 sm:px-5 lg:grid-cols-4">
                {section.items.map(item => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-xl border bg-[var(--bg-card)] px-3.5 py-3 transition ${c.tile}`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.icon}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[var(--text-main)]">
                          {item.label}
                        </span>
                        <span className="block truncate text-[10px] text-[var(--text-muted)]">
                          {item.sub}
                        </span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
