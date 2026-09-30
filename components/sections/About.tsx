"use client";

import { useEffect, useRef, useState } from "react";
import Portrait, { type PortraitMode } from "@/components/Portrait";
import { useDecode } from "@/components/useDecode";
import { site } from "@/data/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { usePalette } from "@/lib/palette-client";

type View = {
  id: string;
  label: string;
  mode: PortraitMode;
  /** Width axis of the headline in this view. */
  wdth: number;
  text: string;
  facts: [string, string][];
  portrait: (palette: string) => string;
};

const views: View[] = [
  {
    id: "designer",
    label: "Designer",
    mode: "tone",
    wdth: 150,
    text: "I start with the person using it, then the system underneath. Flows, type, colour and motion are designed together in Figma, so nothing feels bolted on later.",
    facts: [
      ["Works in", "Figma, variables, prototypes"],
      ["Thinks in", "Systems, flows and motion"],
      ["Recent", "Lumen and Atlas"],
    ],
    portrait: (p) => `The painting, gradient-mapped through the ${p} palette.`,
  },
  {
    id: "developer",
    label: "Developer",
    mode: "code",
    wdth: 58,
    text: "Then I build it myself: TypeScript, React and Next.js, component-driven, accessible and fast from the first commit. What you approved in Figma is what ships.",
    facts: [
      ["Writes", "TypeScript, React, Next.js"],
      ["Animates with", "GSAP, Framer Motion, three.js"],
      ["This site", "Designed and built by me"],
    ],
    portrait: () => "The same painting redrawn from 16 characters, densest where it’s brightest.",
  },
  {
    id: "person",
    label: "Person",
    mode: "color",
    wdth: 100,
    text: "I live and work in Amman, Jordan. AI makes me faster; the taste, judgment and care are still mine. I’m open to full-time roles and freelance work.",
    facts: [
      ["Based in", site.location],
      ["Local time", "clock"],
      ["Open to", "Full-time and freelance"],
    ],
    portrait: () => "The original painting, no recolouring.",
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

/** Text that decodes into place whenever it changes. */
function Decoded({ text }: { text: string }) {
  const ref = useDecode<HTMLSpanElement>(text);
  return (
    <>
      <span className="decode-source sr-only">{text}</span>
      <span aria-hidden ref={ref} />
    </>
  );
}

export default function About() {
  const root = useRef<HTMLElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const indicator = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const palette = usePalette();
  const view = views[active];

  // slide the tab indicator under the active tab
  useEffect(() => {
    const move = () => {
      const t = tabs.current[active];
      const ind = indicator.current;
      if (!t || !ind) return;
      ind.style.width = `${t.offsetWidth}px`;
      ind.style.transform = `translateX(${t.offsetLeft - 4}px)`;
    };
    move();
    window.addEventListener("resize", move);
    return () => window.removeEventListener("resize", move);
  }, [active]);

  useGSAP(
    () => {
      // the headline changes width with the view
      gsap.to(".about-name", { "--wdth": view.wdth, duration: 1, ease: "expo.out" });
    },
    { scope: root, dependencies: [view.wdth] },
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
        // the screen opens up as it arrives, like an app window
        gsap.fromTo(
          ".about-screen",
          { scale: 0.92, borderRadius: 64 },
          {
            scale: 1,
            borderRadius: 32,
            ease: "none",
            scrollTrigger: { trigger: ".about-screen", start: "top bottom", end: "top 25%", scrub: true },
          },
        );
      });
    },
    { scope: root },
  );

  const onKey = (e: React.KeyboardEvent) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (active + dir + views.length) % views.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <section ref={root} id="about" aria-labelledby="about-title" className="bg-chalk px-3 py-24 sm:px-6 md:py-36">
      <div className="about-screen mx-auto grid max-w-[1400px] overflow-hidden rounded-[32px] bg-ink text-chalk md:min-h-[min(780px,90svh)] md:grid-cols-12">
        {/* portrait */}
        <div className="about-stage relative h-[440px] overflow-hidden sm:h-[540px] md:col-span-5 md:h-auto">
          <div className="absolute bottom-0 left-1/2 h-[92%] -translate-x-1/2">
            <Portrait
              luma="/portraits/about-luma.webp"
              color="/portraits/about-color.webp"
              tone="/portraits/about-tone.webp"
              width={956}
              height={1416}
              mode={view.mode}
              alt={`Painted portrait of ${site.name} seen from behind, glancing back over one shoulder`}
              sizes="(min-width: 768px) 36vw, 90vw"
              className="h-full"
            />
          </div>
          <p className="absolute inset-x-5 bottom-4 text-sm text-chalk/80">
            <Decoded text={view.portrait(palette.name)} />
          </p>
        </div>

        {/* profile */}
        <div className="flex flex-col p-6 sm:p-10 md:col-span-7 md:p-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div
              role="tablist"
              aria-label="View the profile as"
              onKeyDown={onKey}
              className="relative flex rounded-full bg-chalk/10 p-1 text-sm"
            >
              <span
                ref={indicator}
                aria-hidden
                className="absolute left-1 top-1 h-[calc(100%-8px)] rounded-full bg-chalk transition-[transform,width] duration-500 ease-[var(--ease-out-expo)]"
              />
              {views.map((v, i) => (
                <button
                  key={v.id}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`about-tab-${v.id}`}
                  aria-selected={i === active}
                  aria-controls="about-panel"
                  tabIndex={i === active ? 0 : -1}
                  onClick={() => setActive(i)}
                  className={`relative rounded-full px-4 py-2 font-medium transition-colors duration-300 sm:px-5 ${
                    i === active ? "text-ink" : "text-chalk/75 hover:text-chalk"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <p className="text-sm text-chalk-muted">Switch the view. The portrait changes with it.</p>
          </div>

          <div
            id="about-panel"
            role="tabpanel"
            aria-labelledby={`about-tab-${view.id}`}
            className="mt-12 flex flex-1 flex-col md:mt-16"
          >
            <h2 id="about-title" className="about-name display text-[clamp(3.5rem,8.5vw,8rem)] uppercase [--wdth:150]">
              I’m Essa.
            </h2>
            <p className="mt-8 min-h-[5.5em] max-w-[44ch] text-xl leading-snug sm:text-2xl">
              <Decoded text={view.text} />
            </p>

            <dl className="mt-10 grid gap-6 border-t border-chalk/15 pt-6 sm:grid-cols-3 md:mt-auto">
              {view.facts.map(([term, detail], i) => (
                <div key={i}>
                  <dt className="text-sm text-chalk-muted">
                    <Decoded text={term} />
                  </dt>
                  <dd className="mt-1.5 text-lg font-medium leading-snug">
                    {detail === "clock" ? <AmmanClock /> : <Decoded text={detail} />}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
