'use client'

import { useState } from 'react'
import { FileArchive, FolderOpen } from 'lucide-react'

type Props = {
  children: React.ReactNode
}

export default function UploadTypeToggle({ children }: Props) {
  const [kind, setKind] = useState<'client_upload' | 'final_file'>('client_upload')

  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3 space-y-2">
      {/* Toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-0.5">
        <button
          type="button"
          onClick={() => setKind('client_upload')}
          className={`flex-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${
            kind === 'client_upload'
              ? 'bg-[var(--accent)]/15 text-[var(--accent)] shadow-sm'
              : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
          }`}
        >
          <FolderOpen className="mr-1 inline h-3 w-3" />
          Klantbestand
        </button>
        <button
          type="button"
          onClick={() => setKind('final_file')}
          className={`flex-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${
            kind === 'final_file'
              ? 'bg-[var(--accent)]/15 text-[var(--accent)] shadow-sm'
              : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
          }`}
        >
          <FileArchive className="mr-1 inline h-3 w-3" />
          Opleverbestand
        </button>
      </div>

      <input type="hidden" name="upload_type" value={kind} />

      {children}
    </div>
  )
}
