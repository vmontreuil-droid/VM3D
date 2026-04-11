type TicketMailInput = {
  to: string[]
  subject: string
  html: string
  text: string
}

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.SITE_URL) return process.env.SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

function getFromAddress() {
  return process.env.TICKET_NOTIFICATIONS_FROM || process.env.RESEND_FROM_EMAIL || ''
}

export function getTicketPublicUrl(path: string) {
  return `${getBaseUrl().replace(/\/$/, '')}${path}`
}

export async function sendTicketNotificationEmail(input: TicketMailInput) {
  const apiKey = process.env.RESEND_API_KEY
  const from = getFromAddress()
  const uniqueRecipients = Array.from(new Set(input.to.map((item) => item.trim()).filter(Boolean)))

  if (!apiKey || !from || uniqueRecipients.length === 0) {
    return { sent: false, reason: 'not_configured' as const }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: uniqueRecipients,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  })

  if (!response.ok) {
    const payload = await response.text()
    console.error('sendTicketNotificationEmail error:', payload)
    return { sent: false, reason: 'provider_error' as const }
  }

  return { sent: true as const }
}
