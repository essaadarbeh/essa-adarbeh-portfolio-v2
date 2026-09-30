"use client";

import Image from "next/image";
import { useState } from "react";
import CompareSlider from "@/components/CompareSlider";
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
  const chrome = "absolute inset-x-0 top-0 flex h-11 items-center gap-2 px-4 text-xs";

  return (
    <CompareSlider
      label="Compare the design file with the built component"
      leftName="design file"
      className="h-[600px] rounded-[28px] ring-1 ring-ink/10 md:h-[640px]"
      right={
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
      }
      left={
        <div className="absolute inset-0 bg-[#e7e9f1] [background-image:radial-gradient(#b9bdd0_1px,transparent_1px)] [background-size:18px_18px]">
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
      }
    />
  );
}
