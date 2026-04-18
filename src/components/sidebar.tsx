'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Logo from '@/components/logo'
import TopoBackground from '@/components/topo-background'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/i18n/context'
import ThemeToggle from '@/components/theme-toggle'
import LanguageSwitcher from '@/components/language-switcher'
import { Home, LayoutDashboard, Users, FolderOpen, ChevronLeft, ChevronRight, X, Plus, List, UploadCloud, BarChart3, Ticket, CreditCard, Eye, UserRound, FileText, FilePlus, MousePointerClick, Receipt, Construction } from 'lucide-react'

type Props = {
  isAdmin?: boolean
  collapsed?: boolean
  onToggle?: () => void
  mobile?: boolean
  onCloseMobile?: () => void
}

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
  color?: string
  match: (pathname: string, view?: string | null) => boolean
  children?: {
    label: string
    href: string
    icon?: React.ReactNode
    badge?: number
    match: (pathname: string, view?: string | null) => boolean
  }[]
}

function getPortalInitials(isAdmin: boolean) {
  return isAdmin ? 'AD' : 'KP'
}

export default function Sidebar({
  isAdmin = false,
  collapsed = false,
  onToggle,
  mobile = false,
  onCloseMobile,
}: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view')
  const { t } = useT()
  const supabase = createClient()
  const [openTicketsCount, setOpenTicketsCount] = useState<number | null>(null)
  const [waitingTicketsCount, setWaitingTicketsCount] = useState<number | null>(null)
  const [customerCount, setCustomerCount] = useState<number | null>(null)
  const [projectCount, setProjectCount] = useState<number | null>(null)
  const [offertesCount, setOffertesCount] = useState<number | null>(null)
  const [facturenCount, setFacturenCount] = useState<number | null>(null)
  const [customerTicketCount, setCustomerTicketCount] = useState<number | null>(null)
  const [machineCount, setMachineCount] = useState<number | null>(null)


  useEffect(() => {
    if (!isAdmin) return;
    let active = true;

    async function fetchCounts() {
      try {
        // Tickets open
        const ticketsRes = await fetch('/api/admin/tickets/open-count', { method: 'GET', cache: 'no-store' });
        if (ticketsRes.ok) {
          const payload = await ticketsRes.json();
          const count = Number(payload?.openCount);
          if (active && Number.isFinite(count)) setOpenTicketsCount(count);
        }
        // Tickets wacht op klant
        const waitingRes = await fetch('/api/admin/tickets/waiting-count', { method: 'GET', cache: 'no-store' });
        if (waitingRes.ok) {
          const payload = await waitingRes.json();
          const count = Number(payload?.waitingCount);
          if (active && Number.isFinite(count)) setWaitingTicketsCount(count);
        }
        // Customers
        const customersRes = await fetch('/api/admin/customers', { method: 'GET', cache: 'no-store' });
        if (customersRes.ok) {
          const payload = await customersRes.json();
          const count = Number(
            typeof payload?.count === 'number'
              ? payload.count
              : Array.isArray(payload?.customers)
                ? payload.customers.length
                : NaN,
          );
          if (active && Number.isFinite(count)) setCustomerCount(count);
        }
        // Projects
        const projectsRes = await fetch('/api/admin/projects', { method: 'GET', cache: 'no-store' });
        if (projectsRes.ok) {
          const payload = await projectsRes.json();
          const count = Number(payload?.count);
          if (active && Number.isFinite(count)) setProjectCount(count);
        }
        // Offertes
        const offertesRes = await fetch('/api/admin/offertes/count', { method: 'GET', cache: 'no-store' });
        if (offertesRes.ok) {
          const payload = await offertesRes.json();
          const count = Number(payload?.count);
          if (active && Number.isFinite(count)) setOffertesCount(count);
        }
        // Facturen
        const facturenRes = await fetch('/api/admin/facturen/count', { method: 'GET', cache: 'no-store' });
        if (facturenRes.ok) {
          const payload = await facturenRes.json();
          const count = Number(payload?.count);
          if (active && Number.isFinite(count)) setFacturenCount(count);
        }
        // Machines
        const machinesRes = await fetch('/api/admin/machines/count', { method: 'GET', cache: 'no-store' });
        if (machinesRes.ok) {
          const payload = await machinesRes.json();
          const count = Number(payload?.count);
          if (active && Number.isFinite(count)) setMachineCount(count);
        }
      } catch (error) {
        console.error('sidebar count fetch error:', error);
      }
    }

    fetchCounts();
    return () => { active = false; };
  }, [isAdmin]);

  // Customer-side ticket count
  useEffect(() => {
    if (isAdmin) return;
    let active = true;

    async function fetchCustomerTickets() {
      try {
        const res = await fetch('/api/tickets/open-count', { method: 'GET', cache: 'no-store' });
        if (res.ok) {
          const payload = await res.json();
          const count = Number(payload?.openCount);
          if (active && Number.isFinite(count)) setCustomerTicketCount(count);
        }
      } catch (err) {
        console.error('customer ticket count error:', err);
      }
    }

    fetchCustomerTickets();
    return () => { active = false; };
  }, [isAdmin]);

  const portalLabel = isAdmin ? t.platform.adminPortal : t.platform.clientPortal
  const portalInitials = getPortalInitials(isAdmin)

  const generalItems: NavItem[] = isAdmin
    ? [
        {
          label: t.platform.dashboard,
          href: '/admin',
          match: (pathname) => pathname === '/admin',
          icon: <LayoutDashboard className="h-[17px] w-[17px]" />,
        },
      ]
    : [
        {
          label: t.platform.home,
          href: '/',
          match: (pathname) => pathname === '/',
          icon: <Home className="h-[17px] w-[17px]" />,
        },
        {
          label: t.platform.dashboard,
          href: '/dashboard',
          match: (pathname) => pathname === '/dashboard',
          icon: <LayoutDashboard className="h-[17px] w-[17px]" />,
          children: [
            {
              label: t.platform.tickets,
              href: '/dashboard/tickets',
              icon: <List className="h-[14px] w-[14px]" />,
              badge: customerTicketCount ?? undefined,
              match: (pathname) => pathname === '/dashboard/tickets' || pathname.startsWith('/dashboard/tickets/'),
            },
            // Offerte knoppen verwijderd
            {
              label: t.platform.billing,
              href: '/dashboard/facturatie',
              icon: <FileText className="h-[14px] w-[14px]" />,
              match: (pathname) => pathname === '/dashboard/facturatie',
            },
          ],
        },
        {
          label: t.platform.myMachines,
          href: '/dashboard/machines',
          match: (pathname) => pathname === '/dashboard/machines' || pathname.startsWith('/dashboard/machines/'),
          icon: <Construction className="h-[17px] w-[17px]" />,
          color: 'green',
        },
        {
          label: t.platform.machinetools,
          href: '/dashboard/machinetools',
          match: (pathname) => pathname === '/dashboard/machinetools' || pathname.startsWith('/dashboard/machinetools/'),
          icon: <MousePointerClick className="h-[17px] w-[17px]" />,
          color: 'green',
        },
      ]

  const adminItems: NavItem[] = [
    {
      label: t.platform.customers,
      href: '/admin/customers',
      match: (pathname) =>
        pathname === '/admin/customers' || pathname.startsWith('/admin/customers/'),
      icon: <Users className="h-[17px] w-[17px]" />,
      badge: customerCount ?? undefined,
    },
        // Offerte knop verwijderd
    {
      label: t.platform.projects,
      href: '/admin/werven',
      match: (pathname) =>
        pathname === '/admin/werven' || pathname.startsWith('/admin/projects'),
      icon: <FolderOpen className="h-[17px] w-[17px]" />,
      badge: projectCount ?? undefined,
    },
    {
      label: t.platform.tickets,
      href: '/admin/tickets',
      match: (pathname) => pathname === '/admin/tickets' || pathname.startsWith('/admin/tickets/'),
      icon: <Ticket className="h-[17px] w-[17px]" />,
      badge: openTicketsCount ?? undefined,
    },
    {
      label: t.platform.offertes,
      href: '/admin/offerte',
      match: (pathname) => pathname === '/admin/offerte' || pathname.startsWith('/admin/offerte/'),
      icon: <MousePointerClick className="h-[17px] w-[17px]" />,
      badge: offertesCount ?? undefined,
    },
    {
      label: t.platform.invoices,
      href: '/admin/facturen',
      match: (pathname) => pathname === '/admin/facturen' || pathname.startsWith('/admin/facturen/'),
      icon: <Receipt className="h-[17px] w-[17px]" />,
      badge: facturenCount ?? undefined,
    },
    {
      label: t.platform.machines,
      href: '/admin/machines',
      match: (pathname) => pathname === '/admin/machines' || pathname.startsWith('/admin/machines/'),
      icon: <Construction className="h-[17px] w-[17px]" />,
      badge: machineCount ?? undefined,
    },
    {
      label: t.platform.statistics,
      href: '/admin/statistieken',
      match: (pathname) => pathname === '/admin/statistieken',
      icon: <BarChart3 className="h-[17px] w-[17px]" />,
    },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function handleNavClick() {
    if (mobile && onCloseMobile) onCloseMobile()
  }

  function renderNavItem(item: NavItem) {
    const active = item.match(pathname, currentView)

    return (
      <div key={item.href + item.label} className="space-y-1.5">
        <Link
          href={item.href}
          onClick={handleNavClick}
          title={collapsed && !mobile ? item.label : undefined}
          className={`group relative flex items-center overflow-hidden rounded-lg transition ${
            collapsed && !mobile
              ? 'justify-center px-3 py-3'
              : 'gap-3 px-4 py-3'
          } ${
            active
              ? item.color === 'green'
                ? 'bg-[linear-gradient(90deg,rgba(16,185,129,0.16),rgba(16,185,129,0.03))] text-emerald-400 shadow-sm'
                : item.label.includes('bewerken')
                  ? 'bg-[linear-gradient(135deg,rgba(245,140,55,0.18),rgba(245,140,55,0.04))] text-[var(--accent)] shadow-sm'
                  : 'bg-[linear-gradient(90deg,rgba(245,140,55,0.16),rgba(245,140,55,0.03))] text-[var(--accent)] shadow-sm'
              : item.color === 'green'
                ? 'text-emerald-400/70 hover:bg-emerald-500/8 hover:text-emerald-400'
                : 'text-[var(--text-soft)] hover:bg-[var(--bg-card)] hover:text-white'
          }`}
        >
          {active && (
            <span className={`absolute right-0 top-0 h-full w-[2px] rounded-l-full ${
              item.color === 'green' ? 'bg-emerald-400' : 'bg-[var(--accent)]'
            }`} />
          )}

          <span
            className={`shrink-0 transition ${
              active
                ? item.color === 'green' ? 'text-emerald-400' : 'text-[var(--accent)]'
                : item.color === 'green' ? 'text-emerald-400/70' : 'text-[var(--text-muted)]'
            }`}
          >
            {item.icon}
          </span>

          {!collapsed && (
            <>
              <span className="truncate text-sm font-medium">{item.label}</span>
              {typeof item.badge === 'number' ? (
                <span className={`ml-auto flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold min-w-[1.8em] h-[1.6em] leading-none ${
                  item.color === 'green'
                    ? 'border-emerald-500/60 bg-[var(--bg-card)] text-emerald-400'
                    : 'border-[var(--accent)]/60 bg-[var(--bg-card)] text-[var(--accent)]'
                }`}>
                  {item.badge}
                </span>
              ) : null}
            </>
          )}
        </Link>

        {!collapsed && item.children && item.children.length > 0 && (
          <div className="space-y-1.5">
            {item.children.map((child) => {
              const childActive = child.match(pathname, currentView)

              return (
                <Link
                  key={child.href + child.label}
                  href={child.href}
                  onClick={handleNavClick}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    childActive
                      ? 'bg-[linear-gradient(90deg,rgba(245,140,55,0.16),rgba(245,140,55,0.03))] text-[var(--accent)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-white'
                  }`}
                >
                  {childActive && (
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]" />
                  )}
                  {child.icon ? (
                    <span className={`flex h-4 w-4 items-center justify-center ${
                      childActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                    }`}>
                      {child.icon}
                    </span>
                  ) : null}
                  <span>{child.label}</span>
                  {typeof child.badge === 'number' ? (
                    <span className="ml-auto flex items-center justify-center rounded-full border border-[var(--accent)]/60 bg-[var(--bg-card)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)] min-w-[1.8em] h-[1.6em] leading-none">
                      {child.badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside
      className={`relative flex h-dvh flex-col border-r border-[var(--border-soft)] bg-[var(--bg-main)] ${
        mobile ? 'w-[280px]' : collapsed ? 'w-[82px]' : 'w-[280px]'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <svg
          className="h-full w-full opacity-[0.12]"
          viewBox="0 0 400 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M-20,200 C40,120 120,80 200,130 C280,180 320,60 400,100" stroke="#f7941d" strokeWidth="1" opacity="0.7"/>
          <path d="M-20,260 C50,180 110,140 190,180 C270,220 310,110 400,160" stroke="#f7941d" strokeWidth="1" opacity="0.6"/>
          <path d="M-20,320 C60,250 100,200 180,230 C260,260 300,160 400,220" stroke="#f7941d" strokeWidth="0.8" opacity="0.5"/>
          <path d="M80,450 C100,380 150,340 210,350 C270,360 290,310 280,270 C270,230 230,210 190,225 C150,240 110,290 100,370 C90,410 85,440 80,450Z" stroke="#f7941d" strokeWidth="1.2" opacity="0.8"/>
          <path d="M110,420 C125,370 160,345 205,352 C250,359 268,320 260,290 C252,260 222,245 195,255 C168,265 140,300 135,365 C130,400 115,415 110,420Z" stroke="#f7941d" strokeWidth="1" opacity="0.6"/>
          <path d="M140,395 C150,360 175,345 205,350 C235,355 248,330 243,310 C238,290 218,280 200,286 C182,292 165,315 163,355 C161,380 145,392 140,395Z" stroke="#f7941d" strokeWidth="0.8" opacity="0.5"/>
          <path d="M-20,600 C40,560 120,580 200,555 C280,530 350,570 420,545" stroke="#f7941d" strokeWidth="0.8" opacity="0.4"/>
          <path d="M-20,660 C50,630 100,640 180,620 C260,600 330,630 420,610" stroke="#f7941d" strokeWidth="0.8" opacity="0.35"/>
          <path d="M-20,80 C60,50 140,70 220,45 C300,20 380,60 420,40" stroke="#f7941d" strokeWidth="0.8" opacity="0.35"/>
          <circle cx="300" cy="700" r="18" stroke="#f7941d" strokeWidth="0.7" opacity="0.3"/>
          <circle cx="300" cy="700" r="10" stroke="#f7941d" strokeWidth="0.5" opacity="0.25"/>
          <circle cx="80" cy="780" r="14" stroke="#f7941d" strokeWidth="0.6" opacity="0.25"/>
        </svg>
      </div>
      {!mobile && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute -right-[16px] top-[140px] z-40 hidden h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] shadow-md transition hover:bg-[var(--bg-card-2)] lg:flex"
          aria-label={t.platform.toggleSidebar}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      )}

      <div
        className={`relative z-10 border-b border-[var(--border-soft)] ${
          collapsed && !mobile ? 'px-3 py-4' : 'px-5 py-4'
        }`}
      >
        <div
          className={`flex items-center ${
            collapsed && !mobile ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex min-w-0 items-center gap-3 overflow-hidden">
            <Logo size={collapsed && !mobile ? 'sm' : 'lg'} variant="adaptive" showText={!(collapsed && !mobile)} />
          </div>

          {mobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] transition hover:bg-[var(--bg-card-2)]"
              aria-label={t.platform.closeNav}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!collapsed && isAdmin && (
          <div className="mt-3.5 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]/80 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-bold text-white shadow-sm">
                {portalInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-main)]">
                  {portalLabel}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                  {t.platform.securedPortal}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-3.5 py-4">
        <nav className="space-y-5">
          <div>
            {!collapsed && (
              <p className="mb-2.5 px-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
                {t.platform.general}
              </p>
            )}
            <div className="space-y-1.5">{generalItems.map(renderNavItem)}</div>
          </div>

          {isAdmin && (
            <div>
              <div className="space-y-1.5">{adminItems.map(renderNavItem)}</div>
            </div>
          )}
        </nav>
      </div>

      <div className="relative z-10 border-t border-[var(--border-soft)] p-3.5">
        {!collapsed ? (
          <div className="space-y-2.5">
            <ThemeToggle collapsed={false} />
            <LanguageSwitcher />
            {isAdmin && (
              <Link
                href={isAdmin ? '/admin' : '/dashboard'}
                onClick={handleNavClick}
                className="block rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3 transition hover:border-[var(--accent)]/30 hover:bg-[var(--bg-card)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-sm font-bold text-[var(--accent)]">
                    {portalInitials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-main)]">
                      {portalLabel}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                      {t.platform.homepage}
                    </p>
                  </div>
                </div>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[var(--text-soft)] transition hover:bg-[var(--bg-card)] hover:text-white"
            >
              <span className="shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 17l5-5-5-5v3H3v4h7v3zm9-14H9a2 2 0 00-2 2v3h2V5h10v14H9v-3H7v3a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2z" />
                </svg>
              </span>
              <span>{t.platform.logout}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <ThemeToggle collapsed={true} />
            <LanguageSwitcher collapsed={true} />
            <button
            type="button"
            onClick={handleLogout}
            title={t.platform.logout}
            className="flex w-full justify-center rounded-lg px-3 py-3 text-sm font-medium text-[var(--text-soft)] transition hover:bg-[var(--bg-card)] hover:text-white"
          >
            <span className="shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 17l5-5-5-5v3H3v4h7v3zm9-14H9a2 2 0 00-2 2v3h2V5h10v14H9v-3H7v3a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2z" />
              </svg>
            </span>
          </button>
          </div>
        )}
      </div>
    </aside>
  )
}