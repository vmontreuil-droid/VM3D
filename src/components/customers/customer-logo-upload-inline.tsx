"use client"
import { useRef, useState } from "react"
import { Plus } from "lucide-react"

export default function CustomerLogoUploadInline({ logoUrl, onUploaded }: { logoUrl?: string, onUploaded?: (url: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // Simuleer upload, vervang door echte upload naar Supabase of S3
      const url = URL.createObjectURL(file)
      setTimeout(() => {
        setUploading(false)
        onUploaded?.(url)
      }, 1200)
    } catch (err) {
      setUploading(false)
      alert("Uploaden mislukt")
    }
  }

  return (
    <div className="relative group">
      {logoUrl ? (
        <img src={logoUrl} alt="Klantlogo" className="h-[88px] w-[88px] min-w-[88px] max-h-[110px] rounded-2xl object-contain bg-[var(--bg-card-2)] border border-[var(--border-soft)] shadow-sm" style={{ aspectRatio: '1/1' }} />
      ) : (
        <div className="flex h-[88px] w-[88px] min-w-[88px] max-h-[110px] items-center justify-center rounded-2xl bg-[var(--accent)]/15 border border-[var(--border-soft)] shadow-sm">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent)] opacity-90"><rect x="4" y="7" width="16" height="10" rx="2"/><path d="M4 17l4-4a2 2 0 012.8 0l2.4 2.4a2 2 0 002.8 0l2-2"/></svg>
        </div>
      )}
      <button
        type="button"
        className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg border-2 border-[var(--bg-card)] opacity-90 hover:opacity-100 transition"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Logo uploaden"
        disabled={uploading}
      >
        <Plus className="h-4 w-4" />
      </button>
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
          <span className="text-xs text-white">Uploaden...</span>
        </div>
      )}
    </div>
  )
}
