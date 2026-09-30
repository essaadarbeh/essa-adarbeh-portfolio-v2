"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

type Props = {
  /** Shown on the left of the handle (on top, clipped). */
  left: React.ReactNode;
  /** Shown on the right of the handle (underneath, interactive). */
  right: React.ReactNode;
  /** Describes what's being compared, for the slider's accessible name. */
  label: string;
  /** Name of the left side, for the slider's value text. */
  leftName: string;
  className?: string;
  handleClassName?: string;
};

/**
 * Two layers at identical coordinates and a handle between them. The left
 * layer is revealed by two opposing transforms (outer clips, inner counter-
 * moves), so dragging never repaints either side; position is written to the
 * DOM directly, never through React state.
 */
export default function CompareSlider({ left, right, label, leftName, className, handleClassName }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const pos = useRef({ v: 50 });
  const dragging = useRef(false);

  const apply = useCallback(
    (v: number) => {
      pos.current.v = v;
      if (outer.current) outer.current.style.transform = `translate3d(${v - 100}%, 0, 0)`;
      if (inner.current) inner.current.style.transform = `translate3d(${100 - v}%, 0, 0)`;
      if (handle.current) handle.current.style.transform = `translate3d(${v}%, 0, 0)`;
      if (knob.current) {
        knob.current.setAttribute("aria-valuenow", String(Math.round(v)));
        knob.current.setAttribute("aria-valuetext", `${Math.round(v)}% ${leftName}`);
      }
    },
    [leftName],
  );

  const fromClientX = useCallback(
    (x: number) => {
      const r = stage.current!.getBoundingClientRect();
      gsap.killTweensOf(pos.current);
      apply(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100)));
    },
    [apply],
  );

  // one nudge when it first comes into view, so the handle announces itself
  useEffect(() => {
    apply(50);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        gsap.fromTo(
          pos.current,
          { v: 86 },
          { v: 50, duration: 1.8, ease: "expo.inOut", delay: 0.2, onUpdate: () => apply(pos.current.v) },
        );
      },
      { threshold: 0.6 },
    );
    io.observe(stage.current!);
    return () => io.disconnect();
  }, [apply]);

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    const v = pos.current.v;
    const next = { ArrowLeft: v - step, ArrowRight: v + step, Home: 0, End: 100 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    gsap.killTweensOf(pos.current);
    apply(Math.min(100, Math.max(0, next)));
  };

  return (
    <div ref={stage} className={`relative w-full select-none overflow-hidden ${className ?? ""}`}>
      <div className="absolute inset-0">{right}</div>

      <div
        ref={outer}
        aria-hidden
        className="absolute inset-0 overflow-hidden will-change-transform"
        style={{ transform: "translate3d(-50%, 0, 0)" }}
      >
        <div
          ref={inner}
          className="absolute inset-0 will-change-transform"
          style={{ transform: "translate3d(50%, 0, 0)" }}
        >
          {left}
        </div>
      </div>

      <div
        ref={handle}
        className="pointer-events-none absolute inset-0 z-20 will-change-transform"
        style={{ transform: "translate3d(50%, 0, 0)" }}
      >
        <div className={`absolute inset-y-0 left-0 w-px ${handleClassName ?? "bg-ink"}`} />
        <div
          ref={knob}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={50}
          aria-valuetext={`50% ${leftName}`}
          data-cursor="Drag"
          onKeyDown={onKey}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => dragging.current && fromClientX(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
          className="pointer-events-auto absolute left-0 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-full bg-ink text-chalk shadow-lg ring-2 ring-chalk/30 transition-transform duration-300 hover:scale-110 active:scale-95"
        >
          <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden>
            <path d="M6 1 1 6l5 5M16 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </div>
      </div>
    </div>
  );
}
