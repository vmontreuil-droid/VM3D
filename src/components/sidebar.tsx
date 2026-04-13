'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, LayoutDashboard, Users, FolderOpen, ChevronLeft, ChevronRight, X, Plus, List, UploadCloud, BarChart3, Ticket, CreditCard, Eye, UserRound, FileText, FilePlus } from 'lucide-react'

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
  match: (pathname: string, view?: string | null) => boolean
  children?: {
    label: string
    href: string
    icon?: React.ReactNode
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
  const supabase = createClient()
  const [openTicketsCount, setOpenTicketsCount] = useState<number | null>(null)
  const [customerCount, setCustomerCount] = useState<number | null>(null)
  const [projectCount, setProjectCount] = useState<number | null>(null)


  useEffect(() => {
    if (!isAdmin) return;
    let active = true;

    async function fetchCounts() {
      try {
        // Tickets
        const ticketsRes = await fetch('/api/admin/tickets/open-count', { method: 'GET', cache: 'no-store' });
        if (ticketsRes.ok) {
          const payload = await ticketsRes.json();
          const count = Number(payload?.openCount);
          if (active && Number.isFinite(count)) setOpenTicketsCount(count);
        }
        // Customers
        const customersRes = await fetch('/api/admin/customers', { method: 'GET', cache: 'no-store' });
        if (customersRes.ok) {
          const payload = await customersRes.json();
          const count = Number(payload?.count);
          if (active && Number.isFinite(count)) setCustomerCount(count);
        }
        // Projects
        const projectsRes = await fetch('/api/admin/projects', { method: 'GET', cache: 'no-store' });
        if (projectsRes.ok) {
          const payload = await projectsRes.json();
          const count = Number(payload?.count);
          if (active && Number.isFinite(count)) setProjectCount(count);
        }
      } catch (error) {
        console.error('sidebar count fetch error:', error);
      }
    }

    fetchCounts();
    return () => { active = false; };
  }, [isAdmin]);

  const portalLabel = isAdmin ? 'Adminportaal' : 'Klantenportaal'
  const portalInitials = getPortalInitials(isAdmin)

  const generalItems: NavItem[] = isAdmin
    ? [
        {
          label: 'Dashboard',
          href: '/admin',
          match: (pathname) => pathname === '/admin',
          icon: <LayoutDashboard className="h-[17px] w-[17px]" />,
        },
      ]
    : [
        {
          label: 'Home',
          href: '/',
          match: (pathname) => pathname === '/',
          icon: <Home className="h-[17px] w-[17px]" />,
        },
        {
          label: 'Dashboard',
          href: '/dashboard',
          match: (pathname) => pathname === '/dashboard',
          icon: <LayoutDashboard className="h-[17px] w-[17px]" />,
          children: [
            {
              label: 'Tickets',
              href: '/dashboard/tickets',
              icon: <List className="h-[14px] w-[14px]" />,
              match: (pathname) => pathname === '/dashboard/tickets' || pathname.startsWith('/dashboard/tickets/'),
            },
            {
              label: 'Klantfiche',
              href: '/dashboard/klantfiche',
              icon: <UserRound className="h-[14px] w-[14px]" />,
              match: (pathname) => pathname === '/dashboard/klantfiche',
            },
            {
              label: 'Offerte aanvragen',
              href: '/dashboard/offerte',
              icon: <FilePlus className="h-[14px] w-[14px]" />,
              match: (pathname) => pathname === '/dashboard/offerte',
            },
            {
              label: 'Facturatie',
              href: '/dashboard/facturatie',
              icon: <FileText className="h-[14px] w-[14px]" />,
              match: (pathname) => pathname === '/dashboard/facturatie',
            },
            {
              label: 'Uploads',
              href: '/dashboard',
              icon: <UploadCloud className="h-[14px] w-[14px]" />,
              match: (pathname) => pathname.startsWith('/dashboard/projects/'),
            },
          ],
        },
      ]

  const adminItems: NavItem[] = [
    {
      label: 'Klanten',
      href: '/admin/customers',
      match: (pathname) =>
        pathname === '/admin/customers' || pathname.startsWith('/admin/customers/'),
      icon: <Users className="h-[17px] w-[17px]" />,
      badge: customerCount ?? undefined,
    },
    {
      label: 'Werven',
      href: '/admin/werven',
      match: (pathname) =>
        pathname === '/admin/werven' || pathname.startsWith('/admin/projects'),
      icon: <FolderOpen className="h-[17px] w-[17px]" />,
      badge: projectCount ?? undefined,
    },
    {
      label: 'Tickets',
      href: '/admin/tickets',
      match: (pathname) => pathname === '/admin/tickets' || pathname.startsWith('/admin/tickets/'),
      icon: <Ticket className="h-[17px] w-[17px]" />,
      badge: openTicketsCount ?? undefined,
    },
    {
      label: 'Klantweergave',
      href: '/admin/customer-preview',
      match: (pathname) => pathname === '/admin/customer-preview',
      icon: <Eye className="h-[17px] w-[17px]" />,
    },
    {
      label: 'Abonnement',
      href: '/dashboard/abonnement',
      match: (pathname) => pathname === '/dashboard/abonnement',
      icon: <CreditCard className="h-[17px] w-[17px]" />,
    },
    {
      label: 'Statistieken',
      href: '/admin/projects/statistics',
      match: (pathname) =>
        pathname === '/admin/projects/statistics' || pathname === '/admin/customers/statistics',
      icon: <BarChart3 className="h-[17px] w-[17px]" />,
    },
    {
      label: 'Uploads',
      href: '/admin#uploads',
      match: () => false,
      icon: <UploadCloud className="h-[17px] w-[17px]" />,
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
              ? item.label.includes('bewerken')
                ? 'bg-[linear-gradient(135deg,rgba(245,140,55,0.18),rgba(245,140,55,0.04))] text-[var(--accent)] shadow-sm'
                : 'bg-[linear-gradient(90deg,rgba(245,140,55,0.16),rgba(245,140,55,0.03))] text-[var(--accent)] shadow-sm'
              : 'text-[var(--text-soft)] hover:bg-[var(--bg-card)] hover:text-white'
          }`}
        >
          {active && (
            <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]" />
          )}

          <span
            className={`shrink-0 transition ${
              active
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {item.icon}
          </span>

          {!collapsed && (
            <>
              <span className="truncate text-sm font-medium">{item.label}</span>
              {typeof item.badge === 'number' ? (
                <span className="ml-auto flex items-center justify-center rounded-full border border-[var(--accent)]/60 bg-[var(--bg-card)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)] min-w-[1.8em] h-[1.6em] leading-none">
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
      className={`relative flex h-screen flex-col border-r border-[var(--border-soft)] bg-[var(--bg-main)] ${
        mobile ? 'w-[280px]' : collapsed ? 'w-[82px]' : 'w-[280px]'
      }`}
    >
      {!mobile && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute -right-[16px] top-4 z-20 hidden h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] shadow-md transition hover:bg-[var(--bg-card-2)] lg:flex"
          aria-label="Sidebar toggelen"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      )}

      <div
        className={`border-b border-[var(--border-soft)] ${
          collapsed && !mobile ? 'px-3 py-4' : 'px-5 py-4'
        }`}
      >
        <div
          className={`flex items-center ${
            collapsed && !mobile ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex min-w-0 items-center gap-3 overflow-hidden">
            <svg width="40" height="40" viewBox="0 0 100 100" className="h-10 w-10 shrink-0">
              {/* Orange squares */}
              <rect x="10" y="10" width="20" height="20" rx="5" fill="#f28c3a" />
              <rect x="40" y="10" width="20" height="20" rx="5" fill="#f28c3a" />
              <rect x="10" y="40" width="20" height="20" rx="5" fill="#f28c3a" />
              <rect x="40" y="40" width="20" height="20" rx="5" fill="#f28c3a" />
            </svg>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-wide text-[var(--text-main)]">
                  MV3D
                </p>
                <p className="truncate text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
                  {isAdmin ? 'ADMIN PORTAL' : 'CLIENT PORTAL'}
                </p>
              </div>
            )}
          </div>

          {mobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] transition hover:bg-[var(--bg-card-2)]"
              aria-label="Sluit navigatie"
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
                  Beveiligd portaal
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 py-4">
        <nav className="space-y-5">
          <div>
            {!collapsed && (
              <p className="mb-2.5 px-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
                Algemeen
              </p>
            )}
            <div className="space-y-1.5">{generalItems.map(renderNavItem)}</div>
          </div>

          {isAdmin && (
            <div>
              {!collapsed && (
                <p className="mb-2.5 px-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
                  Sneltoetsen
                </p>
              )}
              <div className="space-y-1.5">{adminItems.map(renderNavItem)}</div>
            </div>
          )}
        </nav>
      </div>

      <div className="border-t border-[var(--border-soft)] p-3.5">
        {!collapsed ? (
          <div className="space-y-2.5">
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
                      Startpagina
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
              <span>Uitloggen</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            title="Uitloggen"
            className="flex w-full justify-center rounded-lg px-3 py-3 text-sm font-medium text-[var(--text-soft)] transition hover:bg-[var(--bg-card)] hover:text-white"
          >
            <span className="shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 17l5-5-5-5v3H3v4h7v3zm9-14H9a2 2 0 00-2 2v3h2V5h10v14H9v-3H7v3a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2z" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </aside>
  )
}