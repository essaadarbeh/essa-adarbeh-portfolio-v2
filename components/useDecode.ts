"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "<>/{}[]=+*#%_-";

/**
 * Writes `text` into the returned ref's element with a decode effect: every
 * character scrambles, then resolves left to right. Updates textContent
 * directly, so no React render per frame. Instant under reduced motion.
 */
export function useDecode<T extends HTMLElement>(text: string, duration = 700) {
  const ref = useRef<T>(null);
  const first = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (first.current || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      first.current = false;
      el.textContent = text;
      return;
    }
    const start = performance.now();
    const jitter = Array.from(text, () => Math.random() * 0.25);
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const at = (i / text.length) * 0.75 + jitter[i];
        out += ch === " " || t >= at ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (t < 1) raf = requestAnimationFrame(tick);
      else el.textContent = text;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration]);

  return ref;
}
