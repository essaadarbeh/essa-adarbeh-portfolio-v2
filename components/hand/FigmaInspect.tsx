"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * The hero portrait, opened in Figma. Point at a part of it (the glasses,
 * the hair, the ear...) and it gets Figma's blue hover outline with its layer
 * name and size, and that layer alone flips to outline mode (⌘Y): the pencil
 * sketch underneath the paint. Your pointer becomes Figma's purple
 * "Designer" cursor, and a green "Developer" one follows it a beat behind,
 * the way Figma's follow mode does. Click to
 * leave a FigJam sticker. On touch, a tap selects the layer under your finger
 * and stamps it.
 *
 * Everything moves by transforms, clip-path and opacity on its own layers,
 * set straight on the DOM, so pointing around never re-renders React or
 * repaints the portrait.
 */

/** Layers, in the painting's own 425×900 units, from a grid over it. */
const LAYERS = [
  { name: "Glasses", x: 32, y: 165, w: 225, h: 80 },
  { name: "Moustache", x: 8, y: 262, w: 77, h: 63 },
  { name: "Ear", x: 210, y: 255, w: 92, h: 92 },
  { name: "Face", x: 5, y: 95, w: 225, h: 300 },
  { name: "Collar", x: 95, y: 405, w: 190, h: 190 },
  { name: "Hair", x: 98, y: 3, w: 314, h: 395 },
  { name: "Suit", x: 0, y: 420, w: 425, h: 480 },
];
const W = 425,
  H = 900;
const STAMPS = [
  `<path d="M20 2 C21.5 12 28 18.5 38 20 C28 21.5 21.5 28 20 38 C18.5 28 12 21.5 2 20 C12 18.5 18.5 12 20 2 Z" fill="#ffc24b"/>`,
  `<path d="M20 35 C8 26 3 19.5 3 13 C3 7.6 7 4 11.6 4 C15 4 18 6 20 9.4 C22 6 25 4 28.4 4 C33 4 37 7.6 37 13 C37 19.5 32 26 20 35 Z" fill="#ff6fb5"/>`,
  `<circle cx="20" cy="20" r="17" fill="#9747ff"/>`,
  `<path d="M6 21 L16 31 L35 10" fill="none" stroke="#14ae5c" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
];

const pick = (x: number, y: number) => {
  let best: (typeof LAYERS)[number] | null = null;
  for (const l of LAYERS)
    if (x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h && (!best || l.w * l.h < best.w * best.h)) best = l;
  return best;
};

export default function FigmaInspect({ host, ink }: { host: React.RefObject<HTMLElement | null>; ink: string }) {
  const root = useRef<HTMLDivElement>(null);
  const outline = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLSpanElement>(null);
  const size = useRef<HTMLSpanElement>(null);
  const follow = useRef<HTMLDivElement>(null);
  const me = useRef<HTMLDivElement>(null);
  const stamps = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    const ui = root.current;
    if (!el || !ui) return;
    const fine = matchMedia("(pointer: fine)").matches;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current: (typeof LAYERS)[number] | null = null;
    let rect = el.getBoundingClientRect();
    const toUnits = (e: PointerEvent | MouseEvent) => [
      ((e.clientX - rect.left) / rect.width) * W,
      ((e.clientY - rect.top) / rect.height) * H,
    ];

    const select = (l: (typeof LAYERS)[number] | null) => {
      if (l === current) return;
      current = l;
      if (!l) {
        ui.dataset.layer = "false";
        outline.current!.style.clipPath = "inset(50% 50% 50% 50%)";
        return;
      }
      ui.dataset.layer = "true";
      const t = (l.y / H) * 100,
        le = (l.x / W) * 100,
        r = 100 - ((l.x + l.w) / W) * 100,
        b = 100 - ((l.y + l.h) / H) * 100;
      outline.current!.style.clipPath = `inset(${t}% ${r}% ${b}% ${le}%)`;
      Object.assign(box.current!.style, { top: `${t}%`, left: `${le}%`, right: `${r}%`, bottom: `${b}%` });
      name.current!.textContent = l.name;
      size.current!.textContent = `${l.w} × ${l.h}`;
    };

    // the developer follows you around, a beat behind
    const fx = gsap.quickTo(follow.current, "x", { duration: reduced ? 0 : 0.7, ease: "power3.out" });
    const fy = gsap.quickTo(follow.current, "y", { duration: reduced ? 0 : 0.7, ease: "power3.out" });

    let frame = 0;
    let last: PointerEvent | null = null;
    const tick = () => {
      frame = 0;
      if (!last) return;
      const [x, y] = toUnits(last);
      select(pick(x, y));
      me.current!.style.transform = `translate3d(${last.clientX - rect.left - 2}px, ${last.clientY - rect.top - 2}px, 0)`;
      fx(last.clientX - rect.left + 26);
      fy(last.clientY - rect.top + 30);
    };
    const move = (e: PointerEvent) => {
      last = e;
      frame ||= requestAnimationFrame(tick);
    };
    const enter = (e: PointerEvent) => {
      rect = el.getBoundingClientRect();
      gsap.set(follow.current, { x: e.clientX - rect.left + 60, y: e.clientY - rect.top + 70 });
      ui.dataset.on = "true";
      move(e);
    };
    const leave = () => {
      ui.dataset.on = "false";
      select(null);
      // stickers peel off a moment after you leave
      stamps.current!.querySelectorAll(".fi-stamp").forEach((s, i) => {
        (s as HTMLElement).style.animation = `fi-peel 0.35s ease-in ${0.6 + i * 0.05}s forwards`;
        setTimeout(() => s.remove(), 1400 + i * 50);
      });
    };
    const stamp = (e: MouseEvent) => {
      rect = el.getBoundingClientRect();
      const [x, y] = toUnits(e);
      if (!fine) {
        ui.dataset.on = "true";
        select(pick(x, y));
      }
      const s = document.createElement("div");
      s.className = "fi-stamp";
      s.style.left = `${(x / W) * 100}%`;
      s.style.top = `${(y / H) * 100}%`;
      s.style.setProperty("--r", `${Math.round(Math.random() * 40 - 20)}deg`);
      const k = Math.floor(Math.random() * STAMPS.length);
      s.innerHTML = `<svg viewBox="-4 -4 48 48"><g stroke="#fff" stroke-width="6" stroke-linejoin="round" style="paint-order:stroke">${STAMPS[k]}</g>${
        k === 2
          ? `<text x="20" y="26" text-anchor="middle" font-size="16" font-weight="800" fill="#fff" font-family="system-ui,sans-serif">+1</text>`
          : ""
      }</svg>`;
      stamps.current!.appendChild(s);
      const all = stamps.current!.children;
      if (all.length > 8) all[0].remove();
    };

    if (fine) {
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
    }
    el.addEventListener("click", stamp);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("click", stamp);
      cancelAnimationFrame(frame);
    };
  }, [host]);

  return (
    <div
      ref={root}
      data-on="false"
      data-layer="false"
      aria-hidden
      className="fi pointer-events-none absolute inset-0 z-10"
    >
      {/* outline mode, just for the layer you're pointing at */}
      <div
        ref={outline}
        className="fi-outline absolute inset-0"
        style={{
          clipPath: "inset(50% 50% 50% 50%)",
          background: "color-mix(in oklab, var(--color-chalk) 94%, var(--color-ink))",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ink} alt="" className="h-full w-full object-contain object-bottom" />
      </div>

      {/* the frame, named like a Figma frame */}
      <span className="fi-frame absolute -top-6 left-0 hidden font-sans md:block text-[11px] font-medium text-[#0d99ff]"># Essa</span>

      {/* Figma's hover outline, with the layer's name and size */}
      <div ref={box} className="fi-box absolute">
        <span
          ref={name}
          className="absolute -top-[22px] left-[-1.5px] whitespace-nowrap rounded-[3px] bg-[#0d99ff] px-1.5 py-0.5 font-sans text-[11px] font-medium text-white"
        />
        <span
          ref={size}
          className="absolute -bottom-[24px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[3px] bg-[#0d99ff] px-1.5 py-0.5 font-sans text-[11px] font-medium tabular-nums text-white"
        />
      </div>

      <div ref={stamps} className="absolute inset-0" />

      {/* you, as a Figma cursor */}
      <div ref={me} className="fi-me absolute left-0 top-0">
        <Pointer color="#9747ff" label="Designer" />
      </div>

      {/* follow mode: the developer is right behind the designer */}
      <div ref={follow} className="fi-follow absolute left-0 top-0">
        <Pointer color="#14ae5c" label="Developer" />
      </div>
    </div>
  );
}

function Pointer({ color, label }: { color: string; label: string }) {
  return (
    <>
      <svg width="20" height="22" viewBox="0 0 20 22" className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
        <path
          d="M2 1.5 L2 17.5 L6.4 13.4 L9.4 20.2 L12.4 18.9 L9.5 12.3 L15.5 12.1 Z"
          fill={color}
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="-mt-1 ml-3.5 block w-max rounded-[4px] rounded-tl-none px-1.5 py-0.5 font-sans text-[12px] font-medium text-white"
        style={{ background: color }}
      >
        {label}
      </span>
    </>
  );
}
