'use client'

import Link from 'next/link'
import { ArrowRight, Upload, Eye, FileDown, Zap, Lock, TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'

const CustomersMap = dynamic(
  () => import('@/components/customers/customers-map'),
  { ssr: false }
)

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(242,140,58,0.08),rgba(242,140,58,0.02))]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(242,140,58,0.15),transparent_50%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-32 lg:py-40">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-block">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent)]">
                  ✨ EEN PLATFORM VOOR ALLES
                </p>
              </div>

              <h1 className="text-5xl font-black leading-tight text-[var(--text-main)] sm:text-6xl lg:text-7xl">
                Dien plannen in,
                <br />
                volg je dossier op,
                <br />
                <span className="bg-[linear-gradient(90deg,var(--accent),rgba(242,140,58,0.6))] bg-clip-text text-transparent">
                  ontvang 3D-bestanden
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-xl leading-8 text-[var(--text-soft)]">
                Een professionele online omgeving waar klanten plannen aanleveren, projectstatus opvolgen en afgewerkte 3D-documenten veilig downloaden.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4 sm:gap-6">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/30 transition hover:bg-opacity-90"
                >
                  Nu Inloggen
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-soft)] px-7 py-4 text-sm font-bold text-[var(--text-main)] transition hover:bg-[var(--bg-card)]"
                >
                  Dashboard Verkennen
                </Link>
              </div>

              <div className="mt-16 grid grid-cols-3 gap-8 border-t border-[var(--border-soft)] pt-8">
                <div>
                  <p className="text-3xl font-bold text-[var(--accent)]">500+</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Actieve Klanten</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--accent)]">10K+</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Projecten Verwerkt</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--accent)]">99.9%</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Uptime</p>
                </div>
              </div>
            </div>

            {/* Dashboard Mockup */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-sm">
                <div className="rounded-2xl border-8 border-[#2a2a2a] bg-[#1a1a1a] shadow-2xl overflow-hidden">
                  {/* Laptop screen */}
                  <div className="bg-[var(--bg-card)] p-4 aspect-video">
                    <svg viewBox="0 0 400 300" className="w-full h-full">
                      {/* Header */}
                      <rect width="400" height="40" fill="var(--bg-main)" />
                      <circle cx="20" cy="20" r="4" fill="var(--accent)" />
                      <circle cx="32" cy="20" r="4" fill="rgba(242,140,58,0.5)" />
                      <circle cx="44" cy="20" r="4" fill="rgba(242,140,58,0.3)" />

                      {/* Sidebar */}
                      <rect x="0" y="40" width="80" height="260" fill="var(--bg-main)" opacity="0.5" />
                      <rect x="10" y="55" width="60" height="8" fill="var(--accent)" rx="2" />
                      <rect x="10" y="75" width="60" height="8" fill="rgba(242,140,58,0.3)" rx="2" />
                      <rect x="10" y="95" width="60" height="8" fill="rgba(242,140,58,0.3)" rx="2" />

                      {/* Main content */}
                      <rect x="90" y="50" width="300" height="20" fill="var(--accent)" opacity="0.1" rx="4" />

                      {/* Content cards */}
                      <rect x="90" y="80" width="140" height="70" fill="var(--accent)" opacity="0.15" rx="6" />
                      <rect x="250" y="80" width="140" height="70" fill="var(--accent)" opacity="0.1" rx="6" />

                      <rect x="90" y="160" width="140" height="70" fill="var(--accent)" opacity="0.1" rx="6" />
                      <rect x="250" y="160" width="140" height="70" fill="var(--accent)" opacity="0.15" rx="6" />

                      {/* Accent dots */}
                      <circle cx="110" cy="100" r="3" fill="var(--accent)" />
                      <circle cx="110" cy="120" r="3" fill="var(--accent)" />
                      <circle cx="110" cy="140" r="2" fill="var(--accent)" opacity="0.5" />
                    </svg>
                  </div>

                  {/* Laptop bottom */}
                  <div className="h-3 bg-[#2a2a2a]" />
                  <div className="h-2 bg-gradient-to-r from-[#2a2a2a] via-[#3a3a3a] to-[#2a2a2a]" />
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,var(--accent)/20,transparent)] blur-xl -z-10 scale-110" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-b border-[var(--border-soft)] bg-[var(--bg-main)]">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent)]">
              Kernfunctionaliteiten
            </p>
            <h2 className="mt-4 text-4xl font-black text-[var(--text-main)] sm:text-5xl">
              Alles wat je nodig hebt
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] overflow-hidden transition hover:border-[var(--accent)]/50 hover:shadow-lg">
              <div className="h-40 bg-[linear-gradient(135deg,rgba(242,140,58,0.15),rgba(242,140,58,0.05))] flex items-center justify-center">
                <svg viewBox="0 0 200 150" className="w-32 h-24">
                  {/* Upload cloud */}
                  <path d="M60 80 Q40 80 40 100 Q40 120 60 120 L140 120 Q160 120 160 100 Q160 80 140 80" 
                        fill="none" stroke="var(--accent)" strokeWidth="2" />
                  {/* Upload arrow */}
                  <line x1="100" y1="60" x2="100" y2="100" stroke="var(--accent)" strokeWidth="2" />
                  <line x1="85" y1="85" x2="100" y2="60" stroke="var(--accent)" strokeWidth="2" />
                  <line x1="115" y1="85" x2="100" y2="60" stroke="var(--accent)" strokeWidth="2" />
                  {/* File indicators */}
                  <circle cx="100" cy="105" r="3" fill="var(--accent)" opacity="0.7" />
                  <circle cx="95" cy="110" r="2" fill="var(--accent)" opacity="0.5" />
                  <circle cx="105" cy="110" r="2" fill="var(--accent)" opacity="0.5" />
                </svg>
              </div>
              <div className="p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <Upload className="h-7 w-7 text-[var(--accent)]" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-[var(--text-main)]">
                  Plannen Uploaden
                </h3>
                <p className="mt-3 text-[var(--text-soft)]">
                  Upload bestanden, plannen en documenten veilig per project in een duidelijke, georganiseerde omgeving.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] overflow-hidden transition hover:border-[var(--accent)]/50 hover:shadow-lg">
              <div className="h-40 bg-[linear-gradient(135deg,rgba(242,140,58,0.15),rgba(242,140,58,0.05))] flex items-center justify-center">
                <svg viewBox="0 0 200 150" className="w-32 h-24">
                  {/* Status dashboard */}
                  <rect x="50" y="40" width="100" height="60" fill="none" stroke="var(--accent)" strokeWidth="2" rx="4" />
                  {/* Status bars */}
                  <rect x="60" y="50" width="25" height="8" fill="var(--accent)" opacity="0.3" rx="2" />
                  <rect x="60" y="65" width="35" height="8" fill="var(--accent)" opacity="0.6" rx="2" />
                  <rect x="60" y="80" width="40" height="8" fill="var(--accent)" rx="2" />
                  {/* Progress indicator */}
                  <circle cx="140" cy="75" r="12" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.3" />
                  <circle cx="140" cy="75" r="12" fill="none" stroke="var(--accent)" strokeWidth="2" 
                          strokeDasharray="18.85 75.4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <Eye className="h-7 w-7 text-[var(--accent)]" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-[var(--text-main)]">
                  Live Status Volgen
                </h3>
                <p className="mt-3 text-[var(--text-soft)]">
                  Zie in real-time of een project ingediend, in behandeling, klaar voor betaling of volledig afgerond is.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] overflow-hidden transition hover:border-[var(--accent)]/50 hover:shadow-lg">
              <div className="h-40 bg-[linear-gradient(135deg,rgba(242,140,58,0.15),rgba(242,140,58,0.05))] flex items-center justify-center">
                <svg viewBox="0 0 200 150" className="w-32 h-24">
                  {/* Download arrow */}
                  <path d="M100 40 L100 90 M85 75 L100 90 L115 75" 
                        fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Download document */}
                  <rect x="60" y="100" width="80" height="35" fill="none" stroke="var(--accent)" strokeWidth="2" rx="4" />
                  <line x1="80" y1="110" x2="120" y2="110" stroke="var(--accent)" strokeWidth="1.5" opacity="0.6" />
                  <line x1="80" y1="120" x2="120" y2="120" stroke="var(--accent)" strokeWidth="1.5" opacity="0.6" />
                  <line x1="80" y1="125" x2="110" y2="125" stroke="var(--accent)" strokeWidth="1.5" opacity="0.4" />
                </svg>
              </div>
              <div className="p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <FileDown className="h-7 w-7 text-[var(--accent)]" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-[var(--text-main)]">
                  3D-Bestanden Downloaden
                </h3>
                <p className="mt-3 text-[var(--text-soft)]">
                  Ontvang afgewerkte 3D-bestanden en projectdocumenten direct zodra het project klaar is.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Dark with Image */}
      <section className="border-b border-[var(--border-soft)] bg-[#1a1a1a] relative overflow-hidden py-20 lg:py-28">
        {/* Textured background */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" className="w-full h-full">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="2" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent)]">
                Diagnost. Gegeven
              </p>
              <h2 className="mt-4 text-4xl font-black text-white sm:text-5xl leading-tight">
                Vertrouw op diagnostische gegevens op afstand
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Met onze cloud-oplossing is ondersteuning op afstand efficienter dan ooit. Uw team krijgt een compleet overzicht van de status van alle machines. Diagnostische gegevens en continue statuscontroles zorgen voor minimale uitval.
              </p>
              <p className="mt-4 text-lg leading-8 text-gray-400">
                Ondersteuning over-the-air is gemakkelijker dan ooit. Ons team heeft toegang tot diagnostische gegevens en kan problemen op afstand oplossen. Snelle ondersteuning = minimale stilstand.
              </p>

              <div className="mt-10 space-y-4">
                <div className="flex gap-3">
                  <svg className="h-6 w-6 shrink-0 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-200">Real-time monitoringvan alle machines</p>
                </div>
                <div className="flex gap-3">
                  <svg className="h-6 w-6 shrink-0 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-200">Diagnostische back-ups en herstel</p>
                </div>
                <div className="flex gap-3">
                  <svg className="h-6 w-6 shrink-0 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-200">24/7 ondersteuning op afstand</p>
                </div>
              </div>
            </div>

            {/* Product Screenshot */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-md">
                <div className="rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
                  {/* Screen content */}
                  <div className="bg-gradient-to-br from-[var(--bg-card)] to-[#2a2a2a] p-4">
                    <svg viewBox="0 0 320 240" className="w-full h-full">
                      {/* Header with controls */}
                      <rect width="320" height="32" fill="#1a1a1a" />
                      <circle cx="16" cy="16" r="3" fill="var(--accent)" />
                      <circle cx="28" cy="16" r="3" fill="rgba(242,140,58,0.5)" />
                      <circle cx="40" cy="16" r="3" fill="rgba(242,140,58,0.3)" />

                      {/* Dashboard display */}
                      <rect x="8" y="40" width="304" height="50" fill="var(--accent)" opacity="0.1" rx="4" />
                      <rect x="8" y="50" width="80" height="10" fill="var(--accent)" rx="2" opacity="0.6" />
                      <rect x="100" y="50" width="60" height="10" fill="var(--accent)" rx="2" opacity="0.4" />
                      <rect x="170" y="50" width="70" height="10" fill="var(--accent)" rx="2" opacity="0.5" />

                      {/* Status indicators */}
                      <circle cx="20" cy="100" r="8" fill="var(--accent)" opacity="0.8" />
                      <circle cx="60" cy="100" r="8" fill="rgba(34,197,94,0.6)" />
                      <circle cx="100" cy="100" r="8" fill="rgba(239,68,68,0.5)" />

                      {/* Data graph */}
                      <polyline points="20,150 60,120 100,140 140,100 180,130 220,110 260,125 300,115" 
                                fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.7" />

                      {/* Progress bars */}
                      <rect x="20" y="170" width="280" height="4" fill="rgba(242,140,58,0.1)" rx="2" />
                      <rect x="20" y="170" width="210" height="4" fill="var(--accent)" rx="2" />

                      {/* Footer info */}
                      <rect x="20" y="190" width="50" height="8" fill="var(--accent)" opacity="0.3" rx="1" />
                      <rect x="80" y="190" width="70" height="8" fill="var(--accent)" opacity="0.5" rx="1" />
                      <rect x="160" y="190" width="60" height="8" fill="var(--accent)" opacity="0.3" rx="1" />
                    </svg>
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-xl bg-[linear-gradient(135deg,var(--accent)/15,transparent)] blur-2xl -z-10 scale-110" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features with Image - Light background */}
      <section className="border-b border-[var(--border-soft)] bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left content */}
            <div>
              <h2 className="text-4xl font-black text-black sm:text-5xl leading-tight">
                Een aansluitpunt voor alle oplossingen
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-700">
                Synchroniseer projecten, bestanden en instellingen automatisch op al je machines zonder je bureau te verlaten. Ontvang gegevens rechtstreeks van de bouwplaats.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 10a3 3 0 100-6 3 3 0 000 6zM17 16s-1 0-1-1 0-3 3-3 3 0 3 3-1 1-1 1H17z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-black">Upload op afstand</h3>
                    <p className="mt-1 text-gray-600">Projectbestanden rechtstreeks naar machines met GPS-meetstokken</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2c0 1.1.9 2 2 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM15 3a2 2 0 00-2 2v2c0 1.1.9 2 2 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-black">Real-time synchronisatie</h3>
                    <p className="mt-1 text-gray-600">Bestanden automatisch gesynchroniseerd tussen kantoor en machines</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-black">Configureer instellingen</h3>
                    <p className="mt-1 text-gray-600">NTRIP en geolocatie-instellingen op alle machines op afstand</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Device mockup */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* Tablet mockup */}
                <div className="rounded-2xl border-8 border-gray-800 bg-gray-900 shadow-2xl overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-[#2a3f3f] to-[#1a1a1a] p-2">
                    <svg viewBox="0 0 320 240" className="w-full h-full">
                      {/* App header */}
                      <rect width="320" height="30" fill="#f28c3a" opacity="0.8" />
                      <text x="15" y="20" fontSize="12" fontWeight="bold" fill="white">Upload Files</text>

                      {/* Main area */}
                      <rect x="10" y="45" width="300" height="120" fill="#2a2a2a" rx="4" />

                      {/* File upload zone */}
                      <rect x="20" y="60" width="280" height="80" fill="var(--bg-main)" stroke="var(--accent)" strokeWidth="2" strokeDasharray="5,5" rx="4" />
                      <text x="160" y="105" fontSize="14" textAnchor="middle" fill="var(--accent)" fontWeight="bold">Drag drop a file here</text>

                      {/* Footer buttons */}
                      <rect x="20" y="180" width="130" height="40" fill="var(--accent)" rx="4" />
                      <text x="85" y="205" fontSize="12" textAnchor="middle" fill="white" fontWeight="bold">Cancel</text>

                      <rect x="170" y="180" width="130" height="40" fill="var(--accent)" rx="4" opacity="0.6" />
                      <text x="235" y="205" fontSize="12" textAnchor="middle" fill="white" fontWeight="bold">Upload</text>
                    </svg>
                  </div>
                </div>

                {/* Laptop floating in background */}
                <div className="absolute -top-8 -right-12 w-64 opacity-60">
                  <div className="rounded-lg border-4 border-gray-700 bg-gray-800 shadow-xl overflow-hidden">
                    <div className="bg-gray-900 p-2 aspect-video flex items-center justify-center">
                      <svg viewBox="0 0 320 200" className="w-full h-full">
                        <rect width="320" height="30" fill="#2a2a2a" />
                        <rect x="10" y="40" width="300" height="140" fill="var(--bg-main)" opacity="0.3" />
                        <circle cx="160" cy="110" r="30" fill="var(--accent)" opacity="0.2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-[#1a1a1a] border-b border-[var(--border-soft)] py-20 lg:py-28">
        {/* Textured background */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" className="w-full h-full">
            <filter id="noise2">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="3" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise2)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-5xl font-black text-white sm:text-6xl leading-tight">
            BLIJF GESYNCHRONISEERD
          </h2>
          <h3 className="mt-4 text-3xl font-bold text-[var(--accent)] sm:text-4xl">
            DIEN ALLES IN VOOR 3D-PRODUCTIE
          </h3>
          <p className="mt-6 mx-auto max-w-2xl text-xl text-gray-300 leading-8">
            Beheer al je machines, projecten en bestanden vanaf een centraal platform. Dien projecten in, volg de status op en ontvang eindbestanden rechtstreeks in je portal.
          </p>

          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <Link
              href="mailto:contact@example.com"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-10 py-4 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/30 transition hover:shadow-lg hover:shadow-[var(--accent)]/40 uppercase tracking-wide"
            >
              Contact Opnemen
            </Link>

            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-xl border-2 border-[var(--accent)] px-10 py-4 text-sm font-bold text-white transition hover:bg-[var(--accent)]/10 uppercase tracking-wide"
            >
              Inloggen
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Customers Map Section */}
      <section className="border-b border-[var(--border-soft)] bg-[var(--bg-main)] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent)]">
              ONZE KLANTEN WERELDWIJD
            </p>
            <h2 className="mt-4 text-4xl font-black text-[var(--text-main)] sm:text-5xl">
              Verslaan over heel België
            </h2>
            <p className="mt-6 mx-auto max-w-2xl text-lg text-[var(--text-soft)]">
              Meer dan 500 bedrijven in Vlaanderen, Wallonië en Brussel vertrouwen op VM3D Cloud voor hun 3D-projecten.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] overflow-hidden shadow-lg">
            <CustomersMap 
              locations={[
                { name: 'Antwerpen', latitude: 51.2195, longitude: 4.4025 },
                { name: 'Brussel', latitude: 50.8503, longitude: 4.3517 },
                { name: 'Gent', latitude: 51.0543, longitude: 3.7196 },
                { name: 'Charleroi', latitude: 50.4108, longitude: 4.4446 },
                { name: 'Liège', latitude: 50.6292, longitude: 5.5693 },
                { name: 'Leuven', latitude: 50.8798, longitude: 4.7005 },
                { name: 'Mons', latitude: 50.4501, longitude: 3.9557 },
                { name: 'Tournai', latitude: 50.6041, longitude: 3.3891 },
                { name: 'Ypres', latitude: 50.8769, longitude: 2.8849 },
                { name: 'Hasselt', latitude: 50.9309, longitude: 5.3345 },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="bg-[var(--bg-main)] border-t border-[var(--border-soft)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 100 100" className="h-8 w-8">
                {/* Orange squares */}
                <rect x="10" y="10" width="20" height="20" rx="5" fill="#f28c3a" />
                <rect x="40" y="10" width="20" height="20" rx="5" fill="#f28c3a" />
                <rect x="10" y="40" width="20" height="20" rx="5" fill="#f28c3a" />
                <rect x="40" y="40" width="20" height="20" rx="5" fill="#f28c3a" />
              </svg>
              <span className="text-sm font-bold text-[var(--text-main)]">
                <span className="text-[var(--accent)]">VM3D</span>
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              © 2026 VM3D Cloud. Alle rechten voorbehouden.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}