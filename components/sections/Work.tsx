"use client";

import Image from "next/image";
import { useRef } from "react";
import { projects } from "@/data/projects";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { PALETTE_EVENT } from "@/lib/palettes";
import { currentPalette } from "@/lib/palette-client";
import LumenDemo from "@/components/demos/LumenDemo";
import AtlasDemo from "@/components/demos/AtlasDemo";

type Theme = { bg: string; fg: string; muted: string };

/** Between projects the room is the active palette's ink. */
const inkTheme = (): Theme => {
  const p = currentPalette();
  return { bg: p.ink, fg: p.chalk, muted: p.chalkMuted };
};

const demos: Record<string, { Demo: () => React.JSX.Element; hint: string }> = {
  lumen: {
    Demo: LumenDemo,
    hint: "Change a token and watch it land on every card. Switch the range, or hover a sparkline to read it.",
  },
  atlas: {
    Demo: AtlasDemo,
    hint: "Watch a research run. When Atlas stops to ask permission, the decision is yours.",
  },
};

export default function Work() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current!;
      const q = gsap.utils.selector(section);
      // Fading these variables repaints the whole section every frame, which
      // phones feel; they switch instantly instead.
      const small = matchMedia("(max-width: 767px), (pointer: coarse)").matches;
      const paint = (t: Theme, duration = 0.9) =>
        gsap.to(section, {
          "--bg": t.bg,
          "--fg": t.fg,
          "--muted": t.muted,
          duration: small ? 0 : duration,
          ease: "power2.inOut",
        });
      let current: "ink" | number = "ink";
      paint(inkTheme(), 0);

      // The room takes on each project's colour while it's on screen.
      projects.forEach((p, i) => {
        gsap.timeline({
          scrollTrigger: {
            trigger: q(".project")[i],
            start: "top 55%",
            end: "bottom 45%",
            onEnter: () => {
              current = i;
              paint(p.theme);
            },
            onEnterBack: () => {
              current = i;
              paint(p.theme);
            },
            onLeaveBack: () => {
              if (i === 0) {
                current = "ink";
                paint(inkTheme());
              }
            },
          },
        });
      });

      // a palette switch recolours the ink between projects
      const onPalette = () => current === "ink" && paint(inkTheme(), 0);
      window.addEventListener(PALETTE_EVENT, onPalette);

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
        // Covers open from a small inset window to full frame as they arrive.
        // Desktop only: a scrubbed clip-path repaints every frame.
        q(".cover-frame").forEach((frame: HTMLElement) => {
          const img = frame.querySelector("img");
          gsap.fromTo(
            frame,
            { clipPath: "inset(14% 10% 14% 10% round 40px)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 20px)",
              ease: "none",
              scrollTrigger: { trigger: frame, start: "top 95%", end: "top 30%", scrub: true },
            },
          );
          gsap.fromTo(
            img,
            { scale: 1.12 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: { trigger: frame, start: "top bottom", end: "top 30%", scrub: true },
            },
          );
        });
      });

      mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
        // Titles widen letter by letter on hover — a wave, not a snap.
        const splits = q(".project-title").map((el: HTMLElement) => {
          const s = SplitText.create(el, { type: "chars", charsClass: "char" });
          const link = el.closest(".project")!;
          const widen = (w: number) =>
            gsap.to(s.chars, { "--wdth": w, duration: 0.8, ease: "expo.out", stagger: 0.035, overwrite: true });
          const on = () => widen(150);
          const off = () => widen(70);
          link.addEventListener("pointerenter", on);
          link.addEventListener("pointerleave", off);
          return { s, link, on, off };
        });

        return () =>
          splits.forEach(({ s, link, on, off }) => {
            link.removeEventListener("pointerenter", on);
            link.removeEventListener("pointerleave", off);
            s.revert();
          });
      });

      // pointer tilt on the covers (fine pointers only)
      mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const cleanups = q(".cover-tilt").map((el: HTMLElement) => {
          const rx = gsap.quickTo(el, "rotationX", { duration: 0.8, ease: "power3.out" });
          const ry = gsap.quickTo(el, "rotationY", { duration: 0.8, ease: "power3.out" });
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            ry(((e.clientX - r.left) / r.width - 0.5) * 7);
            rx(-((e.clientY - r.top) / r.height - 0.5) * 7);
          };
          const leave = () => {
            rx(0);
            ry(0);
          };
          el.addEventListener("pointermove", move);
          el.addEventListener("pointerleave", leave);
          return () => {
            el.removeEventListener("pointermove", move);
            el.removeEventListener("pointerleave", leave);
          };
        });
        return () => cleanups.forEach((c: () => void) => c());
      });

      return () => window.removeEventListener(PALETTE_EVENT, onPalette);
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="work"
      aria-labelledby="work-title"
      className="relative px-4 pb-24 pt-28 sm:px-6 md:pt-40"
      style={
        {
          "--bg": "var(--color-ink)",
          "--fg": "var(--color-chalk)",
          "--muted": "var(--color-chalk-muted)",
          background: "var(--bg)",
          color: "var(--fg)",
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="work-title" className="display text-[clamp(3.5rem,11vw,11rem)] uppercase [--wdth:125]">
            Work
          </h2>
          <p className="max-w-[36ch] pb-2 text-lg leading-snug text-[var(--muted)]">
            Two recent product designs, each built on its own design system in Figma. Each one comes with a working
            piece you can play with.
          </p>
        </div>

        <ol className="mt-16 md:mt-24">
          {projects.map((p) => {
            const demo = demos[p.slug];
            return (
              <li key={p.slug} className="project grid gap-8 py-14 md:grid-cols-12 md:gap-8 md:py-24">
                <div className="md:col-span-4 md:flex md:flex-col md:justify-between md:py-2">
                  <div>
                    <h3 className="project-title display text-[clamp(4rem,9vw,9rem)] uppercase [--wdth:70]">
                      {p.title}
                    </h3>
                    <p className="mt-5 text-2xl font-medium leading-tight">{p.summary}</p>
                    <p className="mt-5 max-w-[46ch] leading-relaxed text-[var(--muted)]">{p.description}</p>
                  </div>

                  <div className="mt-10">
                    <dl className="grid grid-cols-2 gap-4 border-t border-current/15 pt-5 text-sm">
                      <div>
                        <dt className="text-[var(--muted)]">Role</dt>
                        <dd className="mt-1 font-medium">{p.role}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">Year</dt>
                        <dd className="mt-1 font-medium">{p.year}</dd>
                      </div>
                    </dl>
                    <ul className="mt-6 flex flex-wrap gap-2" aria-label="Deliverables">
                      {p.facts.map((f) => (
                        <li key={f} className="rounded-full px-3 py-1.5 text-sm ring-1 ring-current/25">
                          {f}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group mt-8 inline-flex items-center gap-3 font-medium"
                    >
                      <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 ease-[var(--ease-out-expo)] group-hover:bg-[length:100%_1px]">
                        Open the {p.title} file in Figma
                      </span>
                      <svg
                        aria-hidden
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      >
                        <path d="M3 11 11 3M4.5 3H11v6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </div>
                </div>

                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={-1}
                  aria-hidden
                  data-cursor="Open in Figma"
                  className="block [perspective:1400px] md:col-span-8"
                >
                  <div className="cover-tilt md:will-change-transform [transform-style:preserve-3d]">
                    <div className="cover-frame relative overflow-hidden rounded-[20px] md:shadow-[0_40px_80px_-40px_rgba(4,7,30,0.6)]">
                      <Image
                        src={p.cover.src}
                        alt=""
                        width={p.cover.width}
                        height={p.cover.height}
                        sizes="(min-width: 768px) 60vw, 100vw"
                        className="h-auto w-full md:will-change-transform"
                      />
                    </div>
                  </div>
                </a>

                {demo && (
                  <div className="mt-6 md:col-span-12 md:mt-10">
                    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-lg font-medium">Try a piece of {p.title}</p>
                      <p className="max-w-[60ch] text-sm text-[var(--muted)]">{demo.hint}</p>
                    </div>
                    <demo.Demo />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
