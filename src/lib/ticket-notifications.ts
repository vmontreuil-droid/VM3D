type TicketMailInput = {
  to: string[]
  subject: string
  html: string
  text: string
}

type TicketMailContentInput = {
  subject: string
  html: string
  text: string
}

const MAIL_BRAND = 'VM Plan & Consult'

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

export function buildBrandedTicketEmailContent(input: TicketMailContentInput) {
  const normalizedSubject = input.subject.startsWith(`${MAIL_BRAND} |`)
    ? input.subject
    : `${MAIL_BRAND} | ${input.subject}`
  const brandUrl = getBaseUrl().replace(/\/$/, '')
  const logoUrl = `${brandUrl}/vm-logo.png`
  const decoratedText = `${input.text}\n\n---`
  const decoratedHtml = `${input.html}<hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb"/><div style="margin:0"><img src="${logoUrl}" alt="VM Plan & Consult" style="height:24px;width:auto;display:block"/></div>`

  return {
    subject: normalizedSubject,
    html: decoratedHtml,
    text: decoratedText,
  }
}

export async function sendTicketNotificationEmail(input: TicketMailInput) {
  const config = getTicketNotificationConfig()
  const apiKey = config.apiKey
  const from = config.fromAddress
  const uniqueRecipients = Array.from(new Set(input.to.map((item) => item.trim()).filter(Boolean)))

  const brandedContent = buildBrandedTicketEmailContent(input)

  if (!apiKey || !from || uniqueRecipients.length === 0) {
    return {
      sent: false,
      reason: 'not_configured' as const,
      detail: 'Mailconfig onvolledig of geen ontvanger opgegeven.',
    }
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
      subject: brandedContent.subject,
      html: brandedContent.html,
      text: brandedContent.text,
    }),
  })

  if (!response.ok) {
    const payload = await response.text()
    console.error('sendTicketNotificationEmail error:', payload)
    return {
      sent: false,
      reason: 'provider_error' as const,
      status: response.status,
      detail: payload,
    }
  }

  return { sent: true as const, detail: '' }
}
