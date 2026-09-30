// Stroke icons for the live demos, drawn on a 24px grid to match the
// 24px icon set in the Lumen and Atlas design files.

type P = { size?: number; className?: string };

const Svg = ({ size = 16, className, children }: P & { children: React.ReactNode }) => (
  <svg
    aria-hidden
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

export const IconMore = (p: P) => (
  <Svg {...p}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </Svg>
);

export const IconTrendUp = (p: P) => (
  <Svg {...p}>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </Svg>
);

export const IconTrendDown = (p: P) => (
  <Svg {...p}>
    <path d="m3 7 6 6 4-4 8 8" />
    <path d="M14 17h7v-7" />
  </Svg>
);

export const IconGlobe = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </Svg>
);

export const IconFile = (p: P) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </Svg>
);

export const IconDatabase = (p: P) => (
  <Svg {...p}>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
  </Svg>
);

export const IconShield = (p: P) => (
  <Svg {...p}>
    <path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6z" />
  </Svg>
);

export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="m5 12 5 5 9-10" />
  </Svg>
);

export const IconCheckCircle = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </Svg>
);

export const IconReplay = (p: P) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </Svg>
);

/** The running indicator: eight ticks, spun with CSS. */
export const IconSpinner = ({ size = 15, className }: P) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" className={`animate-spin ${className ?? ""}`}>
    {Array.from({ length: 8 }, (_, i) => (
      <line
        key={i}
        x1="12"
        y1="3"
        x2="12"
        y2="7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity={0.25 + (i / 8) * 0.75}
        transform={`rotate(${i * 45} 12 12)`}
      />
    ))}
  </svg>
);
