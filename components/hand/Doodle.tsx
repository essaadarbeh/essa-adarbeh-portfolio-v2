"use client";

import { useEffect, useRef, useState } from "react";

type Pt = { x: number; y: number; w: number };

/**
 * A ballpoint for the visitor. Drag anywhere on the host (not on links or
 * buttons) to draw; fast strokes run thin, slow ones pool ink, like a real
 * pen. Mouse and trackpad only, so touch still scrolls.
 */
export default function Doodle({
  host,
  onFirstStroke,
}: {
  host: React.RefObject<HTMLElement | null>;
  onFirstStroke?: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Pt[][]>([]);
  const [hasInk, setHasInk] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    const el = host.current!;
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const ink = () => getComputedStyle(el).getPropertyValue("--color-field").trim() || "#2b3bff";

    const drawSegment = (a: Pt, b: Pt, m: Pt) => {
      ctx.lineWidth = (a.w + b.w) / 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(m.x, m.y, b.x, b.y);
      ctx.stroke();
    };
    const redraw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.strokeStyle = ink();
      for (const s of strokes.current) {
        for (let i = 2; i < s.length; i++) {
          const a = { ...s[i - 2], x: (s[i - 2].x + s[i - 1].x) / 2, y: (s[i - 2].y + s[i - 1].y) / 2 };
          const b = { ...s[i], x: (s[i - 1].x + s[i].x) / 2, y: (s[i - 1].y + s[i].y) / 2 };
          drawSegment(a, b, s[i - 1]);
        }
      }
    };
    const resize = () => {
      const r = el.getBoundingClientRect();
      c.width = r.width * dpr;
      c.height = r.height * dpr;
      c.style.width = `${r.width}px`;
      c.style.height = `${r.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = ctx.lineJoin = "round";
      redraw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let current: Pt[] | null = null;
    let last = { x: 0, y: 0, t: 0 };
    const local = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element).closest("a, button, input, textarea, [data-no-ink]")) return;
      const p = local(e);
      current = [{ ...p, w: 2.2 }];
      strokes.current.push(current);
      last = { ...p, t: performance.now() };
      el.setPointerCapture(e.pointerId);
      ctx.strokeStyle = ink();
      e.preventDefault(); // no text selection while drawing
    };
    const move = (e: PointerEvent) => {
      if (!current) return;
      const p = local(e);
      const now = performance.now();
      const speed = Math.hypot(p.x - last.x, p.y - last.y) / Math.max(1, now - last.t);
      const prevW = current[current.length - 1].w;
      // faster → thinner, eased so the line never jumps in weight
      const w = prevW + (Math.max(0.9, Math.min(3.4, 3.4 - speed * 1.6)) - prevW) * 0.35;
      current.push({ ...p, w });
      last = { ...p, t: now };
      const n = current.length;
      if (n >= 3) {
        const [a0, a1, a2] = [current[n - 3], current[n - 2], current[n - 1]];
        drawSegment(
          { ...a0, x: (a0.x + a1.x) / 2, y: (a0.y + a1.y) / 2 },
          { ...a2, x: (a1.x + a2.x) / 2, y: (a1.y + a2.y) / 2 },
          a1,
        );
      }
    };
    const up = () => {
      if (!current) return;
      if (current.length > 3) {
        setHasInk(true);
        onFirstStroke?.();
      } else strokes.current.pop();
      current = null;
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      ro.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [host, onFirstStroke]);

  return (
    <>
      {/* always mounted, so the effect can size it; blank until someone draws */}
      <canvas ref={canvas} aria-hidden className="pointer-events-none absolute inset-0 z-[5]" />
      {enabled && hasInk && (
        <button
          type="button"
          onClick={() => {
            strokes.current = [];
            const c = canvas.current!;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            setHasInk(false);
          }}
          className="font-hand absolute bottom-6 right-6 z-30 rounded-full bg-ink px-4 py-1.5 text-lg text-chalk shadow-md transition-transform hover:-rotate-2"
        >
          rub it out
        </button>
      )}
    </>
  );
}
