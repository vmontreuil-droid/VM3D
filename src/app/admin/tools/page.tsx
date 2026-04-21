import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import Link from 'next/link'
import {
  UserPlus, Receipt, FolderPlus, Ticket, Construction,
  UserCog, MousePointerClick, Bell, BarChart3,
  Clock, StickyNote, Zap, FileCode2,
} from 'lucide-react'

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <AppShell isAdmin>
      <div className="space-y-5">
        {/* Page header */}
        <div className="group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3">
          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
          <span className="flex items-start gap-2.5 pr-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">Snelstartmenu</span>
              <span className="block text-[11px] leading-4 text-[var(--text-soft)]">Directe toegang tot alle functies</span>
            </span>
          </span>
        </div>

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
    </AppShell>
  )
}
