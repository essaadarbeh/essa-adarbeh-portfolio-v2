"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { PREFILL_EVENT } from "@/components/sections/Contact";

const TYPES = ["Website", "Product UI", "Design system"] as const;

/** Small annotation tag, only drawn in the design-file layer. */
function Spec({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-[5px] bg-signal px-1.5 py-0.5 text-[11px] font-medium leading-none text-ink ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

/**
 * The same contact card twice, at identical coordinates: once as a design
 * file with redlines, once as working UI. Only the live one is interactive.
 */
function ContactCard({ mode }: { mode: "design" | "live" }) {
  const design = mode === "design";
  const [type, setType] = useState<(typeof TYPES)[number]>("Product UI");

  return (
    <div
      className={`relative w-[min(420px,88%)] rounded-[24px] bg-white p-7 text-ink ${
        design
          ? "outline outline-1 outline-signal"
          : "shadow-[0_6px_16px_-8px_rgba(11,18,56,0.3)] md:shadow-[0_30px_60px_-30px_rgba(11,18,56,0.35)]"
      }`}
      inert={design || undefined}
    >
      {design && (
        <>
          <Spec className="-top-6 left-0">Contact card, 420 wide</Spec>
          {/* corner handles */}
          {["-left-1 -top-1", "-right-1 -top-1", "-left-1 -bottom-1", "-right-1 -bottom-1"].map((c) => (
            <span key={c} className={`absolute ${c} h-2 w-2 border border-signal bg-white`} />
          ))}
          {/* padding redline */}
          <span className="absolute left-0 top-[46px] h-px w-7 bg-signal" />
          <Spec className="left-1 top-[52px]">28</Spec>
        </>
      )}

      <div className="relative flex items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-field">
          <Image src="/portraits/avatar.webp" alt="" fill sizes="48px" className="object-cover" />
        </div>
        <div>
          <p className="font-medium leading-tight">Essa Adarbeh</p>
          <p className="text-sm text-ink-muted">Usually replies within a day</p>
        </div>
        {design && <Spec className="-right-2 top-1/2 -translate-y-1/2">Avatar 48, round</Spec>}
      </div>

      <p className="display relative mt-7 text-[30px] leading-[1.05] [--wdth:112]">
        What are we building?
        {design && <Spec className="-top-4 right-0">Anybody 30, width 112</Spec>}
      </p>

      <div
        role="radiogroup"
        aria-label="Project type"
        className="relative mt-5 grid grid-cols-3 gap-1 rounded-[14px] bg-chalk p-1 text-sm"
      >
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => setType(t)}
            className={`rounded-[10px] px-2 py-2.5 font-medium transition-[background-color,color,box-shadow] duration-300 ${
              type === t
                ? "bg-white text-ink shadow-[0_2px_8px_-2px_rgba(11,18,56,0.25)]"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
        {design && <Spec className="-bottom-5 left-0">Segmented, radius 14, gap 4</Spec>}
      </div>

      <a
        href="#contact"
        onClick={() => {
          // the composer in Contact picks up the project type chosen here
          if (!design) window.dispatchEvent(new CustomEvent(PREFILL_EVENT, { detail: type }));
        }}
        className="relative mt-7 flex h-[52px] items-center justify-center rounded-[14px] bg-field font-medium text-chalk transition-[background-color,transform,filter] duration-300 hover:brightness-110 active:scale-[0.98]"
      >
        Start the conversation
        {design && <Spec className="-bottom-3 right-3">Primary button, 52 high</Spec>}
      </a>
    </div>
  );
}

export default function HandoffCompare() {
  const stage = useRef<HTMLDivElement>(null);
  const designLayer = useRef<HTMLDivElement>(null);
  const designInner = useRef<HTMLDivElement>(null);
  const handleLayer = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const posObj = useRef({ v: 50 });
  const dragging = useRef(false);

  // Position is written straight to the DOM as transforms, never through
  // React state, so dragging and the intro nudge don't re-render both cards.
  const apply = useCallback((v: number) => {
    posObj.current.v = v;
    // reveal by two opposing transforms (outer clips, inner counter-moves):
    // both layers stay rasterised, so moving the handle never repaints
    if (designLayer.current) designLayer.current.style.transform = `translate3d(${v - 100}%, 0, 0)`;
    if (designInner.current) designInner.current.style.transform = `translate3d(${100 - v}%, 0, 0)`;
    if (handleLayer.current) handleLayer.current.style.transform = `translate3d(${v}%, 0, 0)`;
    if (knob.current) {
      knob.current.setAttribute("aria-valuenow", String(Math.round(v)));
      knob.current.setAttribute("aria-valuetext", `${Math.round(v)}% design file`);
    }
  }, []);

  const setFromClientX = useCallback(
    (x: number) => {
      const r = stage.current!.getBoundingClientRect();
      gsap.killTweensOf(posObj.current);
      apply(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100)));
    },
    [apply],
  );

  // one nudge when it first comes into view, so the handle announces itself
  useEffect(() => {
    apply(50);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = stage.current!;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        gsap.fromTo(
          posObj.current,
          { v: 86 },
          { v: 50, duration: 1.8, ease: "expo.inOut", delay: 0.2, onUpdate: () => apply(posObj.current.v) },
        );
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [apply]);

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    const pos = posObj.current.v;
    const next =
      e.key === "ArrowLeft"
        ? pos - step
        : e.key === "ArrowRight"
          ? pos + step
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? 100
              : null;
    if (next === null) return;
    e.preventDefault();
    gsap.killTweensOf(posObj.current);
    apply(Math.min(100, Math.max(0, next)));
  };

  const chrome = "absolute inset-x-0 top-0 flex h-11 items-center gap-2 px-4 text-xs";

  return (
    <div
      ref={stage}
      className="relative h-[600px] w-full select-none overflow-hidden rounded-[28px] ring-1 ring-ink/10 md:h-[640px]"
    >
      {/* live layer (underneath, full) */}
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_70%_30%,#ffffff_0%,color-mix(in_oklab,var(--color-field)_14%,white)_100%)]">
        <div className={`${chrome} border-b border-ink/10 bg-white/70 text-ink-muted`}>
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
          </span>
          <span className="mx-auto rounded-md bg-chalk px-8 py-1">essa-adarbeh.vercel.app</span>
        </div>
        <div className="absolute inset-0 top-11 grid place-items-center">
          <ContactCard mode="live" />
        </div>
        <span className="absolute bottom-4 right-4 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-chalk">
          In the browser, try it
        </span>
      </div>

      {/* design layer (on top, clipped to the handle) */}
      <div
        ref={designLayer}
        aria-hidden
        className="absolute inset-0 overflow-hidden will-change-transform"
        style={{ transform: "translate3d(-50%, 0, 0)" }}
      >
        <div
          ref={designInner}
          className="absolute inset-0 bg-[#e7e9f1] will-change-transform [background-image:radial-gradient(#b9bdd0_1px,transparent_1px)] [background-size:18px_18px]"
          style={{ transform: "translate3d(50%, 0, 0)" }}
        >
          <div className={`${chrome} border-b border-ink/10 bg-[#f6f7fb] text-ink-muted`}>
            <span className="font-medium text-ink">Design file</span>
            <span>/ Components / Contact card</span>
          </div>
          <div className="absolute inset-0 top-11 grid place-items-center">
            <ContactCard mode="design" />
          </div>
          <span className="absolute bottom-4 left-4 rounded-full bg-signal px-3 py-1.5 text-xs font-medium text-ink">
            Design file
          </span>
        </div>
      </div>

      {/* handle */}
      <div
        ref={handleLayer}
        className="pointer-events-none absolute inset-0 z-20 will-change-transform"
        style={{ transform: "translate3d(50%, 0, 0)" }}
      >
        <div className="absolute inset-y-0 left-0 w-px bg-ink" />
        <div
          ref={knob}
          role="slider"
          tabIndex={0}
          aria-label="Compare the design file with the built component"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={50}
          aria-valuetext="50% design file"
          data-cursor="Drag"
          onKeyDown={onKey}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => dragging.current && setFromClientX(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
          className="pointer-events-auto absolute left-0 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-full bg-ink text-chalk shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95"
        >
          <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden>
            <path d="M6 1 1 6l5 5M16 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </div>
      </div>
    </div>
  );
}
