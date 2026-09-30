"use client";

import { useEffect, useRef, useState } from "react";
import { DrawScope, Mark, Written } from "@/components/hand/Marks";
import SketchPortrait from "@/components/hand/SketchPortrait";
import aboutSketch from "@/data/sketch-about.json";
import { site } from "@/data/site";
import { gsap } from "@/lib/gsap";

/* ── desk objects ─────────────────────────────────────────────────────── */

let topZ = 10;

/**
 * Something on the desk. On desktop it can be picked up and moved: it lifts
 * and straightens while held, then settles at a slight angle where it's put
 * down. On phones everything lies in a tidy stack and the page scrolls.
 */
function DeskItem({
  children,
  x,
  y,
  r,
  i,
  className,
  label,
}: {
  children: React.ReactNode;
  x: string;
  y: string;
  r: number;
  i: number;
  className?: string;
  label: string;
}) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current!;
    if (!matchMedia("(pointer: fine) and (min-width: 768px)").matches) return;
    const pos = { x: 0, y: 0, r };
    const apply = () => (node.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${pos.r}deg)`);
    let start: { px: number; py: number; x: number; y: number } | null = null;

    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element).closest("a, button")) return;
      start = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
      node.setPointerCapture(e.pointerId);
      node.style.zIndex = String(++topZ);
      node.dataset.held = "true";
      gsap.to(pos, { r: r * 0.25, duration: 0.3, ease: "power2.out", onUpdate: apply });
    };
    const move = (e: PointerEvent) => {
      if (!start) return;
      pos.x = start.x + e.clientX - start.px;
      pos.y = start.y + e.clientY - start.py;
      apply();
    };
    const up = () => {
      if (!start) return;
      start = null;
      delete node.dataset.held;
      // put down a little crooked, never exactly where it was
      gsap.to(pos, { r: r + (Math.random() - 0.5) * 6, duration: 0.6, ease: "elastic.out(1, 0.5)", onUpdate: apply });
    };
    apply();
    node.addEventListener("pointerdown", down);
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", up);
    node.addEventListener("pointercancel", up);
    return () => {
      node.removeEventListener("pointerdown", down);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", up);
      node.removeEventListener("pointercancel", up);
    };
  }, [r]);

  return (
    <div
      ref={el}
      aria-label={label}
      role="group"
      data-cursor="Pick up"
      className={`desk-item shrink-0 snap-center md:absolute ${className ?? ""}`}
      style={{ left: x, top: y, "--r": `${r}deg`, "--i": i, transform: `rotate(${r}deg)` } as React.CSSProperties}
    >
      <div className="desk-drop">{children}</div>
    </div>
  );
}

function Sticky({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      className="font-hand w-[210px] p-5 text-[22px] leading-[1.15] text-[#2d2a26] shadow-[0_1px_1px_rgba(0,0,0,0.08),0_14px_22px_-12px_rgba(0,0,0,0.35)]"
      style={{ background: color }}
    >
      {children}
    </div>
  );
}

function AmmanClock() {
  const [now, setNow] = useState<{ h: number; m: number; label: string } | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: site.timeZone,
    });
    const tick = () => {
      const label = fmt.format(new Date());
      const [h, m] = label.split(":").map(Number);
      setNow({ h, m, label });
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  const h = now ? ((now.h % 12) + now.m / 60) * 30 : 0;
  const m = now ? now.m * 6 : 0;
  return (
    <div className="w-[190px] rounded-[6px] bg-white p-4 shadow-[0_14px_22px_-12px_rgba(0,0,0,0.35)]">
      {/* a clock drawn by hand, telling Amman's real time */}
      <svg viewBox="0 0 120 120" className="mx-auto h-28 w-28 text-ink" aria-hidden>
        <path
          d="M60 8 C 92 7, 113 30, 112 60 C 111 92, 90 112, 59 112 C 27 111, 8 90, 9 59 C 10 30, 30 9, 62 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {[0, 1, 2, 3].map((q) => (
          <path
            key={q}
            d="M60 16 L60 24"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            transform={`rotate(${q * 90 + (q % 2 ? 2 : -1)} 60 60)`}
          />
        ))}
        <path
          d="M60 62 L60 34"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          transform={`rotate(${h} 60 60)`}
          className="transition-transform duration-700"
        />
        <path
          d="M60 62 L61 20"
          stroke="var(--color-field)"
          strokeWidth="2.6"
          strokeLinecap="round"
          transform={`rotate(${m} 60 60)`}
          className="transition-transform duration-700"
        />
        <circle cx="60" cy="60" r="3.5" fill="currentColor" />
      </svg>
      <p className="font-hand mt-2 text-center text-xl leading-tight">
        Amman, right now
        <span className="block text-base text-ink-muted tabular-nums">{now?.label ?? "--:--"}</span>
      </p>
    </div>
  );
}

function Todo() {
  const done = ["design it", "build it", "sweat the details"];
  return (
    <div className="torn relative w-[250px] bg-white px-6 pb-7 pt-6 shadow-[0_14px_22px_-12px_rgba(0,0,0,0.35)] [background-image:repeating-linear-gradient(transparent_0_31px,#dbe3f3_31px_32px)] [background-position:0_14px]">
      <p className="font-hand text-2xl leading-none text-field">to do</p>
      <ul className="font-hand mt-3 space-y-[3px] text-[22px] leading-[29px] text-ink">
        {done.map((t, i) => (
          <li key={t} className="relative flex items-center gap-2">
            <span className="relative grid h-5 w-5 shrink-0 place-items-center rounded-[4px] border-2 border-ink/70">
              <Mark
                kind="check"
                delay={0.9 + i * 0.35}
                duration={0.3}
                className="absolute -left-0.5 -top-2 h-6 w-7 text-field"
                width={3}
              />
            </span>
            <span className="relative">
              {t}
              <Mark
                kind="strike"
                delay={1.05 + i * 0.35}
                duration={0.3}
                className="absolute left-0 top-1/2 h-2 w-full text-ink/60"
                width={2}
              />
            </span>
          </li>
        ))}
        <li>
          <a href="#contact" className="todo-next group flex items-center gap-2 text-field">
            <span className="relative grid h-5 w-5 shrink-0 place-items-center rounded-[4px] border-2 border-field">
              <svg
                viewBox="0 0 40 30"
                className="todo-check absolute -left-0.5 -top-2 h-6 w-7 overflow-visible"
                aria-hidden
              >
                <path
                  d="M 4 16 L 12 26 C 18 16, 26 6, 38 2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  pathLength={1}
                />
              </svg>
            </span>
            <span className="underline decoration-wavy decoration-1 underline-offset-4">your project?</span>
          </a>
        </li>
      </ul>
    </div>
  );
}

/* ── section ──────────────────────────────────────────────────────────── */

/**
 * Essa again, turned around this time: drawn and painted the same way as in
 * the hero, once the desk scrolls into view.
 */
function Figure() {
  const el = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPlay(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el.current!);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={el}
      data-no-ink
      className="relative mx-auto aspect-[608/900] h-[60svh] max-h-[520px] md:absolute md:bottom-0 md:left-[-3%] md:mx-0 md:h-full md:max-h-none"
    >
      <SketchPortrait
        sketch={aboutSketch}
        color="/portraits/about-color.webp"
        ink="/portraits/about-ink.webp"
        alt={`${site.name}, drawn in ink and painted, from behind, glancing back over the shoulder`}
        focus={[420, 235]}
        play={play}
        className="h-full w-full"
      />
      <span className="pointer-events-none absolute left-[-2%] top-[4%] flex w-[34%] flex-col items-start md:left-[4%] md:top-[6%] md:w-[26%]">
        <Written className="-rotate-6 text-xl leading-tight text-ink-muted md:text-2xl" delay={1.8}>
          me again, thinking it through
        </Written>
        <Mark kind="arrow" delay={2.6} duration={0.45} className="ml-8 mt-1 h-10 w-12 text-ink-muted" width={3} />
      </span>
    </div>
  );
}

export default function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="paper relative overflow-hidden px-5 py-24 text-ink sm:px-8 md:py-32"
    >
      <DrawScope className="mx-auto max-w-[1400px]" threshold={0.2}>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <h2
            id="about-title"
            className="display text-[clamp(3rem,8vw,7.5rem)] leading-[0.9] tracking-[-0.03em] [--wdth:96]"
          >
            About me
          </h2>
          <Written className="-rotate-3 pb-2 text-3xl text-field" delay={0.3}>
            (the short version)
          </Written>
          <span className="ml-auto hidden items-end gap-1 pb-2 md:flex">
            <Written className="rotate-2 text-xl text-ink-muted" delay={0.9}>
              everything on this desk moves
            </Written>
            <Mark kind="arrow" delay={1.4} duration={0.45} className="h-12 w-14 text-ink-muted" width={3} />
          </span>
        </div>

        {/* the desk */}
        <div className="desk relative mt-10 md:h-[780px]">
          <Figure />

          {/* phones: a row of cards to swipe through; desktop: loose on the desk */}
          <div className="desk-row -mx-5 mt-2 flex snap-x snap-mandatory items-center gap-7 overflow-x-auto px-8 pb-8 pt-6 sm:-mx-8 md:contents">
            <DeskItem x="40%" y="0%" r={2} i={0} label="Index card">
              <div className="w-[min(420px,80vw)] bg-[#fdfcf8] px-7 pb-7 pt-5 shadow-[0_14px_26px_-14px_rgba(0,0,0,0.4)] [background-image:linear-gradient(#e8a0a0,#e8a0a0),repeating-linear-gradient(transparent_0_29px,#cfdcf0_29px_30px)] [background-position:0_52px,0_52px] [background-repeat:no-repeat,repeat] [background-size:100%_1.5px,100%_100%]">
                <p className="font-hand text-3xl leading-[52px] text-field">Essa Adarbeh</p>
                <p className="mt-1 text-[17px] leading-[30px]">
                  I’m a designer who codes, or a developer who designs, depending on the day. I live in Amman, Jordan. I
                  like interfaces that feel obvious, and code that stays that way.
                </p>
              </div>
            </DeskItem>

            <DeskItem x="73%" y="2%" r={5} i={1} label="Note">
              <Sticky color="#fde68a">Designer and developer in one person. Nothing gets lost in handoff.</Sticky>
            </DeskItem>

            <DeskItem x="84%" y="22%" r={-6} i={2} label="Note">
              <Sticky color="#bfdbfe">AI in the loop. A human at the wheel.</Sticky>
            </DeskItem>

            <DeskItem x="39%" y="47%" r={-3} i={3} label="Clock">
              <AmmanClock />
            </DeskItem>

            <DeskItem x="55%" y="41%" r={3} i={4} label="To-do list">
              <Todo />
            </DeskItem>

            <DeskItem x="73%" y="50%" r={-2} i={5} label="Note">
              <Sticky color="#fbcfe8">Taste, judgment and care stay mine.</Sticky>
            </DeskItem>

            <DeskItem x="84%" y="71%" r={4} i={6} label="Note">
              <Sticky color="#bbf7d0">I designed and built this whole site. It’s its own case study.</Sticky>
            </DeskItem>

            <DeskItem x="41%" y="88%" r={1} i={7} label="Label">
              <p className="label-tape">OPEN TO FULL-TIME + FREELANCE</p>
            </DeskItem>
          </div>
          <p className="flex items-center justify-center gap-2 md:hidden">
            <Written className="text-xl text-ink-muted" delay={1.2}>
              swipe, there’s more on the desk
            </Written>
            <Mark kind="squiggle" delay={2.3} duration={0.5} className="h-3 w-10 text-ink-muted" width={5} />
          </p>
        </div>
      </DrawScope>
    </section>
  );
}
