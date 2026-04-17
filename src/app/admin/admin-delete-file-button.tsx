'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Loader } from 'lucide-react'
import { useT } from '@/i18n/context'

type Props = {
  fileId: number
  filePath: string
}

export default function AdminDeleteFileButton({ fileId, filePath }: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const { t } = useT()

  const handleDelete = async () => {
    const confirmed = window.confirm(
      t.adminFiles.deleteConfirm
    )

    if (!confirmed) return

    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const { error: storageError } = await supabase.storage
      .from('project-files')
      .remove([filePath])

    if (storageError) {
      setLoading(false)
      setMessage(`${t.adminFiles.storageError}: ${storageError.message}`)
      return
    }

    const { error: dbError } = await supabase
      .from('project_files')
      .delete()
      .eq('id', fileId)

    setLoading(false)

    if (dbError) {
      setMessage(`${t.adminFiles.dbError}: ${dbError.message}`)
      return
    }

    router.refresh()
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-[var(--danger-bg)] px-3 py-2 text-sm font-medium text-[var(--danger-text)] transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {loading ? t.adminFiles.deleting : t.adminFiles.deleteBtn}
      </button>

      {message && <p className="mt-2 text-xs text-[var(--danger-text)]">{message}</p>}
    </div>
  )
}