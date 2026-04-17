'use client'

import { useRef, useState } from 'react'
import { useT } from '@/i18n/context'

type Props = {
  name?: string
  label?: string
  description?: string
  accept?: string
  required?: boolean
}

export default function FileUploadDropzone({
  name = 'file',
  label,
  description,
  accept,
  required = false,
}: Props) {
  const { t } = useT()
  const tt = t.sharedUI
  const resolvedLabel = label || tt.uploadFile
  const resolvedDescription = description || tt.dragDropOrClick
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState('')

  function updateSelectedFile(fileList: FileList | null) {
    const file = fileList?.[0]
    setSelectedFileName(file?.name || '')
  }

  function handleDragOver(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setIsDragging(false)

    if (!inputRef.current) return

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(files[0])
    inputRef.current.files = dataTransfer.files

    updateSelectedFile(dataTransfer.files)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    updateSelectedFile(e.target.files)
  }

  function handleClick() {
    inputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-[var(--text-main)]">{resolvedLabel}</p>
        <p className="mt-1 text-xs text-[var(--text-soft)]">{resolvedDescription}</p>
      </div>

      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-4 text-center transition ${
          isDragging
            ? 'border-[var(--accent)] bg-[var(--accent)]/10'
            : 'border-[var(--accent)]/50 bg-[var(--bg-card-2)] hover:border-[var(--accent)] hover:bg-[var(--bg-card-3)]'
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <p className="mt-4 text-sm font-medium text-[var(--text-main)]">
          {tt.dropFileHere}
        </p>
        <p className="mt-1 text-xs text-[var(--text-soft)]">
          {tt.orClickToSelect}
        </p>

        {selectedFileName ? (
          <div className="mt-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-main)]">
            {tt.selected}: {selectedFileName}
          </div>
        ) : null}

        <input
          ref={inputRef}
          name={name}
          type="file"
          accept={accept}
          required={required}
          onChange={handleChange}
          className="hidden"
        />
      </label>
    </div>
  )
}