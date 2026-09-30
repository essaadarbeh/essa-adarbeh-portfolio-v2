/**
 * Essa's mark: a pair of round glasses. The left lens is drawn by hand, the
 * right one is a perfect circle: design and build, side by side. The same
 * geometry makes the favicon, the app icon and the share image, so change it
 * here and in lib/lenses.ts together.
 */
import { LENSES } from "@/lib/lenses";

export default function Lenses({
  ink = "var(--color-ink)",
  accent = "var(--color-field)",
  className,
  draw,
  title,
}: {
  ink?: string;
  accent?: string;
  className?: string;
  /** Draw the hand lens in with the pen when it mounts. */
  draw?: boolean;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <path
        d={LENSES.hand}
        fill="none"
        stroke={ink}
        strokeWidth={3.8}
        strokeLinecap="round"
        pathLength={draw ? 1 : undefined}
        className={draw ? "ink-now" : undefined}
        style={draw ? ({ "--dur": "0.9s", "--delay": "0.4s" } as React.CSSProperties) : undefined}
      />
      <circle cx={LENSES.ring.cx} cy={LENSES.ring.cy} r={LENSES.ring.r} fill="none" stroke={accent} strokeWidth={4.4} />
      <path d={LENSES.bridge} fill="none" stroke={ink} strokeWidth={3.4} strokeLinecap="round" />
      <path d={LENSES.templeL} stroke={ink} strokeWidth={3.4} strokeLinecap="round" />
      <path d={LENSES.templeR} stroke={accent} strokeWidth={3.4} />
    </svg>
  );
}
