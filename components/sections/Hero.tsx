"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ParticlePortrait from "@/components/ParticlePortrait";
import { useDecode } from "@/components/useDecode";
import { site } from "@/data/site";
import { gsap, SplitText, useGSAP, INTRO_DONE } from "@/lib/gsap";

const ROLES = ["interfaces", "design systems", "product UI", "motion"];

/** "I design ___ and build them myself", with the blank decoding through roles. */
function RoleLine() {
  const [i, setI] = useState(0);
  const ref = useDecode<HTMLSpanElement>(ROLES[i], 650);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % ROLES.length), 2600);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      I design{" "}
      <span className="relative inline-block min-w-[9.5ch] text-chalk">
        <span className="sr-only">interfaces, design systems, product UI and motion</span>
        <span aria-hidden ref={ref} />
        <span aria-hidden className="absolute -bottom-0.5 left-0 h-px w-full bg-signal/70" />
      </span>{" "}
      and build them myself.
    </>
  );
}

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const wide = matchMedia("(min-width: 768px) and (pointer: fine)").matches;
        let split: SplitText | undefined;

        // The one orchestrated moment: letters rise (and on desktop stretch
        // from narrow to wide) while the particles gather into the portrait.
        document.fonts.ready.then(() => {
          split = SplitText.create(q(".hero-line"), { type: "lines,words,chars", charsClass: "char", mask: "lines" });
          const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
          tl.from(split.chars, {
            yPercent: 115,
            // letters stretching re-lays out text every frame: desktop only
            ...(wide ? { "--wdth": 50 } : {}),
            duration: 1.6,
            stagger: { each: 0.045, from: "start" },
            onComplete: () => gsap.set(split!.chars, { clearProps: "--wdth" }),
          })
            .from(q("[data-hero-fade]"), { autoAlpha: 0, y: 16, duration: 1.1, stagger: 0.08 }, 0.9)
            .from(document.querySelector("header"), { yPercent: -140, duration: 1.1 }, 1.1);

          const d = document.documentElement;
          if (d.dataset.intro !== "done") {
            d.dataset.intro = "done";
            window.dispatchEvent(new Event(INTRO_DONE));
          }
        });

        // Scrolling away: the lines part while the particles drift upward
        // (the drift itself lives in the shader). Transforms only.
        const scrub = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to(q(".hero-line-a"), { xPercent: -8, ease: "none", scrollTrigger: scrub });
        gsap.to(q(".hero-line-b"), { xPercent: 8, ease: "none", scrollTrigger: scrub });
        gsap.to(q(".hero-meta"), { autoAlpha: 0, y: -30, ease: "none", scrollTrigger: { ...scrub, end: "40% top" } });

        return () => split?.revert();
      });

      // desktop: the name also compresses toward its narrowest width
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px) and (pointer: fine)", () => {
        gsap.fromTo(
          q(".hero-line"),
          { "--wdth": 150 },
          {
            "--wdth": 55,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="top"
      className="relative isolate h-[100svh] min-h-[620px] overflow-hidden bg-field text-chalk [touch-action:pan-y]"
    >
      <h1 className="sr-only">
        {site.name}, {site.role.toLowerCase()} in {site.location}
      </h1>

      {/* soft floor light, so the particles have something to settle into */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(60%_60%_at_50%_100%,color-mix(in_oklab,var(--color-sky)_28%,transparent),transparent_70%)]"
      />

      {/* the name sits behind the portrait */}
      <div
        aria-hidden
        data-intro-hide
        className="hero-name pointer-events-none absolute inset-x-0 top-[15svh] flex flex-col px-3 sm:top-[20svh] sm:px-5"
      >
        <span className="hero-line hero-line-a display block text-[12vw] uppercase leading-[0.9] [--wdth:150]">
          {site.firstName}
        </span>
        <span className="hero-line hero-line-b display block self-end text-[12vw] uppercase leading-[0.9] [--wdth:150]">
          {site.lastName}
        </span>
      </div>

      {/* The box the painting fills. It carries the static image for no-JS
          and no-WebGL visitors; the particles draw on the canvas above. */}
      <div
        ref={frame}
        className="portrait absolute bottom-0 left-1/2 z-10 h-[74svh] -translate-x-1/2 sm:h-[86svh]"
        style={{ aspectRatio: "729 / 1544" }}
      >
        <Image
          src="/portraits/hero-tone.webp"
          alt={`Painted portrait of ${site.name} in profile, looking up`}
          fill
          priority
          sizes="(min-width: 640px) 42svh, 60vw"
          className="portrait-fallback object-contain"
        />
      </div>
      <ParticlePortrait
        luma="/portraits/hero-luma.webp"
        color="/portraits/hero-color.webp"
        width={729}
        height={1544}
        frame={frame}
        stage={root}
      />

      {/* keeps the bottom copy legible where the dark suit meets the edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-field/90 to-transparent"
      />

      <div className="hero-meta pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-6 px-4 pb-5 sm:px-6 sm:pb-7">
        <p data-hero-fade data-intro-hide className="max-w-[40ch] text-[15px] leading-snug text-field-muted sm:text-lg">
          <span className="text-chalk">Frontend developer and UI/UX designer in Amman.</span> <RoleLine />
        </p>
        <p
          data-hero-fade
          data-intro-hide
          className="hidden max-w-[30ch] items-center gap-3 text-right text-sm leading-snug text-field-muted md:flex"
        >
          <span className="[@media(pointer:coarse)]:hidden">
            Move through the portrait to see its true colours. Click to send a ripple.
          </span>
          <span className="hidden [@media(pointer:coarse)]:inline">Touch the portrait to see its true colours</span>
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 ring-field-muted/50"
          >
            <span className="h-3 w-3 rounded-full bg-signal" />
          </span>
        </p>
      </div>
    </section>
  );
}
