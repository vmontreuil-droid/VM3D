'use client'

import { useState } from 'react'
import { useT } from '@/i18n/context'
import { Download, MapPin, Cpu, Package, ChevronRight, Lock, RefreshCw, Send } from 'lucide-react'
import type { Region, VendorPack } from './manifest'

const VENDOR_STYLES: Record<string, { dot: string; border: string; bg: string; text: string; hover: string }> = {
  topcon: {
    dot: 'bg-blue-500',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/8',
    text: 'text-blue-400',
    hover: 'hover:border-blue-500/50 hover:bg-blue-500/12',
  },
  leica: {
    dot: 'bg-red-500',
    border: 'border-red-500/30',
    bg: 'bg-red-500/8',
    text: 'text-red-400',
    hover: 'hover:border-red-500/50 hover:bg-red-500/12',
  },
  unicontrol: {
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/8',
    text: 'text-emerald-400',
    hover: 'hover:border-emerald-500/50 hover:bg-emerald-500/12',
  },
}

export default function GeoSetupWizard({ regions }: { regions: Region[] }) {
  const { t } = useT()
  const tt = t.adminGeoSetup

  const [regionCode, setRegionCode] = useState<string | null>(null)
  const [vendorCode, setVendorCode] = useState<string | null>(null)

  const region = regionCode ? regions.find(r => r.code === regionCode) ?? null : null
  const vendor: VendorPack | null = region && vendorCode ? region.vendors.find(v => v.vendor === vendorCode) ?? null : null

  function resetRegion() {
    setRegionCode(null)
    setVendorCode(null)
  }
  function resetVendor() {
    setVendorCode(null)
  }

  function downloadFile(filename: string) {
    if (!region || !vendor) return
    const url = `/geo/${region.code}/${vendor.vendor}/${filename}`
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="space-y-5">
      {/* Step 1 — Region */}
      <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/12 text-sky-400">
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-main)]">{tt.step1Title}</h2>
              <p className="text-[11px] text-[var(--text-soft)]">{tt.step1Desc}</p>
            </div>
          </div>
          {region && (
            <button
              type="button"
              onClick={resetRegion}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-soft)] transition hover:border-[var(--accent)]/40 hover:text-[var(--text-main)]"
            >
              <RefreshCw className="h-3 w-3" /> {tt.changeRegion}
            </button>
          )}
        </header>

        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
          {regions.map(r => {
            const active = r.code === regionCode
            return (
              <button
                key={r.code}
                type="button"
                onClick={() => { setRegionCode(r.code); setVendorCode(null) }}
                className={`group flex flex-col items-start gap-2 rounded-xl border bg-[var(--bg-card)] px-3.5 py-3 text-left transition ${
                  active
                    ? 'border-[var(--accent)]/60 bg-[linear-gradient(90deg,rgba(245,140,55,0.18),rgba(245,140,55,0.04))] shadow-[0_4px_12px_-6px_rgba(245,140,55,0.35)]'
                    : 'border-[var(--border-soft)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-2xl leading-none">{r.flag}</span>
                  {active && <ChevronRight className="h-4 w-4 text-[var(--accent)]" />}
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold ${active ? 'text-[var(--accent)]' : 'text-[var(--text-main)]'}`}>
                    {r.name}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                    {r.crs} · {r.epsg}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Step 2 — Vendor */}
      <section
        className={`overflow-hidden rounded-2xl border transition ${
          region ? 'border-[var(--border-soft)] bg-[var(--bg-card-2)]' : 'border-[var(--border-soft)]/40 bg-[var(--bg-card-2)]/40'
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${region ? 'bg-amber-500/12 text-amber-400' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
              {region ? <Cpu className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </span>
            <div>
              <h2 className={`text-sm font-semibold ${region ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                {tt.step2Title}
              </h2>
              <p className="text-[11px] text-[var(--text-soft)]">{tt.step2Desc}</p>
            </div>
          </div>
          {vendor && (
            <button
              type="button"
              onClick={resetVendor}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-soft)] transition hover:border-[var(--accent)]/40 hover:text-[var(--text-main)]"
            >
              <RefreshCw className="h-3 w-3" /> {tt.changeVendor}
            </button>
          )}
        </header>

        {region ? (
          <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-3">
            {region.vendors.map(v => {
              const style = VENDOR_STYLES[v.vendor]
              const active = v.vendor === vendorCode
              const availableCount = v.files.filter(f => f.available).length
              return (
                <button
                  key={v.vendor}
                  type="button"
                  onClick={() => setVendorCode(v.vendor)}
                  className={`flex items-center justify-between gap-3 rounded-xl border bg-[var(--bg-card)] px-3.5 py-3 text-left transition ${
                    active
                      ? `${style.border} ${style.bg} shadow-sm`
                      : `border-[var(--border-soft)] ${style.hover}`
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                    <div>
                      <p className={`text-sm font-semibold ${active ? style.text : 'text-[var(--text-main)]'}`}>
                        {v.vendorName}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {availableCount}/{v.files.length} {tt.kpiAvailable.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  {active && <ChevronRight className={`h-4 w-4 ${style.text}`} />}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
            {tt.step1Desc}
          </div>
        )}
      </section>

      {/* Step 3 — Package */}
      <section
        className={`overflow-hidden rounded-2xl border transition ${
          vendor ? 'border-[var(--border-soft)] bg-[var(--bg-card-2)]' : 'border-[var(--border-soft)]/40 bg-[var(--bg-card-2)]/40'
        }`}
      >
        <header className="flex items-center gap-2.5 border-b border-[var(--border-soft)] px-4 py-3">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${vendor ? 'bg-violet-500/12 text-violet-400' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
            {vendor ? <Package className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </span>
          <div>
            <h2 className={`text-sm font-semibold ${vendor ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
              {tt.step3Title}
            </h2>
            <p className="text-[11px] text-[var(--text-soft)]">{tt.step3Desc}</p>
          </div>
        </header>

        {region && vendor ? (
          <div className="space-y-4 p-4">
            {/* Pack metadata */}
            <div className="grid gap-2 sm:grid-cols-3">
              <InfoTile label={tt.crsLabel} value={region.crs} />
              <InfoTile label={tt.epsgLabel} value={region.epsg} mono />
              <InfoTile label={tt.geoidLabel} value={region.geoid} />
            </div>

            {/* Files */}
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
              <p className="border-b border-[var(--border-soft)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {tt.filesLabel}
              </p>
              <ul className="divide-y divide-[var(--border-soft)]">
                {vendor.files.map(f => (
                  <li key={f.filename} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-semibold text-[var(--text-main)]">
                        {f.filename}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--text-soft)]">
                        {f.description}
                      </p>
                    </div>
                    {f.available ? (
                      <button
                        type="button"
                        onClick={() => downloadFile(f.filename)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/15"
                      >
                        <Download className="h-3.5 w-3.5" /> {tt.download}
                      </button>
                    ) : (
                      <span
                        title={tt.notAvailableHint}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)]"
                      >
                        <Lock className="h-3.5 w-3.5" /> {tt.notAvailable}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Phase 2 — push to machine */}
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-[var(--accent)]/30 bg-[var(--accent)]/4 px-4 py-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                <Send className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--text-main)]">{tt.pushSoonTitle}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">{tt.pushSoonDesc}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                {tt.pushSoon}
              </span>
            </div>
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
            {tt.step2Desc}
          </div>
        )}
      </section>
    </div>
  )
}

function InfoTile({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5">
      <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-[var(--text-main)] ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
