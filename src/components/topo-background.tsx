export default function TopoBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Radial glow accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(247,148,29,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(247,148,29,0.04),transparent_50%)]" />

      {/* Topographic contour lines */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.18]"
        viewBox="0 0 1400 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
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
      <div className="absolute left-[15%] top-1/4 h-72 w-72 rounded-full bg-[var(--accent)]/[0.04] blur-[100px]" />
      <div className="absolute bottom-1/4 right-[10%] h-96 w-96 rounded-full bg-[var(--accent)]/[0.03] blur-[120px]" />
    </div>
  )
}
