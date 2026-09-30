"use client";

import { useEffect, useRef } from "react";

/** Figma's mark, so the link reads as "this opens Figma" at a glance. */
export function FigmaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 38 57" className={className} aria-hidden>
      <path d="M19 0H9.5a9.5 9.5 0 0 0 0 19H19V0Z" fill="#F24E1E" />
      <path d="M19 0h9.5a9.5 9.5 0 0 1 0 19H19V0Z" fill="#FF7262" />
      <path d="M19 19H9.5a9.5 9.5 0 0 0 0 19H19V19Z" fill="#A259FF" />
      <circle cx="28.5" cy="28.5" r="9.5" fill="#1ABCFE" />
      <path d="M19 38H9.5A9.5 9.5 0 1 0 19 47.5V38Z" fill="#0ACF83" />
    </svg>
  );
}

/** The main "open the file" button, near the top of a case study. */
export function FigmaButton({ href, title, className }: { href: string; title: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`group inline-flex items-center gap-3 rounded-full bg-[var(--fg)] py-3 pl-4 pr-5 font-medium text-[var(--bg)] shadow-[0_12px_24px_-12px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:-rotate-1 hover:scale-[1.03] ${className ?? ""}`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white">
        <FigmaLogo className="h-5 w-auto" />
      </span>
      Open the {title} file in Figma
      <svg
        aria-hidden
        width="14"
        height="14"
        viewBox="0 0 14 14"
        className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      >
        <path d="M4 10 10 4M5 4h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/**
 * A small "Figma ↗" that follows you down the case study once the top has
 * scrolled away, and steps aside at the end, where the file is linked again.
 */
export function FloatingFigma({
  href,
  title,
  after,
  before,
}: {
  href: string;
  title: string;
  /** Show once this has scrolled out of view. */
  after: React.RefObject<HTMLElement | null>;
  /** Hide while this is in view. */
  before: React.RefObject<HTMLElement | null>;
}) {
  const el = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const a = after.current,
      b = before.current,
      link = el.current;
    if (!a || !b || !link) return;
    const state = { past: false, end: false };
    const apply = () => (link.dataset.show = String(state.past && !state.end));
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === a) state.past = !e.isIntersecting && e.boundingClientRect.top < 0;
        if (e.target === b) state.end = e.isIntersecting;
      }
      apply();
    });
    io.observe(a);
    io.observe(b);
    return () => io.disconnect();
  }, [after, before]);

  return (
    <a
      ref={el}
      href={href}
      target="_blank"
      rel="noreferrer"
      data-show="false"
      aria-label={`Open the ${title} file in Figma (opens in a new tab)`}
      className="figma-float fixed bottom-4 right-4 z-[90] flex items-center gap-2.5 rounded-full bg-white py-2 pl-2.5 pr-4 text-sm font-semibold text-[#1e1e1e] shadow-[0_2px_4px_rgba(0,0,0,0.08),0_14px_30px_-10px_rgba(0,0,0,0.45)] ring-1 ring-black/5 sm:bottom-6 sm:right-6"
    >
      <FigmaLogo className="h-5 w-auto" />
      Open in Figma
      <svg aria-hidden width="12" height="12" viewBox="0 0 14 14">
        <path d="M4 10 10 4M5 4h5v5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </a>
  );
}
