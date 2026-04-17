'use client'

import { useState } from 'react'
import { ImageUp, Trash2 } from 'lucide-react'
import { useT } from '@/i18n/context'

type Props = {
  customerId?: string
  initialPath?: string | null
  initialPreviewUrl?: string | null
}

export default function CustomerLogoUpload({
  customerId,
  initialPath,
  initialPreviewUrl,
}: Props) {
  const { t } = useT()
  const [logoPath, setLogoPath] = useState(initialPath || '')
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl || '')
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)
    setMessage('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.set('file', file)

      if (customerId) {
        formData.set('customerId', customerId)
      }

      if (logoPath) {
        formData.set('existingPath', logoPath)
      }

      const response = await fetch('/api/admin/customer-logo', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as {
        error?: string
        filePath?: string
        previewUrl?: string
      }

      if (!response.ok || !data.filePath) {
        setMessage(data.error || t.logoUpload.uploadFailed)
        return
      }

      setLogoPath(data.filePath)
      setPreviewUrl(data.previewUrl || localPreview)
      setMessage(t.logoUpload.uploaded)
    } catch (error) {
      console.error('customer logo upload error:', error)
      setMessage(t.logoUpload.errorUploading)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleClear = () => {
    setLogoPath('')
    setPreviewUrl('')
    setMessage(t.logoUpload.willBeRemoved)
  }

  return (
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
      <input type="hidden" name="logo_path" value={logoPath} />

      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
          <ImageUp className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {t.logoUpload.companyLogo}
          </p>
          <p className="mt-1 text-xs text-[var(--text-soft)]">
            {t.logoUpload.companyLogoDesc}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_210px]">
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
          <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {t.logoUpload.uploadLogo}
          </label>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileChange}
            disabled={uploading}
            className="mt-3 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-main)] outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--bg-card-2)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-60"
          />

          <p className="mt-2 text-xs text-[var(--text-soft)]">
            {t.logoUpload.logoTip}
          </p>

          {message ? (
            <p className="mt-2 text-xs text-[var(--text-soft)]">{message}</p>
          ) : null}

          {logoPath ? (
            <button
              type="button"
              onClick={handleClear}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-main)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t.logoUpload.clear}
            </button>
          ) : null}
        </div>

        <div className="flex min-h-[160px] items-center justify-center overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={t.logoUpload.logoPreviewAlt}
              className="max-h-[120px] w-full object-contain"
            />
          ) : (
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--text-main)]">
                {t.logoUpload.noLogo}
              </p>
              <p className="mt-1 text-xs text-[var(--text-soft)]">
                {t.logoUpload.previewHint}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
