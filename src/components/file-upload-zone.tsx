'use client'

import { useRef, useState } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { useT } from '@/i18n/context'

type Props = {
  name?: string
  accept?: string
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileUploadZone({ name = 'files', accept }: Props) {
  const { t } = useT()
  const tt = t.sharedUI
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)

    // Sync the native input via DataTransfer
    const dt = new DataTransfer()
    updated.forEach((f) => dt.items.add(f))
    if (inputRef.current) {
      inputRef.current.files = dt.files
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      const newFiles = [...files, ...Array.from(e.dataTransfer.files)]
      setFiles(newFiles)
      const dt = new DataTransfer()
      newFiles.forEach((f) => dt.items.add(f))
      if (inputRef.current) {
        inputRef.current.files = dt.files
      }
    }
  }

  return (
    <div className="grid gap-1.5">
      <label className="text-[11px] font-medium text-[var(--text-soft)]">
        {tt.attachmentsOptional}
      </label>

      <label
        htmlFor={`${name}-input`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-6 text-center transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/[0.03]"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10">
          <Upload className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-[12px] font-medium text-[var(--text-main)]">
            {tt.clickToSelectFiles}
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
            {tt.fileFormatHint}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          id={`${name}-input`}
          name={name}
          multiple
          accept={accept || '.dxf,.dwg,.xml,.pdf,.zip,.rar,.csv,.xlsx,.jpg,.jpeg,.png'}
          onChange={handleChange}
          className="sr-only"
        />
      </label>

      {files.length > 0 && (
        <div className="mt-1 space-y-1.5">
          <p className="text-[11px] font-medium text-[var(--text-soft)]">
            {(files.length === 1 ? tt.filesSelected : tt.filesSelectedPlural).replace('{count}', String(files.length))}
          </p>
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-[var(--accent)]" />
              <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--text-main)]">
                {file.name}
              </span>
              <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                {formatSize(file.size)}
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="shrink-0 rounded p-0.5 text-[var(--text-muted)] transition hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
