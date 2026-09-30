"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * What's on my mind: hover the hero portrait and the top of the head lifts
 * like a lid, hinged at the back, and my train of thought rises out of it,
 * in the order I actually work: a question, a sketch, the Figma frame, the
 * code, and "ship it". A pen line strings them together. Move away and the
 * thoughts sink back in and the lid closes. On touch, a tap opens and closes.
 *
 * Everything here is positioned in the painting's own 425×900 units and
 * animated with transforms and opacity only, on its own layers, so opening
 * the head never repaints the portrait.
 */

const W = 425,
  H = 900;
const px = (x: number) => `${(x / W) * 100}%`;
const py = (y: number) => `${(y / H) * 100}%`;

// the cut, from the front hairline to the back of the head (a cubic)
const CUT = [
  [98, 114],
  [190, 90],
  [340, 120],
  [405, 212],
] as const;
const bez = (t: number, i: 0 | 1) =>
  (1 - t) ** 3 * CUT[0][i] + 3 * (1 - t) ** 2 * t * CUT[1][i] + 3 * (1 - t) * t ** 2 * CUT[2][i] + t ** 3 * CUT[3][i];
const cutPts = Array.from({ length: 13 }, (_, k) => [bez(k / 12, 0), bez(k / 12, 1)]);
/** Everything above the cut: the lid, and the hole it leaves. */
const LID = `polygon(${[...cutPts, [470, 212], [470, -60], [30, -60], [30, 114]]
  .map(([x, y]) => `${px(x)} ${py(y)}`)
  .join(", ")})`;
const PIVOT = `${px(405)} ${py(212)}`;
/** Where the thoughts come out. */
const MOUTH = [230, 104];

type Spot = { x: number; y: number; w: number; r: number };
/** Desktop: the thoughts hang in the space between the headline and the face. */
const WIDE: Spot[] = [
  { x: -62, y: 128, w: 27, r: -6 },
  { x: -236, y: 150, w: 27, r: 4 },
  { x: -104, y: 272, w: 36, r: -3 },
  { x: -40, y: 470, w: 29, r: 4 },
  { x: -200, y: 482, w: 26, r: -6 },
];
const WIDE_TRAIN =
  "M230 104 C 160 30, 30 60, -62 128 S -210 100, -236 150 S -130 220, -104 272 S -30 400, -40 470 S -150 520, -200 482";
/** Phones: they tumble down over the suit, below the headline. */
const NARROW: Spot[] = [
  { x: -118, y: 330, w: 46, r: -6 },
  { x: 130, y: 466, w: 44, r: 5 },
  { x: -96, y: 566, w: 54, r: -3 },
  { x: 150, y: 690, w: 48, r: 4 },
  { x: -92, y: 770, w: 42, r: -6 },
];
const NARROW_TRAIN =
  "M230 104 C 120 50, 10 110, -50 200 S -130 290, -118 330 S 120 400, 130 466 S -90 500, -96 566 S 150 620, 150 690 S -30 750, -92 770";

export default function OpenMind({
  host,
  color,
  ready,
  hide,
}: {
  host: React.RefObject<HTMLElement | null>;
  /** The painting, for the lid. */
  color: string;
  /** Only once the portrait has finished drawing. */
  ready: boolean;
  /** Things to tuck away while the head is open (they sit where the thoughts go). */
  hide?: React.RefObject<HTMLElement | null>[];
}) {
  const root = useRef<HTMLDivElement>(null);
  const lid = useRef<HTMLDivElement>(null);
  const hole = useRef<HTMLDivElement>(null);
  const rim = useRef<SVGSVGElement>(null);
  const train = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = host.current;
    const ui = root.current;
    if (!el || !ui || !ready) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const thoughts = gsap.utils.toArray<HTMLElement>(".om-thought", ui);
    const tucked = (hide ?? []).map((r) => r.current).filter(Boolean) as HTMLElement[];
    let tl: gsap.core.Timeline | null = null;

    const build = () => {
      tl?.kill();
      const r = el.getBoundingClientRect();
      const unit = r.width / W;
      const narrow = matchMedia("(max-width: 767px)").matches;
      const spots = narrow ? NARROW : WIDE;
      train.current!.setAttribute("d", narrow ? NARROW_TRAIN : WIDE_TRAIN);
      thoughts.forEach((t, i) => {
        Object.assign(t.style, { left: px(spots[i].x), top: py(spots[i].y), width: `${spots[i].w}%` });
        // centred on its spot (through GSAP, so it composes with the tween)
        gsap.set(t, { xPercent: -50, yPercent: -50 });
      });
      gsap.set([hole.current, rim.current, lid.current, ...thoughts], { autoAlpha: 0 });
      gsap.set(lid.current, { rotation: 0, x: 0, y: 0 });
      tl = gsap.timeline({ paused: true });
      tl.to([hole.current, rim.current, lid.current], { autoAlpha: 1, duration: 0.01 }, 0)
        .to(
          lid.current,
          { rotation: 13, x: 6 * unit, y: -40 * unit, duration: reduced ? 0.01 : 0.6, ease: "back.out(1.5)" },
          0.02,
        )
        .fromTo(
          train.current,
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: reduced ? 0.01 : 1.6, ease: "none" },
          0.3,
        );
      if (tucked.length) tl.to(tucked, { autoAlpha: 0, duration: 0.25 }, 0);
      thoughts.forEach((t, i) => {
        const s = spots[i];
        tl!.fromTo(
          t,
          { x: (MOUTH[0] - s.x) * unit, y: (MOUTH[1] - s.y) * unit, scale: 0.15, rotation: -30, autoAlpha: 0 },
          {
            x: 0,
            y: 0,
            scale: 1,
            rotation: s.r,
            autoAlpha: 1,
            duration: reduced ? 0.01 : 0.75,
            ease: "back.out(1.3)",
          },
          reduced ? 0.02 : 0.28 + i * 0.3,
        );
      });
    };
    let open = false;
    let timer = 0;
    const show = () => {
      window.clearTimeout(timer);
      if (open) return;
      // measure fresh each time it opens from shut (scrolling and parallax move things)
      if (!tl || tl.progress() === 0) build();
      open = true;
      ui.dataset.open = "true";
      tl!.timeScale(1).play();
    };
    const close = () => {
      if (!open) return;
      open = false;
      ui.dataset.open = "false";
      tl!.timeScale(2.2).reverse();
    };
    const later = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(close, 380);
    };
    const toggle = () => (open ? close() : show());
    const fine = matchMedia("(pointer: fine)").matches;
    if (fine) {
      el.addEventListener("pointerenter", show);
      el.addEventListener("pointerleave", later);
    } else el.addEventListener("click", toggle);
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener("pointerenter", show);
      el.removeEventListener("pointerleave", later);
      el.removeEventListener("click", toggle);
      tl?.kill();
    };
  }, [host, ready, hide]);

  return (
    <div ref={root} data-open="false" className="om absolute inset-0 z-10 [container-type:inline-size]">
      {/* inside the head, where the lid was: dark, with a light on */}
      <div
        ref={hole}
        aria-hidden
        className="pointer-events-none invisible absolute inset-0 opacity-0"
        style={{
          clipPath: LID,
          background: `radial-gradient(38% 16% at ${px(MOUTH[0])} ${py(MOUTH[1] + 30)}, #5b68ff 0%, #2433c9 30%, #121a5a 62%, #070b24 100%)`,
          maskImage: `url(${color})`,
          WebkitMaskImage: `url(${color})`,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
        }}
      />

      {/* the opening, drawn in pen, and the train of thought coming out of it */}
      <svg
        ref={rim}
        aria-hidden
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="pointer-events-none invisible absolute inset-0 h-full w-full overflow-visible opacity-0"
      >
        <path
          d="M98 114 C 190 90, 340 120, 405 212"
          fill="none"
          stroke="#0b1238"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          ref={train}
          d={WIDE_TRAIN}
          fill="none"
          stroke="var(--color-field)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="1"
          strokeDashoffset="1"
          pathLength={1}
        />
      </svg>

      {/* the lid: the top of the head, hinged at the back */}
      <div
        ref={lid}
        aria-hidden
        className="pointer-events-none invisible absolute inset-0 opacity-0 drop-shadow-[0_10px_10px_rgba(11,18,56,0.28)]"
        style={{ transformOrigin: PIVOT }}
      >
        <div className="absolute inset-0" style={{ clipPath: LID }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={color} alt="" className="h-full w-full object-contain object-bottom" />
        </div>
        {/* its cut edge, inked */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <path
            d="M98 114 C 190 90, 340 120, 405 212"
            fill="none"
            stroke="#0b1238"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* the thoughts, in the order I work */}
      <Thought i={0} n="1">
        <div className="font-hand bg-[#fde68a] px-[9%] py-[8%] text-[4.4cqw] leading-[1.1] text-[#3b3325] shadow-[0_8px_16px_-8px_rgba(0,0,0,0.45)]">
          who is this for, and what do they need?
        </div>
      </Thought>

      <Thought i={1} n="2">
        <div className="rounded-[6%] bg-white p-[7%] shadow-[0_8px_18px_-8px_rgba(0,0,0,0.4)]">
          <svg
            viewBox="0 0 100 70"
            className="block w-full"
            fill="none"
            stroke="#2b3bff"
            strokeWidth="2.6"
            strokeLinecap="round"
          >
            <path
              d="M6 8 C 30 6, 60 9, 94 7 C 95 25, 93 50, 95 64 C 60 66, 30 63, 5 65 C 4 45, 6 25, 6 8"
              strokeWidth="2"
            />
            <circle cx="18" cy="20" r="6" />
            <path d="M30 17 h 34 M30 25 h 22 M12 38 h 70 M12 46 h 50" />
            <path d="M12 56 C 30 55, 50 57, 70 55" strokeWidth="6" />
          </svg>
          <p className="font-hand mt-[3%] text-center text-[3.6cqw] leading-none text-[#2b3bff]">a quick sketch</p>
        </div>
      </Thought>

      <Thought i={2} n="3">
        <div className="relative pt-[9%]">
          <span className="absolute left-0 top-0 font-sans text-[2.8cqw] font-medium text-[#0d99ff]">
            # Contact card
          </span>
          <div className="relative border-[1.5px] border-[#0d99ff] bg-white p-[8%] shadow-[0_8px_18px_-8px_rgba(0,0,0,0.35)]">
            {[
              "-left-[4px] -top-[4px]",
              "-right-[4px] -top-[4px]",
              "-left-[4px] -bottom-[4px]",
              "-right-[4px] -bottom-[4px]",
            ].map((p) => (
              <span key={p} className={`absolute ${p} h-[7px] w-[7px] border-[1.5px] border-[#0d99ff] bg-white`} />
            ))}
            <div className="flex items-center gap-[6%]">
              <span className="aspect-square w-[18%] rounded-full bg-field" />
              <span className="flex-1 space-y-[6%]">
                <span className="block h-[0.9cqw] w-[80%] rounded bg-ink/70" />
                <span className="block h-[0.9cqw] w-[55%] rounded bg-ink/30" />
              </span>
            </div>
            <p className="display mt-[8%] text-[3.3cqw] leading-[1.05] text-ink [--wdth:100]">What are we building?</p>
            <span className="mt-[8%] block rounded-[4px] bg-field py-[4%] text-center text-[2.8cqw] font-medium text-white">
              Start the conversation
            </span>
          </div>
          <MiniCursor color="#9747ff" label="Designer" className="right-[-8%] top-[26%]" />
          <MiniCursor color="#14ae5c" label="Developer" className="bottom-[-14%] left-[20%]" />
        </div>
      </Thought>

      <Thought i={3} n="4">
        <div className="rounded-[8px] bg-[#0d1117] px-[8%] py-[7%] font-mono text-[3.5cqw] leading-[1.5] text-[#c9d1d9] shadow-[0_10px_20px_-10px_rgba(0,0,0,0.6)]">
          <span className="text-[#7ee787]">&lt;Card</span>
          <br />
          &nbsp;&nbsp;onSend=<span className="text-[#a5d6ff]">{"{ship}"}</span>
          <br />
          <span className="text-[#7ee787]">/&gt;</span>
        </div>
      </Thought>

      <Thought i={4} n="5">
        <svg viewBox="-6 -6 132 52" className="block w-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.3)]">
          <rect
            x="0"
            y="0"
            width="120"
            height="40"
            rx="20"
            fill="#14ae5c"
            stroke="#fff"
            strokeWidth="6"
            style={{ paintOrder: "stroke" }}
          />
          <text
            x="60"
            y="27"
            textAnchor="middle"
            fill="#fff"
            fontSize="19"
            fontWeight="800"
            fontFamily="system-ui, sans-serif"
          >
            ship it ✓
          </text>
        </svg>
      </Thought>
    </div>
  );
}

function Thought({ n, children }: { i: number; n: string; children: React.ReactNode }) {
  return (
    <div className="om-thought invisible absolute opacity-0">
      <span className="font-hand absolute -left-[12%] -top-[14%] text-[5cqw] leading-none text-field">{n}</span>
      {children}
    </div>
  );
}

function MiniCursor({ color, label, className }: { color: string; label: string; className: string }) {
  return (
    <span className={`absolute flex flex-col items-start ${className}`}>
      <svg viewBox="0 0 20 22" className="w-[4cqw] drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
        <path
          d="M2 1.5 L2 17.5 L6.4 13.4 L9.4 20.2 L12.4 18.9 L9.5 12.3 L15.5 12.1 Z"
          fill={color}
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="-mt-[0.5cqw] ml-[2.6cqw] whitespace-nowrap rounded-[3px] rounded-tl-none px-[1cqw] py-[0.3cqw] font-sans text-[2.6cqw] font-medium text-white"
        style={{ background: color }}
      >
        {label}
      </span>
    </span>
  );
}
