"use client";

import { useRef, useState } from "react";
import { useDecode } from "@/components/useDecode";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Case } from "@/data/cases";

type Flow = Case["flow"];

/**
 * A user flow as a row of steps (a column on phones). Scrolling draws the
 * connector through the steps and lights each one as it's reached; clicking
 * a step (or the branch) takes over and shows what that moment is for.
 */
export default function FlowDiagram({ flow, accent }: { flow: Flow; accent: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [branch, setBranch] = useState(false);
  const manual = useRef(false);
  const n = flow.steps.length;
  const current = branch && flow.branch ? flow.branch : flow.steps[active];
  const detail = useDecode<HTMLSpanElement>(current.detail, 500);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 768px)", motion: "(prefers-reduced-motion: no-preference)" }, (ctx) => {
        const { desktop, motion } = ctx.conditions as { desktop: boolean; motion: boolean };
        if (!motion) return;
        const axis = desktop ? "scaleX" : "scaleY";
        gsap.fromTo(
          ".flow-fill",
          { [axis]: 0 },
          {
            [axis]: 1,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top 70%",
              end: "bottom 55%",
              scrub: true,
              onUpdate: (self) => {
                if (manual.current) return;
                const i = Math.min(n - 1, Math.floor(self.progress * n));
                setActive((a) => (a === i ? a : i));
                setBranch(false);
              },
            },
          },
        );
      });
    },
    { scope: root },
  );

  const pick = (i: number) => {
    manual.current = true;
    setBranch(false);
    setActive(i);
  };

  return (
    <div ref={root} className="relative">
      <ol
        className="relative grid gap-4 md:grid-flow-col md:auto-cols-fr md:gap-3"
        style={{ "--accent": accent } as React.CSSProperties}
      >
        {/* connector */}
        <span
          aria-hidden
          className="absolute left-[21px] top-2 h-[calc(100%-16px)] w-px bg-current/20 md:left-[22px] md:right-[22px] md:top-[21px] md:h-px md:w-auto"
        />
        <span
          aria-hidden
          className="flow-fill absolute left-[21px] top-2 h-[calc(100%-16px)] w-px origin-top bg-[var(--accent)] md:left-[22px] md:right-[22px] md:top-[21px] md:h-[2px] md:w-auto md:origin-left"
        />
        {flow.steps.map((s, i) => {
          const on = !branch && i === active;
          const reached = i <= active;
          return (
            <li key={s.label} className="relative">
              <button
                type="button"
                onClick={() => pick(i)}
                aria-pressed={on}
                className="group flex w-full items-center gap-4 text-left md:flex-col md:items-start md:gap-4"
              >
                <span
                  className={`relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold tabular-nums transition-[background-color,border-color,color,transform] duration-500 group-hover:scale-110 ${
                    on
                      ? "scale-110 border-[var(--accent)] bg-[var(--accent)] text-white"
                      : reached
                        ? "border-[var(--accent)] bg-[var(--bg)]"
                        : "border-current/25 bg-[var(--bg)] opacity-70"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-lg font-medium leading-tight transition-opacity ${on || reached ? "" : "opacity-60"}`}
                >
                  {s.label}
                </span>
              </button>
              {flow.branch?.at === i && (
                <button
                  type="button"
                  onClick={() => {
                    manual.current = true;
                    setBranch(true);
                  }}
                  aria-pressed={branch}
                  className={`relative mt-3 flex items-center gap-2 rounded-full border border-dashed px-3 py-1.5 text-sm transition-colors md:mt-6 ${
                    branch
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-current/40 hover:border-current"
                  }`}
                >
                  <span
                    aria-hidden
                    className="absolute -top-3 left-5 hidden h-3 border-l border-dashed border-current/40 md:block md:-top-6 md:h-6"
                  />
                  {flow.branch.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-10 grid gap-2 rounded-[20px] bg-current/[0.06] p-6 ring-1 ring-current/10 md:mt-12 md:grid-cols-[200px_1fr] md:p-8">
        <p className="text-sm opacity-70">{branch && flow.branch ? flow.branch.label : `Step ${active + 1} of ${n}`}</p>
        <p aria-live="polite" className="text-xl leading-snug md:text-2xl">
          <span className="sr-only">{current.detail}</span>
          <span aria-hidden ref={detail} />
        </p>
      </div>
    </div>
  );
}
