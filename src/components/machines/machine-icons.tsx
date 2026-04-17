/** Custom SVG machine icons — cranes & bulldozers.
 *  Bold, high-contrast pictograms (highway-sign style) that stay legible at 16–64px.
 *  Color flows from `currentColor`, so the parent decides the tone.
 */

type IconProps = { className?: string; size?: number; title?: string }

// ---------------------------------------------------------------------------
// Shared bits — tracks underneath
// ---------------------------------------------------------------------------
function Tracks({ w = 46, cy = 54, inset = 4 }: { w?: number; cy?: number; inset?: number }) {
  const x = 32 - w / 2
  return (
    <g fill="currentColor">
      <rect x={x} y={cy - 5} width={w} height="10" rx="5" />
      <rect x={x + inset} y={cy - 2.5} width={w - inset * 2} height="5" rx="2.5" fill="#000" fillOpacity="0.35" />
      {/* wheels */}
      <circle cx={x + 5} cy={cy} r="2.2" fill="#000" fillOpacity="0.45" />
      <circle cx={x + w - 5} cy={cy} r="2.2" fill="#000" fillOpacity="0.45" />
    </g>
  )
}

// ---------------------------------------------------------------------------
// CRANES (excavators) — 10 variants
// ---------------------------------------------------------------------------

/** Mini-graver (≤ 3t) */
export function MiniExcavatorIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={34} cy={54} />
      <rect x="18" y="36" width="20" height="14" rx="2" fill="currentColor" />
      <rect x="20" y="38" width="9" height="8" rx="1" fill="#000" fillOpacity="0.35" />
      <path d="M34 40 L46 28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M46 28 L54 36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M54 36 L58 40 L52 42 L50 38 Z" fill="currentColor" />
    </svg>
  )
}

/** Standaard rupsgraafkraan (8–25t) */
export function ExcavatorIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={44} cy={54} />
      <rect x="10" y="32" width="30" height="18" rx="3" fill="currentColor" />
      <rect x="13" y="35" width="12" height="10" rx="1.5" fill="#000" fillOpacity="0.4" />
      {/* Boom */}
      <path d="M35 36 L50 20" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      {/* Stick */}
      <path d="M50 20 L60 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {/* Bucket */}
      <path d="M60 32 L62 38 L54 42 L50 36 Z" fill="currentColor" />
      <path d="M54 42 L53 44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M56 42 L55.5 44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M58 41.5 L57.5 43.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Hydraulic cylinder */}
      <path d="M38 35 L46 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

/** Grote rupskraan (30–60t) */
export function HeavyExcavatorIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={52} cy={54} />
      <rect x="8" y="30" width="34" height="20" rx="3" fill="currentColor" />
      <rect x="11" y="33" width="13" height="11" rx="1.5" fill="#000" fillOpacity="0.4" />
      <rect x="26" y="33" width="14" height="6" rx="1" fill="#000" fillOpacity="0.25" />
      <path d="M36 33 L54 18" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path d="M54 18 L62 30" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M62 30 L62 40 L52 42 L50 36 Z" fill="currentColor" />
      <path d="M52 42 L51 45 M56 42 L55 45 M59 41.5 L58.5 44.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Long-reach / sloopkraan */
export function LongReachExcavatorIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={40} cy={54} />
      <rect x="12" y="36" width="26" height="14" rx="3" fill="currentColor" />
      <rect x="14" y="38" width="10" height="9" rx="1" fill="#000" fillOpacity="0.4" />
      <path d="M32 38 L56 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M56 10 L60 30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M60 30 L58 38 L54 36 L56 30 Z" fill="currentColor" />
    </svg>
  )
}

/** Wielkraan (bandengraafmachine) */
export function WheelExcavatorIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <rect x="6" y="32" width="34" height="18" rx="3" fill="currentColor" />
      <rect x="10" y="34" width="12" height="10" rx="1" fill="#000" fillOpacity="0.4" />
      <circle cx="14" cy="54" r="6" fill="currentColor" />
      <circle cx="14" cy="54" r="2.5" fill="#000" fillOpacity="0.5" />
      <circle cx="32" cy="54" r="6" fill="currentColor" />
      <circle cx="32" cy="54" r="2.5" fill="#000" fillOpacity="0.5" />
      <path d="M34 36 L50 22" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M50 22 L60 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M60 32 L62 38 L54 42 L50 36 Z" fill="currentColor" />
    </svg>
  )
}

/** Kraan met draaikrans + contragewicht nadrukkelijk zichtbaar */
export function CounterweightExcavatorIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={48} cy={54} />
      <rect x="8" y="30" width="36" height="20" rx="3" fill="currentColor" />
      <rect x="8" y="38" width="6" height="12" rx="1" fill="#000" fillOpacity="0.55" />
      <rect x="16" y="33" width="12" height="11" rx="1.5" fill="#000" fillOpacity="0.4" />
      <path d="M38 34 L52 18" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M52 18 L60 30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M60 30 L62 36 L54 40 L50 34 Z" fill="currentColor" />
    </svg>
  )
}

/** Shovel icon — front-loading excavator */
export function ShovelExcavatorIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={42} cy={54} />
      <rect x="11" y="34" width="28" height="16" rx="3" fill="currentColor" />
      <rect x="14" y="36" width="11" height="10" rx="1.5" fill="#000" fillOpacity="0.4" />
      <path d="M32 38 L48 26" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M48 26 L60 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M58 28 L62 34 L60 42 L52 40 Z" fill="currentColor" />
    </svg>
  )
}

/** Crawler crane (hijskraan) — outreach with hook */
export function CrawlerCraneIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={44} cy={54} />
      <rect x="14" y="38" width="18" height="12" rx="2" fill="currentColor" />
      <rect x="16" y="40" width="8" height="7" rx="1" fill="#000" fillOpacity="0.4" />
      <path d="M28 42 L58 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {/* lattice detail */}
      <path d="M32 38 L44 24 M38 32 L50 18" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
      {/* hoist cable + hook */}
      <path d="M58 10 L58 32" stroke="currentColor" strokeWidth="1.5" />
      <path d="M55 32 L61 32 L59 38 L57 38 Z" fill="currentColor" />
    </svg>
  )
}

/** Breaker / hydraulic hammer */
export function BreakerExcavatorIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={40} cy={54} />
      <rect x="12" y="36" width="26" height="14" rx="3" fill="currentColor" />
      <rect x="15" y="38" width="10" height="9" rx="1" fill="#000" fillOpacity="0.4" />
      <path d="M32 38 L50 22" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M50 22 L58 30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {/* breaker pick */}
      <rect x="54" y="30" width="6" height="12" rx="1" fill="currentColor" />
      <path d="M57 42 L57 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/** Magnet / grapple excavator */
export function MagnetExcavatorIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={42} cy={54} />
      <rect x="12" y="34" width="28" height="16" rx="3" fill="currentColor" />
      <rect x="15" y="36" width="11" height="10" rx="1.5" fill="#000" fillOpacity="0.4" />
      <path d="M34 36 L50 22" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M50 22 L58 34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M58 34 L58 40" stroke="currentColor" strokeWidth="2" />
      {/* magnet disc */}
      <path d="M50 40 L66 40 L64 46 L52 46 Z" fill="currentColor" />
      <rect x="54" y="42" width="8" height="3" fill="#000" fillOpacity="0.45" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// BULLDOZERS — 10 variants
// ---------------------------------------------------------------------------

/** Mini-dozer */
export function MiniBulldozerIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={36} cy={54} />
      <rect x="18" y="34" width="24" height="16" rx="3" fill="currentColor" />
      <rect x="30" y="26" width="10" height="10" rx="1.5" fill="currentColor" />
      <rect x="31.5" y="27.5" width="7" height="6" rx="1" fill="#000" fillOpacity="0.4" />
      <path d="M6 38 L14 34 L14 50 L6 48 Z" fill="currentColor" />
    </svg>
  )
}

/** Standaard bulldozer */
export function BulldozerIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={44} cy={54} />
      <rect x="14" y="32" width="32" height="18" rx="3" fill="currentColor" />
      <rect x="30" y="22" width="14" height="12" rx="2" fill="currentColor" />
      <rect x="32" y="24" width="10" height="7" rx="1" fill="#000" fillOpacity="0.4" />
      {/* blade */}
      <path d="M4 34 L14 30 L14 50 L4 46 Z" fill="currentColor" />
      <path d="M2 32 L4 34 L4 46 L2 48 Z" fill="currentColor" opacity="0.6" />
      {/* exhaust */}
      <rect x="26" y="18" width="3" height="8" rx="1" fill="currentColor" />
      <rect x="25" y="16" width="5" height="3" rx="1" fill="currentColor" />
    </svg>
  )
}

/** Zware bulldozer (D10-klasse) */
export function HeavyBulldozerIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={52} cy={54} />
      <rect x="10" y="30" width="38" height="20" rx="3" fill="currentColor" />
      <rect x="28" y="18" width="18" height="14" rx="2" fill="currentColor" />
      <rect x="30" y="20" width="14" height="9" rx="1" fill="#000" fillOpacity="0.4" />
      <path d="M2 32 L12 28 L12 52 L2 48 Z" fill="currentColor" />
      <path d="M0 30 L2 32 L2 48 L0 50 Z" fill="currentColor" opacity="0.6" />
      <rect x="22" y="12" width="4" height="10" rx="1" fill="currentColor" />
      <rect x="21" y="10" width="6" height="3" rx="1" fill="currentColor" />
      {/* ripper rear */}
      <path d="M48 40 L58 48 L62 58 L54 54 L50 46" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/** Bulldozer met ripper */
export function RipperBulldozerIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={44} cy={54} />
      <rect x="14" y="32" width="30" height="18" rx="3" fill="currentColor" />
      <rect x="30" y="22" width="14" height="12" rx="2" fill="currentColor" />
      <rect x="32" y="24" width="10" height="7" rx="1" fill="#000" fillOpacity="0.4" />
      <path d="M4 34 L14 30 L14 50 L4 46 Z" fill="currentColor" />
      <path d="M44 42 L52 48 L56 58 L50 56 L46 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M56 58 L56 62 M50 56 L50 62" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

/** Wieldozer */
export function WheelDozerIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <rect x="14" y="30" width="32" height="20" rx="3" fill="currentColor" />
      <rect x="30" y="20" width="14" height="12" rx="2" fill="currentColor" />
      <rect x="32" y="22" width="10" height="7" rx="1" fill="#000" fillOpacity="0.4" />
      <path d="M4 34 L14 30 L14 52 L4 48 Z" fill="currentColor" />
      <circle cx="22" cy="54" r="7" fill="currentColor" />
      <circle cx="22" cy="54" r="3" fill="#000" fillOpacity="0.5" />
      <circle cx="40" cy="54" r="7" fill="currentColor" />
      <circle cx="40" cy="54" r="3" fill="#000" fillOpacity="0.5" />
    </svg>
  )
}

/** Grader-achtige dozer (lage blade) */
export function LowBladeDozerIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={46} cy={54} />
      <rect x="12" y="30" width="32" height="20" rx="3" fill="currentColor" />
      <rect x="26" y="22" width="14" height="10" rx="2" fill="currentColor" />
      <rect x="28" y="24" width="10" height="6" rx="1" fill="#000" fillOpacity="0.4" />
      <path d="M2 42 L12 40 L12 52 L2 50 Z" fill="currentColor" />
    </svg>
  )
}

/** Dozer met U-blade (duwblad) */
export function UBladeDozerIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={44} cy={54} />
      <rect x="14" y="32" width="30" height="18" rx="3" fill="currentColor" />
      <rect x="28" y="22" width="14" height="12" rx="2" fill="currentColor" />
      <rect x="30" y="24" width="10" height="7" rx="1" fill="#000" fillOpacity="0.4" />
      {/* U blade curved */}
      <path d="M2 32 Q 8 28 12 32 L 12 50 Q 8 54 2 50 Z" fill="currentColor" />
      <path d="M0 30 Q 1 28 2 32 L 2 50 Q 1 52 0 50 Z" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

/** Dozer met cabine + exhausts (forest) */
export function ForestDozerIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <Tracks w={44} cy={54} />
      <rect x="14" y="32" width="30" height="18" rx="3" fill="currentColor" />
      {/* heavy cage cab */}
      <rect x="26" y="18" width="18" height="16" rx="2" fill="currentColor" />
      <path d="M28 20 V 32 M34 20 V 32 M40 20 V 32" stroke="#000" strokeOpacity="0.4" strokeWidth="1.2" />
      <path d="M26 24 H 44" stroke="#000" strokeOpacity="0.4" strokeWidth="1.2" />
      <path d="M4 34 L14 30 L14 50 L4 46 Z" fill="currentColor" />
      <rect x="20" y="14" width="3" height="10" rx="1" fill="currentColor" />
      <rect x="46" y="14" width="3" height="10" rx="1" fill="currentColor" />
    </svg>
  )
}

/** Wheel loader (shovel) */
export function WheelLoaderIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <rect x="28" y="28" width="20" height="22" rx="3" fill="currentColor" />
      <rect x="31" y="30" width="14" height="10" rx="1.5" fill="#000" fillOpacity="0.4" />
      {/* Arm + bucket */}
      <path d="M28 36 L16 40" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M16 32 L16 48 L4 46 L2 40 L6 36 Z" fill="currentColor" />
      <circle cx="18" cy="54" r="7" fill="currentColor" />
      <circle cx="18" cy="54" r="3" fill="#000" fillOpacity="0.5" />
      <circle cx="42" cy="54" r="7" fill="currentColor" />
      <circle cx="42" cy="54" r="3" fill="#000" fillOpacity="0.5" />
    </svg>
  )
}

/** Compactor / trench dozer */
export function CompactorDozerIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      <rect x="14" y="32" width="34" height="18" rx="3" fill="currentColor" />
      <rect x="28" y="22" width="14" height="12" rx="2" fill="currentColor" />
      <rect x="30" y="24" width="10" height="7" rx="1" fill="#000" fillOpacity="0.4" />
      {/* drum */}
      <circle cx="12" cy="52" r="10" fill="currentColor" />
      <circle cx="12" cy="52" r="5" fill="#000" fillOpacity="0.35" />
      <path d="M6 45 H 18 M6 52 H 18 M6 58 H 18" stroke="#000" strokeOpacity="0.45" strokeWidth="1" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Brand & guidance palettes (unchanged)
// ---------------------------------------------------------------------------

export const BRAND_COLORS: Record<string, string> = {
  CAT: '#FFCB05',
  KOMATSU: '#005BAC',
  HITACHI: '#E60012',
  DEVELON: '#FF6600',
  'DOOSAN/DEVELON': '#FF6600',
  DOOSAN: '#FF6600',
  VOLVO: '#003057',
  LIEBHERR: '#FFD100',
  HYUNDAI: '#002C5F',
  KOBELCO: '#0068B7',
  JCB: '#F7C948',
  CASE: '#CC0000',
  TAKEUCHI: '#E31837',
  KUBOTA: '#F58220',
  SANY: '#D71920',
  ZOOMLION: '#009944',
}

export const GUIDANCE_COLORS: Record<string, { bg: string; text: string }> = {
  UNICONTROL: { bg: 'bg-sky-500/15', text: 'text-sky-400' },
  TRIMBLE: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  TOPCON: { bg: 'bg-red-500/15', text: 'text-red-400' },
  LEICA: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  CHCNAV: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
}

// ---------------------------------------------------------------------------
// Smart selector — kiest een variant op basis van type + tonnage + tag
// ---------------------------------------------------------------------------

export type MachineVariant =
  // excavators
  | 'mini-excavator'
  | 'excavator'
  | 'heavy-excavator'
  | 'long-reach'
  | 'wheel-excavator'
  | 'counterweight'
  | 'shovel'
  | 'crawler-crane'
  | 'breaker'
  | 'magnet'
  // dozers
  | 'mini-bulldozer'
  | 'bulldozer'
  | 'heavy-bulldozer'
  | 'ripper'
  | 'wheel-dozer'
  | 'low-blade'
  | 'u-blade'
  | 'forest-dozer'
  | 'wheel-loader'
  | 'compactor'

export const MACHINE_VARIANTS: { id: MachineVariant; label: string; group: 'excavator' | 'bulldozer' }[] = [
  { id: 'mini-excavator', label: 'Mini-graver', group: 'excavator' },
  { id: 'excavator', label: 'Rupsgraafkraan', group: 'excavator' },
  { id: 'heavy-excavator', label: 'Zware rupskraan', group: 'excavator' },
  { id: 'long-reach', label: 'Long reach / sloop', group: 'excavator' },
  { id: 'wheel-excavator', label: 'Bandengraafkraan', group: 'excavator' },
  { id: 'counterweight', label: 'Met contragewicht', group: 'excavator' },
  { id: 'shovel', label: 'Voorlader-kraan', group: 'excavator' },
  { id: 'crawler-crane', label: 'Hijskraan (rups)', group: 'excavator' },
  { id: 'breaker', label: 'Met hydr. hamer', group: 'excavator' },
  { id: 'magnet', label: 'Met magneet', group: 'excavator' },
  { id: 'mini-bulldozer', label: 'Mini-dozer', group: 'bulldozer' },
  { id: 'bulldozer', label: 'Bulldozer', group: 'bulldozer' },
  { id: 'heavy-bulldozer', label: 'Zware bulldozer', group: 'bulldozer' },
  { id: 'ripper', label: 'Dozer met ripper', group: 'bulldozer' },
  { id: 'wheel-dozer', label: 'Wieldozer', group: 'bulldozer' },
  { id: 'low-blade', label: 'Lage blade', group: 'bulldozer' },
  { id: 'u-blade', label: 'U-blade duwer', group: 'bulldozer' },
  { id: 'forest-dozer', label: 'Bosdozer', group: 'bulldozer' },
  { id: 'wheel-loader', label: 'Wiellader', group: 'bulldozer' },
  { id: 'compactor', label: 'Compactor', group: 'bulldozer' },
]

export function IconByVariant({ variant, className, size, title }: { variant: MachineVariant } & IconProps) {
  switch (variant) {
    case 'mini-excavator': return <MiniExcavatorIcon className={className} size={size} title={title} />
    case 'excavator': return <ExcavatorIcon className={className} size={size} title={title} />
    case 'heavy-excavator': return <HeavyExcavatorIcon className={className} size={size} title={title} />
    case 'long-reach': return <LongReachExcavatorIcon className={className} size={size} title={title} />
    case 'wheel-excavator': return <WheelExcavatorIcon className={className} size={size} title={title} />
    case 'counterweight': return <CounterweightExcavatorIcon className={className} size={size} title={title} />
    case 'shovel': return <ShovelExcavatorIcon className={className} size={size} title={title} />
    case 'crawler-crane': return <CrawlerCraneIcon className={className} size={size} title={title} />
    case 'breaker': return <BreakerExcavatorIcon className={className} size={size} title={title} />
    case 'magnet': return <MagnetExcavatorIcon className={className} size={size} title={title} />
    case 'mini-bulldozer': return <MiniBulldozerIcon className={className} size={size} title={title} />
    case 'bulldozer': return <BulldozerIcon className={className} size={size} title={title} />
    case 'heavy-bulldozer': return <HeavyBulldozerIcon className={className} size={size} title={title} />
    case 'ripper': return <RipperBulldozerIcon className={className} size={size} title={title} />
    case 'wheel-dozer': return <WheelDozerIcon className={className} size={size} title={title} />
    case 'low-blade': return <LowBladeDozerIcon className={className} size={size} title={title} />
    case 'u-blade': return <UBladeDozerIcon className={className} size={size} title={title} />
    case 'forest-dozer': return <ForestDozerIcon className={className} size={size} title={title} />
    case 'wheel-loader': return <WheelLoaderIcon className={className} size={size} title={title} />
    case 'compactor': return <CompactorDozerIcon className={className} size={size} title={title} />
  }
}

/** Grader (motorgrader) — lang frame + middelste lange blade + 3 assen */
export function GraderIcon({ className = '', size = 24, title }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={title}>
      {/* Long frame */}
      <rect x="6" y="36" width="52" height="6" rx="2" fill="currentColor" />
      {/* Rear engine block */}
      <rect x="40" y="28" width="18" height="14" rx="2" fill="currentColor" />
      {/* Cab */}
      <rect x="28" y="20" width="14" height="16" rx="2" fill="currentColor" />
      <rect x="30" y="22" width="10" height="9" rx="1" fill="#000" fillOpacity="0.4" />
      {/* Exhaust */}
      <rect x="44" y="18" width="3" height="10" rx="1" fill="currentColor" />
      {/* Front hood */}
      <path d="M6 40 L6 36 L18 36 L22 32 L22 36" fill="currentColor" />
      {/* Angled center blade */}
      <path d="M18 44 L36 48" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {/* Wheels: 1 front, 2 rear tandem */}
      <circle cx="12" cy="54" r="5.5" fill="currentColor" />
      <circle cx="12" cy="54" r="2.2" fill="#000" fillOpacity="0.5" />
      <circle cx="44" cy="54" r="5.5" fill="currentColor" />
      <circle cx="44" cy="54" r="2.2" fill="#000" fillOpacity="0.5" />
      <circle cx="56" cy="54" r="5.5" fill="currentColor" />
      <circle cx="56" cy="54" r="2.2" fill="#000" fillOpacity="0.5" />
    </svg>
  )
}

/** Backward-compatible default icon picker based on machine_type + tonnage. */
export function MachineIcon({
  type,
  tonnage,
  className,
  size,
}: { type: string; tonnage?: number } & IconProps) {
  const t = tonnage ?? 0
  if (type === 'grader') {
    return <GraderIcon className={className} size={size} />
  }
  if (type === 'bulldozer') {
    if (t > 0 && t < 6) return <MiniBulldozerIcon className={className} size={size} />
    if (t >= 35) return <HeavyBulldozerIcon className={className} size={size} />
    return <BulldozerIcon className={className} size={size} />
  }
  if (t > 0 && t < 4) return <MiniExcavatorIcon className={className} size={size} />
  if (t >= 30) return <HeavyExcavatorIcon className={className} size={size} />
  return <ExcavatorIcon className={className} size={size} />
}

export function formatTonnage(t: number): string {
  if (t < 1) return `${Math.round(t * 1000)} kg`
  return `${t}T`
}
