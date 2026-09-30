"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useLenis } from "@/components/SmoothScroll";

export const ROUTE_EVENT = "route:go";
export type RouteDetail = { href: string; color: string; fg: string; label: string; x: number; y: number };

/**
 * Page-to-page transition. A link dispatches ROUTE_EVENT; the overlay floods
 * the screen from the click point in the destination's colour with its name,
 * the route changes underneath, and the overlay lifts off the new page.
 */
export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const overlay = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLParagraphElement>(null);
  const pending = useRef(false);
  const first = useRef(true);

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<RouteDetail>).detail;
      const el = overlay.current!;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(d.href);
        return;
      }
      el.style.background = d.color;
      el.style.color = d.fg;
      label.current!.textContent = d.label;
      gsap.killTweensOf(el);
      gsap.set(el, { visibility: "visible", clipPath: `circle(0% at ${d.x}px ${d.y}px)` });
      gsap.fromTo(
        label.current,
        { yPercent: 60, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.7, delay: 0.25, ease: "expo.out" },
      );
      gsap.to(el, {
        clipPath: `circle(150% at ${d.x}px ${d.y}px)`,
        duration: 0.75,
        ease: "power3.inOut",
        onComplete: () => {
          pending.current = true;
          router.push(d.href, { scroll: false });
        },
      });
    };
    window.addEventListener(ROUTE_EVENT, on);
    return () => window.removeEventListener(ROUTE_EVENT, on);
  }, [router]);

  // the new page is in: reset scroll underneath, then lift the overlay
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const hash = window.location.hash.slice(1);
    const target = hash ? document.getElementById(hash) : null;
    const y = target ? target.getBoundingClientRect().top + window.scrollY : 0;
    lenis?.scrollTo(y, { immediate: true, force: true });
    window.scrollTo(0, y);
    document.documentElement.dataset.intro = "done";
    requestAnimationFrame(() => ScrollTrigger.refresh());
    if (!pending.current) return;
    pending.current = false;
    const el = overlay.current!;
    gsap.to(label.current, { yPercent: -60, opacity: 0, duration: 0.5, ease: "power2.in" });
    gsap.fromTo(
      el,
      { clipPath: "inset(0% 0% 0% 0%)" },
      {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: 0.9,
        delay: 0.15,
        ease: "expo.inOut",
        onComplete: () => gsap.set(el, { visibility: "hidden" }),
      },
    );
  }, [pathname, lenis]);

  return (
    <div
      ref={overlay}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[400] grid place-items-center overflow-hidden"
      style={{ visibility: "hidden" }}
    >
      <p ref={label} className="display text-[18vw] uppercase leading-none [--wdth:120]" />
    </div>
  );
}
