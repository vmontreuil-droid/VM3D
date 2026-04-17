"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Minus } from "lucide-react"
import { useT } from '@/i18n/context'

export default function CustomerLogoUploadInline({ logoUrl, onUploaded }: { logoUrl?: string, onUploaded?: (url: string) => void }) {
  const { t } = useT()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(logoUrl)
  const router = useRouter()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // Show local preview immediately
      setPreview(URL.createObjectURL(file))

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/customer-logo', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || t.logoUpload.uploadFailedShort)
      }

      setUploading(false)
      onUploaded?.(result.logoUrl)
      router.refresh()
    } catch (err) {
      setUploading(false)
      setPreview(logoUrl)
      alert(err instanceof Error ? err.message : t.logoUpload.uploadFailedShort)
    }
  }

  return (
    <div className="relative group">
      {preview ? (
        <img src={preview} alt={t.logoUpload.customerLogoAlt} className="h-[88px] w-[88px] min-w-[88px] max-h-[110px] rounded-2xl object-contain bg-[var(--bg-card-2)] border border-[var(--border-soft)] shadow-sm" style={{ aspectRatio: '1/1' }} />
      ) : (
        <div className="flex h-[88px] w-[88px] min-w-[88px] max-h-[110px] items-center justify-center rounded-2xl bg-[var(--accent)]/15 border border-[var(--border-soft)] shadow-sm">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent)] opacity-90"><rect x="4" y="7" width="16" height="10" rx="2"/><path d="M4 17l4-4a2 2 0 012.8 0l2.4 2.4a2 2 0 002.8 0l2-2"/></svg>
        </div>
      )}
      {preview ? (
        <button
          type="button"
          className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg border-2 border-[var(--bg-card)] opacity-0 group-hover:opacity-100 transition"
          onClick={async () => {
            setUploading(true)
            try {
              const res = await fetch('/api/customer-logo', { method: 'DELETE' })
              if (res.ok) {
                setPreview(undefined)
                onUploaded?.('')
                router.refresh()
              }
            } catch {}
            setUploading(false)
          }}
          aria-label={t.logoUpload.removeLogoAria}
          disabled={uploading}
        >
          <Minus className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg border-2 border-[var(--bg-card)] opacity-90 hover:opacity-100 transition"
          onClick={() => fileInputRef.current?.click()}
          aria-label={t.logoUpload.uploadLogoAria}
          disabled={uploading}
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
          <span className="text-xs text-white">{t.logoUpload.uploading}</span>
        </div>
      )}
    </div>
  )
}
