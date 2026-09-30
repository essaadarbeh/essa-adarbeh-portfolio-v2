"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import CompareSlider from "@/components/CompareSlider";
import { DrawScope, Mark, Tape, Written } from "@/components/hand/Marks";
import TornEdge from "@/components/hand/TornEdge";
import RollText from "@/components/RollText";
import TransitionLink from "@/components/TransitionLink";
import { FigmaButton, FloatingFigma } from "@/components/case/FigmaLink";
import FlowDiagram from "@/components/case/FlowDiagram";
import LumenOverview from "@/components/case/LumenOverview";
import AtlasPanel from "@/components/case/AtlasPanel";
import LumenDemo from "@/components/demos/LumenDemo";
import AtlasDemo from "@/components/demos/AtlasDemo";
import { cases } from "@/data/cases";
import { projects } from "@/data/projects";
import { gsap, SplitText, useGSAP, INTRO_DONE } from "@/lib/gsap";

/** A section heading with a note scribbled beside it, like the home page's. */
function Heading({ children, id, note }: { children: React.ReactNode; id?: string; note?: string }) {
  return (
    <DrawScope className="flex flex-wrap items-end gap-x-5 gap-y-1">
      <h2 id={id} className="display text-[clamp(2.6rem,6.5vw,6rem)] uppercase [--wdth:110]">
        {children}
      </h2>
      {note && (
        <Written className="-rotate-3 pb-2 text-2xl text-[var(--accent)] md:pb-4 md:text-3xl" delay={0.3}>
          {note}
        </Written>
      )}
    </DrawScope>
  );
}

const STICKIES = [
  { bg: "#fde68a", r: -2 },
  { bg: "#bfdbfe", r: 1.6 },
  { bg: "#fbcfe8", r: -1.2 },
];

/** A notebook page inside the case study: ink on paper, whatever the project's colours. */
const PAPER = {
  "--fg": "var(--color-ink)",
  "--muted": "var(--color-ink-muted)",
  "--bg": "var(--color-chalk)",
} as React.CSSProperties;

export default function CaseStudy({ slug }: { slug: "lumen" | "atlas" }) {
  const root = useRef<HTMLElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLElement>(null);
  const i = projects.findIndex((p) => p.slug === slug);
  const p = projects[i];
  const c = cases[slug];
  const next = projects[(i + 1) % projects.length];
  const maxCount = Math.max(...c.components.map((x) => x.count));

  // arriving directly on this page there is no hero intro to wait for
  useEffect(() => {
    const d = document.documentElement;
    if (d.dataset.intro !== "done") {
      d.dataset.intro = "done";
      window.dispatchEvent(new Event(INTRO_DONE));
    }
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(".case-title", { type: "chars", charsClass: "char", mask: "chars" });
        gsap.from(split.chars, { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.05, delay: 0.35 });

        // cover opens from an inset window as it arrives
        gsap.fromTo(
          ".case-cover",
          { clipPath: "inset(10% 8% 10% 8% round 32px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 24px)",
            ease: "none",
            scrollTrigger: { trigger: ".case-cover", start: "top 90%", end: "top 25%", scrub: true },
          },
        );

        // stats count up once
        gsap.utils.toArray<HTMLElement>(".case-stat").forEach((el) => {
          const to = Number(el.dataset.value);
          const o = { v: 0 };
          gsap.to(o, {
            v: to,
            duration: 1.4,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
            onUpdate: () => (el.textContent = String(Math.round(o.v))),
          });
        });

        // inventory bars grow in
        gsap.from(".case-bar", {
          scaleX: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.05,
          scrollTrigger: { trigger: ".case-inventory", start: "top 80%" },
        });

        return () => split.revert();
      });
    },
    { scope: root },
  );

  const compare =
    slug === "lumen"
      ? { left: <LumenOverview wire />, right: <LumenOverview wire={false} /> }
      : { left: <AtlasPanel mode="dark" />, right: <AtlasPanel mode="light" /> };

  return (
    <main
      ref={root}
      className="min-h-screen bg-[var(--bg)] text-[var(--fg)]"
      style={
        {
          "--bg": p.theme.bg,
          "--fg": p.theme.fg,
          "--muted": p.theme.muted,
          "--accent": p.accent,
        } as React.CSSProperties
      }
    >
      {/* ── hero: the project, on its own screen ─────────────── */}
      <header className="relative pb-24 md:pb-32">
        <DrawScope className="mx-auto max-w-[1400px] px-4 pt-28 sm:px-6 md:pt-36">
          <TransitionLink
            href="/#work"
            color="#0b1238"
            label="Work"
            className="font-hand inline-flex items-center gap-1 text-2xl transition-transform duration-300 hover:-translate-x-1 hover:-rotate-2"
          >
            <Mark kind="arrowLeft" delay={0.1} duration={0.4} className="-mt-3 h-8 w-11 -scale-y-100" width={3} />
            all work
          </TransitionLink>

          <div className="mt-6 flex flex-wrap items-end gap-x-6">
            <h1 className="case-title display text-[clamp(5rem,19vw,19rem)] uppercase leading-[0.8] [--wdth:92]">
              {p.title}
            </h1>
            <Written className="-rotate-3 pb-3 text-3xl text-[var(--accent)] md:pb-8 md:text-4xl" delay={1}>
              (a case study)
            </Written>
          </div>

          <div className="mt-10 grid gap-12 md:grid-cols-12 md:gap-10">
            <div ref={top} className="md:col-span-7">
              <p className="text-2xl leading-snug md:text-3xl">{c.lede}</p>
              {/* the real file, right up front */}
              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
                <FigmaButton href={p.href} title={p.title} />
                <span className="flex items-end gap-1">
                  <Mark kind="arrowLeft" delay={1.6} duration={0.4} className="-mt-2 h-8 w-11 -scale-y-100" width={3} />
                  <Written className="rotate-[-3deg] text-xl text-[var(--accent)]" delay={1.9}>
                    every frame, every layer
                  </Written>
                </span>
              </div>
            </div>

            {/* the project's index card */}
            <div className="relative self-start md:col-span-4 md:col-start-9 md:mt-2">
              <Tape className="-top-3 left-1/2 -translate-x-1/2" rotate={-3} />
              <div className="rotate-[1.5deg] bg-[#fdfcf8] px-6 pb-6 pt-4 text-ink shadow-[0_18px_30px_-16px_rgba(0,0,0,0.5)] [background-image:linear-gradient(#e8a0a0,#e8a0a0),repeating-linear-gradient(transparent_0_27px,#cfdcf0_27px_28px)] [background-position:0_46px,0_46px] [background-repeat:no-repeat,repeat] [background-size:100%_1.5px,100%_100%]">
                <p className="font-hand text-2xl leading-[46px]" style={{ color: p.ink }}>
                  {p.title}, {p.year}
                </p>
                <dl className="mt-1 space-y-[6px] text-[15px] leading-[22px]">
                  {[
                    ["Role", p.role],
                    ["Scope", p.facts.join(", ")],
                    ["Tools", p.tools],
                  ].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[64px_1fr] gap-2">
                      <dt className="text-ink-muted">{k}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </DrawScope>

        <div className="relative mx-auto mt-16 max-w-[1400px] px-4 sm:px-6 md:mt-24">
          {/* the same note as on the home page, scribbled over the screen */}
          <DrawScope
            threshold={0.6}
            className="pointer-events-none relative z-10 mb-3 flex items-end gap-1 md:absolute md:-top-14 md:left-10 md:mb-0"
            style={{ color: p.accent } as React.CSSProperties}
          >
            <Written className="-rotate-2 text-2xl leading-tight md:text-[1.8rem]" delay={0.2}>
              {p.note}
            </Written>
            <Mark
              kind="arrow"
              delay={0.2 + p.note.length * 0.045}
              duration={0.45}
              className="mb-[-2.2rem] hidden h-14 w-16 md:block"
              width={3}
            />
          </DrawScope>
          <div className="case-cover overflow-hidden rounded-[24px]">
            <Image
              src={p.cover.src}
              alt={`${p.title}: ${p.summary}`}
              width={p.cover.width}
              height={p.cover.height}
              sizes="100vw"
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
        {/* the notebook starts below */}
        <TornEdge side="bottom" />
      </header>

      {/* ── the thinking, on paper ───────────────────────────── */}
      <div className="paper relative text-[var(--fg)]" style={{ ...PAPER, "--accent": p.ink } as React.CSSProperties}>
        <section
          aria-labelledby="brief"
          className="mx-auto grid max-w-[1400px] gap-10 px-4 pb-20 pt-20 sm:px-6 md:grid-cols-12 md:pb-28 md:pt-28"
        >
          <div className="md:col-span-5">
            <Heading id="brief" note="(what I was asked)">
              The brief
            </Heading>
          </div>
          <div className="space-y-6 text-xl leading-relaxed md:col-span-7 md:col-start-6 md:pt-4">
            {c.brief.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>

          {/* the approach, as the sticky notes it started as */}
          <ul className="grid gap-8 md:col-span-12 md:mt-8 md:grid-cols-3 md:gap-10">
            {c.approach.map((a, k) => (
              <li
                key={a.title}
                className="p-6 text-[#2d2a26] shadow-[0_1px_1px_rgba(0,0,0,0.08),0_16px_26px_-14px_rgba(0,0,0,0.4)] transition-transform duration-500 ease-[var(--ease-out-expo)] hover:rotate-0 md:p-7"
                style={{ background: STICKIES[k % 3].bg, rotate: `${STICKIES[k % 3].r}deg` }}
              >
                <h3 className="font-hand text-[26px] leading-tight">{a.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[#3b3325]">{a.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="flow" className="mx-auto max-w-[1400px] px-4 pb-28 sm:px-6 md:pb-36">
          <div className="mb-12 grid gap-6 md:grid-cols-12">
            <div className="md:col-span-7">
              <Heading id="flow" note="(click any step)">
                {c.flow.title}
              </Heading>
            </div>
            <p className="self-end text-lg leading-snug text-[var(--muted)] md:col-span-4 md:col-start-9">
              {c.flow.intro}
            </p>
          </div>
          <FlowDiagram flow={c.flow} accent={p.ink} />
        </section>
      </div>

      {/* ── the build, back on screen ────────────────────────── */}
      <div className="relative pt-24 md:pt-32">
        <TornEdge side="top" />
        <section aria-labelledby="compare" className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6 md:pb-36">
          <div className="mb-10 grid gap-6 md:grid-cols-12">
            <div className="md:col-span-7">
              <Heading id="compare" note="(drag the handle)">
                {c.compare.title}
              </Heading>
            </div>
            <p className="self-end text-lg leading-snug text-[var(--muted)] md:col-span-4 md:col-start-9">
              {c.compare.intro}
            </p>
          </div>
          {/* which side is which, labelled by hand */}
          <DrawScope threshold={0.5} className="mb-2 flex items-end justify-between px-2">
            <span className="flex items-end gap-1">
              <Mark
                kind="arrowLeft"
                delay={0.1}
                duration={0.4}
                className="h-9 w-12 -scale-y-100 -rotate-12"
                width={3}
              />
              <Written className="-rotate-2 text-2xl text-[var(--accent)]" delay={0.4}>
                {c.compare.left.toLowerCase()}
              </Written>
            </span>
            <span className="flex items-end gap-1">
              <Written className="rotate-2 text-2xl text-[var(--accent)]" delay={0.8}>
                {c.compare.right.toLowerCase()}
              </Written>
              <Mark kind="arrow" delay={1.2} duration={0.4} className="h-9 w-12 rotate-[20deg]" width={3} />
            </span>
          </DrawScope>
          <CompareSlider
            label={`Compare ${c.compare.left.toLowerCase()} and ${c.compare.right.toLowerCase()}`}
            leftName={c.compare.left.toLowerCase()}
            className="h-[520px] rounded-[24px] ring-1 ring-current/15 md:h-[600px]"
            handleClassName="bg-[var(--accent)]"
            left={compare.left}
            right={compare.right}
          />
        </section>

        <section aria-labelledby="system" className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6 md:pb-36">
          <Heading id="system" note="(counted from the Figma file)">
            The system
          </Heading>
          <DrawScope threshold={0.5} className="mt-10">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] bg-current/15 md:grid-cols-4">
              {c.stats.map((st, k) => (
                <div key={st.label} className="bg-[var(--bg)] p-6 md:p-8">
                  <dt className="sr-only">{st.label}</dt>
                  <dd>
                    <span className="relative inline-block">
                      <span
                        className="case-stat display block text-[clamp(3rem,7vw,6rem)] tabular-nums [--wdth:80]"
                        data-value={st.value}
                      >
                        {st.value}
                      </span>
                      {/* the pen rings the number the whole system hangs on */}
                      {k === 0 && (
                        <Mark
                          kind="circle"
                          delay={0.9}
                          duration={0.7}
                          className="absolute -inset-x-5 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+2.5rem)] text-[var(--accent)]"
                          width={2.5}
                        />
                      )}
                    </span>
                    <span className="mt-2 block text-[var(--muted)]">{st.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </DrawScope>

          <div className="case-inventory mt-14">
            <p className="mb-4 text-sm text-[var(--muted)]">Component inventory, with every variant the file defines</p>
            <ul className="divide-y divide-current/15 border-y border-current/15">
              {c.components.map((cmp) => (
                <li key={cmp.name} className="grid items-center gap-2 py-4 md:grid-cols-[220px_1fr_240px] md:gap-6">
                  <span className="text-lg font-medium">{cmp.name}</span>
                  <span className="text-[var(--muted)]">{cmp.variants}</span>
                  <span className="flex items-center gap-3">
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-current/10">
                      <span
                        className="case-bar block h-full origin-left rounded-full bg-[var(--accent)]"
                        style={{ width: `${Math.max(4, (cmp.count / maxCount) * 100)}%` }}
                      />
                    </span>
                    <span className="w-20 text-right text-sm tabular-nums">
                      {cmp.count} {cmp.count === 1 ? "variant" : "variants"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="try" className="mx-auto max-w-[1400px] px-4 pb-32 sm:px-6 md:pb-44">
          <div className="mb-10 grid gap-6 md:grid-cols-12">
            <div className="md:col-span-7">
              <Heading id="try" note="(it’s live, go ahead)">
                Try it
              </Heading>
            </div>
            <p className="self-end text-lg leading-snug text-[var(--muted)] md:col-span-4 md:col-start-9">
              {c.demoIntro}
            </p>
          </div>
          {slug === "lumen" ? <LumenDemo /> : <AtlasDemo />}
        </section>
        <TornEdge side="bottom" />
      </div>

      {/* ── a note to finish, signed ─────────────────────────── */}
      <section ref={end} aria-labelledby="learned" className="paper text-ink" style={PAPER}>
        <DrawScope
          threshold={0.4}
          className="mx-auto grid max-w-[1400px] gap-8 px-4 pb-28 pt-24 sm:px-6 md:grid-cols-12 md:pb-36 md:pt-32"
        >
          <h2 id="learned" className="md:col-span-3">
            <Written className="-rotate-3 text-3xl text-field" delay={0.1}>
              what I’d take forward
            </Written>
          </h2>
          <div className="md:col-span-8">
            <p className="text-3xl leading-tight md:text-5xl">{c.learned}</p>
            <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
              <FigmaButton href={p.href} title={p.title} />
              <span className="relative block">
                <Written className="-rotate-3 text-6xl leading-none" delay={0.9}>
                  Essa
                </Written>
                <Mark
                  kind="underline"
                  delay={1.3}
                  duration={0.5}
                  className="absolute -bottom-3 -left-2 h-4 w-[130%] text-field"
                  width={3}
                />
              </span>
            </div>
          </div>
        </DrawScope>
      </section>

      <FloatingFigma href={p.href} title={p.title} after={top} before={end} />

      {/* ── next ─────────────────────────────────────────────── */}
      <TransitionLink
        href={`/work/${next.slug}`}
        color={next.theme.bg}
        fg={next.theme.fg}
        label={next.title}
        data-cursor="Next case"
        className="roll-host relative block px-4 pb-16 pt-24 sm:px-6"
        style={{ background: next.theme.bg, color: next.theme.fg, "--roll": next.accent } as React.CSSProperties}
      >
        <TornEdge side="top" />
        <span className="mx-auto block max-w-[1400px]">
          <span className="font-hand block -rotate-2 text-2xl" style={{ color: next.accent }}>
            next case →
          </span>
          <span className="display mt-3 block text-[clamp(4.5rem,16vw,16rem)] uppercase leading-[0.85] [--wdth:92]">
            <RollText text={next.title} />
          </span>
          <span className="mt-4 block text-xl">{next.summary}</span>
        </span>
      </TransitionLink>
    </main>
  );
}
