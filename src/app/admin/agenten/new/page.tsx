import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import AppShell from '@/components/app-shell'
import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'

function resolveSiteUrl(headerList: Headers) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  if (envUrl) return envUrl.replace(/\/$/, '')
  const proto = headerList.get('x-forwarded-proto') || 'https'
  const host  = headerList.get('x-forwarded-host') || headerList.get('host')
  if (host && !/localhost|127\.0\.0\.1/i.test(host)) return `${proto}://${host}`
  return 'https://mv3d.cloud'
}

async function createAgent(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const email          = String(formData.get('email') || '').trim().toLowerCase()
  const fullName       = String(formData.get('full_name') || '').trim()
  const companyName    = String(formData.get('company_name') || '').trim()
  const commissionRate = parseFloat(String(formData.get('commission_rate') || '0')) || 0
  const vatNumber      = String(formData.get('vat_number') || '').trim()
  const iban           = String(formData.get('iban') || '').trim().toUpperCase()

  if (!email) redirect('/admin/agenten/new?error=missing_email')

  const adminSupabase = createAdminClient()
  const tempPassword  = `Mv3d!${Math.random().toString(36).slice(-10)}A1`

  const { data: createdUserData, error } = await adminSupabase.auth.admin.createUser({
    email,
    password:      tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName || null, company_name: companyName || null },
  })

  if (error || !createdUserData.user) {
    console.error('createAgent error:', error)
    redirect('/admin/agenten/new?error=create_user')
  }

  const agentUser = createdUserData.user
  await adminSupabase.from('profiles').upsert({
    id:              agentUser.id,
    role:            'agent',
    full_name:       fullName  || null,
    company_name:    companyName || null,
    email,
    vat_number:      vatNumber || null,
    iban:            iban      || null,
    commission_rate: commissionRate,
    agent_active:    true,
  }, { onConflict: 'id' })

  // Stuur uitnodigingsemail
  const headerList = await headers()
  const siteUrl    = resolveSiteUrl(headerList)
  await adminSupabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/agent`,
    data: { full_name: fullName || null, company_name: companyName || null },
  })

  redirect(`/admin/agenten?created=1`)
}

export default async function NewAgentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <AppShell isAdmin>
      <div className="space-y-4">
        <Link href="/admin/agenten" className="group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3">
          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
          <span className="flex items-start gap-2.5 pr-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">Agenten</span>
              <span className="block text-[11px] leading-4 text-[var(--text-soft)]">Terug naar overzicht</span>
            </span>
          </span>
        </Link>

        <div className="overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[var(--border-soft)] px-4 py-4 sm:px-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
              <UserPlus className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-sm font-semibold text-[var(--text-main)]">Nieuwe agent aanmaken</h1>
              <p className="text-xs text-[var(--text-soft)]">Agent ontvangt een uitnodigingsemail om in te loggen via /agent</p>
            </div>
          </div>

          <form action={createAgent} className="space-y-4 p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Email <span className="text-[var(--accent)]">*</span>
                </label>
                <input name="email" type="email" required
                  className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent)]/50"
                  placeholder="agent@bedrijf.be" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Naam</label>
                <input name="full_name" type="text"
                  className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent)]/50"
                  placeholder="Voornaam Achternaam" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Bedrijfsnaam</label>
                <input name="company_name" type="text"
                  className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent)]/50"
                  placeholder="Bedrijf BV" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Commissie % <span className="text-[var(--accent)]">*</span>
                </label>
                <input name="commission_rate" type="number" min="0" max="100" step="0.5" defaultValue="10" required
                  className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent)]/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">BTW-nummer</label>
                <input name="vat_number" type="text"
                  className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent)]/50"
                  placeholder="BE0123456789" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">IBAN</label>
                <input name="iban" type="text"
                  className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent)]/50"
                  placeholder="BE00 0000 0000 0000" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                <UserPlus className="h-4 w-4" />
                Agent aanmaken &amp; uitnodigen
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
