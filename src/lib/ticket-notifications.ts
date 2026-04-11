type TicketMailInput = {
  to: string[]
  subject: string
  html: string
  text: string
}

function pickFirstEnv(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]
    if (value && value.trim()) {
      return { key, value: value.trim() }
    }
  }

  return { key: null as string | null, value: '' }
}

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.SITE_URL) return process.env.SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

function getFromAddress() {
  return pickFirstEnv([
    'TICKET_NOTIFICATIONS_FROM',
    'RESEND_FROM_EMAIL',
    'RESEND_FROM',
    'EMAIL_FROM',
    'NEXT_PUBLIC_RESEND_FROM_EMAIL',
    'NEXT_PUBLIC_EMAIL_FROM',
  ])
}

export function getTicketNotificationConfig() {
  const apiKeyMatch = pickFirstEnv([
    'RESEND_API_KEY',
    'TICKET_RESEND_API_KEY',
    'RESEND_API_TOKEN',
    'NEXT_PUBLIC_RESEND_API_KEY',
  ])
  const fromAddressMatch = getFromAddress()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VERCEL_URL || ''

  return {
    apiKey: apiKeyMatch.value,
    fromAddress: fromAddressMatch.value,
    apiKeyKey: apiKeyMatch.key,
    fromAddressKey: fromAddressMatch.key,
    siteUrl,
    enabled: Boolean(apiKeyMatch.value && fromAddressMatch.value),
    missing: [
      apiKeyMatch.value ? null : 'RESEND_API_KEY (of alias)',
      fromAddressMatch.value
        ? null
        : 'TICKET_NOTIFICATIONS_FROM of RESEND_FROM_EMAIL (1 van beide)',
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
