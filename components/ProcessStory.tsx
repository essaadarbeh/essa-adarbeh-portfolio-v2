"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Mark } from "@/components/hand/Marks";
import { process } from "@/data/skills";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

const NOTES = [
  { text: "Who is getting in touch, and why now?", rot: -6, x: "8%", y: "10%", color: "#fde68a" },
  { text: "What do they need to decide before they write?", rot: 4, x: "56%", y: "6%", color: "#bfdbfe" },
  { text: "What happens after they press send?", rot: -3, x: "58%", y: "58%", color: "#fbcfe8" },
  { text: "One screen. No account.", rot: 5, x: "6%", y: "62%", color: "#bbf7d0" },
];

const CODE = [
  `<Card>`,
  `  <Person avatar={essa} note="Replies within a day" />`,
  `  <Title>What are we building?</Title>`,
  `  <Segmented`,
  `    options={["Website", "Product UI", "Design system"]}`,
  `    value={type} onChange={setType}`,
  `  />`,
  `  <Button onClick={send}>Start the conversation</Button>`,
  `</Card>`,
];

/**
 * The four steps as one pinned scene: the same contact card grows up while
 * you scroll, from questions on sticky notes, to a redlined wireframe, to code
 * writing itself, to the finished, working component.
 */
export default function ProcessStory() {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        trigger.current = ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "+=300%",
          pin: true,
          anticipatePin: 1,
          snap: {
            snapTo: [0, 1 / 3, 2 / 3, 1],
            directional: false,
            duration: { min: 0.25, max: 0.6 },
            delay: 0.08,
            ease: "power2.inOut",
          },
          onUpdate: (self) => {
            const i = Math.min(3, Math.floor(self.progress * 4));
            setStep((s) => (s === i ? s : i));
            if (fill.current) fill.current.style.transform = `scaleX(${self.progress})`;
          },
        });
        return () => {
          trigger.current = null;
        };
      });
    },
    { scope: root },
  );

  const go = (i: number) => {
    const st = trigger.current;
    if (!st) return setStep(i);
    window.scrollTo({ top: st.start + (st.end - st.start) * (i / 3) + 2, behavior: "smooth" });
  };

  const layer = (i: number) => (i === step ? "on" : i < step ? "past" : "next");

  return (
    <div
      ref={root}
      className="process-story paper-md relative bg-chalk flex min-h-[100svh] flex-col justify-center pb-4 pt-16 text-ink md:py-20"
    >
      <div className="mx-auto grid w-full max-w-[1400px] gap-8 px-4 sm:px-6 md:grid-cols-12 md:items-center md:gap-10">
        {/* steps */}
        <div className="order-2 md:order-1 md:col-span-4">
          <p className="hidden text-sm text-ink-muted md:block">How a project moves</p>
          <ol className="mt-3 space-y-1 md:mt-5 md:space-y-2">
            {process.map((s, i) => (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === step ? "step" : undefined}
                  className="group w-full rounded-[18px] px-4 py-2 text-left md:py-3"
                >
                  <span className="flex items-baseline gap-4">
                    <span
                      className={`display text-3xl tabular-nums [--wdth:60] transition-colors duration-500 ${i === step ? "text-field" : "text-ink/35"}`}
                    >
                      {i + 1}
                    </span>
                    {/* the pen circles where we are, and ticks off what's done */}
                    <span className="relative text-xl font-medium">
                      {s.title}
                      {i === step && (
                        <Mark
                          key={`c${step}`}
                          now
                          kind="circle"
                          duration={0.6}
                          className="absolute -left-4 -top-2.5 h-[calc(100%+1.25rem)] w-[calc(100%+2rem)] text-field"
                        />
                      )}
                      {i < step && (
                        <Mark
                          key={`t${i}`}
                          now
                          kind="check"
                          duration={0.3}
                          className="absolute -right-10 top-0 h-6 w-8 text-field"
                          width={3}
                        />
                      )}
                    </span>
                  </span>
                  <span
                    className={`grid transition-[grid-template-rows,opacity] duration-500 ${
                      i === step ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <span className="overflow-hidden">
                      <span className="block pb-1 pl-[3.1rem] pt-2 text-[15px] leading-relaxed text-ink-muted md:pt-3 md:text-base">
                        {s.text}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <span aria-hidden className="mt-6 block h-1 overflow-hidden rounded-full bg-ink/10">
            <span ref={fill} className="block h-full origin-left scale-x-0 rounded-full bg-field" />
          </span>
        </div>

        {/* stage */}
        <div
          data-step={step}
          className="stage relative order-1 h-[38svh] min-h-[280px] overflow-hidden rounded-[28px] ring-1 ring-ink/10 md:order-2 md:col-span-8 md:h-[70svh]"
        >
          {/* 1 · understand */}
          <div data-layer={layer(0)} className="stage-layer absolute inset-0 bg-[#f4efe6]">
            {NOTES.map((n) => (
              <p
                key={n.text}
                className="note absolute w-[40%] max-w-[240px] p-4 text-[15px] leading-snug text-[#3b3325] shadow-[0_10px_20px_-10px_rgba(0,0,0,0.35)] sm:text-lg"
                style={{ left: n.x, top: n.y, background: n.color, "--rot": `${n.rot}deg` } as React.CSSProperties}
              >
                {n.text}
              </p>
            ))}
            <svg
              aria-hidden
              viewBox="0 0 200 140"
              className="absolute left-1/2 top-1/2 w-[34%] -translate-x-1/2 -translate-y-1/2 text-[#3b3325]/70"
            >
              <path
                className="sketch"
                d="M12 14 Q100 6 188 12 Q194 70 186 128 Q100 134 14 126 Q6 70 12 14Z M28 30 h40 M28 44 h110 M28 70 h30 M70 70 h30 M112 70 h30 M28 100 h144 v16 h-144z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* 2 · design */}
          <div
            data-layer={layer(1)}
            className="stage-layer absolute inset-0 grid place-items-center bg-[#e7e9f1] [background-image:radial-gradient(#b9bdd0_1px,transparent_1px)] [background-size:18px_18px]"
          >
            <div className="relative w-[min(380px,82%)] rounded-[24px] border-2 border-dashed border-[#8b91ad] bg-white/70 p-6">
              <span className="absolute -top-6 left-0 rounded-[5px] bg-signal px-1.5 py-0.5 text-[11px] font-medium">
                Card, 420 wide, padding 28
              </span>
              <div className="flex items-center gap-3">
                <span className="h-11 w-11 rounded-full bg-[#cfd3e3]" />
                <span className="space-y-1.5">
                  <span className="block h-3 w-28 rounded bg-[#cfd3e3]" />
                  <span className="block h-2.5 w-40 rounded bg-[#e0e3ee]" />
                </span>
              </div>
              <span className="mt-6 block h-6 w-3/4 rounded bg-[#cfd3e3]" />
              <span className="mt-2 block h-6 w-1/2 rounded bg-[#cfd3e3]" />
              <span className="mt-5 grid grid-cols-3 gap-1 rounded-[12px] bg-[#eef0f6] p-1">
                <span className="h-8 rounded-[9px] bg-[#e0e3ee]" />
                <span className="h-8 rounded-[9px] bg-white shadow-sm" />
                <span className="h-8 rounded-[9px] bg-[#e0e3ee]" />
              </span>
              <span className="mt-6 block h-12 rounded-[14px] bg-[#9aa0bd]" />
              <span className="absolute -right-3 bottom-4 rounded-[5px] bg-signal px-1.5 py-0.5 text-[11px] font-medium">
                Primary, 52 high
              </span>
            </div>
          </div>

          {/* 3 · build */}
          <div
            data-layer={layer(2)}
            className="stage-layer absolute inset-0 grid bg-[#0d1117] md:grid-cols-[1.1fr_1fr]"
          >
            <pre className="overflow-hidden p-5 font-mono text-[12px] leading-6 text-[#c9d1d9] sm:text-[13px] md:p-8">
              {CODE.map((line, i) => (
                <span key={i} className="code-line block whitespace-pre" style={{ "--i": i } as React.CSSProperties}>
                  <span className="mr-4 select-none text-[#484f58]">{String(i + 1).padStart(2, " ")}</span>
                  {line
                    .replace(/(<\/?\w+|\/>|>)/g, "\u0000$1\u0000")
                    .split("\u0000")
                    .map((part, k) =>
                      /^(<\/?\w+|\/>|>)$/.test(part) ? (
                        <span key={k} className="text-[#7ee787]">
                          {part}
                        </span>
                      ) : /"[^"]*"/.test(part) ? (
                        <span key={k}>
                          {part.split(/("[^"]*")/).map((x, j) =>
                            x.startsWith('"') ? (
                              <span key={j} className="text-[#a5d6ff]">
                                {x}
                              </span>
                            ) : (
                              <span key={j}>{x}</span>
                            ),
                          )}
                        </span>
                      ) : (
                        <span key={k}>{part}</span>
                      ),
                    )}
                </span>
              ))}
              <span className="caret inline-block h-4 w-2 translate-y-0.5 bg-[#c9d1d9]" />
            </pre>
            <div className="hidden place-items-center bg-[#161b22] md:grid">
              <div className="w-[82%] rounded-[20px] bg-white p-5 text-ink">
                <div className="flex items-center gap-3">
                  <span className="relative h-10 w-10 overflow-hidden rounded-full bg-field">
                    <Image src="/portraits/avatar.webp" alt="" fill sizes="40px" className="object-cover" />
                  </span>
                  <span className="text-sm font-medium">Essa Adarbeh</span>
                </div>
                <p className="mt-4 text-lg font-semibold">What are we building?</p>
                <span className="mt-4 block h-11 rounded-[12px] border-2 border-dashed border-ink/20" />
              </div>
            </div>
          </div>

          {/* 4 · polish */}
          <div
            data-layer={layer(3)}
            className="stage-layer absolute inset-0 grid place-items-center bg-[radial-gradient(90%_70%_at_70%_30%,#ffffff_0%,color-mix(in_oklab,var(--color-field)_16%,white)_100%)]"
          >
            <div className="polish-card w-[min(400px,84%)] rounded-[24px] bg-white p-6 text-ink shadow-[0_30px_60px_-30px_rgba(11,18,56,0.4)] sm:p-7">
              <div className="flex items-center gap-3">
                <span className="relative h-12 w-12 overflow-hidden rounded-full bg-field">
                  <Image src="/portraits/avatar.webp" alt="" fill sizes="48px" className="object-cover" />
                </span>
                <span>
                  <span className="block font-medium leading-tight">Essa Adarbeh</span>
                  <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                    Usually replies within a day
                  </span>
                </span>
              </div>
              <p className="display mt-6 text-[28px] leading-[1.05] [--wdth:112]">What are we building?</p>
              <button
                type="button"
                tabIndex={step === 3 ? 0 : -1}
                onClick={() => setSent(true)}
                className="shine relative mt-6 flex h-[52px] w-full items-center justify-center overflow-hidden rounded-[14px] bg-field font-medium text-chalk transition-transform active:scale-[0.98]"
              >
                {sent ? "Sent. Talk soon." : "Start the conversation"}
              </button>
            </div>
          </div>

          <p className="absolute left-4 top-4 z-10 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-chalk">
            {process[step].title}
          </p>
        </div>
      </div>
    </div>
  );
}
