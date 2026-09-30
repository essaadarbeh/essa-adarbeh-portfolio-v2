"use client";

import { useRef } from "react";
import PortraitLens from "@/components/PortraitLens";
import { site } from "@/data/site";
import { gsap, SplitText, useGSAP, INTRO_DONE } from "@/lib/gsap";

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let split: SplitText | undefined;

        // The one orchestrated moment: letters rise and stretch from narrow
        // to wide while the portrait develops in behind them.
        document.fonts.ready.then(() => {
          split = SplitText.create(q(".hero-line"), { type: "lines,words,chars", charsClass: "char", mask: "lines" });
          const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
          tl.from(split.chars, {
            yPercent: 115,
            "--wdth": 50,
            duration: 1.6,
            stagger: { each: 0.045, from: "start" },
            onComplete: () => gsap.set(split!.chars, { clearProps: "--wdth" }),
          })
            .from(q("[data-hero-fade]"), { autoAlpha: 0, y: 16, duration: 1.1, stagger: 0.08 }, 0.7)
            .from(document.querySelector("header"), { yPercent: -140, duration: 1.1 }, 0.9);

          const d = document.documentElement;
          if (d.dataset.intro !== "done") {
            d.dataset.intro = "done";
            window.dispatchEvent(new Event(INTRO_DONE));
          }
        });

        // Scrolling away: the name compresses toward its narrowest width and
        // the two lines part, while the portrait sinks slower than the page.
        const scrub = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
        gsap.fromTo(q(".hero-line"), { "--wdth": 150 }, { "--wdth": 55, ease: "none", scrollTrigger: scrub });
        gsap.to(q(".hero-line-a"), { xPercent: -6, ease: "none", scrollTrigger: scrub });
        gsap.to(q(".hero-line-b"), { xPercent: 6, ease: "none", scrollTrigger: scrub });
        gsap.to(q(".hero-portrait"), { yPercent: 14, scale: 1.04, ease: "none", scrollTrigger: scrub });
        gsap.to(q(".hero-meta"), { autoAlpha: 0, y: -30, ease: "none", scrollTrigger: { ...scrub, end: "40% top" } });

        return () => split?.revert();
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="top"
      className="relative isolate h-[100svh] min-h-[620px] overflow-hidden bg-cobalt text-chalk"
    >
      <h1 className="sr-only">
        {site.name}, {site.role.toLowerCase()} in {site.location}
      </h1>

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

      <div
        data-intro-hide
        className="hero-portrait absolute bottom-0 left-1/2 z-10 h-[74svh] -translate-x-1/2 origin-bottom sm:h-[86svh]"
      >
        <PortraitLens
          tone="/portraits/hero-tone.webp"
          color="/portraits/hero-color.webp"
          width={729}
          height={1544}
          alt={`Painted portrait of ${site.name} in profile, looking up`}
          priority
          waitForIntro
          sizes="(min-width: 640px) 42svh, 60vw"
          className="h-full"
        />
      </div>

      {/* keeps the bottom copy legible where the dark suit meets the edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-cobalt/90 to-transparent"
      />

      <div className="hero-meta pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-6 px-4 pb-5 sm:px-6 sm:pb-7">
        <p
          data-hero-fade
          data-intro-hide
          className="max-w-[31ch] text-[15px] leading-snug text-cobalt-muted sm:text-lg"
        >
          <span className="text-chalk">Frontend developer and UI/UX designer in Amman.</span> I design interfaces, then
          build them myself, so nothing gets lost in between.
        </p>
        <p
          data-hero-fade
          data-intro-hide
          className="hidden max-w-[30ch] items-center gap-3 text-right text-sm leading-snug text-cobalt-muted md:flex"
        >
          <span className="[@media(pointer:coarse)]:hidden">Hover over the portrait to see its original colours</span>
          <span className="hidden [@media(pointer:coarse)]:inline">Touch the portrait to see its original colours</span>
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 ring-cobalt-muted/50"
          >
            <span className="h-3 w-3 rounded-full bg-marigold" />
          </span>
        </p>
      </div>
    </section>
  );
}
