import { createAdminClient } from '@/lib/supabase/admin'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_EXTENSIONS = new Set([
  '.dxf', '.dwg', '.xml', '.pdf', '.zip', '.rar',
  '.csv', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.webp',
])

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 200)
}

export async function uploadTicketFiles(
  formData: FormData,
  ticketId: string | number,
): Promise<{ uploaded: string[]; errors: string[] }> {
  const files = formData.getAll('files') as File[]
  const validFiles = files.filter(
    (f) => f instanceof File && f.size > 0 && f.name,
  )

  if (validFiles.length === 0) {
    return { uploaded: [], errors: [] }
  }

  const adminSupabase = createAdminClient()
  const uploaded: string[] = []
  const errors: string[] = []

  for (const file of validFiles) {
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: te groot (max 50MB)`)
      continue
    }

    const ext = file.name.includes('.')
      ? `.${file.name.split('.').pop()?.toLowerCase()}`
      : ''
    if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
      errors.push(`${file.name}: type niet toegestaan`)
      continue
    }

    const safeName = sanitizeFileName(file.name)
    const storagePath = `tickets/${ticketId}/${Date.now()}_${safeName}`

    const { error: uploadError } = await adminSupabase.storage
      .from('project-files')
      .upload(storagePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error(`Upload failed for ${file.name}:`, uploadError)
      errors.push(`${file.name}: upload mislukt`)
      continue
    }

    uploaded.push(safeName)
  }

  // Append file list to ticket description
  if (uploaded.length > 0) {
    const { data: ticket } = await adminSupabase
      .from('tickets')
      .select('description')
      .eq('id', ticketId)
      .single()

    const fileListText = `\n\n📎 Bijlagen (${uploaded.length}):\n${uploaded.map((f) => `• ${f}`).join('\n')}`
    const updatedDescription = (ticket?.description || '') + fileListText

    await adminSupabase
      .from('tickets')
      .update({ description: updatedDescription })
      .eq('id', ticketId)
  }

  return { uploaded, errors }
}
