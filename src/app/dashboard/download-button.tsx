'use client'

import { createClient } from '@/lib/supabase/client'
import { Download } from 'lucide-react'
import { useT } from '@/i18n/context'

type Props = {
  filePath: string
  fileName: string
}

export default function DownloadButton({ filePath, fileName }: Props) {
  const { t } = useT()
  const handleDownload = async () => {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from('project-files')
      .createSignedUrl(filePath, 60)

    if (error) {
      alert(`${t.dash.downloadError}: ${error.message}`)
      return
    }

    if (!data?.signedUrl) {
      alert(t.dash.noDownloadLink)
      return
    }

    const link = document.createElement('a')
    link.href = data.signedUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-card-2)]"
    >
      <Download className="h-4 w-4" />
      {t.dash.download}
    </button>
  )
}