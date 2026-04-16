'use client'

import Link from 'next/link'
import { ArrowRight, ChevronDown, Mail, MapPin, Users, Crosshair, Plane, PenTool, Target } from 'lucide-react'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Logo from '@/components/logo'
import { useRef, useState, useEffect, type FormEvent } from 'react'


/* ─── Scroll-reveal (like Unicontrol's fade-in-up on scroll) ─── */
function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'none'
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  const initial: Record<string, number> = { opacity: 0 }
  if (direction === 'up') initial.y = 60
  if (direction === 'left') initial.x = -60
  if (direction === 'right') initial.x = 60

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : initial}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── Parallax image (like Unicontrol's floating hero image) ─── */
function ParallaxImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '5%'])

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        style={{ y }}
        className="h-full w-full object-cover"
      />
    </div>
  )
}

/* ─── Dashboard spotlight sections for cycling zoom animation ─── */
const spotlightSections = [
  { label: 'Live Statistieken', x: '55%', y: '22%', scale: 2.8, cx: 50, cy: -6, angle: 180,
    icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { label: 'Werf Voortgang', x: '42%', y: '52%', scale: 2.6, cx: 91, cy: 10, angle: 225,
    icon: 'M3 20h2V10h3v10h2V6h3v14h2V2h3v18h2' },
  { label: 'Machine Conversie', x: '82%', y: '35%', scale: 2.8, cx: 108, cy: 48, angle: 270,
    icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 9V3.5L18.5 9H13zM9 13h6v2H9zm0 4h6v2H9z' },
  { label: 'Remote Scherm', x: '82%', y: '52%', scale: 2.8, cx: 91, cy: 86, angle: 315,
    icon: 'M21 2H3a1 1 0 00-1 1v14a1 1 0 001 1h7v2H8v2h8v-2h-2v-2h7a1 1 0 001-1V3a1 1 0 00-1-1zM4 15V4h16v11H4zm5-3l3-3 3 3' },
  { label: 'Push Plannen', x: '55%', y: '80%', scale: 2.8, cx: 50, cy: 102, angle: 0,
    icon: 'M12 2L4.5 20.3l.7.3L12 18l6.8 2.6.7-.3L12 2zm0 3.5l5 13.1L12 16.5l-5 2.1 5-13.1z' },
  { label: 'Werven Kaart', x: '42%', y: '80%', scale: 2.8, cx: 9, cy: 86, angle: 45,
    icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z' },
  { label: 'Activiteit Feed', x: '18%', y: '52%', scale: 2.8, cx: -8, cy: 48, angle: 90,
    icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { label: 'Volledig Overzicht', x: '50%', y: '50%', scale: 1, cx: 9, cy: 10, angle: 135,
    icon: 'M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2 0v14h14V5H5zm2 2h4v4H7V7zm6 0h4v2h-4V7zm0 4h4v2h-4v-2zM7 13h10v2H7v-2z' },
] as const

/* ─── FAQ Accordion (like Unicontrol's FAQ with + icon and image) ─── */
function FaqItem({ question, answer, image }: { question: string; answer: string; image?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-7 text-left"
      >
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-white pr-8">{question}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)] text-[var(--accent)] text-xl transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="pb-8 flex gap-8">
          {image && (
            <div className="hidden md:block w-32 h-32 shrink-0 rounded-xl overflow-hidden bg-[var(--bg-card)]">
              <img src={image} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <p className="text-gray-400 leading-relaxed text-sm uppercase tracking-[0.2em] font-bold">{answer}</p>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Placeholder image block for sections ─── */
function SectionImage({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0f2030] to-[#162535] ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(247,148,29,0.08),transparent_70%)]" />
      <div className="relative flex items-center justify-center h-full min-h-[300px] p-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
            <svg className="h-10 w-10 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-muted)] font-bold uppercase tracking-[0.2em]">{label}</p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroImageY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])

  // Dashboard spotlight cycling
  const [spotlightIdx, setSpotlightIdx] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setSpotlightIdx(prev => (prev + 1) % spotlightSections.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <main className="bg-[#080e18] text-white overflow-x-hidden">

      {/* ══════════ HERO — Full-screen like Unicontrol ══════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(247,148,29,0.08),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(247,148,29,0.05),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(247,148,29,0.04),transparent_40%)]" />

          {/* Topographic contour lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.15]" viewBox="0 0 1400 900" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            {/* Large outer contours */}
            <path d="M-100,450 C50,200 300,100 500,180 C700,260 750,50 950,120 C1150,190 1300,80 1500,200" stroke="#f7941d" strokeWidth="1.2" opacity="0.8"/>
            <path d="M-80,500 C60,280 280,160 480,230 C680,300 740,100 940,170 C1140,240 1280,130 1480,250" stroke="#f7941d" strokeWidth="1.2" opacity="0.7"/>
            <path d="M-60,550 C80,350 260,220 460,280 C660,340 730,150 930,220 C1130,290 1260,180 1460,300" stroke="#f7941d" strokeWidth="1" opacity="0.6"/>
            <path d="M-40,600 C100,420 240,280 440,330 C640,380 720,200 920,270 C1120,340 1240,230 1440,350" stroke="#f7941d" strokeWidth="1" opacity="0.5"/>
            
            {/* Central formation - main contour cluster */}
            <path d="M300,650 C350,550 420,480 550,460 C680,440 720,380 700,320 C680,260 620,230 550,250 C480,270 400,330 380,420 C360,510 320,580 300,650Z" stroke="#f7941d" strokeWidth="1.5" opacity="0.9"/>
            <path d="M330,620 C370,540 430,490 540,475 C650,460 690,410 675,360 C660,310 610,285 555,300 C500,315 430,365 415,440 C400,515 355,570 330,620Z" stroke="#f7941d" strokeWidth="1.3" opacity="0.8"/>
            <path d="M360,590 C390,530 440,500 530,490 C620,480 655,440 645,400 C635,360 595,340 555,350 C515,360 460,400 450,460 C440,520 390,560 360,590Z" stroke="#f7941d" strokeWidth="1.2" opacity="0.7"/>
            <path d="M390,560 C410,520 450,505 520,500 C590,495 620,465 615,435 C610,405 580,390 555,395 C530,400 490,430 485,475 C480,520 415,545 390,560Z" stroke="#f7941d" strokeWidth="1" opacity="0.6"/>
            <path d="M420,535 C435,510 465,500 510,498 C555,496 580,478 577,458 C574,438 555,428 540,432 C525,436 505,455 503,485 C501,515 440,530 420,535Z" stroke="#f7941d" strokeWidth="0.8" opacity="0.5"/>

            {/* Right side formation */}
            <path d="M900,700 C920,600 980,530 1080,500 C1180,470 1220,400 1200,340 C1180,280 1120,250 1060,270 C1000,290 950,350 940,430 C930,510 910,600 900,700Z" stroke="#f7941d" strokeWidth="1.3" opacity="0.7"/>
            <path d="M930,660 C945,580 990,530 1070,510 C1150,490 1185,430 1170,380 C1155,330 1105,305 1060,320 C1015,335 975,385 970,445 C965,505 945,580 930,660Z" stroke="#f7941d" strokeWidth="1.1" opacity="0.6"/>
            <path d="M960,620 C970,560 1005,525 1060,515 C1115,505 1145,460 1135,420 C1125,380 1090,360 1060,370 C1030,380 1005,415 1002,460 C999,505 975,565 960,620Z" stroke="#f7941d" strokeWidth="0.9" opacity="0.5"/>

            {/* Upper contour waves */}
            <path d="M-50,150 C100,80 250,120 400,90 C550,60 700,130 850,100 C1000,70 1150,140 1300,110 C1450,80 1500,120 1500,120" stroke="#f7941d" strokeWidth="1" opacity="0.4"/>
            <path d="M-50,200 C120,140 240,170 390,145 C540,120 690,180 840,155 C990,130 1140,190 1290,165 C1440,140 1500,170 1500,170" stroke="#f7941d" strokeWidth="0.8" opacity="0.35"/>
            <path d="M-50,250 C140,200 230,220 380,200 C530,180 680,230 830,210 C980,190 1130,240 1280,220 C1430,200 1500,220 1500,220" stroke="#f7941d" strokeWidth="0.8" opacity="0.3"/>

            {/* Lower sweeping contours */}
            <path d="M-100,750 C100,700 300,730 500,700 C700,670 800,720 1000,690 C1200,660 1350,710 1500,680" stroke="#f7941d" strokeWidth="1" opacity="0.45"/>
            <path d="M-100,800 C80,760 280,780 480,755 C680,730 800,770 980,745 C1180,720 1330,760 1500,735" stroke="#f7941d" strokeWidth="0.8" opacity="0.35"/>
            <path d="M-100,850 C60,820 260,830 460,810 C660,790 800,820 960,800 C1160,780 1310,810 1500,790" stroke="#f7941d" strokeWidth="0.8" opacity="0.3"/>

            {/* Small left formation */}
            <path d="M80,380 C100,340 140,320 180,330 C220,340 240,370 230,400 C220,430 180,445 140,435 C100,425 80,400 80,380Z" stroke="#f7941d" strokeWidth="1" opacity="0.5"/>
            <path d="M110,385 C120,360 145,350 170,355 C195,360 208,380 202,400 C196,420 172,428 148,422 C124,416 110,400 110,385Z" stroke="#f7941d" strokeWidth="0.8" opacity="0.4"/>

            {/* Scattered small details */}
            <circle cx="1100" cy="150" r="25" stroke="#f7941d" strokeWidth="0.8" opacity="0.3"/>
            <circle cx="1100" cy="150" r="15" stroke="#f7941d" strokeWidth="0.6" opacity="0.25"/>
            <circle cx="200" cy="700" r="20" stroke="#f7941d" strokeWidth="0.7" opacity="0.3"/>
            <circle cx="200" cy="700" r="10" stroke="#f7941d" strokeWidth="0.5" opacity="0.25"/>
            <circle cx="750" cy="280" r="18" stroke="#f7941d" strokeWidth="0.7" opacity="0.25"/>
          </svg>

          {/* Floating glow orbs */}
          <div className="absolute top-1/4 left-[15%] h-72 w-72 rounded-full bg-[var(--accent)]/[0.04] blur-[100px]" />
          <div className="absolute bottom-1/4 right-[10%] h-96 w-96 rounded-full bg-[var(--accent)]/[0.03] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-[1400px] w-full px-4 sm:px-8 lg:px-16 py-20 sm:py-32 lg:py-0">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left column */}
            <div className="max-w-xl">
              {/* Logo icon animated in */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8"
              >
                <svg width="64" height="58" viewBox="0 0 44 40" className="drop-shadow-[0_0_20px_rgba(247,148,29,0.3)]">
                  <rect x="0" y="2" width="44" height="36" rx="6" fill="#f7941d" opacity="0.15" />
                  <path d="M14,4 L6,4 Q2,4 2,8 L2,32 Q2,36 6,36 L14,36" fill="none" stroke="#f7941d" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M30,4 L38,4 Q42,4 42,8 L42,32 Q42,36 38,36 L30,36" fill="none" stroke="#f7941d" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="26" y1="8" x2="18" y2="32" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-sm font-bold uppercase tracking-[0.35em] text-[var(--accent)] mb-5"
              >
                Blijf Gesynchroniseerd
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="text-[clamp(3.2rem,7vw,6rem)] font-black leading-[0.95] tracking-tight"
              >
                MV3D<span className="text-[var(--accent)]">.CLOUD</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.45 }}
                className="mt-7 text-sm sm:text-base leading-relaxed text-gray-400 max-w-md uppercase tracking-[0.2em] font-bold"
              >
                &Eacute;&eacute;n platform voor al je werven, machines en bestanden. Beheer alles vanaf kantoor &mdash; zonder verplaatsingen. MV3D.CLOUD is jouw perfecte 3D-assistent.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Link
                  href="mailto:contact@mv3d.be"
                  className="flex items-center gap-3 rounded-lg border border-[var(--accent)]/30 border-r-[3px] border-r-[var(--accent)] px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)] transition-all hover:border-[var(--accent)]/60 hover:shadow-lg hover:shadow-[var(--accent)]/20"
                  style={{ background: 'linear-gradient(135deg, rgba(247,148,29,0.12) 0%, rgba(247,148,29,0.04) 100%)' }}
                >
                  <Mail size={16} />
                  Contact Opnemen
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-3 rounded-lg border border-white/[0.1] border-r-[3px] border-r-white/30 px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white/80 transition-all hover:border-[var(--accent)]/40 hover:border-r-[var(--accent)] hover:text-[var(--accent)]"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)' }}
                >
                  <ArrowRight size={16} />
                  Inloggen
                </Link>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="mt-10 sm:mt-14 flex flex-wrap items-center gap-4 sm:gap-8 text-gray-600"
              >
                {[
                  { val: '99.9%', label: 'Uptime' },
                  { val: '500+', label: 'Werven' },
                  { val: '24/7', label: 'Monitoring' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="text-lg font-bold uppercase tracking-[0.2em] text-[var(--accent)]">{b.val}</span>
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">{b.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right column — Laptop mockup with fancy dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block"
            >
              <motion.div style={{ y: heroImageY }} className="relative perspective-[1200px]">
                {/* Ambient glow behind laptop */}
                <div className="absolute -inset-16 rounded-full bg-[var(--accent)]/[0.07] blur-[100px]" />
                <div className="absolute -inset-8 top-12 rounded-full bg-blue-500/[0.03] blur-[80px]" />

                {/* === LAPTOP BODY === */}
                <div className="relative" style={{ transform: 'perspective(1200px) rotateX(8deg) rotateY(-3deg)', transformOrigin: 'center bottom' }}>
                  {/* Screen bezel */}
                  <div className="relative rounded-t-2xl border border-white/[0.08] bg-[#0c1220] p-[6px] shadow-2xl shadow-black/70">
                    {/* Camera dot */}
                    <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gray-700/80" />
                    
                    {/* Screen */}
                    <div className="rounded-lg overflow-hidden bg-[#080e18] border border-white/[0.04]">
                      {/* === DASHBOARD CONTENT with spotlight zoom === */}
                      <motion.div
                        className="relative origin-center"
                        animate={{
                          scale: spotlightSections[spotlightIdx].scale,
                          x: `calc(50% - ${spotlightSections[spotlightIdx].x})`,
                          y: `calc(50% - ${spotlightSections[spotlightIdx].y})`,
                        }}
                        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {/* Top bar with logo + search + avatar */}
                        <div className="flex items-center justify-between px-4 py-2 bg-[#0a1220] border-b border-white/[0.05]">
                          <div className="flex items-center gap-2">
                            <svg width="14" height="12" viewBox="0 0 44 40"><rect x="0" y="2" width="44" height="36" rx="6" fill="#f7941d" opacity="0.2"/><path d="M14,4 L6,4 Q2,4 2,8 L2,32 Q2,36 6,36 L14,36" fill="none" stroke="#f7941d" strokeWidth="3" strokeLinecap="round"/><path d="M30,4 L38,4 Q42,4 42,8 L42,32 Q42,36 38,36 L30,36" fill="none" stroke="#f7941d" strokeWidth="3" strokeLinecap="round"/><line x1="26" y1="8" x2="18" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                            <span className="text-[8px] font-bold text-white/40">MV3D.CLOUD</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-24 rounded bg-white/[0.03] border border-white/[0.05] flex items-center px-2">
                              <span className="text-[7px] text-gray-600">Zoeken...</span>
                            </div>
                            <div className="h-5 w-5 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center">
                              <span className="text-[6px] font-bold text-[var(--accent)]">VP</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex">
                          {/* Sidebar */}
                          <div className="w-12 bg-[#0a1220] border-r border-white/[0.04] py-3 flex flex-col items-center gap-3">
                            {[
                              'M4,4 L20,4 L20,20 L4,20Z',
                              'M4,4 L20,4 M4,12 L20,12 M4,20 L16,20',
                              'M12,2 A10,10 0 1,1 11.99,2 M12,6 L12,12 L16,14',
                              'M4,20 L4,8 M10,20 L10,4 M16,20 L16,12',
                              'M12,4 L12,20 M4,12 L20,12',
                            ].map((d, i) => (
                              <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-[var(--accent)]/15 border border-[var(--accent)]/20' : 'hover:bg-white/[0.03]'}`}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={i === 0 ? '#f7941d' : '#555'} strokeWidth="1.5" strokeLinecap="round"><path d={d}/></svg>
                              </div>
                            ))}
                          </div>

                          {/* Main content area */}
                          <div className="flex-1 p-3 space-y-3">
                            {/* Header row */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[9px] font-bold text-white/80">Dashboard</p>
                                <p className="text-[7px] text-gray-600">Overzicht van al je werven</p>
                              </div>
                              <div className="flex gap-1.5">
                                {['Vandaag', 'Week', 'Maand'].map((t, i) => (
                                  <div key={i} className={`px-2 py-1 rounded text-[7px] font-medium ${i === 2 ? 'bg-[var(--accent)] text-white' : 'bg-white/[0.03] text-gray-600 border border-white/[0.04]'}`}>{t}</div>
                                ))}
                              </div>
                            </div>

                            {/* Stat cards row */}
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { n: '247', l: 'Werven', c: '#f7941d', pct: '+12%', up: true },
                                { n: '18', l: 'Machines', c: '#28c840', pct: '+3', up: true },
                                { n: '1.2K', l: 'Bestanden', c: '#3b82f6', pct: '+89', up: true },
                                { n: '99.9%', l: 'Uptime', c: '#a78bfa', pct: 'Stabiel', up: true },
                              ].map((s, i) => (
                                <div key={i} className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.05]">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="text-sm font-black leading-none" style={{ color: s.c }}>{s.n}</p>
                                      <p className="text-[7px] text-gray-600 mt-1">{s.l}</p>
                                    </div>
                                    <span className="text-[6px] font-bold text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded">{s.pct}</span>
                                  </div>
                                  {/* Mini sparkline */}
                                  <svg width="100%" height="16" viewBox="0 0 80 16" className="mt-1.5" preserveAspectRatio="none">
                                    <path d={i === 0 ? 'M0,14 L10,10 L20,12 L30,6 L40,8 L50,3 L60,5 L70,2 L80,4' : i === 1 ? 'M0,12 L15,8 L30,10 L45,4 L60,6 L80,2' : i === 2 ? 'M0,14 L12,12 L24,10 L36,11 L48,7 L60,4 L72,3 L80,2' : 'M0,6 L20,5 L40,6 L60,5 L80,5'} fill="none" stroke={s.c} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                                    <path d={i === 0 ? 'M0,14 L10,10 L20,12 L30,6 L40,8 L50,3 L60,5 L70,2 L80,4 L80,16 L0,16Z' : i === 1 ? 'M0,12 L15,8 L30,10 L45,4 L60,6 L80,2 L80,16 L0,16Z' : i === 2 ? 'M0,14 L12,12 L24,10 L36,11 L48,7 L60,4 L72,3 L80,2 L80,16 L0,16Z' : 'M0,6 L20,5 L40,6 L60,5 L80,5 L80,16 L0,16Z'} fill={s.c} opacity="0.06"/>
                                  </svg>
                                </div>
                              ))}
                            </div>

                            {/* Two-column: Chart + Activity */}
                            <div className="grid grid-cols-5 gap-2">
                              {/* Chart area */}
                              <div className="col-span-3 bg-white/[0.015] rounded-lg border border-white/[0.05] p-2.5">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[8px] font-bold text-white/60">Werf Voortgang</p>
                                  <div className="flex gap-2">
                                    <span className="flex items-center gap-1 text-[6px] text-gray-600"><span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />Actief</span>
                                    <span className="flex items-center gap-1 text-[6px] text-gray-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Afgerond</span>
                                  </div>
                                </div>
                                {/* Bar chart */}
                                <div className="flex items-end gap-[3px] h-20">
                                  {[
                                    { a: 65, b: 20 }, { a: 45, b: 35 }, { a: 80, b: 10 },
                                    { a: 30, b: 55 }, { a: 70, b: 15 }, { a: 50, b: 30 },
                                    { a: 85, b: 8 }, { a: 40, b: 40 }, { a: 60, b: 25 },
                                    { a: 75, b: 18 }, { a: 55, b: 28 }, { a: 90, b: 5 },
                                  ].map((bar, i) => (
                                    <div key={i} className="flex-1 flex flex-col gap-[1px] justify-end h-full">
                                      <div className="rounded-t-sm bg-[var(--accent)]" style={{ height: `${bar.a}%`, opacity: 0.7 }} />
                                      <div className="rounded-b-sm bg-emerald-400" style={{ height: `${bar.b}%`, opacity: 0.5 }} />
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-between mt-1.5">
                                  {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'].map(m => (
                                    <span key={m} className="text-[5px] text-gray-700 flex-1 text-center">{m}</span>
                                  ))}
                                </div>
                              </div>

                              {/* Recent activity */}
                              <div className="col-span-2 bg-white/[0.015] rounded-lg border border-white/[0.05] p-2.5">
                                <p className="text-[8px] font-bold text-white/60 mb-2">Recente Activiteit</p>
                                <div className="space-y-2">
                                  {[
                                    { t: 'Werf Antwerpen', s: 'Nieuwe bestanden ge\u00FCpload', time: '2m', color: '#f7941d' },
                                    { t: 'GPS Rover #4', s: 'Online gekomen', time: '8m', color: '#28c840' },
                                    { t: 'Werf Brussel', s: 'Opmeting voltooid', time: '15m', color: '#3b82f6' },
                                    { t: 'Machine MC-12', s: 'Sync compleet', time: '23m', color: '#28c840' },
                                    { t: 'Werf Gent-Zuid', s: 'Factuur verstuurd', time: '1u', color: '#a78bfa' },
                                  ].map((a, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <div className="w-1 h-1 rounded-full mt-1 shrink-0" style={{ backgroundColor: a.color }} />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[7px] font-semibold text-white/60 truncate">{a.t}</p>
                                        <p className="text-[6px] text-gray-600 truncate">{a.s}</p>
                                      </div>
                                      <span className="text-[6px] text-gray-700 shrink-0">{a.time}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Bottom row: Map hint + quick actions */}
                            <div className="grid grid-cols-5 gap-2">
                              <div className="col-span-3 bg-white/[0.015] rounded-lg border border-white/[0.05] p-2.5 relative overflow-hidden">
                                <p className="text-[8px] font-bold text-white/60 mb-1.5">Werven Kaart</p>
                                {/* Map placeholder with dots */}
                                <div className="relative h-14 rounded bg-[#0c1520]">
                                  {/* Belgium shape hint */}
                                  <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full opacity-[0.06]">
                                    <path d="M60,20 L140,15 L160,40 L170,70 L140,90 L100,100 L50,85 L30,60 L40,35Z" fill="white"/>
                                  </svg>
                                  {/* Dots for cities */}
                                  {[
                                    { x: '45%', y: '30%', pulse: true },
                                    { x: '55%', y: '55%', pulse: false },
                                    { x: '35%', y: '65%', pulse: true },
                                    { x: '60%', y: '40%', pulse: false },
                                    { x: '50%', y: '75%', pulse: true },
                                  ].map((dot, i) => (
                                    <div key={i} className="absolute" style={{ left: dot.x, top: dot.y }}>
                                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                                      {dot.pulse && <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping opacity-40" />}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="col-span-2 bg-white/[0.015] rounded-lg border border-white/[0.05] p-2.5">
                                <p className="text-[8px] font-bold text-white/60 mb-2">Snel</p>
                                <div className="space-y-1.5">
                                  {['+ Nieuwe Werf', '+ Upload Bestand', '+ Machine Koppelen'].map((a, i) => (
                                    <div key={i} className="px-2 py-1.5 rounded bg-white/[0.03] border border-white/[0.04] text-[7px] text-gray-500 hover:text-[var(--accent)] hover:border-[var(--accent)]/20 transition cursor-pointer">
                                      {a}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Laptop hinge / bottom */}
                  <div className="relative">
                    <div className="h-[6px] bg-gradient-to-b from-[#1a2030] to-[#141c2a] border-t border-white/[0.03]" />
                    <div className="mx-auto w-16 h-[3px] rounded-b bg-[#1a2030] -mb-[3px]" />
                  </div>
                </div>

                {/* Laptop base / keyboard */}
                <div className="relative mx-[-8%]">
                  <div className="h-5 bg-gradient-to-b from-[#1e2838] to-[#151d2a] rounded-b-xl border-x border-b border-white/[0.05] shadow-lg shadow-black/30">
                    {/* Keyboard keys hint */}
                    <div className="flex justify-center gap-[2px] pt-1 px-6">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} className="flex-1 h-[3px] rounded-[1px] bg-white/[0.04]" />
                      ))}
                    </div>
                  </div>
                  {/* Trackpad */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-3 rounded-b border-x border-b border-white/[0.04] bg-white/[0.015]" />
                </div>

                {/* Shadow under laptop */}
                <div className="absolute -bottom-4 left-[5%] right-[5%] h-8 bg-black/30 blur-xl rounded-full" />

                {/* ── Orbiting label circles ── */}
                {spotlightSections.map((section, i) => {
                  const isActive = i === spotlightIdx

                  return (
                    <motion.div
                      key={i}
                      className="absolute z-20 pointer-events-none"
                      style={{ left: `${section.cx}%`, top: `${section.cy}%` }}
                      animate={{
                        scale: isActive ? 1.15 : 0.85,
                        opacity: isActive ? 1 : 0.35,
                      }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className={`
                        -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1
                      `}>
                        {/* Circle */}
                        <motion.div
                          className={`
                            w-20 h-20 rounded-full flex items-center justify-center
                            border-2 backdrop-blur-md shadow-2xl
                            ${isActive
                              ? 'bg-[var(--accent)]/20 border-[var(--accent)] shadow-[var(--accent)]/40'
                              : 'bg-[#0c1220]/80 border-white/[0.08] shadow-black/30'
                            }
                          `}
                          animate={isActive ? {
                            boxShadow: ['0 0 20px rgba(247,148,29,0.3)', '0 0 40px rgba(247,148,29,0.6)', '0 0 20px rgba(247,148,29,0.3)'],
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <svg width="32" height="32" viewBox="0 0 24 24" fill={isActive ? '#f7941d' : '#555'} className="transition-colors duration-500">
                            <path d={section.icon} />
                          </svg>
                        </motion.div>
                        {/* Label */}
                        <motion.span
                          className={`
                            text-sm font-bold whitespace-nowrap uppercase tracking-[0.2em]
                            ${isActive ? 'text-[var(--accent)]' : 'text-white/25'}
                          `}
                        >
                          {section.label}
                        </motion.span>
                        {/* Connecting line to laptop */}
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            exit={{ opacity: 0 }}
                            className="absolute left-1/2 top-1/2 w-px bg-gradient-to-b from-[var(--accent)] to-transparent"
                            style={{
                              height: '40px',
                              transform: `rotate(${(section.angle + 180) % 360}deg)`,
                              transformOrigin: 'top center',
                            }}
                          />
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-5 h-8 rounded-full border-2 border-white/20 flex justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-[var(--accent)]" />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════ SINGLE POINT OF CONNECTION ══════════ */}
      <section className="relative bg-[#0a1220] py-16 sm:py-24 lg:py-36 overflow-hidden">
        {/* Topographic contour background */}
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 1400 800" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            {/* Right-side large formation flowing from top-right */}
            <path d="M1400,0 C1300,50 1200,80 1100,120 C950,180 900,250 920,350 C940,450 850,480 780,460 C710,440 680,380 700,300 C720,220 800,180 880,160 C960,140 1050,100 1100,60 C1150,20 1250,-10 1400,0Z" stroke="#f7941d" strokeWidth="1.2"/>
            <path d="M1400,30 C1310,75 1210,110 1120,150 C980,210 930,270 945,360 C960,440 880,465 820,450 C750,430 720,375 740,310 C760,245 830,210 900,190 C970,170 1060,135 1120,95 C1180,55 1270,25 1400,30Z" stroke="#f7941d" strokeWidth="1.1"/>
            <path d="M1400,65 C1320,105 1225,140 1145,180 C1020,240 965,295 975,370 C985,430 915,450 865,438 C800,420 775,372 790,318 C805,264 870,235 930,220 C990,205 1075,170 1140,130 C1205,90 1290,60 1400,65Z" stroke="#f7941d" strokeWidth="1"/>
            <path d="M1400,100 C1335,135 1245,170 1170,210 C1060,270 1010,320 1020,380 C1030,425 970,440 925,430 C870,415 850,375 862,332 C874,289 925,265 975,252 C1025,239 1100,210 1160,170 C1220,130 1310,100 1400,100Z" stroke="#f7941d" strokeWidth="0.9"/>
            <path d="M1400,140 C1345,168 1270,200 1200,240 C1110,300 1065,340 1072,388 C1079,420 1035,432 1000,424 C952,412 938,382 948,348 C958,314 1000,295 1040,285 C1080,275 1140,250 1190,215 C1240,180 1330,145 1400,140Z" stroke="#f7941d" strokeWidth="0.8"/>
            
            {/* Inner eye of right formation */}
            <path d="M1050,320 C1040,340 1020,355 1000,355 C980,355 965,340 965,320 C965,300 980,285 1000,282 C1020,279 1040,295 1050,320Z" stroke="#f7941d" strokeWidth="0.8"/>
            <path d="M1035,318 C1028,332 1015,340 1002,340 C989,340 980,332 980,320 C980,308 990,298 1003,296 C1016,294 1028,304 1035,318Z" stroke="#f7941d" strokeWidth="0.6"/>
            
            {/* Bottom-left formation */}
            <path d="M-50,800 C0,700 80,650 180,640 C300,628 380,580 400,500 C420,420 360,380 280,390 C200,400 140,450 120,530 C100,610 40,680 -50,720Z" stroke="#f7941d" strokeWidth="1.2"/>
            <path d="M-20,780 C25,690 100,650 190,642 C300,632 370,590 385,520 C400,450 350,415 285,422 C220,429 170,470 155,540 C140,610 85,665 -20,700Z" stroke="#f7941d" strokeWidth="1.1"/>
            <path d="M10,755 C50,680 120,645 200,640 C295,634 355,600 368,545 C381,490 340,460 290,465 C240,470 200,500 190,555 C180,610 130,655 10,685Z" stroke="#f7941d" strokeWidth="1"/>
            <path d="M40,730 C75,670 135,645 208,641 C285,636 338,608 348,565 C358,522 325,500 290,503 C255,506 225,528 218,570 C211,612 170,650 40,670Z" stroke="#f7941d" strokeWidth="0.9"/>
            
            {/* Inner eye of bottom-left */}
            <path d="M260,530 C258,548 248,560 235,562 C222,564 212,555 210,540 C208,525 216,512 230,509 C244,506 256,515 260,530Z" stroke="#f7941d" strokeWidth="0.7"/>
            <path d="M248,532 C247,542 242,550 235,551 C228,552 223,546 222,538 C221,530 226,522 234,521 C242,520 247,525 248,532Z" stroke="#f7941d" strokeWidth="0.5"/>
            
            {/* Flowing horizontal contour waves across middle */}
            <path d="M-50,420 C100,400 250,430 400,410 C550,390 650,420 800,405 C950,390 1050,415 1200,400 C1350,385 1400,400 1450,395" stroke="#f7941d" strokeWidth="0.6" opacity="0.5"/>
            <path d="M-50,445 C110,428 240,455 390,438 C540,421 660,448 810,433 C960,418 1060,440 1210,428 C1360,416 1400,430 1450,425" stroke="#f7941d" strokeWidth="0.5" opacity="0.4"/>
            <path d="M-50,470 C120,456 230,478 380,464 C530,450 670,474 820,462 C970,450 1070,468 1220,458 C1370,448 1400,460 1450,456" stroke="#f7941d" strokeWidth="0.5" opacity="0.3"/>
            
            {/* Small isolated formation top-left */}
            <path d="M150,120 C170,100 200,95 220,105 C240,115 245,140 230,160 C215,180 185,185 165,172 C145,159 138,138 150,120Z" stroke="#f7941d" strokeWidth="0.8" opacity="0.5"/>
            <path d="M165,128 C178,115 198,112 210,118 C222,124 225,140 215,152 C205,164 187,167 175,158 C163,149 158,138 165,128Z" stroke="#f7941d" strokeWidth="0.6" opacity="0.4"/>
            <circle cx="192" cy="138" r="6" stroke="#f7941d" strokeWidth="0.5" opacity="0.3"/>
            
            {/* Scattered small details */}
            <circle cx="600" cy="150" r="15" stroke="#f7941d" strokeWidth="0.5" opacity="0.25"/>
            <circle cx="600" cy="150" r="8" stroke="#f7941d" strokeWidth="0.4" opacity="0.2"/>
            <circle cx="450" cy="680" r="12" stroke="#f7941d" strokeWidth="0.5" opacity="0.2"/>
            <circle cx="1200" cy="600" r="18" stroke="#f7941d" strokeWidth="0.5" opacity="0.2"/>
            <circle cx="1200" cy="600" r="10" stroke="#f7941d" strokeWidth="0.4" opacity="0.15"/>
          </svg>
          
          {/* Subtle radial glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(247,148,29,0.06),transparent_70%)]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(247,148,29,0.04),transparent_70%)]" />
        </div>
        
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-16">
          {/* Section header */}
          <Reveal>
            <div className="text-center">
              <Logo size="lg" variant="dark" className="inline-block" />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-center text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-[3.5rem] max-w-4xl mx-auto leading-[1.1]">
              E&eacute;n centrale cloud voor al uw 3D oplossingen
            </h2>
          </Reveal>
          {/* Orange divider with signal icon */}
          <Reveal delay={0.15}>
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="h-[2px] w-16 bg-gradient-to-r from-transparent to-[var(--accent)]" />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#f7941d" className="shrink-0">
                <path d="M12 18c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-3.54-2.46a4.98 4.98 0 017.08 0l1.41-1.41a6.96 6.96 0 00-9.9 0l1.41 1.41zm-2.83-2.83a8.96 8.96 0 0112.74 0l1.41-1.41c-4.3-4.3-11.26-4.3-15.56 0l1.41 1.41zM2.81 9.88a12.94 12.94 0 0118.38 0l1.41-1.41C16.36 2.23 7.64 2.23 1.4 8.47l1.41 1.41z"/>
              </svg>
              <div className="h-[2px] w-16 bg-gradient-to-l from-transparent to-[var(--accent)]" />
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 mx-auto max-w-2xl text-center text-sm text-gray-400 leading-relaxed uppercase tracking-[0.2em] font-bold">
              Synchroniseer werven, bestanden en instellingen automatisch over je hele MV3D-vloot zonder je bureau te verlaten. Laat uw plannen ontwerpen en push ze direct in Machine of Rover.
            </p>
          </Reveal>

          {/* 3 feature cards below */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { 
                title: 'Laat uw 3D plannen ontwerpen, dit voor alle machinesturingen of rovers',
                delay: 0.1,
                // Blueprint/design icon with 3D cube and grid
                illustration: (
                  <svg viewBox="0 0 220 160" className="w-full h-full">
                    <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f7941d" stopOpacity="0.18"/>
                        <stop offset="100%" stopColor="#f7941d" stopOpacity="0.04"/>
                      </linearGradient>
                    </defs>
                    {/* Background grid - thin blueprint lines */}
                    {[25,45,65,85,105,125,145,165,185].map(x => <line key={`v${x}`} x1={x} y1="10" x2={x} y2="145" stroke="#f7941d" strokeWidth="0.4" opacity="0.18"/>)}
                    {[20,40,60,80,100,120,140].map(y => <line key={`h${y}`} x1="20" y1={y} x2="190" y2={y} stroke="#f7941d" strokeWidth="0.4" opacity="0.18"/>)}

                    {/* Outer blueprint frame */}
                    <rect x="30" y="15" width="150" height="120" rx="3" fill="url(#grad1)" stroke="#f7941d" strokeWidth="1.5" opacity="0.5"/>
                    {/* Inner frame line */}
                    <rect x="38" y="22" width="134" height="106" rx="2" fill="none" stroke="#f7941d" strokeWidth="0.5" opacity="0.25"/>

                    {/* 3D cube - front face */}
                    <path d="M65,105 L65,55 L125,55 L125,105Z" fill="rgba(247,148,29,0.06)" stroke="#f7941d" strokeWidth="2" strokeLinejoin="round" opacity="0.85"/>
                    {/* 3D cube - top face */}
                    <path d="M65,55 L90,32 L150,32 L125,55Z" fill="rgba(247,148,29,0.04)" stroke="#f7941d" strokeWidth="2" strokeLinejoin="round" opacity="0.65"/>
                    {/* 3D cube - right face */}
                    <path d="M125,55 L150,32 L150,82 L125,105Z" fill="rgba(247,148,29,0.08)" stroke="#f7941d" strokeWidth="2" strokeLinejoin="round" opacity="0.65"/>
                    {/* Hidden edges - dashed */}
                    <path d="M65,55 L90,32" stroke="#f7941d" strokeWidth="1" opacity="0.3" strokeDasharray="4,3"/>
                    <path d="M90,32 L90,82" stroke="#f7941d" strokeWidth="1" opacity="0.3" strokeDasharray="4,3"/>
                    <path d="M90,82 L65,105" stroke="#f7941d" strokeWidth="1" opacity="0.3" strokeDasharray="4,3"/>
                    <path d="M90,82 L150,82" stroke="#f7941d" strokeWidth="1" opacity="0.3" strokeDasharray="4,3"/>

                    {/* Left dimension arrow */}
                    <line x1="52" y1="55" x2="52" y2="105" stroke="#f7941d" strokeWidth="1.2" opacity="0.6"/>
                    <path d="M49,58 L52,53 L55,58" fill="none" stroke="#f7941d" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
                    <path d="M49,102 L52,107 L55,102" fill="none" stroke="#f7941d" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
                    {/* Top dimension arrow */}
                    <line x1="65" y1="25" x2="125" y2="25" stroke="#f7941d" strokeWidth="1.2" opacity="0.6"/>
                    <path d="M68,22 L63,25 L68,28" fill="none" stroke="#f7941d" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
                    <path d="M122,22 L127,25 L122,28" fill="none" stroke="#f7941d" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>

                    {/* Pencil icon bottom-right */}
                    <g transform="translate(152,88) rotate(-40)">
                      <rect x="0" y="0" width="7" height="32" rx="1.5" fill="#f7941d" opacity="0.75" stroke="#f7941d" strokeWidth="0.5"/>
                      <polygon points="0,32 7,32 3.5,40" fill="#f7941d" opacity="0.9"/>
                      <rect x="0" y="0" width="7" height="6" rx="1.5" fill="#d97a00" opacity="0.4"/>
                    </g>

                    {/* File type label */}
                    <text x="60" y="130" fontSize="8" fill="#f7941d" opacity="0.55" fontFamily="monospace" fontWeight="bold" letterSpacing="1">DXF / DWG / XML</text>
                  </svg>
                ),
              },
              { 
                title: 'Synchroniseer de geleverde bestanden direct in graafkraan of bulldozer',
                delay: 0.2,
                // Excavator with laptop screen and cloud sync
                illustration: (
                  <svg viewBox="0 0 240 160" className="w-full h-full">
                    <defs>
                      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f7941d" stopOpacity="0.14"/>
                        <stop offset="100%" stopColor="#f7941d" stopOpacity="0.03"/>
                      </linearGradient>
                    </defs>

                    {/* Ground/terrain line */}
                    <path d="M10,132 C50,130 80,134 120,131 C160,128 190,133 230,131" stroke="#f7941d" strokeWidth="0.8" opacity="0.25" fill="none"/>

                    {/* ── Excavator ── */}
                    {/* Tracks - rounded rectangle with wheels */}
                    <rect x="10" y="118" width="80" height="14" rx="7" fill="none" stroke="#f7941d" strokeWidth="1.8" opacity="0.7"/>
                    <circle cx="22" cy="125" r="5" fill="none" stroke="#f7941d" strokeWidth="1.2" opacity="0.5"/>
                    <circle cx="50" cy="125" r="3.5" fill="none" stroke="#f7941d" strokeWidth="0.8" opacity="0.35"/>
                    <circle cx="78" cy="125" r="5" fill="none" stroke="#f7941d" strokeWidth="1.2" opacity="0.5"/>
                    {/* Track treads */}
                    <line x1="30" y1="118" x2="30" y2="132" stroke="#f7941d" strokeWidth="0.6" opacity="0.2"/>
                    <line x1="40" y1="118" x2="40" y2="132" stroke="#f7941d" strokeWidth="0.6" opacity="0.2"/>
                    <line x1="60" y1="118" x2="60" y2="132" stroke="#f7941d" strokeWidth="0.6" opacity="0.2"/>
                    <line x1="70" y1="118" x2="70" y2="132" stroke="#f7941d" strokeWidth="0.6" opacity="0.2"/>
                    {/* Body/engine */}
                    <rect x="25" y="90" width="60" height="28" rx="4" fill="url(#grad2)" stroke="#f7941d" strokeWidth="1.8" opacity="0.75"/>
                    {/* Cabin */}
                    <rect x="48" y="62" width="38" height="30" rx="4" fill="url(#grad2)" stroke="#f7941d" strokeWidth="1.8" opacity="0.75"/>
                    {/* Cabin window */}
                    <rect x="54" y="67" width="20" height="16" rx="2" fill="#f7941d" fillOpacity="0.06" stroke="#f7941d" strokeWidth="1" opacity="0.5"/>
                    {/* Window cross */}
                    <line x1="64" y1="67" x2="64" y2="83" stroke="#f7941d" strokeWidth="0.5" opacity="0.3"/>
                    <line x1="54" y1="76" x2="74" y2="76" stroke="#f7941d" strokeWidth="0.5" opacity="0.3"/>

                    {/* Boom arm - thick segments */}
                    <line x1="48" y1="70" x2="18" y2="40" stroke="#f7941d" strokeWidth="3.5" strokeLinecap="round" opacity="0.75"/>
                    {/* Stick */}
                    <line x1="18" y1="40" x2="0" y2="72" stroke="#f7941d" strokeWidth="2.8" strokeLinecap="round" opacity="0.75"/>
                    {/* Hydraulic cylinder */}
                    <line x1="38" y1="68" x2="12" y2="48" stroke="#f7941d" strokeWidth="1" opacity="0.35"/>
                    {/* Bucket */}
                    <path d="M-6,66 L0,72 L10,72 L6,82 L-10,82 L-10,72Z" fill="#f7941d" fillOpacity="0.12" stroke="#f7941d" strokeWidth="1.5" strokeLinejoin="round" opacity="0.7"/>
                    {/* Bucket teeth */}
                    <line x1="-8" y1="82" x2="-8" y2="86" stroke="#f7941d" strokeWidth="1.2" opacity="0.5"/>
                    <line x1="-3" y1="82" x2="-3" y2="86" stroke="#f7941d" strokeWidth="1.2" opacity="0.5"/>
                    <line x1="2" y1="82" x2="2" y2="86" stroke="#f7941d" strokeWidth="1.2" opacity="0.5"/>

                    {/* ── Laptop screen on excavator ── */}
                    <g transform="translate(115,70)">
                      {/* Screen */}
                      <rect x="0" y="0" width="52" height="36" rx="3" fill="#0a1220" stroke="#f7941d" strokeWidth="1.8" opacity="0.8"/>
                      {/* Screen content - mini map */}
                      <rect x="4" y="4" width="44" height="28" rx="1" fill="#f7941d" opacity="0.04"/>
                      {/* Screen map lines */}
                      <path d="M8,22 L18,14 L28,18 L38,10 L44,16" fill="none" stroke="#f7941d" strokeWidth="1.2" opacity="0.5"/>
                      <circle cx="18" cy="14" r="2" fill="#f7941d" opacity="0.5"/>
                      <circle cx="38" cy="10" r="2" fill="#28c840" opacity="0.5"/>
                      {/* Status bar */}
                      <rect x="4" y="26" width="16" height="4" rx="1" fill="#f7941d" opacity="0.15"/>
                      <rect x="22" y="26" width="10" height="4" rx="1" fill="#28c840" opacity="0.15"/>
                      {/* Base/stand */}
                      <rect x="14" y="36" width="24" height="3" rx="1" fill="none" stroke="#f7941d" strokeWidth="1" opacity="0.5"/>
                      {/* Keyboard hint */}
                      <path d="M8,42 L44,42" stroke="#f7941d" strokeWidth="0.8" opacity="0.3"/>
                      <rect x="5" y="39" width="42" height="8" rx="2" fill="none" stroke="#f7941d" strokeWidth="1" opacity="0.35"/>
                    </g>

                    {/* ── WiFi/sync dots between laptop and cloud ── */}
                    <circle cx="173" cy="52" r="1.2" fill="#f7941d" opacity="0.7"/>
                    <circle cx="177" cy="44" r="1.2" fill="#f7941d" opacity="0.55"/>
                    <circle cx="181" cy="36" r="1.2" fill="#f7941d" opacity="0.4"/>

                    {/* ── Cloud ── */}
                    <g transform="translate(170,5)">
                      <path d="M8,35 Q-4,35 0,24 Q-4,12 12,12 Q16,0 32,4 Q44,-2 50,10 Q62,8 60,22 Q68,26 62,35 Q66,40 55,40 L12,40 Q2,40 8,35Z" fill="#f7941d" fillOpacity="0.08" stroke="#f7941d" strokeWidth="1.8" opacity="0.65"/>
                      {/* Down arrow inside cloud */}
                      <path d="M35,18 L35,32" stroke="#f7941d" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
                      <path d="M30,28 L35,34 L40,28" fill="none" stroke="#f7941d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                    </g>
                  </svg>
                ),
              },
              { 
                title: 'Beheer uw werven en instellingen in de cloud met ticketservice',
                delay: 0.3,
                // Cloud dashboard with tickets
                illustration: (
                  <svg viewBox="0 0 240 170" className="w-full h-full">
                    <defs>
                      <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f7941d" stopOpacity="0.14"/>
                        <stop offset="100%" stopColor="#f7941d" stopOpacity="0.03"/>
                      </linearGradient>
                      <linearGradient id="grad3bar" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#f7941d" stopOpacity="0.6"/>
                        <stop offset="100%" stopColor="#f7941d" stopOpacity="0.25"/>
                      </linearGradient>
                    </defs>

                    {/* ── Large cloud shape ── */}
                    <path d="M30,72 Q12,72 18,55 Q8,36 35,36 Q42,16 72,22 Q92,10 108,26 Q125,14 140,30 Q158,24 156,44 Q172,48 165,62 Q178,72 158,72Z" fill="url(#grad3)" stroke="#f7941d" strokeWidth="1.8" opacity="0.7"/>

                    {/* ── Dashboard panel 1: Bar chart ── */}
                    <g transform="translate(30,34)">
                      <rect x="0" y="0" width="42" height="30" rx="3" fill="#0a1220" stroke="#f7941d" strokeWidth="1.2" opacity="0.6"/>
                      {/* Bars */}
                      <rect x="5" y="18" width="5" height="9" rx="1" fill="url(#grad3bar)"/>
                      <rect x="12" y="12" width="5" height="15" rx="1" fill="url(#grad3bar)"/>
                      <rect x="19" y="8" width="5" height="19" rx="1" fill="url(#grad3bar)"/>
                      <rect x="26" y="14" width="5" height="13" rx="1" fill="url(#grad3bar)"/>
                      <rect x="33" y="5" width="5" height="22" rx="1" fill="url(#grad3bar)"/>
                      {/* X axis */}
                      <line x1="4" y1="27" x2="39" y2="27" stroke="#f7941d" strokeWidth="0.5" opacity="0.3"/>
                    </g>

                    {/* ── Dashboard panel 2: Checkmarks ── */}
                    <g transform="translate(78,34)">
                      <rect x="0" y="0" width="42" height="30" rx="3" fill="#0a1220" stroke="#f7941d" strokeWidth="1.2" opacity="0.6"/>
                      {/* Row 1: checkmark + line */}
                      <path d="M6,10 L9,13 L15,7" fill="none" stroke="#28c840" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="19" y="8" width="18" height="3" rx="1" fill="#f7941d" opacity="0.25"/>
                      {/* Row 2: checkmark + line */}
                      <path d="M6,20 L9,23 L15,17" fill="none" stroke="#28c840" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="19" y="18" width="14" height="3" rx="1" fill="#f7941d" opacity="0.2"/>
                    </g>

                    {/* ── Dashboard panel 3: Colored blocks ── */}
                    <g transform="translate(126,34)">
                      <rect x="0" y="0" width="36" height="30" rx="3" fill="#0a1220" stroke="#f7941d" strokeWidth="1.2" opacity="0.6"/>
                      {/* Mini colored squares */}
                      <rect x="5" y="6" width="11" height="8" rx="2" fill="#f7941d" opacity="0.3"/>
                      <rect x="19" y="6" width="11" height="8" rx="2" fill="#d97a00" opacity="0.25"/>
                      <rect x="5" y="18" width="11" height="8" rx="2" fill="#f7941d" opacity="0.15"/>
                      <rect x="19" y="18" width="11" height="8" rx="2" fill="#f7941d" opacity="0.35"/>
                    </g>

                    {/* ── Settings gear (right side) ── */}
                    <g transform="translate(178,40)">
                      <circle cx="14" cy="14" r="10" fill="none" stroke="#f7941d" strokeWidth="1.5" opacity="0.5"/>
                      <circle cx="14" cy="14" r="4" fill="none" stroke="#f7941d" strokeWidth="1.5" opacity="0.6"/>
                      {/* Gear teeth */}
                      <line x1="14" y1="0" x2="14" y2="4" stroke="#f7941d" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
                      <line x1="14" y1="24" x2="14" y2="28" stroke="#f7941d" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
                      <line x1="0" y1="14" x2="4" y2="14" stroke="#f7941d" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
                      <line x1="24" y1="14" x2="28" y2="14" stroke="#f7941d" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
                      <line x1="4" y1="4" x2="7" y2="7" stroke="#f7941d" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                      <line x1="21" y1="21" x2="24" y2="24" stroke="#f7941d" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                      <line x1="24" y1="4" x2="21" y2="7" stroke="#f7941d" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                      <line x1="4" y1="24" x2="7" y2="21" stroke="#f7941d" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                    </g>

                    {/* ── Ticket card 1 ── */}
                    <g transform="translate(28,88)">
                      <rect x="0" y="0" width="140" height="26" rx="4" fill="#f7941d" fillOpacity="0.08" stroke="#f7941d" strokeWidth="1.2" opacity="0.5"/>
                      {/* Ticket notch left */}
                      <circle cx="0" cy="13" r="5" fill="#0f2030"/>
                      {/* Ticket notch right */}
                      <circle cx="140" cy="13" r="5" fill="#0f2030"/>
                      {/* Perforated line */}
                      <line x1="110" y1="2" x2="110" y2="24" stroke="#f7941d" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.25"/>
                      {/* Text content */}
                      <text x="12" y="10" fontSize="6.5" fill="#f7941d" opacity="0.75" fontFamily="sans-serif" fontWeight="bold">TICKET #1247</text>
                      <text x="12" y="19" fontSize="5" fill="#f7941d" opacity="0.4" fontFamily="sans-serif">Werf Antwerpen — In behandeling</text>
                      {/* Status dot */}
                      <circle cx="120" cy="13" r="4" fill="#28c840" opacity="0.55"/>
                    </g>

                    {/* ── Ticket card 2 ── */}
                    <g transform="translate(28,120)">
                      <rect x="0" y="0" width="140" height="26" rx="4" fill="#f7941d" fillOpacity="0.05" stroke="#f7941d" strokeWidth="1" opacity="0.4"/>
                      <circle cx="0" cy="13" r="5" fill="#0f2030"/>
                      <circle cx="140" cy="13" r="5" fill="#0f2030"/>
                      <line x1="110" y1="2" x2="110" y2="24" stroke="#f7941d" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.2"/>
                      <text x="12" y="10" fontSize="6.5" fill="#f7941d" opacity="0.65" fontFamily="sans-serif" fontWeight="bold">TICKET #1248</text>
                      <text x="12" y="19" fontSize="5" fill="#f7941d" opacity="0.35" fontFamily="sans-serif">Werf Brussel — Nieuw</text>
                      <circle cx="120" cy="13" r="4" fill="#f7941d" opacity="0.5"/>
                    </g>

                    {/* ── Ticket card 3 (faded) ── */}
                    <g transform="translate(28,150)">
                      <rect x="0" y="0" width="140" height="18" rx="4" fill="#f7941d" fillOpacity="0.02" stroke="#f7941d" strokeWidth="0.8" opacity="0.2"/>
                      <circle cx="0" cy="9" r="4" fill="#0f2030"/>
                      <circle cx="140" cy="9" r="4" fill="#0f2030"/>
                    </g>
                  </svg>
                ),
              },
            ].map((f, i) => (
              <Reveal key={i} delay={f.delay}>
                <div className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-1 transition-all duration-500 hover:border-[var(--accent)]/30 hover:bg-white/[0.04]">
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-[#0f2030] to-[#162535] flex items-center justify-center p-8">
                    {f.illustration}
                  </div>
                  <h4 className="mt-4 px-4 pb-4 text-sm font-bold uppercase tracking-[0.2em] text-white/90 leading-snug">
                    {f.title}
                  </h4>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ ONTWERP PLANNEN (text left, illustration right) ══════════ */}
      <section className="relative bg-[#080e18] py-16 sm:py-24 lg:py-36 overflow-hidden">
        {/* Topographic contour background */}
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full opacity-[0.10]" viewBox="0 0 1400 800" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            {/* Large flowing formation from top-right */}
            <path d="M1400,80 C1280,120 1150,180 1050,260 C950,340 920,420 960,500 C1000,580 900,620 820,600 C740,580 700,510 730,430 C760,350 860,300 960,270 C1060,240 1180,180 1260,120 C1340,60 1400,40 1400,80Z" stroke="#f7941d" strokeWidth="1.2"/>
            <path d="M1400,115 C1290,150 1170,208 1078,282 C978,358 952,430 985,502 C1018,570 935,605 868,588 C798,570 765,510 790,440 C815,370 900,325 990,298 C1080,271 1190,215 1272,158 C1354,101 1400,82 1400,115Z" stroke="#f7941d" strokeWidth="1.1"/>
            <path d="M1400,155 C1305,185 1195,238 1110,305 C1018,378 998,442 1022,505 C1046,558 980,588 925,575 C865,558 840,510 860,452 C880,394 948,355 1025,332 C1102,309 1205,255 1285,202 C1365,149 1400,130 1400,155Z" stroke="#f7941d" strokeWidth="1"/>
            <path d="M1400,200 C1320,222 1225,268 1148,328 C1068,398 1052,455 1070,508 C1088,548 1038,572 995,562 C942,548 925,510 940,465 C955,420 1010,388 1072,370 C1134,352 1222,305 1298,258 C1374,211 1400,195 1400,200Z" stroke="#f7941d" strokeWidth="0.9"/>
            {/* Inner eye */}
            <path d="M1080,430 C1068,455 1045,470 1025,468 C1005,466 992,448 995,428 C998,408 1015,392 1038,390 C1061,388 1078,408 1080,430Z" stroke="#f7941d" strokeWidth="0.8"/>
            <circle cx="1040" cy="430" r="8" stroke="#f7941d" strokeWidth="0.6"/>

            {/* Bottom-left formation */}
            <path d="M-50,650 C30,580 120,560 220,570 C340,582 400,520 390,450 C380,380 310,360 250,380 C190,400 160,460 170,530 C180,600 100,650 -50,680Z" stroke="#f7941d" strokeWidth="1.1"/>
            <path d="M-20,630 C50,572 132,555 222,563 C328,574 382,522 374,462 C366,402 308,385 258,402 C208,419 182,470 190,530 C198,590 125,632 -20,658Z" stroke="#f7941d" strokeWidth="1"/>
            <path d="M10,608 C68,562 142,548 220,555 C312,564 358,520 352,472 C346,424 300,410 260,424 C220,438 200,480 206,528 C212,576 148,612 10,635Z" stroke="#f7941d" strokeWidth="0.9"/>
            <path d="M40,588 C85,552 148,542 215,548 C292,556 330,520 326,482 C322,444 288,434 258,445 C228,456 215,490 220,525 C225,560 172,592 40,612Z" stroke="#f7941d" strokeWidth="0.8"/>
            <ellipse cx="280" cy="490" rx="12" ry="15" stroke="#f7941d" strokeWidth="0.6"/>

            {/* Subtle horizontal waves */}
            <path d="M-50,350 C120,338 280,362 440,345 C600,328 720,355 880,340 C1040,325 1160,348 1320,335 C1400,328 1450,340 1450,340" stroke="#f7941d" strokeWidth="0.5" opacity="0.5"/>
            <path d="M-50,375 C130,365 270,385 430,372 C590,359 730,380 890,368 C1050,356 1170,375 1330,365 C1400,360 1450,368 1450,368" stroke="#f7941d" strokeWidth="0.4" opacity="0.4"/>

            {/* Small isolated details */}
            <circle cx="200" cy="180" r="18" stroke="#f7941d" strokeWidth="0.6" opacity="0.3"/>
            <circle cx="200" cy="180" r="9" stroke="#f7941d" strokeWidth="0.5" opacity="0.2"/>
            <circle cx="650" cy="680" r="14" stroke="#f7941d" strokeWidth="0.5" opacity="0.25"/>
          </svg>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(247,148,29,0.05),transparent_70%)]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(247,148,29,0.04),transparent_70%)]" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-16">
          <div className="grid gap-10 sm:gap-16 lg:grid-cols-2 lg:gap-24 items-center">
            <div>
              <Reveal>
                <Logo size="sm" />
              </Reveal>
              <Reveal delay={0.1}>
                <h2 className="mt-5 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-[2.75rem] leading-[1.1]">
                  Laat uw 3D plannen op maat ontwerpen
                </h2>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="mt-6 text-sm leading-relaxed text-gray-400 uppercase tracking-[0.2em] font-bold">
                  Ons team van ervaren landmeter-experten ontwerpt uw 3D-machinebesturingsplannen volledig op maat. Van DXF en DWG tot XML &mdash; wij leveren bestanden die direct klaar zijn om in uw machine te laden.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <p className="mt-4 text-sm leading-relaxed text-gray-500 uppercase tracking-[0.2em] font-bold">
                  Hoe vroeger u bestelt v&oacute;&oacute;r de uitvoeringsdatum, hoe voordeliger. Plan vooruit en bespaar op uw ontwerpkosten &mdash; wij zorgen dat alles tijdig klaarstaat.
                </p>
              </Reveal>

              {/* Early-bird pricing tiers */}
              <Reveal delay={0.4}>
                <div className="mt-8 space-y-3">
                  {[
                    { weeks: '4+ weken vooraf', discount: 'Beste prijs', accent: true },
                    { weeks: '1–4 weken vooraf', discount: 'Standaard tarief', accent: false },
                    { weeks: '48u–1 week vooraf', discount: 'Spoedtarief', accent: false },
                    { weeks: '< 48u voor aflevering', discount: 'Express tarief', accent: false },
                  ].map((tier, i) => (
                    <div key={i} className={`flex items-center gap-4 rounded-lg border px-4 py-3 transition-all ${tier.accent ? 'border-[var(--accent)]/40 bg-[var(--accent)]/[0.06]' : 'border-white/5 bg-white/[0.02]'}`}>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${tier.accent ? 'bg-[var(--accent)] text-[#080e18]' : 'bg-white/10 text-white/60'}`}>
                        {i === 0 ? '★' : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-bold uppercase tracking-[0.15em] ${tier.accent ? 'text-[var(--accent)]' : 'text-white/70'}`}>{tier.weeks}</p>
                      </div>
                      <p className={`text-xs font-bold uppercase tracking-[0.15em] ${tier.accent ? 'text-[var(--accent)]' : 'text-white/40'}`}>{tier.discount}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Illustration: calendar with countdown & blueprint */}
            <Reveal direction="right" delay={0.2}>
              <div className="w-full aspect-[4/3] rounded-2xl border border-white/5 bg-gradient-to-br from-[#0f2030] to-[#162535] flex items-center justify-center p-6">
                <svg viewBox="0 0 280 210" className="w-full h-full">
                  <defs>
                    <linearGradient id="gradCal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f7941d" stopOpacity="0.14"/>
                      <stop offset="100%" stopColor="#f7941d" stopOpacity="0.03"/>
                    </linearGradient>
                    <linearGradient id="gradArrow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f7941d" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#28c840" stopOpacity="0.8"/>
                    </linearGradient>
                  </defs>

                  {/* ── Calendar ── */}
                  <rect x="20" y="25" width="150" height="130" rx="8" fill="url(#gradCal)" stroke="#f7941d" strokeWidth="1.8" opacity="0.6"/>
                  {/* Calendar header bar */}
                  <rect x="20" y="25" width="150" height="28" rx="8" fill="#f7941d" opacity="0.12"/>
                  <rect x="20" y="45" width="150" height="8" fill="#0f2030" opacity="0.8"/>
                  {/* Calendar rings */}
                  <rect x="52" y="18" width="4" height="16" rx="2" fill="#f7941d" opacity="0.6"/>
                  <rect x="92" y="18" width="4" height="16" rx="2" fill="#f7941d" opacity="0.6"/>
                  <rect x="132" y="18" width="4" height="16" rx="2" fill="#f7941d" opacity="0.6"/>
                  {/* Month text */}
                  <text x="95" y="43" fontSize="10" fill="#f7941d" opacity="0.7" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle" className="uppercase">PLANNING</text>

                  {/* Calendar grid - 5x4 */}
                  {[0,1,2,3,4].map(col => [0,1,2,3].map(row => {
                    const x = 32 + col * 26;
                    const y = 62 + row * 22;
                    const day = row * 5 + col + 1;
                    const isHighlight = day >= 6 && day <= 10;
                    const isToday = day === 8;
                    return (
                      <g key={`${col}-${row}`}>
                        <rect x={x} y={y} width="20" height="16" rx="3"
                          fill={isToday ? '#f7941d' : isHighlight ? '#f7941d' : 'transparent'}
                          opacity={isToday ? 0.25 : isHighlight ? 0.08 : 0}
                          stroke={isHighlight ? '#f7941d' : 'transparent'}
                          strokeWidth={isHighlight ? '0.8' : '0'}
                          strokeOpacity="0.4"
                        />
                        <text x={x + 10} y={y + 11} fontSize="7" fill="#f7941d"
                          opacity={isToday ? 0.9 : isHighlight ? 0.6 : 0.3}
                          fontFamily="monospace" textAnchor="middle" fontWeight={isToday ? 'bold' : 'normal'}>
                          {day}
                        </text>
                      </g>
                    );
                  }))}

                  {/* ── Arrow from calendar to blueprint: earlier = cheaper ── */}
                  <path d="M175,90 C195,90 200,75 215,75" fill="none" stroke="url(#gradArrow)" strokeWidth="2" strokeDasharray="5,3" opacity="0.6"/>
                  <path d="M212,71 L218,75 L212,79" fill="none" stroke="#28c840" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>

                  {/* ── Blueprint/document ── */}
                  <g transform="translate(195,30)">
                    <rect x="0" y="0" width="68" height="88" rx="5" fill="url(#gradCal)" stroke="#f7941d" strokeWidth="1.5" opacity="0.55"/>
                    {/* Folded corner */}
                    <path d="M53,0 L68,0 L68,15Z" fill="#0f2030" stroke="#f7941d" strokeWidth="0.8" opacity="0.4"/>
                    <path d="M53,0 L53,15 L68,15" fill="none" stroke="#f7941d" strokeWidth="0.8" opacity="0.4"/>
                    {/* Document lines */}
                    <rect x="10" y="22" width="35" height="3" rx="1" fill="#f7941d" opacity="0.3"/>
                    <rect x="10" y="30" width="48" height="3" rx="1" fill="#f7941d" opacity="0.2"/>
                    <rect x="10" y="38" width="40" height="3" rx="1" fill="#f7941d" opacity="0.15"/>
                    {/* Mini 3D shape on document */}
                    <path d="M20,58 L20,48 L38,48 L38,58Z" fill="none" stroke="#f7941d" strokeWidth="1.2" opacity="0.5"/>
                    <path d="M20,48 L28,42 L46,42 L38,48" fill="none" stroke="#f7941d" strokeWidth="1.2" opacity="0.4"/>
                    <path d="M38,48 L46,42 L46,52 L38,58" fill="none" stroke="#f7941d" strokeWidth="1.2" opacity="0.4"/>
                    {/* DXF label */}
                    <text x="34" y="76" fontSize="7" fill="#f7941d" opacity="0.4" fontFamily="monospace" textAnchor="middle">.DXF</text>
                  </g>

                  {/* ── Price tag with discount ── */}
                  <g transform="translate(200,128)">
                    <rect x="0" y="0" width="60" height="32" rx="6" fill="#f7941d" fillOpacity="0.1" stroke="#f7941d" strokeWidth="1.2" opacity="0.5"/>
                    {/* Tag hole */}
                    <circle cx="10" cy="16" r="4" fill="none" stroke="#f7941d" strokeWidth="1" opacity="0.4"/>
                    {/* Euro symbol */}
                    <text x="28" y="13" fontSize="7" fill="#f7941d" opacity="0.5" fontFamily="sans-serif" fontWeight="bold">PRIJS</text>
                    {/* Down arrow = cheaper */}
                    <path d="M35,18 L35,27" stroke="#28c840" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
                    <path d="M31,24 L35,28 L39,24" fill="none" stroke="#28c840" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                  </g>

                  {/* ── Clock icon bottom-left ── */}
                  <g transform="translate(30,164)">
                    <circle cx="16" cy="16" r="14" fill="none" stroke="#f7941d" strokeWidth="1.5" opacity="0.4"/>
                    <line x1="16" y1="16" x2="16" y2="7" stroke="#f7941d" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                    <line x1="16" y1="16" x2="23" y2="18" stroke="#f7941d" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
                    <circle cx="16" cy="16" r="2" fill="#f7941d" opacity="0.5"/>
                  </g>

                  {/* Curved arrow from clock to calendar */}
                  <path d="M62,178 C80,185 120,185 140,160" fill="none" stroke="#f7941d" strokeWidth="1" strokeDasharray="3,3" opacity="0.25"/>
                </svg>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════ FILE CONVERSION (image left, text right) ══════════ */}
      <section className="relative bg-[#0a1220] py-16 sm:py-24 lg:py-36 overflow-hidden">
        {/* Topographic contour background */}
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full opacity-[0.10]" viewBox="0 0 1400 800" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            {/* Top-left large formation */}
            <path d="M-50,0 C50,60 160,120 250,200 C360,300 380,400 330,490 C280,580 370,620 440,600 C520,575 560,500 530,420 C500,340 410,290 320,265 C230,240 120,180 50,110 C-20,40 -50,10 -50,0Z" stroke="#f7941d" strokeWidth="1.2"/>
            <path d="M-50,40 C40,95 145,150 232,225 C335,318 355,410 310,490 C265,568 345,602 408,585 C480,565 515,498 488,428 C461,358 380,312 300,290 C220,268 128,212 62,148 C-4,84 -50,55 -50,40Z" stroke="#f7941d" strokeWidth="1.1"/>
            <path d="M-50,82 C30,130 128,180 210,248 C305,335 322,418 285,488 C248,552 318,582 372,568 C435,550 465,492 442,432 C419,372 348,332 278,315 C208,298 118,248 58,190 C-2,132 -50,100 -50,82Z" stroke="#f7941d" strokeWidth="1"/>
            <path d="M-50,128 C18,168 108,212 182,272 C268,348 282,420 252,478 C222,530 282,555 328,545 C382,530 408,482 390,432 C372,382 312,350 252,338 C192,326 112,282 58,232 C4,182 -50,150 -50,128Z" stroke="#f7941d" strokeWidth="0.9"/>
            {/* Inner eye top-left */}
            <path d="M310,400 C300,425 280,438 262,436 C244,434 232,418 236,398 C240,378 258,365 278,363 C298,361 310,378 310,400Z" stroke="#f7941d" strokeWidth="0.8"/>
            <circle cx="275" cy="400" r="8" stroke="#f7941d" strokeWidth="0.6"/>

            {/* Bottom-right flowing formation */}
            <path d="M1450,750 C1350,700 1250,660 1150,640 C1020,615 960,560 980,480 C1000,400 1080,380 1140,410 C1200,440 1220,500 1200,570 C1180,640 1280,690 1450,720Z" stroke="#f7941d" strokeWidth="1.1"/>
            <path d="M1450,720 C1360,678 1265,645 1170,628 C1050,606 998,558 1015,490 C1032,422 1102,405 1155,432 C1208,459 1225,512 1208,572 C1191,632 1280,668 1450,695Z" stroke="#f7941d" strokeWidth="1"/>
            <path d="M1450,690 C1372,655 1282,628 1195,615 C1088,598 1042,558 1055,502 C1068,446 1128,432 1172,455 C1216,478 1230,522 1216,572 C1202,622 1282,650 1450,672Z" stroke="#f7941d" strokeWidth="0.9"/>
            <ellipse cx="1115" cy="520" rx="14" ry="12" stroke="#f7941d" strokeWidth="0.6"/>

            {/* Subtle horizontal waves */}
            <path d="M-50,520 C150,508 350,535 550,518 C750,501 900,528 1100,512 C1250,500 1350,518 1450,510" stroke="#f7941d" strokeWidth="0.5" opacity="0.45"/>
            <path d="M-50,548 C160,538 340,560 540,546 C740,532 910,555 1110,542 C1260,532 1360,548 1450,540" stroke="#f7941d" strokeWidth="0.4" opacity="0.35"/>

            {/* Small details */}
            <circle cx="750" cy="120" r="16" stroke="#f7941d" strokeWidth="0.6" opacity="0.3"/>
            <circle cx="750" cy="120" r="8" stroke="#f7941d" strokeWidth="0.5" opacity="0.2"/>
            <circle cx="350" cy="700" r="12" stroke="#f7941d" strokeWidth="0.5" opacity="0.2"/>
            <circle cx="1050" cy="200" r="10" stroke="#f7941d" strokeWidth="0.5" opacity="0.2"/>
          </svg>
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(247,148,29,0.05),transparent_70%)]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(247,148,29,0.04),transparent_70%)]" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-16">
          <div className="grid gap-10 sm:gap-16 lg:grid-cols-2 lg:gap-24 items-center">
            {/* Illustration: brand conversion flow */}
            <Reveal direction="left">
              <div className="w-full aspect-[4/3] rounded-2xl border border-white/5 bg-gradient-to-br from-[#0f2030] to-[#162535] flex items-center justify-center p-6">
                <svg viewBox="0 0 320 240" className="w-full h-full">
                  <defs>
                    <linearGradient id="gradConv" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f7941d" stopOpacity="0.14"/>
                      <stop offset="100%" stopColor="#f7941d" stopOpacity="0.03"/>
                    </linearGradient>
                    <linearGradient id="gradConvArrow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f7941d" stopOpacity="0.9"/>
                      <stop offset="100%" stopColor="#28c840" stopOpacity="0.9"/>
                    </linearGradient>
                  </defs>

                  {/* ── Left: Source file (Brand X) ── */}
                  <g transform="translate(15,30)">
                    {/* File shape */}
                    <rect x="0" y="0" width="75" height="95" rx="5" fill="url(#gradConv)" stroke="#f7941d" strokeWidth="1.8" opacity="0.6"/>
                    <path d="M55,0 L75,0 L75,20Z" fill="#0f2030" stroke="#f7941d" strokeWidth="0.8" opacity="0.4"/>
                    <path d="M55,0 L55,20 L75,20" fill="none" stroke="#f7941d" strokeWidth="0.8" opacity="0.4"/>
                    {/* Content lines */}
                    <rect x="10" y="28" width="40" height="3" rx="1" fill="#f7941d" opacity="0.3"/>
                    <rect x="10" y="36" width="50" height="3" rx="1" fill="#f7941d" opacity="0.2"/>
                    <rect x="10" y="44" width="35" height="3" rx="1" fill="#f7941d" opacity="0.15"/>
                    {/* X / other brand icon */}
                    <circle cx="37" cy="68" r="14" fill="none" stroke="#f7941d" strokeWidth="1.5" opacity="0.4"/>
                    <text x="37" y="73" fontSize="12" fill="#f7941d" opacity="0.5" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">?</text>
                    {/* Label */}
                    <text x="37" y="108" fontSize="7" fill="#f7941d" opacity="0.45" fontFamily="monospace" textAnchor="middle" fontWeight="bold">MERK X</text>
                  </g>

                  {/* ── Center: MV3D conversion hub ── */}
                  <g transform="translate(115,45)">
                    {/* Arrows in */}
                    <path d="M-15,55 L8,55" stroke="#f7941d" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                    <path d="M4,51 L10,55 L4,59" fill="none" stroke="#f7941d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>

                    {/* Central hexagon / conversion engine */}
                    <path d="M45,10 L75,25 L75,60 L45,75 L15,60 L15,25Z" fill="#f7941d" fillOpacity="0.06" stroke="#f7941d" strokeWidth="2" opacity="0.7"/>
                    {/* Inner ring */}
                    <circle cx="45" cy="42" r="18" fill="none" stroke="#f7941d" strokeWidth="1.5" opacity="0.4"/>
                    {/* Rotating arrows inside */}
                    <path d="M45,28 A14,14 0 0,1 59,42" fill="none" stroke="#f7941d" strokeWidth="2" strokeLinecap="round" opacity="0.65"/>
                    <path d="M57,37 L60,43 L54,43" fill="#f7941d" opacity="0.65"/>
                    <path d="M45,56 A14,14 0 0,1 31,42" fill="none" stroke="#f7941d" strokeWidth="2" strokeLinecap="round" opacity="0.65"/>
                    <path d="M33,47 L30,41 L36,41" fill="#f7941d" opacity="0.65"/>
                    {/* MV3D text */}
                    <text x="45" y="45" fontSize="7" fill="#f7941d" opacity="0.8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">MV3D</text>

                    {/* Arrows out */}
                    <path d="M82,55 L105,55" stroke="url(#gradConvArrow)" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                    <path d="M101,51 L107,55 L101,59" fill="none" stroke="#28c840" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                    
                    {/* Label below */}
                    <text x="45" y="92" fontSize="6" fill="#f7941d" opacity="0.4" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">CONVERTEER</text>
                  </g>

                  {/* ── Right: Two output targets ── */}
                  {/* Target 1: Excavator */}
                  <g transform="translate(230,18)">
                    <rect x="0" y="0" width="72" height="85" rx="6" fill="url(#gradConv)" stroke="#28c840" strokeWidth="1.5" opacity="0.5"/>
                    {/* Mini excavator */}
                    <rect x="18" y="22" width="36" height="16" rx="3" fill="none" stroke="#f7941d" strokeWidth="1.2" opacity="0.6"/>
                    <rect x="32" y="12" width="20" height="12" rx="2" fill="none" stroke="#f7941d" strokeWidth="1.2" opacity="0.6"/>
                    <line x1="32" y1="16" x2="16" y2="8" stroke="#f7941d" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                    <line x1="16" y1="8" x2="10" y2="20" stroke="#f7941d" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                    <rect x="15" y="38" width="42" height="6" rx="3" fill="none" stroke="#f7941d" strokeWidth="1" opacity="0.4"/>
                    {/* Check mark */}
                    <circle cx="55" cy="55" r="8" fill="#28c840" fillOpacity="0.12" stroke="#28c840" strokeWidth="1.2" opacity="0.5"/>
                    <path d="M50,55 L53,58 L60,51" fill="none" stroke="#28c840" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                    {/* Label */}
                    <text x="36" y="75" fontSize="6" fill="#f7941d" opacity="0.45" fontFamily="monospace" textAnchor="middle" fontWeight="bold">KRAAN</text>
                  </g>

                  {/* Target 2: Rover/GPS */}
                  <g transform="translate(230,118)">
                    <rect x="0" y="0" width="72" height="85" rx="6" fill="url(#gradConv)" stroke="#28c840" strokeWidth="1.5" opacity="0.5"/>
                    {/* Rover/GPS stick */}
                    <line x1="36" y1="15" x2="36" y2="55" stroke="#f7941d" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                    <circle cx="36" cy="12" r="8" fill="none" stroke="#f7941d" strokeWidth="1.5" opacity="0.5"/>
                    <circle cx="36" cy="12" r="3" fill="#f7941d" opacity="0.3"/>
                    {/* Signal waves */}
                    <path d="M28,6 Q36,-2 44,6" fill="none" stroke="#f7941d" strokeWidth="1" opacity="0.3"/>
                    <path d="M24,2 Q36,-8 48,2" fill="none" stroke="#f7941d" strokeWidth="0.8" opacity="0.2"/>
                    {/* Base */}
                    <rect x="28" y="52" width="16" height="8" rx="2" fill="none" stroke="#f7941d" strokeWidth="1.2" opacity="0.5"/>
                    {/* Check mark */}
                    <circle cx="55" cy="55" r="8" fill="#28c840" fillOpacity="0.12" stroke="#28c840" strokeWidth="1.2" opacity="0.5"/>
                    <path d="M50,55 L53,58 L60,51" fill="none" stroke="#28c840" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                    {/* Label */}
                    <text x="36" y="76" fontSize="6" fill="#f7941d" opacity="0.45" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ROVER</text>
                  </g>

                  {/* Split arrows to both targets */}
                  <path d="M225,100 C228,80 228,65 230,50" fill="none" stroke="#28c840" strokeWidth="1" strokeDasharray="3,3" opacity="0.3"/>
                  <path d="M225,100 C228,120 228,140 230,155" fill="none" stroke="#28c840" strokeWidth="1" strokeDasharray="3,3" opacity="0.3"/>

                  {/* Supported formats label bottom */}
                  <text x="55" y="175" fontSize="6" fill="#f7941d" opacity="0.35" fontFamily="monospace" textAnchor="middle">.DXF .DWG .XML .CSV</text>
                  <text x="55" y="185" fontSize="5" fill="#f7941d" opacity="0.25" fontFamily="monospace" textAnchor="middle">TOPCON / LEICA / TRIMBLE / ...</text>
                </svg>
              </div>
            </Reveal>
            <div>
              <Reveal>
                <Logo size="sm" />
              </Reveal>
              <Reveal delay={0.1}>
                <h2 className="mt-5 text-2xl font-black uppercase tracking-tight sm:text-3xl lg:text-[2.75rem] leading-[1.1]">
                  Ander merk? Geen paniek &mdash; converteer en verstuur
                </h2>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="mt-6 text-sm leading-relaxed text-gray-400 uppercase tracking-[0.2em] font-bold">
                  Heb je een machinebesturingsbestand van een ander merk? Geen probleem. Upload het naar MV3D Cloud, converteer het met &eacute;&eacute;n klik naar het juiste formaat en stuur het rechtstreeks door naar je graafkraan of rover.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <p className="mt-4 text-sm leading-relaxed text-gray-500 uppercase tracking-[0.2em] font-bold">
                  Van Topcon naar Leica, van Trimble naar elk ander systeem &mdash; MV3D Cloud overbrugt de kloof tussen merken. Geen gedoe met incompatibele bestanden, geen tijdverlies op de werf.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ REQUEST PRICING CTA ══════════ */}
      <section className="relative py-20 overflow-hidden">
        {/* Orange gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#f7941d] via-[#e8850f] to-[#f7941d]" />
        {/* Topographic contour overlay */}
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 1400 400" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <path d="M-50,120 C150,100 350,140 550,115 C750,90 950,130 1150,110 C1300,96 1450,120 1450,120" stroke="#000" strokeWidth="0.8"/>
            <path d="M-50,155 C160,140 330,170 530,150 C730,130 960,162 1160,145 C1310,134 1450,155 1450,155" stroke="#000" strokeWidth="0.6"/>
            <path d="M-50,280 C140,268 300,295 500,275 C700,255 900,285 1100,268 C1250,256 1450,278 1450,278" stroke="#000" strokeWidth="0.6"/>
            <path d="M-50,310 C150,300 320,322 520,305 C720,288 920,312 1120,298 C1260,288 1450,308 1450,308" stroke="#000" strokeWidth="0.5" opacity="0.5"/>
            <circle cx="350" cy="200" r="22" stroke="#000" strokeWidth="0.6" opacity="0.25"/>
            <circle cx="350" cy="200" r="10" stroke="#000" strokeWidth="0.5" opacity="0.15"/>
            <circle cx="1050" cy="200" r="18" stroke="#000" strokeWidth="0.6" opacity="0.2"/>
          </svg>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(0,0,0,0.08),transparent_70%)]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-8 text-center">
          <Reveal>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white drop-shadow-md sm:text-3xl lg:text-4xl">
              Vraag Offerte
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-3 text-sm font-bold uppercase tracking-[0.2em] text-white/80">
              Ontvang een vrijblijvend voorstel op maat
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10">
              <Link
                href="/offerte"
                className="inline-flex items-center gap-3 rounded-lg border-2 border-white/40 bg-white/15 px-8 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur-sm transition-all hover:border-white/70 hover:bg-white/25 hover:shadow-xl"
              >
                <Mail size={16} />
                Offerte Aanvragen
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════ STATS BAR (like Unicontrol's satellite/operator/distributor bar) ══════════ */}
      <section className="relative bg-[#080e18] border-y border-white/5 overflow-hidden">
        {/* Topographic contour background */}
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full opacity-[0.08]" viewBox="0 0 1400 400" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <path d="M-50,200 C100,180 250,220 400,195 C550,170 700,210 850,190 C1000,170 1150,205 1300,185 C1400,172 1450,190 1450,190" stroke="#f7941d" strokeWidth="0.8"/>
            <path d="M-50,230 C110,215 240,248 390,228 C540,208 710,240 860,222 C1010,204 1160,232 1310,218 C1400,210 1450,222 1450,222" stroke="#f7941d" strokeWidth="0.6"/>
            <path d="M-50,260 C120,248 230,275 380,258 C530,241 720,268 870,254 C1020,240 1170,260 1320,250 C1400,244 1450,254 1450,254" stroke="#f7941d" strokeWidth="0.5" opacity="0.6"/>
            <circle cx="250" cy="150" r="30" stroke="#f7941d" strokeWidth="0.6" opacity="0.3"/>
            <circle cx="250" cy="150" r="15" stroke="#f7941d" strokeWidth="0.5" opacity="0.2"/>
            <circle cx="1100" cy="280" r="25" stroke="#f7941d" strokeWidth="0.6" opacity="0.25"/>
            <circle cx="1100" cy="280" r="12" stroke="#f7941d" strokeWidth="0.5" opacity="0.15"/>
          </svg>
        </div>
        <div className="relative mx-auto max-w-5xl px-8 py-16">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {[
              { value: '85', label: '3D Agenten' },
              { value: '850+', label: 'Werven Verwerkt' },
              { value: '99.9%', label: 'Uptime Garantie' },
            ].map((stat, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="text-center">
                  <p className="text-4xl font-black tracking-tight text-[var(--accent)] sm:text-5xl lg:text-6xl">{stat.value}</p>
                  <p className="mt-3 text-sm font-bold uppercase tracking-[0.25em] text-gray-500">
                    {stat.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ COMPATIBLE BRANDS ══════════ */}
      <section className="relative bg-[#080e18] py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(247,148,29,0.04),transparent_70%)]" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-8">
          <Reveal>
            <p className="mb-10 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
              Compatibel met alle grote besturingen
            </p>
          </Reveal>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 lg:gap-20">
            {[
              { name: 'Topcon', src: '/brands/topcon.svg', w: 130, h: 28 },
              { name: 'Leica', src: '/brands/leica.svg', w: 100, h: 28 },
              { name: 'Trimble', src: '/brands/trimble.svg', w: 120, h: 28 },
              { name: 'Unicontrol', src: '/brands/unicontrol.svg', w: 150, h: 28 },
              { name: 'CHC Navigation', src: '/brands/chcnav.svg', w: 130, h: 28 },
            ].map((brand, i) => (
              <Reveal key={brand.name} delay={i * 0.08}>
                <div className="group flex items-center justify-center opacity-40 transition-all hover:opacity-90">
                  <img
                    src={brand.src}
                    alt={brand.name}
                    width={brand.w}
                    height={brand.h}
                    className="w-auto transition-all"
                    style={{ height: brand.h }}
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ 3D AGENTS NETWORK + PARTNER SIGNUP ══════════ */}
      <section className="relative bg-[#080e18] py-16 sm:py-24 lg:py-36 overflow-hidden">
        {/* Agent network illustration background */}
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1400 800" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">

            {/* Connection lines between agent nodes */}
            <line x1="180" y1="190" x2="480" y2="340" stroke="rgba(247,148,29,0.08)" strokeWidth="1"/>
            <line x1="480" y1="340" x2="700" y2="380" stroke="rgba(247,148,29,0.1)" strokeWidth="1.2"/>
            <line x1="700" y1="380" x2="1050" y2="260" stroke="rgba(247,148,29,0.08)" strokeWidth="1"/>
            <line x1="700" y1="380" x2="920" y2="560" stroke="rgba(247,148,29,0.06)" strokeWidth="1"/>
            <line x1="700" y1="380" x2="400" y2="580" stroke="rgba(247,148,29,0.06)" strokeWidth="0.8"/>
            <line x1="480" y1="340" x2="320" y2="500" stroke="rgba(0,163,224,0.06)" strokeWidth="0.8"/>
            <line x1="1050" y1="260" x2="1250" y2="360" stroke="rgba(247,148,29,0.05)" strokeWidth="0.8"/>
            <line x1="180" y1="190" x2="350" y2="120" stroke="rgba(0,163,224,0.06)" strokeWidth="0.8"/>
            <line x1="350" y1="120" x2="580" y2="160" stroke="rgba(247,148,29,0.05)" strokeWidth="0.8"/>
            <line x1="580" y1="160" x2="700" y2="380" stroke="rgba(247,148,29,0.04)" strokeWidth="0.6"/>
            <line x1="700" y1="380" x2="580" y2="620" stroke="rgba(0,163,224,0.04)" strokeWidth="0.6"/>
            <line x1="1050" y1="260" x2="1150" y2="140" stroke="rgba(247,148,29,0.04)" strokeWidth="0.6"/>
            <line x1="920" y1="560" x2="1100" y2="640" stroke="rgba(0,163,224,0.04)" strokeWidth="0.6"/>
            <line x1="480" y1="340" x2="250" y2="380" stroke="rgba(247,148,29,0.04)" strokeWidth="0.6"/>
            <line x1="250" y1="380" x2="100" y2="480" stroke="rgba(0,163,224,0.03)" strokeWidth="0.5"/>
            <line x1="1250" y1="360" x2="1350" y2="500" stroke="rgba(247,148,29,0.03)" strokeWidth="0.5"/>

            {/* Large central agent node (hub) */}
            <circle cx="700" cy="380" r="36" stroke="rgba(247,148,29,0.12)" strokeWidth="1.5" fill="none"/>
            <circle cx="700" cy="380" r="24" stroke="rgba(247,148,29,0.08)" strokeWidth="1" fill="none"/>
            <circle cx="700" cy="380" r="8" fill="rgba(247,148,29,0.12)"/>
            {/* Person icon placeholder — head */}
            <circle cx="700" cy="374" r="4" fill="rgba(247,148,29,0.2)"/>
            {/* Person icon — body arc */}
            <path d="M692,387 Q700,381 708,387" stroke="rgba(247,148,29,0.2)" strokeWidth="1.5" fill="none"/>

            {/* Agent node — top left (teal) */}
            <circle cx="180" cy="190" r="22" stroke="rgba(0,163,224,0.12)" strokeWidth="1.2" fill="none"/>
            <circle cx="180" cy="190" r="14" stroke="rgba(0,163,224,0.06)" strokeWidth="0.8" fill="none" strokeDasharray="3 3"/>
            <circle cx="180" cy="184" r="3.5" fill="rgba(0,163,224,0.18)"/>
            <path d="M173,196 Q180,191 187,196" stroke="rgba(0,163,224,0.18)" strokeWidth="1.3" fill="none"/>

            {/* Agent node — left (orange) */}
            <circle cx="480" cy="340" r="18" stroke="rgba(247,148,29,0.1)" strokeWidth="1" fill="none"/>
            <circle cx="480" cy="335" r="3" fill="rgba(247,148,29,0.2)"/>
            <path d="M474,346 Q480,341 486,346" stroke="rgba(247,148,29,0.2)" strokeWidth="1.2" fill="none"/>

            {/* Agent node — right (blue) */}
            <circle cx="1050" cy="260" r="26" stroke="rgba(0,100,200,0.1)" strokeWidth="1.2" fill="none"/>
            <circle cx="1050" cy="260" r="16" stroke="rgba(0,100,200,0.06)" strokeWidth="0.8" fill="none"/>
            <circle cx="1050" cy="254" r="3.5" fill="rgba(0,100,200,0.2)"/>
            <path d="M1043,266 Q1050,261 1057,266" stroke="rgba(0,100,200,0.2)" strokeWidth="1.3" fill="none"/>

            {/* Agent node — bottom left (green) */}
            <circle cx="320" cy="500" r="20" stroke="rgba(34,197,94,0.1)" strokeWidth="1" fill="none"/>
            <circle cx="320" cy="500" r="12" stroke="rgba(34,197,94,0.06)" strokeWidth="0.8" fill="none" strokeDasharray="2 3"/>
            <circle cx="320" cy="495" r="3" fill="rgba(34,197,94,0.16)"/>
            <path d="M314,506 Q320,501 326,506" stroke="rgba(34,197,94,0.16)" strokeWidth="1.2" fill="none"/>

            {/* Agent node — bottom right (orange) */}
            <circle cx="920" cy="560" r="18" stroke="rgba(247,148,29,0.1)" strokeWidth="1" fill="none"/>
            <circle cx="920" cy="555" r="3" fill="rgba(247,148,29,0.15)"/>
            <path d="M914,566 Q920,561 926,566" stroke="rgba(247,148,29,0.15)" strokeWidth="1.2" fill="none"/>

            {/* Agent node — top center (amber) */}
            <circle cx="580" cy="160" r="16" stroke="rgba(247,148,29,0.08)" strokeWidth="1" fill="none"/>
            <circle cx="580" cy="156" r="2.8" fill="rgba(247,148,29,0.15)"/>
            <path d="M575,166 Q580,162 585,166" stroke="rgba(247,148,29,0.15)" strokeWidth="1" fill="none"/>

            {/* Agent node — top right (yellow) */}
            <circle cx="1150" cy="140" r="20" stroke="rgba(234,179,8,0.08)" strokeWidth="1" fill="none" strokeDasharray="4 4"/>
            <circle cx="1150" cy="135" r="3" fill="rgba(234,179,8,0.15)"/>
            <path d="M1144,146 Q1150,141 1156,146" stroke="rgba(234,179,8,0.15)" strokeWidth="1.2" fill="none"/>

            {/* Agent node — far right (teal) */}
            <circle cx="1250" cy="360" r="16" stroke="rgba(0,163,224,0.08)" strokeWidth="1" fill="none"/>
            <circle cx="1250" cy="356" r="2.5" fill="rgba(0,163,224,0.12)"/>
            <path d="M1245,365 Q1250,361 1255,365" stroke="rgba(0,163,224,0.12)" strokeWidth="1" fill="none"/>

            {/* Agent node — far left bottom (blue) */}
            <circle cx="100" cy="480" r="14" stroke="rgba(0,100,200,0.06)" strokeWidth="0.8" fill="none"/>
            <circle cx="100" cy="476" r="2.5" fill="rgba(0,100,200,0.12)"/>
            <path d="M96,485 Q100,481 104,485" stroke="rgba(0,100,200,0.12)" strokeWidth="1" fill="none"/>

            {/* Small decorative dots scattered */}
            <circle cx="350" cy="120" r="4" stroke="rgba(247,148,29,0.08)" strokeWidth="0.8" fill="none"/>
            <circle cx="250" cy="380" r="5" stroke="rgba(0,163,224,0.06)" strokeWidth="0.6" fill="none"/>
            <circle cx="400" cy="580" r="4" fill="rgba(247,148,29,0.06)"/>
            <circle cx="580" cy="620" r="3" fill="rgba(0,163,224,0.05)"/>
            <circle cx="1100" cy="640" r="4" stroke="rgba(34,197,94,0.06)" strokeWidth="0.6" fill="none"/>
            <circle cx="1350" cy="500" r="3" fill="rgba(247,148,29,0.05)"/>
            <circle cx="850" cy="180" r="3" stroke="rgba(247,148,29,0.06)" strokeWidth="0.6" fill="none"/>
            <circle cx="620" cy="480" r="2.5" fill="rgba(0,163,224,0.06)"/>
            <circle cx="800" cy="600" r="2" fill="rgba(34,197,94,0.05)"/>
            <circle cx="420" cy="240" r="2" fill="rgba(247,148,29,0.07)"/>
            <circle cx="960" cy="350" r="2.5" stroke="rgba(247,148,29,0.06)" strokeWidth="0.5" fill="none"/>
            <circle cx="140" cy="340" r="2" fill="rgba(0,100,200,0.06)"/>
            <circle cx="1200" cy="480" r="2.5" stroke="rgba(234,179,8,0.05)" strokeWidth="0.5" fill="none"/>
            <circle cx="530" cy="270" r="1.5" fill="rgba(247,148,29,0.08)"/>
            <circle cx="780" cy="220" r="2" fill="rgba(0,163,224,0.06)"/>
            <circle cx="300" cy="650" r="2" fill="rgba(247,148,29,0.04)"/>
            <circle cx="1050" cy="500" r="1.5" fill="rgba(0,100,200,0.05)"/>

            {/* Arrow tips on some connections */}
            <polygon points="475,338 485,342 480,332" fill="rgba(247,148,29,0.08)"/>
            <polygon points="695,378 705,382 700,372" fill="rgba(247,148,29,0.08)"/>
            <polygon points="1045,258 1055,262 1050,252" fill="rgba(0,100,200,0.08)"/>

            {/* Partial arc decorations */}
            <path d="M650,340 A60,60 0 0,1 750,340" stroke="rgba(247,148,29,0.05)" strokeWidth="0.8" fill="none"/>
            <path d="M660,420 A55,55 0 0,0 740,420" stroke="rgba(0,163,224,0.04)" strokeWidth="0.6" fill="none"/>
            <path d="M160,170 A30,30 0 0,1 200,170" stroke="rgba(0,163,224,0.06)" strokeWidth="0.6" fill="none"/>
            <path d="M1030,240 A30,30 0 0,0 1070,240" stroke="rgba(0,100,200,0.05)" strokeWidth="0.6" fill="none"/>
          </svg>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(247,148,29,0.05),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_25%,rgba(0,163,224,0.03),transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(0,100,200,0.025),transparent_40%)]" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-16">
          {/* Header */}
          <Reveal>
            <div className="mb-10 sm:mb-16 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-[var(--accent)]">
                Ons Netwerk
              </p>
              <h2 className="mt-5 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-6xl">
                85 <span className="text-[var(--accent)]">3D Agenten</span>
                <br />
                Staan voor u klaar
              </h2>
              <p className="mt-6 mx-auto max-w-3xl text-sm text-gray-400 uppercase tracking-[0.15em] font-bold leading-relaxed">
                Uw aanvraag wordt automatisch doorgestuurd naar de 3D partner dichtst bij uw werf.
                <br />
                Snel, lokaal en persoonlijk.
              </p>
            </div>
          </Reveal>

          {/* Network feature cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {[
              {
                icon: MapPin,
                label: '4 Landen',
                headline: 'Actief netwerk',
                text: 'Onze agenten zijn actief in België, Nederland, Frankrijk en Luxemburg. Waar uw project ook is, wij hebben een lokale specialist in de buurt.',
              },
              {
                icon: Users,
                label: '85 Agenten',
                headline: 'Gecertificeerd',
                text: 'Elk lid van ons netwerk is een gecertificeerde landmeter, drone-piloot of 3D-specialist. Gegarandeerde kwaliteit bij elke opdracht.',
              },
              {
                icon: Crosshair,
                label: '12H',
                headline: 'Responstijd',
                text: 'Binnen 12 uur na uw aanvraag wordt een gekwalificeerde agent aan uw project gekoppeld. Geen wachttijden, geen vertragingen.',
              },
              {
                icon: Mail,
                label: 'Ticketservice',
                headline: 'Altijd bereikbaar',
                text: 'Via ons ticketsysteem volgt u elke aanvraag in real-time. Stel vragen, deel bestanden en ontvang updates — alles op één plek.',
              },
            ].map(({ icon: Icon, label, headline, text }, i) => (
              <Reveal key={label} delay={0.15 + i * 0.1}>
                <motion.div
                  whileHover={{ y: -4, borderColor: 'rgba(247,148,29,0.25)' }}
                  transition={{ duration: 0.25 }}
                  className="group relative flex h-full flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-colors"
                >
                  {/* Accent glow on hover */}
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[var(--accent)]/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="relative">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.08]">
                      <Icon className="h-5 w-5 text-[var(--accent)]" />
                    </div>
                    <span className="text-3xl font-black text-white">{label}</span>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--accent)]">{headline}</p>
                    <p className="mt-4 text-sm leading-relaxed text-gray-400">{text}</p>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ BECOME AN AGENT / PARTNER SIGNUP ══════════ */}
      <section className="relative bg-[#0a1220] py-16 sm:py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 1400 800" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <path d="M1450,200 C1350,250 1260,320 1200,410 C1140,500 1170,580 1240,620 C1310,660 1370,620 1380,550 C1390,480 1340,420 1280,380 C1220,340 1300,280 1450,240Z" stroke="#f7941d" strokeWidth="1"/>
            <path d="M1450,240 C1360,282 1280,345 1225,425 C1170,505 1195,575 1255,608 C1315,641 1365,608 1374,548 C1383,488 1340,435 1290,400 C1240,365 1310,310 1450,275Z" stroke="#f7941d" strokeWidth="0.8"/>
            <path d="M-50,600 C30,560 110,530 180,520 C280,505 320,460 300,400 C280,340 220,330 180,360 C140,390 130,440 150,500 C170,560 80,590 -50,610Z" stroke="#f7941d" strokeWidth="0.9"/>
            <path d="M-50,320 C150,308 350,335 550,318 C750,301 950,328 1150,312 C1300,300 1400,318 1450,312" stroke="#f7941d" strokeWidth="0.5" opacity="0.4"/>
          </svg>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(247,148,29,0.05),transparent_60%)]" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-16">
          <div className="grid gap-10 sm:gap-16 lg:grid-cols-2 lg:gap-24 items-start">
            {/* Left: CTA text + benefits */}
            <div>
              <Reveal>
                <p className="text-sm font-bold uppercase tracking-[0.35em] text-[var(--accent)]">
                  Word 3D Agent
                </p>
                <h2 className="mt-5 text-3xl font-black uppercase tracking-tight leading-[1.08] sm:text-4xl lg:text-6xl">
                  Sluit aan bij
                  <br />
                  <span className="text-[var(--accent)]">het MV3D</span>
                  <br />
                  netwerk
                </h2>
              </Reveal>

              <Reveal delay={0.15}>
                <p className="mt-6 max-w-lg text-sm text-gray-400 leading-relaxed">
                  Bent u landmeter, drone-piloot of 3D-specialist? Sluit u aan als gecertificeerd MV3D agent en ontvang automatisch aanvragen uit uw regio. U bepaalt zelf uw beschikbaarheid en tarieven.
                </p>
              </Reveal>

              <div className="mt-10 space-y-4">
                {[
                  { icon: Crosshair, title: 'Opmetingen', desc: 'Klassieke en GPS-opmetingen op de werf' },
                  { icon: Plane, title: 'Dronemetingen', desc: 'Luchtfotogrammetrie en terreinscans' },
                  { icon: PenTool, title: '3D Ontwerp', desc: 'Machinebesturingsplannen en grondmodellen' },
                  { icon: Target, title: 'Uitzettingen', desc: 'Precieze uitzettingen en as-built controle' },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <Reveal key={title} delay={0.2 + i * 0.08}>
                    <motion.div
                      whileHover={{ x: 8 }}
                      className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-[var(--accent)]/20 hover:bg-[var(--accent)]/[0.03]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                        <Icon className="h-5 w-5 text-[var(--accent)]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-wider text-white">{title}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
                      </div>
                    </motion.div>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* Right: partner signup form */}
            <Reveal delay={0.2} direction="right">
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 lg:p-10"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/15">
                    <Users className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-[0.15em]">Agent Worden</h3>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500">Schrijf u in als partner</p>
                  </div>
                </div>

                <form onSubmit={(e: FormEvent) => e.preventDefault()} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Voornaam"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[var(--accent)] focus:outline-none transition"
                    />
                    <input
                      type="text"
                      placeholder="Achternaam"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Bedrijfsnaam"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[var(--accent)] focus:outline-none transition"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="email"
                      placeholder="E-mailadres"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[var(--accent)] focus:outline-none transition"
                    />
                    <input
                      type="tel"
                      placeholder="Telefoonnummer"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[var(--accent)] focus:outline-none transition"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Regio / Werkgebied"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[var(--accent)] focus:outline-none transition"
                  />

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">Welke diensten biedt u aan?</p>
                    <div className="flex flex-wrap gap-2">
                      {['Opmetingen', 'Dronemetingen', '3D Ontwerp', 'Uitzettingen'].map((opt) => (
                        <label key={opt} className="cursor-pointer">
                          <input type="checkbox" className="peer sr-only" />
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] border-r-[3px] border-r-white/20 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.15em] text-gray-400 transition peer-checked:border-[var(--accent)]/30 peer-checked:border-r-[var(--accent)] peer-checked:text-[var(--accent)]"
                            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}
                          >
                            {opt}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Vertel kort over uw ervaring en beschikbaar materiaal..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[var(--accent)] focus:outline-none transition resize-none"
                  />

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--accent)]/30 border-r-[3px] border-r-[var(--accent)] py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)] transition-all hover:border-[var(--accent)]/60 hover:shadow-lg hover:shadow-[var(--accent)]/20"
                    style={{ background: 'linear-gradient(135deg, rgba(247,148,29,0.12) 0%, rgba(247,148,29,0.04) 100%)' }}
                  >
                    <Users size={16} />
                    Aanmelden als Agent
                  </motion.button>
                </form>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════ FAQ (like Unicontrol — accordion + image thumbnails) ══════════ */}
      <section className="relative bg-[#0a1220] py-16 sm:py-24 lg:py-36 overflow-hidden">
        {/* Topographic contour background */}
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 1400 800" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            {/* Center-right organic shape */}
            <path d="M1100,200 C1050,250 1020,330 1050,420 C1080,510 1150,540 1220,510 C1290,480 1300,400 1260,330 C1220,260 1160,220 1100,200Z" stroke="#f7941d" strokeWidth="1"/>
            <path d="M1118,228 C1075,270 1050,342 1075,420 C1100,498 1160,524 1222,498 C1284,472 1292,402 1258,340 C1224,278 1172,242 1118,228Z" stroke="#f7941d" strokeWidth="0.9"/>
            <path d="M1138,258 C1102,292 1082,354 1102,420 C1122,486 1172,508 1224,486 C1276,464 1282,404 1254,352 C1226,300 1182,268 1138,258Z" stroke="#f7941d" strokeWidth="0.8"/>
            <ellipse cx="1190" cy="400" rx="14" ry="18" stroke="#f7941d" strokeWidth="0.6"/>
            <ellipse cx="1190" cy="400" rx="5" ry="7" stroke="#f7941d" strokeWidth="0.5"/>
            {/* Left side formation */}
            <path d="M100,500 C140,450 200,430 260,450 C340,475 380,435 365,380 C350,325 295,310 250,335 C205,360 195,410 215,465 C235,520 170,545 100,530Z" stroke="#f7941d" strokeWidth="0.9"/>
            <path d="M125,490 C158,448 210,432 262,448 C332,470 366,438 354,392 C342,346 295,334 256,354 C217,374 209,416 226,462 C243,508 188,530 125,518Z" stroke="#f7941d" strokeWidth="0.8"/>
            <path d="M150,478 C176,445 218,432 262,445 C320,462 348,438 338,400 C328,362 288,352 258,368 C228,384 222,418 235,455 C248,492 200,512 150,502Z" stroke="#f7941d" strokeWidth="0.7"/>
            {/* Horizontal flow */}
            <path d="M-50,250 C200,240 450,265 700,248 C950,231 1200,258 1450,245" stroke="#f7941d" strokeWidth="0.5" opacity="0.4"/>
            <path d="M-50,275 C210,268 440,288 690,275 C940,262 1210,282 1450,272" stroke="#f7941d" strokeWidth="0.4" opacity="0.3"/>
            <circle cx="500" cy="650" r="18" stroke="#f7941d" strokeWidth="0.5" opacity="0.2"/>
            <circle cx="500" cy="650" r="9" stroke="#f7941d" strokeWidth="0.4" opacity="0.15"/>
            <circle cx="900" cy="120" r="14" stroke="#f7941d" strokeWidth="0.5" opacity="0.2"/>
          </svg>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(247,148,29,0.04),transparent_70%)]" />
        </div>
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-16">
          <Reveal>
            <div className="mb-14 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-[var(--accent)]">
                MV3D Cloud
              </p>
              <h2 className="mt-5 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">
                FAQ
              </h2>
            </div>
          </Reveal>

          <div className="max-w-3xl mx-auto">
            <Reveal delay={0.15}>
              <FaqItem
                question="Wat is MV3D Cloud?"
                answer="MV3D Cloud is een cloudservice waarmee je werfbestanden rechtstreeks vanuit je kantoor naar je teams op het terrein kunt sturen. Zo hoef je niet meer tussen machines te lopen om data over te zetten &mdash; het bespaart je tijd en moeite. Operatoren en landmeters kunnen projectdata, punten, lijnen en as-built informatie uploaden. Alle projectdata wordt automatisch opgeslagen, wat zorgt voor grondige en nauwkeurige documentatie voor elke projectfase. Iedereen met toegang tot de cloud kan samenwerken en de productiviteit verbeteren."
              />
              <FaqItem
                question="Wat zijn de voordelen van MV3D Cloud?"
                answer="MV3D Cloud biedt verschillende voordelen: 1) Verbeterde samenwerking &mdash; snel en eenvoudig as-built informatie en werfbestanden uitwisselen tussen kantoor en terrein. 2) Gestroomlijnde databeheer &mdash; automatische synchronisatie van gelogde punten en lijnen, real-time updates en directe synchronisatie. 3) Verbeterde machine-effici&euml;ntie &mdash; diagnose op afstand en back-up herstel minimaliseren stilstand en verbeteren de algehele vloot-effici&euml;ntie."
              />
              <FaqItem
                question="Welke bestandsformaten worden ondersteund?"
                answer="MV3D Cloud ondersteunt uploads in populaire formaten zoals DXF, XML, DWG en meer. Upload projectdata en ontwerpbestanden, en werk snel en eenvoudig met as-built informatie."
              />
              <FaqItem
                question="Hoe upload je bestanden naar MV3D Cloud?"
                answer="Om bestanden te uploaden maak je eenvoudig een werf aan, wijs je je machines en rovers toe, en sleep je bestanden via de &lsquo;Bestanden&rsquo; &gt; &lsquo;Upload Ontwerp&rsquo; optie. Alle bestanden worden automatisch verstuurd naar de machines die aan de werf zijn toegewezen."
              />
              <FaqItem
                question="Kan ik MV3D Cloud integreren met andere systemen?"
                answer="Ja! MV3D Cloud integreert naadloos met diverse platforms, waardoor een digitale gegevensstroom van ontwerpen en as-built informatie mogelijk is over verschillende machinebesturingssoftware. Dit cre&euml;ert een open gegevensstroom ongeacht de samenstelling van machinebesturingssoftware in je vloot."
              />
              <FaqItem
                question="In welke landen is MV3D actief?"
                answer="MV3D is actief in 4 landen: België, Nederland, Frankrijk en Luxemburg. Ons netwerk van 85 gecertificeerde agenten dekt de volledige Benelux en Frankrijk, zodat er altijd een lokale specialist dichtbij uw werf beschikbaar is."
              />
              <FaqItem
                question="Hoe snel wordt mijn aanvraag behandeld?"
                answer="Binnen 12 uur na uw aanvraag wordt een gekwalificeerde agent aan uw project gekoppeld. Via ons ticketsysteem kunt u de voortgang in real-time volgen, vragen stellen, bestanden delen en updates ontvangen &mdash; alles op &eacute;&eacute;n plek."
              />
              <FaqItem
                question="Wat doet een MV3D Agent precies?"
                answer="Een MV3D Agent is een gecertificeerde landmeter, drone-piloot of 3D-specialist die lokaal beschikbaar is voor opmetingen, dronemetingen, 3D-ontwerpen en uitzettingen op de werf. Agenten ontvangen automatisch aanvragen uit hun regio en bepalen zelf hun beschikbaarheid en tarieven."
              />
              <FaqItem
                question="Hoe kan ik zelf MV3D Agent worden?"
                answer="Bent u landmeter, drone-piloot of 3D-specialist? Via het formulier op onze website kunt u zich aanmelden als gecertificeerd MV3D Agent. Na goedkeuring ontvangt u automatisch aanvragen uit uw regio. U bepaalt zelf uw beschikbaarheid, diensten en tarieven."
              />
              <FaqItem
                question="Welke diensten bieden MV3D Agenten aan?"
                answer="Onze agenten bieden vier kerndiensten: 1) Klassieke en GPS-opmetingen op de werf. 2) Luchtfotogrammetrie en terreinscans via drones. 3) Machinebesturingsplannen en grondmodellen (3D-ontwerp). 4) Precieze uitzettingen en as-built controle. Elke agent kiest zelf welke diensten hij aanbiedt."
              />
              <FaqItem
                question="Hoe werkt de ticketservice?"
                answer="Bij elke aanvraag wordt automatisch een ticket aangemaakt in ons systeem. Via het ticket kunt u bestanden uploaden, vragen stellen aan uw agent en real-time updates ontvangen over de status van uw opdracht. Zo heeft u altijd volledig overzicht."
              />
              <FaqItem
                question="Kan ik een offerte aanvragen via het platform?"
                answer="Ja, via onze offertepagina kunt u eenvoudig een offerte aanvragen. Vul uw gegevens en projectdetails in, en wij koppelen u aan de dichtstbijzijnde beschikbare agent. U ontvangt binnen 12 uur een gepersonaliseerde offerte."
              />
            </Reveal>

            <Reveal delay={0.3}>
              <p className="mt-12 text-center text-gray-500 text-sm uppercase tracking-[0.2em] font-bold">
                Nog vragen? Mail ons op{' '}
                <a href="mailto:support@mv3d.be" className="text-[var(--accent)] underline underline-offset-4 hover:text-[var(--accent-hover)] transition">
                  support@mv3d.be
                </a>
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER (like Unicontrol — logo + links + contact) ══════════ */}
      <footer className="bg-[#060b14] border-t border-white/5">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-16 py-12 sm:py-16">
          <div className="grid gap-8 sm:gap-12 grid-cols-2 md:grid-cols-4">
            {/* Logo */}
            <div>
              <Logo size="lg" variant="dark" />
              <p className="text-sm text-gray-500 leading-relaxed uppercase tracking-[0.2em] font-bold">
                Verbeter samenwerking, optimaliseer productiviteit en verminder stilstand met MV3D Cloud.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-5">Oplossingen</h4>
              <ul className="space-y-3">
                {['3D Opmeting', 'Werfbeheer', 'Machine Control', 'Rover'].map((l) => (
                  <li key={l}>
                    <span className="text-sm text-gray-500 hover:text-[var(--accent)] transition cursor-pointer uppercase tracking-[0.2em] font-bold">{l}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-5">Platform</h4>
              <ul className="space-y-3">
                {['Dashboard', 'Support', 'Machines', 'Bestanden'].map((l) => (
                  <li key={l}>
                    <Link href={`/${l.toLowerCase()}`} className="text-sm text-gray-500 hover:text-[var(--accent)] transition uppercase tracking-[0.2em] font-bold">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-5">Contact</h4>
              <ul className="space-y-3 text-sm text-gray-500 uppercase tracking-[0.2em] font-bold">
                <li>
                  <a href="mailto:contact@mv3d.be" className="hover:text-[var(--accent)] transition">contact@mv3d.be</a>
                </li>
                <li>
                  <a href="tel:+3200000000" className="hover:text-[var(--accent)] transition">+32 (0) 000 00 00</a>
                </li>
                <li>Belgi&euml;</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600 uppercase tracking-[0.2em] font-bold">
              &copy; 2026 MV3D Cloud. Alle rechten voorbehouden.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-xs text-gray-500 hover:text-[var(--accent)] transition uppercase tracking-[0.2em] font-bold">
                Inloggen
              </Link>
              <Link href="/support" className="text-xs text-gray-500 hover:text-[var(--accent)] transition uppercase tracking-[0.2em] font-bold">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}