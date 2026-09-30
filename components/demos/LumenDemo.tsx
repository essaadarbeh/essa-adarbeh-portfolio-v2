"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { IconMore, IconTrendDown, IconTrendUp } from "./icons";

// Values below come from the Lumen design file (Foundations + Stat Card):
// neutral/0 #FFFFFF, neutral/50 #F8FAFC, neutral/200 #E2E8F0, neutral/500
// #64748B, neutral/600 #475569, neutral/900 #0F172A, success/50 #ECFDF5,
// success/700 #047857, danger/50 #FEF2F2, danger/700 #B91C1C; card padding
// 20/18, gap 10, radius/xl 12, Metric/XL 32/40 at -2%.

const BRANDS = [
  { id: "indigo", name: "Indigo", c600: "#4f46e5", c50: "#eef2ff" },
  { id: "teal", name: "Teal", c600: "#0d9488", c50: "#f0fdfa" },
  { id: "rose", name: "Rose", c600: "#e11d48", c50: "#fff1f2" },
  { id: "amber", name: "Amber", c600: "#b45309", c50: "#fffbeb" },
] as const;

const RANGES = [
  { id: "7d", days: 7 },
  { id: "30d", days: 30 },
  { id: "90d", days: 90 },
] as const;
type RangeId = (typeof RANGES)[number]["id"];

type Metric = {
  label: string;
  format: (n: number) => string;
  value: Record<RangeId, number>;
  delta: Record<RangeId, number>;
  seed: number;
};

const METRICS: Metric[] = [
  {
    label: "Monthly active users",
    format: (n) => Math.round(n).toLocaleString("en-US"),
    value: { "7d": 61204, "30d": 248910, "90d": 702118 },
    delta: { "7d": 4.2, "30d": 12.4, "90d": 28.9 },
    seed: 11,
  },
  {
    label: "Activation rate",
    format: (n) => `${n.toFixed(1)}%`,
    value: { "7d": 44.8, "30d": 46.2, "90d": 43.5 },
    delta: { "7d": 1.2, "30d": 3.1, "90d": -0.8 },
    seed: 23,
  },
  {
    label: "Weekly retention",
    format: (n) => `${n.toFixed(1)}%`,
    value: { "7d": 70.3, "30d": 68.9, "90d": 66.1 },
    delta: { "7d": 0.6, "30d": -1.8, "90d": -3.4 },
    seed: 37,
  },
];

const POINTS = 14;

/** Deterministic wiggly series (0–1) that trends with the delta's sign. */
function series(seed: number, delta: number) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const slope = Math.max(-0.6, Math.min(0.6, delta / 20));
  return Array.from({ length: POINTS }, (_, i) => {
    const t = i / (POINTS - 1);
    return Math.min(0.95, Math.max(0.05, 0.5 + slope * (t - 0.5) + (rand() - 0.5) * 0.28));
  });
}

const W = 260;
const H = 44;
const toPath = (pts: number[]) =>
  pts.map((v, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * W).toFixed(1)},${((1 - v) * H).toFixed(1)}`).join("");

type Tokens = { brand: (typeof BRANDS)[number]; radius: number; compact: boolean };

function StatCard({ metric, range, tokens }: { metric: Metric; range: RangeId; tokens: Tokens }) {
  const value = metric.value[range];
  const delta = metric.delta[range];
  const days = RANGES.find((r) => r.id === range)!.days;
  const target = useMemo(() => series(metric.seed + days, delta), [metric.seed, days, delta]);

  const valueEl = useRef<HTMLParagraphElement>(null);
  const line = useRef<SVGPathElement>(null);
  const area = useRef<SVGPathElement>(null);
  const shown = useRef({ value, pts: target });
  const [hover, setHover] = useState<number | null>(null);

  // count the number and morph the sparkline to the new range
  useEffect(() => {
    const from = { ...shown.current, pts: [...shown.current.pts] };
    const state = { t: 0 };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tween = gsap.to(state, {
      t: 1,
      duration: reduced ? 0 : 0.9,
      ease: "expo.out",
      onUpdate: () => {
        const v = from.value + (value - from.value) * state.t;
        const pts = from.pts.map((p, i) => p + (target[i] - p) * state.t);
        shown.current = { value: v, pts };
        if (valueEl.current) valueEl.current.textContent = metric.format(v);
        const d = toPath(pts);
        line.current?.setAttribute("d", d);
        area.current?.setAttribute("d", `${d}L${W},${H}L0,${H}Z`);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, target, metric]);

  const up = delta >= 0;
  const prev = value / (1 + delta / 100);
  const pad = tokens.compact ? "px-4 py-3.5 gap-2" : "px-5 py-[18px] gap-2.5";
  const hoverX = hover === null ? 0 : (hover / (POINTS - 1)) * 100;
  const hoverY = hover === null ? 0 : (1 - target[hover]) * 100;

  return (
    <div
      className={`flex flex-col border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-[border-radius,padding] duration-500 ${pad}`}
      style={{ borderRadius: tokens.radius }}
    >
      <div className="flex items-center gap-2">
        <p className="flex-1 text-[12px] font-medium leading-[18px] text-[#475569]">{metric.label}</p>
        <IconMore className="text-[#64748b]" />
      </div>
      <div className="flex items-center gap-2.5">
        <p
          ref={valueEl}
          className={`font-semibold tabular-nums tracking-[-0.02em] text-[#0f172a] transition-[font-size] duration-500 ${
            tokens.compact ? "text-[26px] leading-[34px]" : "text-[32px] leading-[40px]"
          }`}
        >
          {metric.format(value)}
        </p>
        <span
          className={`flex items-center gap-[3px] rounded-full py-[3px] pl-[7px] pr-[9px] text-[12px] font-semibold leading-[18px] ${
            up ? "bg-[#ecfdf5] text-[#047857]" : "bg-[#fef2f2] text-[#b91c1c]"
          }`}
        >
          {up ? <IconTrendUp size={13} /> : <IconTrendDown size={13} />}
          {Math.abs(delta).toFixed(1)}%
        </span>
      </div>

      <div
        className="relative h-11"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(Math.round(((e.clientX - r.left) / r.width) * (POINTS - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <path ref={area} d={`${toPath(target)}L${W},${H}L0,${H}Z`} fill={tokens.brand.c600} opacity={0.08} />
          <path
            ref={line}
            d={toPath(target)}
            fill="none"
            stroke={tokens.brand.c600}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            className="transition-[stroke] duration-500"
          />
        </svg>
        {hover !== null && (
          <>
            <span className="pointer-events-none absolute inset-y-0 w-px bg-[#cbd5e1]" style={{ left: `${hoverX}%` }} />
            <span
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
              style={{ left: `${hoverX}%`, top: `${hoverY}%`, background: tokens.brand.c600 }}
            />
            <span
              className="pointer-events-none absolute -top-8 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0f172a] px-2 py-1 text-[11px] font-medium text-white"
              style={{ left: `${hoverX}%` }}
            >
              Day {Math.round(((hover + 1) / POINTS) * days)}: {metric.format(value * (0.86 + target[hover] * 0.2))}
            </span>
          </>
        )}
      </div>

      <p className="text-[12px] leading-[18px] text-[#64748b]">
        vs. {metric.format(prev)} previous {days} days
      </p>
    </div>
  );
}

/** Label for a control, named the way the Figma variable is named. */
const Token = ({ name, value }: { name: string; value: string }) => (
  <p className="mb-2.5 flex items-baseline justify-between text-[12px] leading-[18px]">
    <span className="font-mono text-[#0f172a]">{name}</span>
    <span className="text-[#64748b]">{value}</span>
  </p>
);

export default function LumenDemo() {
  const [brand, setBrand] = useState<(typeof BRANDS)[number]>(BRANDS[0]);
  const [radius, setRadius] = useState(12);
  const [compact, setCompact] = useState(false);
  const [range, setRange] = useState<RangeId>("30d");
  const tokens = { brand, radius, compact };

  return (
    <div
      className="overflow-hidden rounded-[24px] bg-[#f8fafc] text-[#0f172a] ring-1 ring-[#0f172a]/10 [font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe_UI',sans-serif]"
      style={{ "--brand": brand.c600 } as React.CSSProperties}
    >
      <div className="flex h-11 items-center justify-between gap-4 border-b border-[#e2e8f0] bg-white px-4 text-[12px] text-[#64748b]">
        <span className="flex items-center gap-2 font-medium text-[#0f172a]">
          <span
            className="grid h-5 w-5 place-items-center rounded-[5px] text-white transition-colors duration-500"
            style={{ background: brand.c600 }}
          >
            <IconTrendUp size={12} />
          </span>
          Lumen
        </span>
        <span className="hidden sm:inline">Live components. Change a token and it lands everywhere.</span>
      </div>

      <div className="grid lg:grid-cols-[250px_1fr]">
        {/* token panel */}
        <div className="grid gap-6 border-b border-[#e2e8f0] bg-white p-5 sm:grid-cols-3 lg:grid-cols-1 lg:content-start lg:border-b-0 lg:border-r">
          <div>
            <Token name="color/brand/600" value={brand.name} />
            <div role="radiogroup" aria-label="Brand colour" className="flex gap-2">
              {BRANDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  role="radio"
                  aria-checked={b.id === brand.id}
                  aria-label={b.name}
                  onClick={() => setBrand(b)}
                  className={`h-8 w-8 rounded-full ring-offset-2 transition-transform duration-300 hover:scale-110 ${
                    b.id === brand.id ? "ring-2" : ""
                  }`}
                  style={{ background: b.c600, "--tw-ring-color": b.c600 } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          <div>
            <Token name="radius/xl" value={`${radius}px`} />
            <input
              type="range"
              min={0}
              max={24}
              value={radius}
              onChange={(e) => setRadius(+e.target.value)}
              aria-label="Card corner radius"
              className="w-full"
              style={{ accentColor: brand.c600 }}
            />
          </div>

          <div>
            <Token name="space/card" value={compact ? "16 / 14" : "20 / 18"} />
            <div
              role="radiogroup"
              aria-label="Density"
              className="grid grid-cols-2 gap-1 rounded-[10px] bg-[#f1f5f9] p-1 text-[12px] font-medium"
            >
              {[false, true].map((c) => (
                <button
                  key={String(c)}
                  type="button"
                  role="radio"
                  aria-checked={compact === c}
                  onClick={() => setCompact(c)}
                  className={`rounded-[7px] py-1.5 transition-colors duration-300 ${
                    compact === c ? "bg-white text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.1)]" : "text-[#64748b]"
                  }`}
                >
                  {c ? "Compact" : "Comfortable"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* preview */}
        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[24px] font-semibold leading-[32px] tracking-[-0.01em]">Overview</p>
              <p className="text-[14px] leading-[20px] text-[#475569]">
                How Acme Inc is performing across activation and retention.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                role="radiogroup"
                aria-label="Date range"
                className="flex rounded-[8px] border border-[#e2e8f0] bg-white p-0.5 text-[12px] font-medium"
              >
                {RANGES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={range === r.id}
                    onClick={() => setRange(r.id)}
                    className="rounded-[6px] px-2.5 py-1 transition-colors duration-300"
                    style={range === r.id ? { background: brand.c50, color: brand.c600 } : { color: "#475569" }}
                  >
                    {r.id}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="px-3 py-1.5 text-[12px] font-semibold text-white transition-[background-color,border-radius] duration-500"
                style={{ background: brand.c600, borderRadius: Math.max(4, radius / 2) }}
              >
                Export
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {METRICS.map((m) => (
              <StatCard key={m.label} metric={m} range={range} tokens={tokens} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
