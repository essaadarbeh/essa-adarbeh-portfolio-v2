"use client";

import { useRef } from "react";
import PortraitLens from "@/components/PortraitLens";
import { site } from "@/data/site";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";

const facts = [
  { term: "Based in", detail: site.location },
  { term: "Focus", detail: "Interfaces, design systems and motion" },
  { term: "Working", detail: "Full-time roles and freelance projects" },
];

export default function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The statement reads itself in: each word goes from faint to full
        // as it passes through the middle of the screen.
        const split = SplitText.create(".about-statement", { type: "words" });
        gsap.fromTo(
          split.words,
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: {
              trigger: ".about-statement",
              start: "top 78%",
              end: "bottom 45%",
              scrub: true,
            },
          },
        );
        return () => split.revert();
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="about"
      aria-labelledby="about-title"
      className="relative bg-chalk px-4 py-28 text-ink sm:px-6 md:py-40"
    >
      <div className="mx-auto grid max-w-[1400px] gap-16 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-7">
          <h2 id="about-title" className="mb-10 text-sm font-medium text-ink-muted">
            About
          </h2>
          <p className="about-statement text-[clamp(1.75rem,3.4vw,3.35rem)] font-medium leading-[1.12] tracking-[-0.02em]">
            I’m Essa. I design interfaces and then build them myself, so the thing you approve in Figma is the thing
            that ships. No handoff, no lost details, no “that’s not what the mockup looked like.” AI makes me faster.
            The taste, judgment and care are still mine.
          </p>

          <dl className="mt-16 grid gap-x-8 gap-y-8 border-t border-ink/15 pt-8 sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.term}>
                <dt className="text-sm text-ink-muted">{f.term}</dt>
                <dd className="mt-1.5 text-lg font-medium leading-snug">{f.detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="md:col-span-4 md:col-start-9">
          <figure className="md:sticky md:top-24">
            <div className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(120%_80%_at_60%_20%,#3a48ff_0%,#1a2490_45%,#0b1238_100%)]">
              <PortraitLens
                tone="/portraits/about-tone.webp"
                color="/portraits/about-color.webp"
                width={956}
                height={1416}
                alt={`Painted portrait of ${site.name} seen from behind, glancing back over one shoulder`}
                sizes="(min-width: 768px) 30vw, 90vw"
                className="translate-y-[6%] scale-[1.02]"
              />
            </div>
            <figcaption className="mt-4 flex items-center justify-between text-sm text-ink-muted">
              <span>Recoloured in cobalt. The lens shows the original.</span>
              <span aria-hidden className="h-2 w-2 rounded-full bg-marigold" />
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
