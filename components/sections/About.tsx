"use client";

import { useEffect, useRef, useState } from "react";
import Portrait, { type PortraitMode } from "@/components/Portrait";
import { site } from "@/data/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

type Chapter = {
  word: string;
  label: string;
  mode: PortraitMode;
  title: string;
  text: string;
  facts: [string, string][];
  caption: string;
};

const chapters: Chapter[] = [
  {
    word: "Design",
    label: "Design",
    mode: "tone",
    title: "I start with the person using it.",
    text: "Then the system underneath. Flows, type, colour and motion are designed together in Figma, so nothing feels bolted on later.",
    facts: [
      ["Works in", "Figma, variables, prototypes"],
      ["Recent", "Lumen and Atlas"],
    ],
    caption: "The painting, gradient-mapped into the site’s colours",
  },
  {
    word: "Code",
    label: "Code",
    mode: "code",
    title: "Then I build it myself.",
    text: "TypeScript, React and Next.js: component-driven, accessible and fast from the first commit. What you approved in Figma is what ships.",
    facts: [
      ["Writes", "TypeScript, React, Next.js"],
      ["Animates with", "GSAP, Framer Motion, three.js"],
    ],
    caption: "The same painting, redrawn from 16 characters",
  },
  {
    word: "Human",
    label: "Human",
    mode: "color",
    title: "And I’m a person, not a pipeline.",
    text: "I live and work in Amman, Jordan. AI makes me faster; the taste, judgment and care are still mine. I’m open to full-time roles and freelance work.",
    facts: [
      ["Based in", site.location],
      ["Local time", "clock"],
    ],
    caption: "The original painting",
  },
];

function AmmanClock() {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: site.timeZone });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{time}</span>;
}

/**
 * About as a short pinned story. The section holds still while you scroll
 * through three chapters; each one swaps the giant word behind, the copy,
 * and the way the portrait is drawn. Chapter changes are CSS transitions on
 * stacked layers (transform and opacity only), driven by one ScrollTrigger.
 */
export default function About() {
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  // Pinned by default (the common case, and what the server renders); only
  // reduced motion falls back to a plain stacked section.
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) setPinned(false);
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        trigger.current = ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "+=200%",
          pin: true,
          anticipatePin: 1,
          snap: {
            snapTo: [0, 0.5, 1],
            // nearest chapter, not "next in the scroll direction", so a fast
            // scroll into the section never skips the first one
            directional: false,
            duration: { min: 0.25, max: 0.6 },
            delay: 0.08,
            ease: "power2.inOut",
          },
          onUpdate: (self) => {
            const i = self.progress < 1 / 3 ? 0 : self.progress < 2 / 3 ? 1 : 2;
            setActive((a) => (a === i ? a : i));
            if (bar.current) bar.current.style.transform = `scaleY(${self.progress})`;
          },
        });
        return () => {
          trigger.current = null;
        };
      });
    },
    { scope: root },
  );

  const go = (i: number) => {
    const st = trigger.current;
    if (!st) return setActive(i);
    const y = st.start + (st.end - st.start) * (i / 2);
    window.scrollTo({ top: y + 2, behavior: "smooth" });
  };

  const state = (i: number) => (i === active ? "on" : i < active ? "past" : "next");

  return (
    <section
      ref={root}
      id="about"
      aria-labelledby="about-title"
      className={`about relative bg-ink text-chalk ${pinned ? "h-[100svh] min-h-[640px] overflow-hidden" : "py-24"}`}
    >
      {/* giant chapter words */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {chapters.map((c, i) => (
          <span
            key={c.word}
            data-state={state(i)}
            className="about-word display absolute whitespace-nowrap text-[26vw] uppercase leading-none md:text-[21vw]"
          >
            {c.word}
          </span>
        ))}
      </div>

      <div className="relative mx-auto grid h-full max-w-[1400px] grid-rows-[auto_1fr] gap-4 px-4 pb-6 pt-20 sm:px-6 md:grid-cols-12 md:grid-rows-1 md:items-center md:gap-8 md:pb-10 md:pt-24">
        {/* portrait */}
        <div className="relative mx-auto h-[38svh] md:order-2 md:col-span-5 md:col-start-5 md:h-[74svh]">
          <div className="about-glow absolute inset-[-10%] rounded-full" aria-hidden />
          <Portrait
            luma="/portraits/about-luma.webp"
            color="/portraits/about-color.webp"
            tone="/portraits/about-tone.webp"
            width={956}
            height={1416}
            mode={chapters[active].mode}
            alt={`Painted portrait of ${site.name} seen from behind, glancing back over one shoulder`}
            sizes="(min-width: 768px) 36vw, 60vw"
            className="h-full"
          />
          <p className="absolute inset-x-0 -bottom-6 hidden text-center text-sm text-chalk-muted md:block">
            {chapters[active].caption}
          </p>
        </div>

        {/* copy */}
        <div className="relative md:order-1 md:col-span-4 md:self-stretch">
          <h2 id="about-title" className="sr-only">
            About Essa
          </h2>
          <p aria-hidden className="display text-3xl uppercase [--wdth:120] md:absolute md:top-0 md:text-6xl">
            I’m Essa.
          </p>
          <div className="relative mt-3 min-h-[20rem] md:absolute md:inset-x-0 md:bottom-0 md:mt-0 md:min-h-[22rem]">
            {chapters.map((c, i) => (
              <div
                key={c.word}
                data-state={pinned ? state(i) : "on"}
                aria-hidden={pinned && i !== active}
                className={`about-copy ${pinned ? "absolute inset-x-0 bottom-0" : "mb-10"}`}
              >
                <p className="flex gap-3 text-sm text-chalk-muted">
                  <span className="tabular-nums text-signal">{String(i + 1).padStart(2, "0")}</span>
                  {c.label}
                </p>
                <p className="mt-2 text-[1.35rem] font-medium leading-tight sm:text-3xl md:text-[2.4rem]">{c.title}</p>
                <p className="mt-2 max-w-[40ch] text-[15px] leading-relaxed text-chalk/80 sm:text-base md:mt-3 md:text-lg">
                  {c.text}
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-chalk/15 pt-4 text-sm">
                  {c.facts.map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-chalk-muted">{k}</dt>
                      <dd className="mt-1 font-medium">{v === "clock" ? <AmmanClock /> : v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>

        {/* chapter rail */}
        {pinned && (
          <nav
            aria-label="About chapters"
            className="absolute right-4 top-1/2 hidden -translate-y-1/2 md:right-6 md:flex md:flex-col md:items-end md:gap-6"
          >
            <span aria-hidden className="absolute right-[5px] top-0 h-full w-px bg-chalk/15">
              <span ref={bar} className="block h-full w-full origin-top scale-y-0 bg-signal" />
            </span>
            {chapters.map((c, i) => (
              <button
                key={c.word}
                type="button"
                onClick={() => go(i)}
                aria-current={i === active ? "step" : undefined}
                className={`relative flex items-center gap-3 text-sm transition-colors ${
                  i === active ? "text-chalk" : "text-chalk-muted hover:text-chalk"
                }`}
              >
                {c.label}
                <span
                  className={`h-[11px] w-[11px] rounded-full border transition-colors ${
                    i <= active ? "border-signal bg-signal" : "border-chalk/40 bg-ink"
                  }`}
                />
              </button>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
