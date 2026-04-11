type TicketMailInput = {
  to: string[]
  subject: string
  html: string
  text: string
}

function getApiKey() {
  return process.env.RESEND_API_KEY || process.env.TICKET_RESEND_API_KEY || ''
}

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.SITE_URL) return process.env.SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

function getFromAddress() {
  return (
    process.env.TICKET_NOTIFICATIONS_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.RESEND_FROM ||
    process.env.EMAIL_FROM ||
    ''
  )
}

export function getTicketNotificationConfig() {
  const apiKey = getApiKey()
  const fromAddress = getFromAddress()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VERCEL_URL || ''

  return {
    apiKey,
    fromAddress,
    siteUrl,
    enabled: Boolean(apiKey && fromAddress),
    missing: [
      apiKey ? null : 'RESEND_API_KEY',
      fromAddress ? null : 'TICKET_NOTIFICATIONS_FROM of RESEND_FROM_EMAIL (1 van beide)',
    ].filter(Boolean),
    warnings: [
      siteUrl ? null : 'NEXT_PUBLIC_SITE_URL of SITE_URL (aanbevolen voor correcte links)',
    ].filter(Boolean),
  }
}

export function getTicketPublicUrl(path: string) {
  return `${getBaseUrl().replace(/\/$/, '')}${path}`
}

export async function sendTicketNotificationEmail(input: TicketMailInput) {
  const config = getTicketNotificationConfig()
  const apiKey = config.apiKey
  const from = config.fromAddress
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
