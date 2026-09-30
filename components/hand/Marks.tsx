"use client";

import { useEffect, useRef } from "react";

// Pen marks drawn by hand (paths authored with deliberate wobble, overshoot
// and uneven pressure), drawn onto the page with stroke-dashoffset. Every
// path uses pathLength=1, so one CSS rule animates any of them. Strokes scale
// with the mark (no non-scaling-stroke: Chrome measures dashes in screen
// space then, and cuts marks short), which also gives them a pen's uneven weight.

const PATHS = {
  // a loop that overshoots its start, the way a real circle around a word does
  circle: [
    "M 30 12 C 70 2, 150 1, 184 16 C 204 26, 198 52, 166 64 C 126 76, 50 76, 18 60 C -2 50, 0 24, 26 12 C 50 2, 90 -2, 128 2",
  ],
  underline: ["M 3 12 C 40 6, 90 13, 140 8 S 215 5, 247 10", "M 18 20 C 70 15, 150 19, 236 15"],
  squiggle: ["M 3 12 C 13 2, 21 22, 31 12 S 49 2, 59 12 S 77 22, 87 12 S 105 2, 115 12 S 133 22, 143 12"],
  arrow: ["M 6 8 C 34 6, 66 22, 78 58", "M 64 50 L 79 60 L 86 43"],
  arrowLeft: ["M 94 10 C 64 6, 30 20, 16 56", "M 8 42 L 15 58 L 31 52"],
  check: ["M 4 16 L 12 26 C 18 16, 26 6, 38 2"],
  strike: ["M 2 10 C 30 6, 70 12, 110 8"],
  star: ["M 20 3 L 25 16 L 38 17 L 27 25 L 31 38 L 20 30 L 9 38 L 13 25 L 2 17 L 15 16 Z"],
} as const;

const BOXES: Record<keyof typeof PATHS, string> = {
  circle: "0 0 200 76",
  underline: "0 0 250 24",
  squiggle: "0 0 146 24",
  arrow: "0 0 90 66",
  arrowLeft: "0 0 100 66",
  check: "0 0 40 30",
  strike: "0 0 112 18",
  star: "0 0 40 40",
};

type MarkProps = {
  kind: keyof typeof PATHS;
  className?: string;
  /** Seconds after the scope switches on. */
  delay?: number;
  duration?: number;
  width?: number;
};

export function Mark({ kind, className, delay = 0, duration = 0.7, width = 2 }: MarkProps) {
  const paths = PATHS[kind];
  return (
    <svg
      aria-hidden
      viewBox={BOXES[kind]}
      preserveAspectRatio="none"
      className={`pointer-events-none overflow-visible ${className ?? ""}`}
      fill="none"
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          className="ink-path"
          stroke="currentColor"
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={
            {
              "--delay": `${delay + i * duration * 0.85}s`,
              "--dur": `${i === 0 ? duration : duration * 0.5}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </svg>
  );
}

/** Words that appear as if written: a left-to-right reveal at pen speed. */
export function Written({
  children,
  className,
  delay = 0,
  as: Tag = "span",
}: {
  children: string;
  className?: string;
  delay?: number;
  as?: "span" | "p";
}) {
  // roughly a letter every 45ms, like a quick hand
  const dur = Math.max(0.35, children.length * 0.045);
  return (
    <Tag
      className={`written font-hand ${className ?? ""}`}
      style={{ "--delay": `${delay}s`, "--dur": `${dur}s` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** A strip of masking tape. */
export function Tape({ className, rotate = 0 }: { className?: string; rotate?: number }) {
  return (
    <span aria-hidden className={`tape ${className ?? ""}`} style={{ "--r": `${rotate}deg` } as React.CSSProperties} />
  );
}

/**
 * Switches its marks on when it scrolls into view (or immediately, if `on`
 * is controlled by the parent). Marks inside stay undrawn until then.
 */
export function DrawScope({
  children,
  className,
  on,
  threshold = 0.35,
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  on?: boolean;
  threshold?: number;
  as?: "div" | "section" | "span";
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (on !== undefined) {
      el.dataset.draw = on ? "on" : "off";
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.draw = "on";
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [on, threshold]);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} data-draw="off" className={className} {...rest}>
      {children}
    </Tag>
  );
}
