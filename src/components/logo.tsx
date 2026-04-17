interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light' | 'adaptive';
  className?: string;
  showText?: boolean;
}

const sizes = {
  sm: { height: 24, fontSize: 16, iconScale: 0.55, gap: 6 },
  md: { height: 32, fontSize: 22, iconScale: 0.73, gap: 8 },
  lg: { height: 40, fontSize: 28, iconScale: 0.91, gap: 10 },
  xl: { height: 52, fontSize: 36, iconScale: 1.18, gap: 12 },
};

export default function Logo({ size = 'md', variant = 'dark', className = '', showText = true }: LogoProps) {
  const s = sizes[size];
  const textColor =
    variant === 'adaptive' ? 'var(--text-main)' : variant === 'dark' ? '#ffffff' : '#1a1a2e';
  const slashColor = textColor;

  // Icon is 44x40 base, scaled to match text height
  const iconW = Math.round(44 * s.iconScale);
  const iconH = Math.round(40 * s.iconScale);
  const textW = showText ? Math.round(s.fontSize * 6.8) : 0;
  const totalW = showText ? iconW + s.gap + textW : iconW;

  return (
    <svg
      width={totalW}
      height={s.height}
      viewBox={`0 0 ${totalW} ${s.height}`}
      className={className}
      role="img"
      aria-label="MV3D.CLOUD logo"
    >
      {/* Bracket icon */}
      <g transform={`scale(${s.iconScale})`}>
        {/* Orange glow background */}
        <rect x="0" y="2" width="44" height="36" rx="6" fill="#f7941d" opacity="0.12" />
        {/* Left bracket */}
        <path d="M14,4 L6,4 Q2,4 2,8 L2,32 Q2,36 6,36 L14,36" fill="none" stroke="#f7941d" strokeWidth="2.5" strokeLinecap="round" />
        {/* Right bracket */}
        <path d="M30,4 L38,4 Q42,4 42,8 L42,32 Q42,36 38,36 L30,36" fill="none" stroke="#f7941d" strokeWidth="2.5" strokeLinecap="round" />
        {/* Slash */}
        <line x1="26" y1="8" x2="18" y2="32" stroke={slashColor} strokeWidth="2" strokeLinecap="round" />
      </g>

      {showText && (
        <text
          x={iconW + s.gap}
          y={s.height * 0.72}
          fontFamily="'Segoe UI', system-ui, sans-serif"
          fontWeight="800"
          fontSize={s.fontSize}
          fill={textColor}
        >
          MV3D<tspan fill="#f7941d">.</tspan><tspan fill="#f7941d">CLOUD</tspan>
        </text>
      )}
    </svg>
  );
}
