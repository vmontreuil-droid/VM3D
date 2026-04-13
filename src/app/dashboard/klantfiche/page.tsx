import CustomerLogoHeaderBlock from "@/components/customers/customer-logo-header-block"
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { UserRound, Mail, Phone, Building2, MapPin, FileText } from 'lucide-react'

function display(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export default async function DashboardCustomerProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'role, full_name, company_name, email, phone, mobile, vat_number, street, postal_code, city, country, logo_url'
    )
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  const address = [
    profile?.street,
    [profile?.postal_code, profile?.city].filter(Boolean).join(' '),
    profile?.country,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <AppShell>
      <div className="space-y-4">
        <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard" className="btn-secondary">
                ← Terug naar dashboard
              </Link>
              <div className="ml-auto">
                <CustomerLogoHeaderBlock logoUrl={profile?.logo_url} />
              </div>
            </div>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Klantenportaal
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)]">
              Klantfiche
            </h1>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Dit is jouw read-only klantfiche. Gegevens kunnen alleen door admin aangepast worden.
            </p>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-2 xl:grid-cols-3">
            <div className="card-mini">
              <p className="text-xs text-[var(--text-muted)]">Naam / firma</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
                <UserRound className="h-4 w-4 text-[var(--accent)]" />
                {display(profile?.company_name || profile?.full_name)}
              </p>
            </div>

            <div className="card-mini">
              <p className="text-xs text-[var(--text-muted)]">E-mail</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
                <Mail className="h-4 w-4 text-[var(--accent)]" />
                {display(profile?.email)}
              </p>
            </div>

            <div className="card-mini">
              <p className="text-xs text-[var(--text-muted)]">Mobiel / telefoon</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
                <Phone className="h-4 w-4 text-[var(--accent)]" />
                {display(profile?.mobile || profile?.phone)}
              </p>
            </div>

            <div className="card-mini">
              <p className="text-xs text-[var(--text-muted)]">BTW-nummer</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
                <FileText className="h-4 w-4 text-[var(--accent)]" />
                {display(profile?.vat_number)}
              </p>
            </div>

            <div className="card-mini md:col-span-2 xl:col-span-2">
              <p className="text-xs text-[var(--text-muted)]">Adres</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
                <MapPin className="h-4 w-4 text-[var(--accent)]" />
                {display(address)}
              </p>
            </div>

            <div className="card-mini">
              <p className="text-xs text-[var(--text-muted)]">Toegang</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
                <Building2 className="h-4 w-4 text-[var(--accent)]" />
                Read-only
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
