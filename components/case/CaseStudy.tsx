"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import CompareSlider from "@/components/CompareSlider";
import RollText from "@/components/RollText";
import TransitionLink from "@/components/TransitionLink";
import FlowDiagram from "@/components/case/FlowDiagram";
import LumenOverview from "@/components/case/LumenOverview";
import AtlasPanel from "@/components/case/AtlasPanel";
import LumenDemo from "@/components/demos/LumenDemo";
import AtlasDemo from "@/components/demos/AtlasDemo";
import { cases } from "@/data/cases";
import { projects } from "@/data/projects";
import { gsap, SplitText, useGSAP, INTRO_DONE } from "@/lib/gsap";

function Heading({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="display text-[clamp(2.6rem,6.5vw,6rem)] uppercase [--wdth:110]">
      {children}
    </h2>
  );
}

export default function CaseStudy({ slug }: { slug: "lumen" | "atlas" }) {
  const root = useRef<HTMLElement>(null);
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
      {/* ── hero ─────────────────────────────────────────────── */}
      <header className="mx-auto max-w-[1400px] px-4 pb-14 pt-28 sm:px-6 md:pb-20 md:pt-36">
        <TransitionLink
          href="/#work"
          color="#0b1238"
          label="Work"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ring-1 ring-current/25 transition-colors hover:bg-current/10"
        >
          <svg aria-hidden width="14" height="14" viewBox="0 0 14 14">
            <path d="M11 7H3M6.5 3.5 3 7l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          All work
        </TransitionLink>

        <h1 className="case-title display mt-8 text-[clamp(5rem,19vw,19rem)] uppercase leading-[0.8] [--wdth:92]">
          {p.title}
        </h1>
        <div className="mt-8 grid gap-10 md:grid-cols-12">
          <p className="text-2xl leading-snug md:col-span-7 md:text-3xl">{c.lede}</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 self-end text-sm md:col-span-4 md:col-start-9">
            {[
              ["Role", p.role],
              ["Year", p.year],
              ["Scope", p.facts.join(", ")],
              ["Tools", p.tools],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[var(--muted)]">{k}</dt>
                <dd className="mt-1 font-medium leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
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

      {/* ── brief + approach ─────────────────────────────────── */}
      <section
        aria-labelledby="brief"
        className="mx-auto grid max-w-[1400px] gap-10 px-4 py-24 sm:px-6 md:grid-cols-12 md:py-36"
      >
        <div className="md:col-span-4">
          <Heading id="brief">The brief</Heading>
        </div>
        <div className="space-y-6 text-xl leading-relaxed md:col-span-7 md:col-start-6">
          {c.brief.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
        <ul className="grid gap-4 md:col-span-12 md:mt-10 md:grid-cols-3">
          {c.approach.map((a) => (
            <li key={a.title} className="rounded-[20px] bg-current/[0.06] p-6 ring-1 ring-current/10 md:p-8">
              <span aria-hidden className="block h-1 w-10 rounded-full bg-[var(--accent)]" />
              <h3 className="mt-5 text-xl font-medium">{a.title}</h3>
              <p className="mt-3 leading-relaxed text-[var(--muted)]">{a.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── flow ─────────────────────────────────────────────── */}
      <section aria-labelledby="flow" className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6 md:pb-36">
        <div className="mb-12 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <Heading id="flow">{c.flow.title}</Heading>
          </div>
          <p className="self-end text-lg leading-snug text-[var(--muted)] md:col-span-4 md:col-start-9">
            {c.flow.intro}
          </p>
        </div>
        <FlowDiagram flow={c.flow} accent={p.accent} />
      </section>

      {/* ── compare ──────────────────────────────────────────── */}
      <section aria-labelledby="compare" className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6 md:pb-36">
        <div className="mb-10 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <Heading id="compare">{c.compare.title}</Heading>
          </div>
          <p className="self-end text-lg leading-snug text-[var(--muted)] md:col-span-4 md:col-start-9">
            {c.compare.intro}
          </p>
        </div>
        <CompareSlider
          label={`Compare ${c.compare.left.toLowerCase()} and ${c.compare.right.toLowerCase()}`}
          leftName={c.compare.left.toLowerCase()}
          className="h-[520px] rounded-[24px] ring-1 ring-current/15 md:h-[600px]"
          handleClassName="bg-[var(--accent)]"
          left={compare.left}
          right={compare.right}
        />
      </section>

      {/* ── system ───────────────────────────────────────────── */}
      <section aria-labelledby="system" className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6 md:pb-36">
        <Heading id="system">The system</Heading>
        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] bg-current/15 md:grid-cols-4">
          {c.stats.map((s) => (
            <div key={s.label} className="bg-[var(--bg)] p-6 md:p-8">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span
                  className="case-stat display block text-[clamp(3rem,7vw,6rem)] tabular-nums [--wdth:80]"
                  data-value={s.value}
                >
                  {s.value}
                </span>
                <span className="mt-2 block text-[var(--muted)]">{s.label}</span>
              </dd>
            </div>
          ))}
        </dl>

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

      {/* ── demo ─────────────────────────────────────────────── */}
      <section aria-labelledby="try" className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6 md:pb-36">
        <div className="mb-10 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <Heading id="try">Try it</Heading>
          </div>
          <p className="self-end text-lg leading-snug text-[var(--muted)] md:col-span-4 md:col-start-9">
            {c.demoIntro}
          </p>
        </div>
        {slug === "lumen" ? <LumenDemo /> : <AtlasDemo />}
      </section>

      {/* ── reflection ───────────────────────────────────────── */}
      <section
        aria-labelledby="learned"
        className="mx-auto grid max-w-[1400px] gap-8 px-4 pb-24 sm:px-6 md:grid-cols-12 md:pb-36"
      >
        <h2 id="learned" className="text-sm text-[var(--muted)] md:col-span-3">
          What I’d take forward
        </h2>
        <p className="text-3xl leading-tight md:col-span-8 md:text-5xl">{c.learned}</p>
        <div className="md:col-span-9 md:col-start-4">
          <a
            href={p.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-[var(--fg)] px-6 py-3.5 font-medium text-[var(--bg)] transition-transform hover:scale-[1.03]"
          >
            Open the {p.title} file in Figma
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </section>

      {/* ── next ─────────────────────────────────────────────── */}
      <TransitionLink
        href={`/work/${next.slug}`}
        color={next.theme.bg}
        fg={next.theme.fg}
        label={next.title}
        data-cursor="Next case"
        className="roll-host block px-4 pb-16 pt-20 sm:px-6"
        style={{ background: next.theme.bg, color: next.theme.fg, "--roll": next.accent } as React.CSSProperties}
      >
        <span className="mx-auto block max-w-[1400px]">
          <span className="block text-sm opacity-70">Next case study</span>
          <span className="display mt-3 block text-[clamp(4.5rem,16vw,16rem)] uppercase leading-[0.85] [--wdth:92]">
            <RollText text={next.title} />
          </span>
          <span className="mt-4 block text-xl">{next.summary}</span>
        </span>
      </TransitionLink>
    </main>
  );
}
