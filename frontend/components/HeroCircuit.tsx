export function HeroCircuit() {
  return (
    <svg
      viewBox="0 0 640 640"
      className="w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C08552" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#C08552" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#C08552" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="traceFade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5B8DEF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#5B8DEF" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* ambient glow behind the core */}
      <circle cx="320" cy="320" r="220" fill="url(#coreGlow)" className="animate-pulse-slow" />

      {/* outer ring of orbit + solder points */}
      <circle cx="320" cy="320" r="180" fill="none" stroke="#232E3D" strokeWidth="1.5" />
      <circle cx="320" cy="320" r="240" fill="none" stroke="#232E3D" strokeWidth="1" strokeDasharray="2 8" />

      {/* radiating circuit traces, right-angled like a real PCB */}
      <g stroke="#5B8DEF" strokeWidth="1.5" fill="none" opacity="0.7">
        <path d="M320 140 V90 H420" />
        <path d="M320 500 V560 H240" />
        <path d="M140 320 H70 V240" />
        <path d="M500 320 H580 V400" />
        <path d="M210 210 L150 150 H90" />
        <path d="M430 430 L490 490 H560" />
        <path d="M430 210 L490 150 H540" />
        <path d="M210 430 L150 490 H100" />
      </g>

      {/* solder points at trace ends */}
      <g fill="#C08552">
        <circle cx="420" cy="90" r="4" />
        <circle cx="240" cy="560" r="4" />
        <circle cx="70" cy="240" r="4" />
        <circle cx="580" cy="400" r="4" />
        <circle cx="90" cy="150" r="3" />
        <circle cx="560" cy="490" r="3" />
        <circle cx="540" cy="150" r="3" />
        <circle cx="100" cy="490" r="3" />
      </g>

      {/* inner hexagonal chip housing */}
      <polygon
        points="320,220 390,260 390,340 320,380 250,340 250,260"
        fill="#121821"
        stroke="#C08552"
        strokeWidth="2"
      />
      <polygon
        points="320,240 372,268 372,332 320,360 268,332 268,268"
        fill="none"
        stroke="#5B8DEF"
        strokeWidth="1"
        opacity="0.6"
      />

      {/* pulsing core node */}
      <circle cx="320" cy="300" r="14" fill="#C08552" className="animate-pulse-slow" />
      <circle cx="320" cy="300" r="24" fill="none" stroke="#C08552" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
