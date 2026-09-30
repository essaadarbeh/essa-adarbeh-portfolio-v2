"use client";

import { useEffect, useId, useRef, useState } from "react";
import { preload } from "react-dom";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export type Sketch = { width: number; height: number; paths: { d: string; k: number }[] };

type Props = {
  sketch: Sketch;
  color: string;
  ink: string;
  alt: string;
  /** Where the paint starts to spread from (the face), in sketch units. */
  focus: [number, number];
  /** Start drawing (controlled by the parent, e.g. once fonts are in). */
  play: boolean;
  /** Scrolling this element away washes the paint back out to the sketch. */
  unwashOn?: React.RefObject<HTMLElement | null>;
  /** Hold the finished state (no drawing), e.g. when it starts off-screen. */
  instant?: boolean;
  /** Above the fold: fetch both images early. */
  priority?: boolean;
  /** The built-in eraser (hover) and tap-to-swap. Off when a parent brings its own. */
  interactive?: boolean;
  className?: string;
};

/**
 * A portrait that is drawn, then painted:
 *   1. a pen draws the silhouette in one continuous line
 *   2. the pencil sketch comes in under the line
 *   3. paint washes in from the face outward, with a ragged watercolour edge
 * Afterwards the pointer works as an eraser: under it the paint lifts off and
 * the sketch shows through, the design under the build. On touch, a tap
 * swaps between sketch and painting. All SVG, no WebGL.
 *
 * The watercolour edge is a pre-made image (public/portraits/wash.png, from
 * scripts/make-wash.mjs) that scales from the face. An SVG turbulence filter
 * did this before, and recomputing it over the whole painting every frame
 * held desktop to a few frames a second. The eraser is the same shape as a
 * CSS mask on its own layer: it slides with transforms and never repaints
 * the portrait.
 *
 * Phones get a lighter version of the same thing: the pen still draws the
 * line, then the sketch and the paint fade in as plain images.
 */
const WASH = "/portraits/wash.png";
/** Size a wash blob so it covers a circle of radius r around (cx, cy). */
const blob = (el: SVGImageElement | null, cx: number, cy: number, r: number) => {
  if (!el) return;
  // the blob's ragged edge sits at ~0.9 of its half-size, so pad it out
  const half = r / 0.82;
  el.setAttribute("x", String(cx - half));
  el.setAttribute("y", String(cy - half));
  el.setAttribute("width", String(half * 2));
  el.setAttribute("height", String(half * 2));
};
const LITE = "(max-width: 767px), (pointer: coarse)";
export default function SketchPortrait({
  sketch,
  color,
  ink,
  alt,
  focus,
  play,
  unwashOn,
  instant,
  priority,
  interactive = true,
  className,
}: Props) {
  if (priority) {
    preload(color, { as: "image", fetchPriority: "high" });
    preload(ink, { as: "image", fetchPriority: "high" });
  }

  const id = useId().replace(/:/g, "");
  const svg = useRef<SVGSVGElement>(null);
  const wash = useRef<SVGImageElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const patch = useRef<HTMLDivElement>(null);
  const patchInner = useRef<HTMLDivElement>(null);
  const inkLayer = useRef<SVGImageElement>(null);
  const pen = useRef<SVGGElement>(null);
  const inkImg = useRef<HTMLImageElement>(null);
  const colorImg = useRef<HTMLImageElement>(null);
  const done = useRef(false);
  const [lite, setLite] = useState<boolean | null>(null);
  useEffect(() => setLite(matchMedia(LITE).matches), []);
  const { width: w, height: h } = sketch;
  const [fx, fy] = focus;
  const full = Math.hypot(w, h);

  // the drawing itself
  useEffect(() => {
    if (!play || lite === null) return;
    const root = svg.current!;
    const outline = [...root.querySelectorAll<SVGPathElement>(".sp-outline")];
    const paint = { r: 0 };
    const setWash = () => blob(wash.current, fx, fy, paint.r);
    if (instant || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(outline, { strokeDashoffset: 0 });
      if (lite) gsap.set([inkImg.current, colorImg.current], { opacity: 1 });
      else {
        gsap.set(inkLayer.current, { opacity: 0.9 });
        paint.r = full;
        setWash();
      }
      done.current = true;
      return;
    }

    // the pen rides the tip of the longest line
    const lead = outline.reduce((a, b) => (b.getTotalLength() > a.getTotalLength() ? b : a), outline[0]);
    const len = lead.getTotalLength();
    const tip = { p: 0 };
    const placePen = () => {
      const pt = lead.getPointAtLength(tip.p * len);
      pen.current?.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
    };
    placePen();

    const tl = gsap.timeline({ onComplete: () => void (done.current = true) });
    tl.to(pen.current, { opacity: 1, duration: 0.2 }, 0)
      .to(outline, { strokeDashoffset: 0, duration: 1.5, ease: "power1.inOut" }, 0)
      .to(tip, { p: 1, duration: 1.5, ease: "power1.inOut", onUpdate: placePen }, 0)
      .to(pen.current, { opacity: 0, y: -30, duration: 0.35, ease: "power2.in" }, 1.5)
      .to(lite ? inkImg.current : inkLayer.current, { opacity: 0.9, duration: 0.9, ease: "power1.in" }, 0.5);
    if (lite) tl.to(colorImg.current, { opacity: 1, duration: 1.1, ease: "power2.inOut" }, 1.4);
    else tl.to(paint, { r: full, duration: 1.6, ease: "power2.inOut", onUpdate: setWash }, 1.3);
    return () => {
      tl.kill();
    };
  }, [play, instant, full, lite, fx, fy]);

  // eraser (fine pointers) and tap-to-swap (touch)
  useEffect(() => {
    if (lite === null || !interactive) return;
    const root = (lite ? svg.current : wrap.current) as HTMLElement;
    if (lite) {
      let painted = true;
      const tap = () => {
        if (!done.current) return;
        painted = !painted;
        gsap.to(colorImg.current, { opacity: painted ? 1 : 0, duration: 0.8, ease: "power2.inOut" });
      };
      root.addEventListener("click", tap);
      return () => root.removeEventListener("click", tap);
    }
    const fine = matchMedia("(pointer: fine)").matches;
    // the eraser: a patch of paper and sketch that slides with the pointer
    // (outer layer moves, inner layer moves back, so the sketch stays put)
    const box = { x: 0, y: 0, w: 0, h: 0, e: 0 };
    const pt = { x: 0, y: 0 };
    let frame = 0;
    const draw = () => {
      frame = 0;
      const ox = pt.x - box.e / 2,
        oy = pt.y - box.e / 2;
      patch.current!.style.transform = `translate3d(${ox}px, ${oy}px, 0)`;
      patchInner.current!.style.transform = `translate3d(${-ox}px, ${-oy}px, 0)`;
    };
    const move = (e: PointerEvent) => {
      if (!done.current) return;
      pt.x = e.clientX - box.x;
      pt.y = e.clientY - box.y;
      frame ||= requestAnimationFrame(draw);
    };
    const enter = (e: PointerEvent) => {
      if (!done.current || !wrap.current) return;
      const r = wrap.current.getBoundingClientRect();
      Object.assign(box, { x: r.left, y: r.top, w: r.width, h: r.height, e: r.width * 0.63 });
      Object.assign(patch.current!.style, { width: `${box.e}px`, height: `${box.e}px` });
      Object.assign(patchInner.current!.style, { width: `${box.w}px`, height: `${box.h}px` });
      move(e);
      gsap.to(patch.current, { opacity: 1, duration: 0.35, ease: "power2.out", overwrite: true });
    };
    const leave = () => gsap.to(patch.current, { opacity: 0, duration: 0.4, ease: "power2.out", overwrite: true });
    let painted = true;
    const paint = { r: full };
    const tap = () => {
      if (!done.current) return;
      painted = !painted;
      gsap.to(paint, {
        r: painted ? full : 0,
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: () => blob(wash.current, fx, fy, paint.r),
      });
    };
    if (fine) {
      root.addEventListener("pointerenter", enter);
      root.addEventListener("pointermove", move);
      root.addEventListener("pointerleave", leave);
    } else root.addEventListener("click", tap);
    return () => {
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("click", tap);
      cancelAnimationFrame(frame);
    };
  }, [w, full, lite, fx, fy, interactive]);

  // leaving the section, the paint drains back out and the sketch stays
  useEffect(() => {
    const host = unwashOn?.current;
    if (!host || lite !== false) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px) and (pointer: fine)", () => {
      const st = ScrollTrigger.create({
        trigger: host,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          if (!done.current) return;
          blob(wash.current, fx, fy, full * Math.max(0, 1 - self.progress * 1.5));
        },
      });
      return () => st.kill();
    });
    return () => mm.revert();
  }, [unwashOn, full, lite, fx, fy]);

  // the pen's line, and the pen itself: the same on every screen
  const drawing = (
    <>
      <g fill="none" stroke="var(--color-ink)" strokeLinecap="round" strokeLinejoin="round">
        {sketch.paths
          .filter((p) => p.k === 0)
          .map((p, i) => (
            <path
              key={i}
              d={p.d}
              className="sp-outline"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset="1"
              strokeWidth={2.2}
            />
          ))}
      </g>

      {/* the pen, a plain ballpoint, only while it draws */}
      <g ref={pen} opacity="0" aria-hidden>
        <g transform="rotate(32)">
          <path d="M0 0 L-4.5 -15 L4.5 -15 Z" fill="var(--color-ink)" />
          <path d="M-7 -15 L7 -15 L7 -40 L-7 -40 Z" fill="#cfd4e6" />
          <rect x="-7" y="-140" width="14" height="101" rx="3" fill="var(--color-field)" />
          <rect x="-2" y="-128" width="4" height="46" rx="2" fill="#fff" opacity="0.35" />
          <rect x="7" y="-132" width="4" height="40" rx="2" fill="var(--color-ink)" />
        </g>
      </g>
    </>
  );

  if (lite)
    return (
      <div role="img" aria-label={alt} className={`relative ${className ?? ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={inkImg}
          src={ink}
          alt=""
          className="absolute inset-0 h-full w-full object-contain object-bottom opacity-0"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={colorImg}
          src={color}
          alt=""
          className="absolute inset-0 h-full w-full object-contain object-bottom opacity-0"
        />
        <svg
          ref={svg}
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMidYMax meet"
          aria-hidden
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          {drawing}
        </svg>
      </div>
    );

  return (
    <div ref={wrap} role="img" aria-label={alt} className={`relative ${className ?? ""}`}>
      <svg
        ref={svg}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMax meet"
        aria-hidden
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <defs>
          {/* paint: a watercolour wash growing from the face */}
          <mask id={`paint-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
            <image ref={wash} href={WASH} x={fx} y={fy} width="0" height="0" preserveAspectRatio="none" />
          </mask>
        </defs>
        <image ref={inkLayer} href={ink} width={w} height={h} preserveAspectRatio="xMidYMax meet" opacity="0" />
        <image href={color} width={w} height={h} mask={`url(#paint-${id})`} preserveAspectRatio="xMidYMax meet" />
        {drawing}
      </svg>

      {/* under the eraser: bare paper and the sketch again */}
      <div
        ref={patch}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 overflow-hidden opacity-0 will-change-transform"
        style={{
          maskImage: `url(${WASH})`,
          WebkitMaskImage: `url(${WASH})`,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
        }}
      >
        <div
          ref={patchInner}
          className="absolute left-0 top-0 will-change-transform"
          style={{ background: "color-mix(in oklab, var(--color-chalk) 93%, var(--color-ink))" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ink} alt="" className="h-full w-full object-contain object-bottom opacity-90" />
        </div>
      </div>
    </div>
  );
}
