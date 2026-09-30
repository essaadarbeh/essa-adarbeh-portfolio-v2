"use client";

import { useRef } from "react";
import HandoffCompare from "@/components/HandoffCompare";
import { process } from "@/data/skills";
import { gsap, useGSAP } from "@/lib/gsap";

export default function Process() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 768px)", motion: "(prefers-reduced-motion: no-preference)" }, (ctx) => {
        const { desktop, motion } = ctx.conditions as { desktop: boolean; motion: boolean };
        if (!motion) return;
        // the rail fills as you read down the steps; each step lights up
        // as you reach it
        const axis = desktop ? "scaleX" : "scaleY";
        gsap.fromTo(
          ".process-fill",
          { [axis]: 0 },
          {
            [axis]: 1,
            ease: "none",
            scrollTrigger: { trigger: ".process-list", start: "top 75%", end: "bottom 60%", scrub: true },
          },
        );
        gsap.utils.toArray<HTMLElement>(".process-step").forEach((step) => {
          gsap.fromTo(
            step,
            { opacity: 0.3 },
            {
              opacity: 1,
              duration: 0.6,
              scrollTrigger: { trigger: step, start: "top 70%", toggleActions: "play none none reverse" },
            },
          );
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="process"
      aria-labelledby="process-title"
      className="bg-chalk px-4 py-28 text-ink sm:px-6 md:py-40"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-8 md:grid-cols-12">
          <h2
            id="process-title"
            className="display text-[clamp(3rem,7.5vw,7.5rem)] uppercase [--wdth:118] md:col-span-8"
          >
            One person, design to code
          </h2>
          <p className="max-w-[40ch] self-end text-lg leading-snug text-ink-muted md:col-span-4">
            Most projects lose something between the design file and the browser. Mine don’t have that gap. Drag the
            handle to compare the two.
          </p>
        </div>

        <div className="mt-14 md:mt-20">
          <HandoffCompare />
        </div>

        <ol className="process-list relative mt-24 grid gap-12 md:mt-32 md:grid-cols-4 md:gap-8 md:pt-14">
          {/* rail: horizontal on desktop, vertical on mobile */}
          <span aria-hidden className="absolute left-[11px] top-0 h-full w-px bg-ink/15 md:left-0 md:h-px md:w-full" />
          <span
            aria-hidden
            className="process-fill absolute left-[11px] top-0 h-full w-px origin-top bg-field md:left-0 md:h-px md:w-full md:origin-left"
          />
          {process.map((s, i) => (
            <li key={s.title} className="process-step relative pl-10 md:pl-0">
              <span
                aria-hidden
                className="absolute left-0 top-1.5 h-[23px] w-[23px] rounded-full border border-field bg-chalk md:-top-[calc(3.5rem+11px)]"
              />
              <p className="display text-6xl text-field [--wdth:60]">{i + 1}</p>
              <h3 className="mt-3 text-2xl font-medium">{s.title}</h3>
              <p className="mt-3 max-w-[36ch] leading-relaxed text-ink-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
