"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

/**
 * Lenis drives the scroll, GSAP's ticker drives Lenis — one clock for both, so
 * scrubbed ScrollTriggers never drift a frame behind the smoothed position.
 * Skipped under reduced motion and on touch screens: phones already have
 * native momentum scrolling, and it is smoother and cheaper than any emulation.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    // the mobile address bar showing/hiding resizes the viewport; don't
    // recalculate every trigger for it
    ScrollTrigger.config({ ignoreMobileResize: true });
    if (matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return;

    const instance = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      anchors: { offset: 0 },
    });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
