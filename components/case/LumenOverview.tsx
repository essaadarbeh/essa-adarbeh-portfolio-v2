import { IconMore, IconTrendDown, IconTrendUp } from "@/components/demos/icons";

// Lumen's Overview at one geometry, drawn two ways: as the grey wireframe it
// started as, and as the finished screen (values from the Lumen file).

const NAV = ["Overview", "Reports", "Audience", "Events", "Integrations", "Data sources", "Settings", "Billing"];
const CARDS = [
  {
    label: "Monthly active users",
    value: "248,910",
    delta: "12.4%",
    up: true,
    pts: [30, 34, 31, 40, 37, 45, 44, 50, 49, 56],
  },
  { label: "Activation rate", value: "46.2%", delta: "3.1%", up: true, pts: [40, 42, 41, 43, 44, 43, 46, 45, 47, 48] },
  {
    label: "Weekly retention",
    value: "68.9%",
    delta: "1.8%",
    up: false,
    pts: [52, 50, 51, 47, 48, 45, 46, 43, 44, 41],
  },
];
const A = [22, 26, 25, 31, 34, 33, 38, 42, 41, 46, 48, 53];
const B = [10, 12, 11, 14, 13, 16, 17, 16, 19, 20, 22, 23];
const path = (pts: number[], w: number, h: number, max: number) =>
  pts
    .map((v, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * w).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
    .join("");

/** Text, or a grey bar of about the same width. */
function T({ wire, children, w, className }: { wire: boolean; children: string; w?: number; className?: string }) {
  if (!wire) return <span className={className}>{children}</span>;
  return (
    <span
      className={`inline-block h-[0.62em] rounded-[3px] bg-[#cbd5e1] align-middle ${className ?? ""}`}
      style={{ width: `${(w ?? children.length) * 0.52}em` }}
    />
  );
}

export default function LumenOverview({ wire }: { wire: boolean }) {
  const brand = wire ? "#94a3b8" : "#4f46e5";
  const card = wire
    ? "border border-dashed border-[#94a3b8] bg-white"
    : "border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]";

  return (
    <div
      className={`absolute inset-0 flex text-[#0f172a] [font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe_UI',sans-serif] ${
        wire ? "bg-[#f1f5f9]" : "bg-[#f8fafc]"
      }`}
    >
      <aside
        className={`hidden w-[200px] shrink-0 flex-col gap-1 border-r p-4 sm:flex ${wire ? "border-dashed border-[#94a3b8] bg-white" : "border-[#e2e8f0] bg-white"}`}
      >
        <p className="mb-4 flex items-center gap-2 text-[15px] font-semibold">
          <span className="h-6 w-6 rounded-[6px]" style={{ background: brand }} />
          <T wire={wire}>Lumen</T>
        </p>
        {NAV.map((n, i) => (
          <p
            key={n}
            className="rounded-[6px] px-2.5 py-1.5 text-[13px]"
            style={
              i === 0
                ? { background: wire ? "#e2e8f0" : "#eef2ff", color: wire ? undefined : "#4f46e5" }
                : { color: "#475569" }
            }
          >
            <T wire={wire}>{n}</T>
          </p>
        ))}
      </aside>

      <main className="min-w-0 flex-1 p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div
            className={`h-8 w-[min(320px,55%)] rounded-[8px] ${wire ? "border border-dashed border-[#94a3b8] bg-white" : "border border-[#e2e8f0] bg-white"}`}
          />
          <div className="h-8 w-24 rounded-[8px]" style={{ background: brand }} />
        </div>
        <p className="mt-6 text-[24px] font-semibold leading-8">
          <T wire={wire}>Overview</T>
        </p>
        <p className="text-[13px] text-[#475569]">
          <T wire={wire} w={44}>
            How Acme Inc is performing across activation and retention.
          </T>
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CARDS.map((c, i) => (
            <div key={c.label} className={`rounded-[12px] px-4 py-3.5 ${card} ${i > 0 ? "hidden sm:block" : ""}`}>
              <div className="flex items-center justify-between text-[12px] font-medium text-[#475569]">
                <T wire={wire}>{c.label}</T>
                {!wire && <IconMore className="text-[#64748b]" />}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[26px] font-semibold leading-8 tracking-[-0.02em]">
                  <T wire={wire} w={6}>
                    {c.value}
                  </T>
                </span>
                {wire ? (
                  <span className="h-5 w-12 rounded-full bg-[#e2e8f0]" />
                ) : (
                  <span
                    className={`flex items-center gap-[3px] rounded-full py-[2px] pl-[6px] pr-[8px] text-[11px] font-semibold ${
                      c.up ? "bg-[#ecfdf5] text-[#047857]" : "bg-[#fef2f2] text-[#b91c1c]"
                    }`}
                  >
                    {c.up ? <IconTrendUp size={12} /> : <IconTrendDown size={12} />}
                    {c.delta}
                  </span>
                )}
              </div>
              <svg viewBox="0 0 200 36" preserveAspectRatio="none" className="mt-2 h-9 w-full">
                <path
                  d={path(c.pts, 200, 36, 60)}
                  fill="none"
                  stroke={wire ? "#94a3b8" : c.up ? brand : "#e11d48"}
                  strokeWidth={2}
                  strokeDasharray={wire ? "4 4" : undefined}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          ))}
        </div>

        <div className={`mt-3 rounded-[12px] p-4 ${card}`}>
          <div className="flex items-center justify-between text-[14px] font-semibold">
            <T wire={wire}>Active users over time</T>
            <span className="flex gap-3 text-[11px] font-medium text-[#475569]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: brand }} />
                <T wire={wire}>Returning</T>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: wire ? "#cbd5e1" : "#0ea5e9" }} />
                <T wire={wire}>New</T>
              </span>
            </span>
          </div>
          <svg viewBox="0 0 600 150" preserveAspectRatio="none" className="mt-3 h-[150px] w-full">
            {[0, 1, 2, 3].map((g) => (
              <line
                key={g}
                x1="0"
                x2="600"
                y1={g * 50}
                y2={g * 50}
                stroke="#e2e8f0"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {!wire && <path d={`${path(A, 600, 150, 60)}L600,150L0,150Z`} fill="#4f46e5" opacity="0.08" />}
            <path
              d={path(A, 600, 150, 60)}
              fill="none"
              stroke={brand}
              strokeWidth={2}
              strokeDasharray={wire ? "6 6" : undefined}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={path(B, 600, 150, 60)}
              fill="none"
              stroke={wire ? "#cbd5e1" : "#0ea5e9"}
              strokeWidth={2}
              strokeDasharray={wire ? "6 6" : undefined}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </main>

      <span
        className={`absolute bottom-4 ${wire ? "left-4 bg-[#0f172a] text-white" : "right-4 bg-[#4f46e5] text-white"} rounded-full px-3 py-1.5 text-xs font-medium`}
      >
        {wire ? "Wireframe" : "Final"}
      </span>
    </div>
  );
}
