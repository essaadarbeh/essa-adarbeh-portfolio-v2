"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Doodle from "@/components/hand/Doodle";
import { DrawScope, Mark, Tape, Written } from "@/components/hand/Marks";
import { site } from "@/data/site";
import { gsap, INTRO_DONE, useGSAP } from "@/lib/gsap";

/**
 * The first page of the notebook. The sentence is typeset; everything a hand
 * would add arrives after it: a circle, an underline, a note in the margin,
 * a taped print, a rubber stamp. Then the pen is yours.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const photo = useRef<HTMLElement>(null);
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
      mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
        // the print leans toward the pointer, like picking up a photo
        const el = photo.current!;
        const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
        const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 12);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
        };
        const leave = () => {
          rx(0);
          ry(0);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);

        // scrolling away, the print drifts up a little slower than the page
        gsap.to(el, {
          yPercent: -12,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        return () => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        };
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="paper relative isolate min-h-[100svh] overflow-hidden text-ink">
      <Doodle host={root} onFirstStroke={onFirstStroke} />

      <DrawScope
        on={on}
        className="relative z-10 mx-auto grid min-h-[100svh] max-w-[1400px] items-center gap-12 px-5 pb-16 pt-28 sm:px-8 md:grid-cols-12 md:gap-8 md:pt-24"
      >
        {/* words */}
        <div className="md:col-span-7">
          <Written className="-rotate-2 text-3xl text-field sm:text-4xl" delay={0.1}>
            hi, I’m Essa.
          </Written>

          <h1 className="display mt-4 text-[clamp(3rem,7.4vw,7.6rem)] leading-[0.95] tracking-[-0.03em] [--wdth:96]">
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
          <div className="relative mt-6 flex items-start gap-2 pl-2 sm:ml-[42%] sm:mt-2">
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

          <p className="mt-10 max-w-[46ch] text-lg leading-relaxed text-ink-muted">
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

        {/* the taped print */}
        <div className="relative mx-auto w-[min(76vw,390px)] md:col-span-5 md:mr-10 [perspective:1200px]">
          <figure
            ref={photo}
            data-no-ink
            className="print relative [transform-style:preserve-3d]"
            style={{ "--r": "3deg" } as React.CSSProperties}
          >
            <div className="print-inner bg-white p-3 pb-16 shadow-[0_2px_4px_rgba(11,18,56,0.08),0_24px_48px_-20px_rgba(11,18,56,0.45)]">
              <div className="relative aspect-[4/5] overflow-hidden bg-[radial-gradient(90%_70%_at_50%_20%,#3a48ff,#1a2490_60%,#0b1238)]">
                <Image
                  src="/portraits/hero-color.webp"
                  alt={`Painted portrait of ${site.name} in profile, looking up`}
                  fill
                  priority
                  sizes="(min-width: 768px) 420px, 78vw"
                  className="object-cover object-[50%_8%]"
                />
              </div>
              <figcaption className="absolute inset-x-0 bottom-3 text-center">
                <Written className="text-2xl text-ink" delay={1.5}>
                  me, somewhere in Amman
                </Written>
              </figcaption>
            </div>
            <Tape className="tape-in -left-7 top-3" rotate={-32} />
            <Tape className="tape-in -right-7 top-5 [--tape-delay:0.95s]" rotate={38} />
          </figure>

          {/* rubber stamp */}
          <div
            className="stamp absolute -bottom-14 -left-2 z-20 rounded-[10px] border-[3px] border-field px-4 py-2 text-field sm:-left-16"
            style={{ "--r": "-9deg", "--delay": "2.4s", transform: "rotate(-9deg)" } as React.CSSProperties}
          >
            <p className="display text-xl uppercase leading-none tracking-wide [--wdth:115]">Available for work</p>
            <p className="mt-1 text-center text-xs font-medium uppercase tracking-[0.2em]">Amman, Jordan · 2026</p>
          </div>
        </div>
      </DrawScope>
    </section>
  );
}
