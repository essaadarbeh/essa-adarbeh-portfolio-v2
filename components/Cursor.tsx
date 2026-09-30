"use client";

import { useEffect, useRef } from "react";

/**
 * Two layers. The dot sits exactly on the pointer every frame (no easing, so
 * it never feels behind). The ring trails it with a short lerp and grows over
 * anything interactive; over [data-cursor="Label"] it becomes a labelled disc.
 * Everything is transform and opacity on fixed layers, written straight to
 * the DOM, so moving the mouse never triggers layout or a React render.
 * Fine pointers only; touch keeps the system behaviour.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches) return;
    const d = dot.current!;
    const r = ring.current!;
    const l = label.current!;
    document.documentElement.classList.add("has-cursor");
    d.hidden = r.hidden = false;

    const pos = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    // the ring is drawn at its largest (label) size and scaled down, so the
    // label text is crisp at scale 1
    const REST = 0.4;
    let scale = REST;
    let targetScale = REST;
    let raf = 0;
    let shown = false;
    let lastLabel: string | null = null;

    const frame = () => {
      raf = 0;
      // ~0.35 per frame closes the gap in well under 100ms
      ringPos.x += (pos.x - ringPos.x) * 0.35;
      ringPos.y += (pos.y - ringPos.y) * 0.35;
      scale += (targetScale - scale) * 0.3;
      r.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) scale(${scale})`;
      if (
        Math.abs(pos.x - ringPos.x) > 0.1 ||
        Math.abs(pos.y - ringPos.y) > 0.1 ||
        Math.abs(targetScale - scale) > 0.001
      ) {
        raf = requestAnimationFrame(frame);
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const move = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      d.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (!shown) {
        shown = true;
        ringPos.x = pos.x;
        ringPos.y = pos.y;
        d.style.opacity = r.style.opacity = "1";
      }

      const target = (e.target as Element | null)?.closest?.(
        "[data-cursor], a, button, label, [role=slider], [role=tab], [role=radio], input[type=range]",
      );
      const text = target?.getAttribute("data-cursor") ?? null;
      // stand aside over text fields, and where a component draws its own pointer
      const overText = (e.target as Element | null)?.closest?.("input:not([type=range]), textarea, [data-cursor-hide]");
      if (text !== lastLabel) {
        lastLabel = text;
        l.textContent = text ?? "";
        r.dataset.label = text ? "true" : "";
      }
      targetScale = text ? 1 : target ? 0.62 : REST;
      d.style.opacity = overText ? "0" : "1";
      r.style.opacity = overText ? "0" : "1";
      kick();
    };
    const leave = () => {
      shown = false;
      d.style.opacity = r.style.opacity = "0";
    };
    const down = () => {
      targetScale *= 0.85;
      kick();
    };
    const up = () => {
      targetScale /= 0.85;
      kick();
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div
        ref={ring}
        hidden
        aria-hidden
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[300] opacity-0 will-change-transform"
      >
        <span ref={label} className="cursor-label" />
      </div>
      <div
        ref={dot}
        hidden
        aria-hidden
        className="cursor-dot pointer-events-none fixed left-0 top-0 z-[301] opacity-0 will-change-transform"
      />
    </>
  );
}
