"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

/**
 * A dot that follows the pointer and becomes a labelled disc over anything
 * with data-cursor="Label". Fine pointers only; touch keeps the system cursor.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = matchMedia("(pointer: fine)");
    if (!fine.matches) return;
    setEnabled(true);
    document.documentElement.classList.add("has-cursor");

    const el = dot.current!;
    const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
    let shown = false;

    const move = (e: PointerEvent) => {
      if (!shown) {
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { autoAlpha: 1, duration: 0.3 });
        shown = true;
      }
      xTo(e.clientX);
      yTo(e.clientY);
      const target = (e.target as Element | null)?.closest?.("[data-cursor], a, button, [role=slider], input");
      setLabel(target?.getAttribute("data-cursor") ?? null);
      setActive(Boolean(target));
    };
    const leave = () => {
      gsap.to(el, { autoAlpha: 0, duration: 0.2 });
      shown = false;
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  if (!enabled) return <div ref={dot} hidden />;

  return (
    <div
      ref={dot}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[300] opacity-0"
      style={{ mixBlendMode: label ? "normal" : "difference" }}
    >
      <div
        className={`-translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-[width,height,background-color] duration-500 ease-[var(--ease-out-expo)] ${
          label ? "h-24 w-24 bg-marigold text-ink" : active ? "h-11 w-11 bg-white" : "h-3 w-3 bg-white"
        }`}
      >
        {label && <span className="px-2 text-center text-[13px] font-medium leading-tight">{label}</span>}
      </div>
    </div>
  );
}
