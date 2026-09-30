"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Doodle from "@/components/hand/Doodle";
import FigmaStickers from "@/components/hand/FigmaStickers";
import { DrawScope, Mark, Written } from "@/components/hand/Marks";
import SketchPortrait from "@/components/hand/SketchPortrait";
import heroSketch from "@/data/sketch-hero.json";
import { site } from "@/data/site";
import { gsap, INTRO_DONE, useGSAP } from "@/lib/gsap";

/**
 * The first page of the notebook. The sentence is typeset; everything a hand
 * would add arrives after it: a circle, an underline, then a pen draws Essa
 * and paint washes in over the lines. Then the pen is yours.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const figure = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [drew, setDrew] = useState(false);
  const onFirstStroke = useCallback(() => setDrew(true), []);

  // start once fonts are in, so marks land on the words' final positions
  useEffect(() => {
    let alive = true;
    document.fonts.ready.then(() => {
      if (!alive) return;
      setOn(true);
      const d = document.documentElement;
      if (d.dataset.intro !== "done") {
        d.dataset.intro = "done";
        window.dispatchEvent(new Event(INTRO_DONE));
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
        // scrolling away, the figure stays behind a little longer than the page
        gsap.to(figure.current, {
          yPercent: 14,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="paper relative isolate min-h-[100svh] overflow-hidden text-ink">
      <Doodle host={root} onFirstStroke={onFirstStroke} />

      <DrawScope
        on={on}
        className="relative z-10 mx-auto grid min-h-[100svh] max-w-[1400px] content-center px-5 pb-10 pt-24 sm:px-8 md:grid-cols-12 md:pb-16"
      >
        {/* the sentence */}
        <div className="relative z-10 md:col-span-7">
          <Written className="-rotate-2 text-3xl text-field sm:text-4xl" delay={0.1}>
            hi, I’m Essa.
          </Written>

          <h1 className="display mt-3 text-[clamp(2.9rem,7.4vw,7.6rem)] leading-[0.95] tracking-[-0.03em] [--wdth:96] md:mt-4">
            <span className="sr-only">
              {site.name}, {site.role.toLowerCase()} in {site.location}.{" "}
            </span>
            I{" "}
            <span className="relative -mx-[0.16em] -my-[0.14em] inline-block px-[0.16em] py-[0.14em]">
              design
              <Mark kind="circle" delay={0.45} duration={0.8} className="absolute inset-0 h-full w-full text-field" />
            </span>{" "}
            interfaces{" "}
            <span className="relative inline-block">
              &amp; build
              <Mark
                kind="underline"
                delay={1.2}
                duration={0.55}
                className="absolute -bottom-[0.02em] left-0 h-[0.2em] w-full text-signal"
                width={5}
              />
            </span>{" "}
            them myself.
          </h1>

          {/* margin note */}
          <div className="relative mt-2 hidden items-start gap-2 pl-2 md:ml-[42%] md:flex">
            <Mark
              kind="arrowLeft"
              delay={1.7}
              duration={0.5}
              className="-mt-10 h-14 w-20 shrink-0 -scale-y-100 text-field"
            />
            <Written className="max-w-[18ch] rotate-[-3deg] text-2xl leading-tight text-field" delay={2.05}>
              no handoff, so nothing gets lost in between
            </Written>
          </div>
        </div>

        {/* Essa, drawn then painted. In the flow on phones (right under the
            headline), standing at the right edge of the page on desktop. */}
        <div
          ref={figure}
          data-no-ink
          className="relative -mt-10 ml-auto mr-[-6vw] aspect-[425/900] h-[64svh] max-h-[640px] md:absolute md:bottom-0 md:right-[7%] md:m-0 md:h-[min(96svh,1000px)] md:max-h-none"
        >
          <SketchPortrait
            sketch={heroSketch}
            color="/portraits/hero-color.webp"
            ink="/portraits/hero-ink.webp"
            alt={`${site.name}, drawn in ink and painted, in profile and looking up`}
            focus={[110, 240]}
            play={on}
            priority
            unwashOn={root}
            className="h-full w-full"
          />
          <FigmaStickers host={figure} />

          {/* what it is, and what to do with it */}
          <div className="pointer-events-none absolute left-[-64%] top-[11%] hidden w-[62%] flex-col items-end md:flex">
            <Written className="rotate-[3deg] text-right text-2xl leading-tight text-ink-muted" delay={2.7}>
              that’s me, drawn first
            </Written>
            <Written className="rotate-[3deg] text-right text-xl text-field" delay={3.1}>
              hover: the sketch is still under the paint
            </Written>
            <Mark kind="arrow" delay={3.5} duration={0.45} className="mr-1 mt-1 h-12 w-16 text-ink-muted" width={3} />
          </div>
          <span className="absolute left-[-34%] top-[42%] md:hidden">
            <Written className="-rotate-6 text-xl text-field" delay={2.7}>
              tap me
            </Written>
          </span>

          {/* rubber stamp */}
          <div
            className="stamp absolute bottom-[14%] left-[-60%] z-20 rounded-[10px] border-[3px] border-field px-4 py-2 text-field md:bottom-[9%] md:left-[-68%]"
            style={{ "--r": "-9deg", "--delay": "2.9s", transform: "rotate(-9deg)" } as React.CSSProperties}
          >
            <p className="display text-base uppercase leading-none tracking-wide [--wdth:115] md:text-xl">
              Available for work
            </p>
            <p className="mt-1 text-center text-[9px] font-medium uppercase tracking-[0.2em] md:text-xs">
              Amman, Jordan · 2026
            </p>
          </div>
        </div>

        {/* the plain version, and where to go next */}
        <div className="relative z-10 md:col-span-6 md:col-start-1">
          <p className="mt-8 max-w-[46ch] text-lg leading-relaxed text-ink-muted md:mt-10">
            Frontend developer and UI/UX designer in Amman, Jordan. I make product interfaces that read at a glance,
            then ship them as fast, accessible code.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a
              href="#work"
              className="rounded-full bg-ink px-6 py-3.5 font-medium text-chalk transition-transform duration-300 hover:-rotate-1 hover:scale-[1.03]"
            >
              See my work
            </a>
            <span className="relative hidden items-center gap-2 [@media(pointer:fine)]:flex">
              <Written className="text-xl text-ink-muted" delay={2.9}>
                {drew ? "nice. keep going, or scroll on" : "or go ahead, draw on this page"}
              </Written>
              <Mark kind="squiggle" delay={3.4} duration={0.5} className="h-3 w-12 text-ink-muted" width={5} />
            </span>
          </div>
        </div>
      </DrawScope>
    </section>
  );
}
