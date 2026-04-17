'use client'

import { FileText, FileArchive, File, Image, Video, Music, FileQuestion } from 'lucide-react'
import { useT } from '@/i18n/context'

type FileItem = {
  id: string
  file_name: string
  file_type?: string | null
  created_at?: string | null
  signedUrl?: string | null
}

type Props = {
  files: FileItem[]
}

function getFileExtension(name: string) {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop()?.toUpperCase() ?? 'FILE' : 'FILE'
}

function getFileIcon(extension: string) {
  const ext = extension.toLowerCase()
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) {
    return <FileText className="h-4 w-4" />
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileArchive className="h-4 w-4" />
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) {
    return <Image className="h-4 w-4" />
  }
  if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) {
    return <Video className="h-4 w-4" />
  }
  if (['mp3', 'wav', 'flac'].includes(ext)) {
    return <Music className="h-4 w-4" />
  }
  return <File className="h-4 w-4" />
}

function formatDate(date: string | null | undefined, locale: string) {
  if (!date) return '—'
  const loc = locale === 'fr' ? 'fr-BE' : locale === 'en' ? 'en-US' : 'nl-BE'
  return new Date(date).toLocaleDateString(loc)
}

export default function FileList({ files }: Props) {
  const { t, locale } = useT()
  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <FileQuestion className="h-12 w-12 text-[var(--text-muted)] mb-3" />
        <p className="text-sm text-[var(--text-soft)]">
          {t.fileList.noFilesFound}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 px-4 py-4">
      {files.map((file) => {
        const extension = getFileExtension(file.file_name)

        return (
          <div
            key={file.id}
            className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4 transition hover:bg-[var(--bg-card-3)]"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {getFileIcon(extension)}
                  <span className="badge-neutral text-xs px-2 py-1">
                    {extension}
                  </span>
                  <p className="truncate font-semibold text-[var(--text-main)]">
                    {file.file_name}
                  </p>
                </div>

                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  {file.file_type === 'client_upload'
                    ? t.fileList.clientUpload
                    : file.file_type === 'final_file'
                    ? t.fileList.deliveryFile
                    : t.fileList.fileLabel}
                </p>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {formatDate(file.created_at, locale)}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                {file.signedUrl ? (
                  <>
                    <a
                      href={file.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-xs px-3 py-1"
                    >
                      {t.fileList.view}
                    </a>

                    <a
                      href={file.signedUrl}
                      download={file.file_name}
                      className="btn-secondary text-xs px-3 py-1"
                    >
                      {t.fileList.download}
                    </a>
                  </>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">
                    {t.fileList.noLink}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}