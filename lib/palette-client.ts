"use client";

import { useEffect, useState } from "react";
import { getPalette, palettes, PALETTE_EVENT, PALETTE_STORAGE_KEY, type Palette } from "./palettes";

export const currentPalette = (): Palette =>
  getPalette(typeof document === "undefined" ? null : document.documentElement.dataset.palette);

/**
 * Switches the palette. Where View Transitions exist, the new palette is
 * revealed as a circle growing from `origin` (usually the click point);
 * elsewhere, or under reduced motion, it swaps instantly.
 */
export function setPalette(id: string, origin?: { x: number; y: number }) {
  const p = getPalette(id);
  const root = document.documentElement;
  if (root.dataset.palette === p.id) return;

  const apply = () => {
    root.dataset.palette = p.id;
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, p.id);
    } catch {}
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", p.field);
    // portraits listen and re-render synchronously, so the new frame is in
    // the view-transition snapshot
    window.dispatchEvent(new CustomEvent<Palette>(PALETTE_EVENT, { detail: p }));
  };

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduced) return apply();

  const x = origin?.x ?? innerWidth / 2;
  const y = origin?.y ?? innerHeight / 2;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const t = document.startViewTransition(apply);
  t.ready
    .then(() =>
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 850, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
      ),
    )
    .catch(() => {});
}

export function nextPalette(origin?: { x: number; y: number }) {
  const i = palettes.findIndex((p) => p.id === currentPalette().id);
  setPalette(palettes[(i + 1) % palettes.length].id, origin);
}

export function usePalette() {
  const [palette, set] = useState<Palette>(palettes[0]);
  useEffect(() => {
    set(currentPalette());
    const on = (e: Event) => set((e as CustomEvent<Palette>).detail);
    window.addEventListener(PALETTE_EVENT, on);
    return () => window.removeEventListener(PALETTE_EVENT, on);
  }, []);
  return palette;
}
