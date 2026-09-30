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
  className?: string;
};

/**
 * A portrait that is drawn, then painted:
 *   1. a pen draws the silhouette in one continuous line
 *   2. the ink sketch comes in along the pen's contour paths
 *   3. paint washes in from the face outward, with a ragged watercolour edge
 * Afterwards the pointer works as an eraser: under it the paint lifts off and
 * the sketch shows through, the design under the build. On touch, a tap
 * swaps between sketch and painting. All SVG, no WebGL.
 *
 * Phones get a lighter version of the same thing: the pen still draws the
 * line, then the sketch and the paint fade in as plain images. Masks and
 * displacement filters repaint every frame, which a phone feels.
 */
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
  className,
}: Props) {
  if (priority) {
    preload(color, { as: "image", fetchPriority: "high" });
    preload(ink, { as: "image", fetchPriority: "high" });
  }

  const id = useId().replace(/:/g, "");
  const svg = useRef<SVGSVGElement>(null);
  const wash = useRef<SVGCircleElement>(null);
  const eraser = useRef<SVGCircleElement>(null);
  const inkFill = useRef<SVGRectElement>(null);
  const pen = useRef<SVGGElement>(null);
  const inkImg = useRef<HTMLImageElement>(null);
  const colorImg = useRef<HTMLImageElement>(null);
  const done = useRef(false);
  const [lite, setLite] = useState<boolean | null>(null);
  useEffect(() => setLite(matchMedia(LITE).matches), []);
  const { width: w, height: h } = sketch;
  const full = Math.hypot(w, h);

  // the drawing itself
  useEffect(() => {
    if (!play || lite === null) return;
    const root = svg.current!;
    const outline = [...root.querySelectorAll<SVGPathElement>(".sp-outline")];
    const brush = root.querySelectorAll<SVGPathElement>(".sp-brush");
    if (instant || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([...outline, ...brush], { strokeDashoffset: 0 });
      if (lite) gsap.set([inkImg.current, colorImg.current], { opacity: 1 });
      else {
        gsap.set(inkFill.current, { opacity: 1 });
        gsap.set(wash.current, { attr: { r: full } });
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
    tl.to(pen.current, { opacity: 1, duration: 0.25 }, 0)
      .to(outline, { strokeDashoffset: 0, duration: 2, ease: "power1.inOut" }, 0)
      .to(tip, { p: 1, duration: 2, ease: "power1.inOut", onUpdate: placePen }, 0)
      .to(pen.current, { opacity: 0, y: -30, duration: 0.4, ease: "power2.in" }, 2);
    if (lite)
      tl.to(inkImg.current, { opacity: 0.9, duration: 0.9, ease: "power1.in" }, 1).to(
        colorImg.current,
        { opacity: 1, duration: 1.3, ease: "power2.inOut" },
        2,
      );
    else
      tl.to(brush, { strokeDashoffset: 0, duration: 0.9, ease: "power1.in", stagger: 0.025 }, 0.7)
        .to(inkFill.current, { opacity: 1, duration: 0.7 }, 1.7)
        .to(wash.current, { attr: { r: full }, duration: 2.1, ease: "power2.inOut" }, 1.9);
    return () => {
      tl.kill();
    };
  }, [play, instant, full, lite]);

  // eraser (fine pointers) and tap-to-swap (touch)
  useEffect(() => {
    if (lite === null) return;
    const root = svg.current!;
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
    const toLocal = (e: PointerEvent) => {
      const m = root.getScreenCTM();
      if (!m) return [-999, -999];
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      return [p.x, p.y];
    };
    const er = eraser.current!;
    const size = { r: 0 };
    const setR = () => er.setAttribute("r", String(size.r));
    const move = (e: PointerEvent) => {
      if (!done.current) return;
      const [x, y] = toLocal(e);
      er.setAttribute("cx", String(x));
      er.setAttribute("cy", String(y));
    };
    const enter = (e: PointerEvent) => {
      if (!done.current) return;
      move(e);
      gsap.to(size, { r: w * 0.26, duration: 0.5, ease: "power3.out", onUpdate: setR, overwrite: true });
    };
    const leave = () => gsap.to(size, { r: 0, duration: 0.5, ease: "power3.out", onUpdate: setR, overwrite: true });
    let painted = true;
    const tap = () => {
      if (!done.current) return;
      painted = !painted;
      gsap.to(wash.current, { attr: { r: painted ? full : 0 }, duration: 1.2, ease: "power2.inOut" });
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
    };
  }, [w, full, lite]);

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
          wash.current?.setAttribute("r", String(full * Math.max(0, 1 - self.progress * 1.5)));
        },
      });
      return () => st.kill();
    });
    return () => mm.revert();
  }, [unwashOn, full, lite]);

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
    <svg
      ref={svg}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMax meet"
      role="img"
      aria-label={alt}
      className={`overflow-visible ${className ?? ""}`}
    >
      <defs>
        {/* ragged watercolour edge */}
        <filter id={`rough-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="80" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`rough-sm-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* the ink appears along the pen's paths, then everywhere */}
        <mask id={`ink-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
          <g fill="none" stroke="#fff" strokeWidth={w * 0.11} strokeLinecap="round" strokeLinejoin="round">
            {sketch.paths.map((p, i) => (
              <path key={i} d={p.d} className="sp-brush" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />
            ))}
          </g>
          <rect ref={inkFill} width={w} height={h} fill="#fff" opacity="0" />
        </mask>
        {/* paint: a wash growing from the face */}
        <mask id={`paint-${id}`} maskUnits="userSpaceOnUse" x={-w} y={-h} width={w * 3} height={h * 3}>
          <g filter={`url(#rough-${id})`}>
            <circle ref={wash} cx={focus[0]} cy={focus[1]} r="0" fill="#fff" />
          </g>
        </mask>
        {/* the eraser: a ragged patch where the paint is lifted */}
        <mask id={`erase-${id}`} maskUnits="userSpaceOnUse" x={-w} y={-h} width={w * 3} height={h * 3}>
          <g filter={`url(#rough-sm-${id})`}>
            <circle ref={eraser} cx="-999" cy="-999" r="0" fill="#fff" />
          </g>
        </mask>
      </defs>

      <image
        href={ink}
        width={w}
        height={h}
        mask={`url(#ink-${id})`}
        preserveAspectRatio="xMidYMax meet"
        opacity="0.9"
      />
      <image href={color} width={w} height={h} mask={`url(#paint-${id})`} preserveAspectRatio="xMidYMax meet" />
      {/* under the eraser: bare paper and the sketch again */}
      <g mask={`url(#erase-${id})`}>
        <rect width={w} height={h} style={{ fill: "color-mix(in oklab, var(--color-chalk) 93%, var(--color-ink))" }} />
        <image href={ink} width={w} height={h} preserveAspectRatio="xMidYMax meet" opacity="0.9" />
      </g>
      {drawing}
    </svg>
  );
}
