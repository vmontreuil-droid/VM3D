import { ImageResponse } from 'next/og'
import { cookies } from 'next/headers'
import { locales, defaultLocale, COOKIE_NAME, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

export const alt = 'MV3D Cloud'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value ?? defaultLocale
  const locale: Locale = (locales as readonly string[]).includes(raw)
    ? (raw as Locale)
    : defaultLocale
  const t = getDictionary(locale)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #08111d 0%, #0f1d2f 50%, #162338 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Topographic pattern overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.06,
            display: 'flex',
          }}
        >
          <svg
            width="1200"
            height="630"
            viewBox="0 0 1200 630"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0,100 C200,50 400,150 600,80 C800,10 1000,120 1200,60" stroke="#f7941d" strokeWidth="2" />
            <path d="M0,200 C200,150 400,250 600,180 C800,110 1000,220 1200,160" stroke="#f7941d" strokeWidth="2" />
            <path d="M0,300 C200,250 400,350 600,280 C800,210 1000,320 1200,260" stroke="#f7941d" strokeWidth="2" />
            <path d="M0,400 C200,350 400,450 600,380 C800,310 1000,420 1200,360" stroke="#f7941d" strokeWidth="2" />
            <path d="M0,500 C200,450 400,550 600,480 C800,410 1000,520 1200,460" stroke="#f7941d" strokeWidth="2" />
          </svg>
        </div>

        {/* Accent glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(247,148,29,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px 90px',
            flex: 1,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Logo area */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '40px',
            }}
          >
            {/* Logo icon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '72px',
                height: '72px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #f7941d, #e8850f)',
                boxShadow: '0 8px 32px rgba(247,148,29,0.35)',
              }}
            >
              <span style={{ fontSize: '36px', fontWeight: 900, color: 'white', fontFamily: 'Arial' }}>
                M
              </span>
            </div>
            <span style={{ fontSize: '42px', fontWeight: 800, color: '#f8fafc', fontFamily: 'Arial', letterSpacing: '-1px' }}>
              MV3D.CLOUD
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '52px',
              fontWeight: 800,
              color: '#f8fafc',
              lineHeight: 1.15,
              fontFamily: 'Arial',
              marginBottom: '24px',
              maxWidth: '900px',
            }}
          >
            {t.og.imageTitle}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '26px',
              color: '#9fb0c3',
              lineHeight: 1.4,
              fontFamily: 'Arial',
              maxWidth: '800px',
            }}
          >
            {t.og.imageSubtitle}
          </div>

          {/* Bottom bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '40px',
              marginTop: '50px',
            }}
          >
            {/* Stats */}
            {[
              { val: '85', label: '3D Agents' },
              { val: '850+', label: locale === 'nl' ? 'Werven' : locale === 'fr' ? 'Chantiers' : 'Projects' },
              { val: '99.9%', label: 'Uptime' },
              { val: '4', label: locale === 'nl' ? 'Landen' : locale === 'fr' ? 'Pays' : 'Countries' },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, color: '#f7941d', fontFamily: 'Arial' }}>
                  {s.val}
                </span>
                <span style={{ fontSize: '14px', color: '#71859a', fontFamily: 'Arial', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, transparent, #f7941d 30%, #f7941d 70%, transparent)',
            display: 'flex',
          }}
        />

        {/* URL badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            right: '60px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            borderRadius: '12px',
            background: 'rgba(247,148,29,0.12)',
            border: '1px solid rgba(247,148,29,0.25)',
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#f7941d', fontFamily: 'Arial' }}>
            mv3d.be
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
