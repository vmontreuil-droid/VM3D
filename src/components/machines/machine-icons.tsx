/** custom SVG machine icons — excavators & bulldozers, brand-colored */

type IconProps = { className?: string; size?: number }

/** Rupsgraafkraan / excavator silhouette */
export function ExcavatorIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" className={className}>
      {/* Tracks */}
      <rect x="4" y="48" width="36" height="10" rx="5" fill="currentColor" opacity="0.25" />
      <rect x="6" y="50" width="32" height="6" rx="3" fill="currentColor" opacity="0.15" />
      {/* Body / cab */}
      <rect x="6" y="36" width="28" height="14" rx="3" fill="currentColor" opacity="0.6" />
      <rect x="8" y="38" width="10" height="8" rx="1.5" fill="currentColor" opacity="0.3" />
      {/* Boom */}
      <path d="M30 40 L44 22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      {/* Stick */}
      <path d="M44 22 L56 34" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
      {/* Bucket */}
      <path d="M56 34 L60 38 L54 42 L50 36 Z" fill="currentColor" opacity="0.5" />
      <path d="M60 38 L62 40 L60 42 L58 41" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      {/* Hydraulic cylinder accents */}
      <path d="M34 38 L42 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <path d="M46 24 L52 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      {/* Cab window detail */}
      <rect x="9" y="39" width="8" height="5" rx="1" fill="currentColor" opacity="0.15" />
    </svg>
  )
}

/** Bulldozer / dozer silhouette */
export function BulldozerIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" className={className}>
      {/* Tracks */}
      <rect x="12" y="46" width="40" height="12" rx="6" fill="currentColor" opacity="0.25" />
      <rect x="14" y="48" width="36" height="8" rx="4" fill="currentColor" opacity="0.15" />
      {/* Body */}
      <rect x="16" y="32" width="32" height="16" rx="3" fill="currentColor" opacity="0.55" />
      {/* Cab */}
      <rect x="32" y="22" width="14" height="12" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="34" y="24" width="10" height="7" rx="1" fill="currentColor" opacity="0.25" />
      {/* Blade */}
      <path d="M6 36 L14 32 L14 52 L6 48 Z" fill="currentColor" opacity="0.65" />
      <path d="M4 34 L6 36 L6 48 L4 50 Z" fill="currentColor" opacity="0.45" />
      {/* Push arm */}
      <path d="M14 42 L16 42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      {/* Exhaust stack */}
      <rect x="28" y="18" width="3" height="8" rx="1" fill="currentColor" opacity="0.35" />
      {/* Ripper (rear) */}
      <path d="M48 48 L54 52 L56 58 L52 56 L50 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  )
}

/** Brand logo color mapping */
export const BRAND_COLORS: Record<string, string> = {
  CAT: '#FFCB05',        // Caterpillar yellow
  KOMATSU: '#005BAC',    // Komatsu blue
  HITACHI: '#E60012',    // Hitachi orange-red
  DEVELON: '#FF6600',    // Develon (Doosan) orange
  DOOSAN: '#FF6600',     // legacy Doosan orange
  VOLVO: '#003057',      // Volvo dark blue
  LIEBHERR: '#FFD100',   // Liebherr yellow
  HYUNDAI: '#002C5F',    // Hyundai dark blue
  KOBELCO: '#0068B7',    // Kobelco blue
  JCB: '#F7C948',        // JCB yellow
  CASE: '#CC0000',       // Case IH red
  TAKEUCHI: '#E31837',   // Takeuchi red
  KUBOTA: '#F58220',     // Kubota orange
  SANY: '#D71920',       // SANY red
  ZOOMLION: '#009944',   // Zoomlion green
}

/** Guidance system badge colors */
export const GUIDANCE_COLORS: Record<string, { bg: string; text: string }> = {
  UNICONTROL: { bg: 'bg-sky-500/15', text: 'text-sky-400' },
  TRIMBLE: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  TOPCON: { bg: 'bg-red-500/15', text: 'text-red-400' },
  LEICA: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  CHCNAV: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
}

/** Get the appropriate machine icon */
export function MachineIcon({ type, className, size }: { type: string } & IconProps) {
  if (type === 'bulldozer') return <BulldozerIcon className={className} size={size} />
  return <ExcavatorIcon className={className} size={size} />
}

/** Format tonnage display */
export function formatTonnage(t: number): string {
  if (t < 1) return `${Math.round(t * 1000)} kg`
  return `${t}T`
}
