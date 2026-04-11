'use client'

export default function ProjectSummaryActions() {
  const handlePrint = () => {
    window.print()
  }

  const handleSavePdf = () => {
    window.print()
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-card-2)]"
      >
        Print projectoverzicht
      </button>

      <button
        type="button"
        onClick={handleSavePdf}
        className="btn-primary min-h-[44px] px-4 py-2 text-sm"
      >
        Opslaan als PDF
      </button>
    </div>
  )
}