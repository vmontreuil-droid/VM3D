import CustomerLogoHeaderBlock from "@/components/customers/customer-logo-header-block"
import React from "react"


import { FolderOpen, Activity, UploadCloud, Download } from 'lucide-react'

interface CustomerPortalHeaderProps {
  logoUrl?: string | null
  companyName?: string | null
  statcards?: {
    totalProjects: number
    activeProjects: number
    uploadsCount: number
    finalFilesCount: number
  }
}

export default function CustomerPortalHeader({ logoUrl, companyName, statcards }: CustomerPortalHeaderProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm mb-4">
      <div className="relative px-4 py-4 sm:px-8 flex flex-row items-center justify-between gap-6 w-full">
        <div className="flex min-w-0 md:max-w-2xl items-center">
          <div className="flex items-stretch pr-6">
            <CustomerLogoHeaderBlock logoUrl={logoUrl} />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Klantenportaal
            </p>
            <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
              Welkom{companyName ? `, ${companyName}` : ''}
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-[var(--text-soft)] sm:text-sm">
              {companyName
                ? `Welkom in het klantenportaal van ${companyName}. Hier volg je eenvoudig je lopende dossiers, uploads en opleverbestanden.`
                : `Welkom in je klantenportaal. Hier volg je eenvoudig je lopende dossiers, uploads en opleverbestanden.`}
            </p>
          </div>
        </div>
        {statcards && (
          <div className="flex gap-3 flex-wrap justify-end">
            <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.13),rgba(245,140,55,0.04))] px-5 py-4 min-w-[140px]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Werven</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--accent)]">{statcards.totalProjects}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/15">
                  <FolderOpen className="h-7 w-7 text-[var(--accent)]" />
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(76,175,80,0.13),rgba(76,175,80,0.04))] px-5 py-4 min-w-[140px]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Actief</p>
                  <p className="mt-1 text-2xl font-bold text-green-500">{statcards.activeProjects}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/15">
                  <Activity className="h-7 w-7 text-green-500" />
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(33,150,243,0.13),rgba(33,150,243,0.04))] px-5 py-4 min-w-[140px]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Uploads</p>
                  <p className="mt-1 text-2xl font-bold text-blue-500">{statcards.uploadsCount}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15">
                  <UploadCloud className="h-7 w-7 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(156,39,176,0.13),rgba(156,39,176,0.04))] px-5 py-4 min-w-[140px]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Oplevering</p>
                  <p className="mt-1 text-2xl font-bold text-purple-500">{statcards.finalFilesCount}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15">
                  <Download className="h-7 w-7 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
