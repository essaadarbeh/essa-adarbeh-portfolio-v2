import { IconCheck, IconCheckCircle, IconFile, IconGlobe, IconShield, IconSpinner } from "@/components/demos/icons";

// One Atlas screen, rendered from a mode's resolved tokens. The two token
// maps are the file's semantic variables in Dark and Light (read from Figma),
// which is exactly how the product's light screens are produced.
const MODES = {
  dark: {
    canvas: "#09090b",
    surface: "#101013",
    raised: "#18181b",
    subtle: "#1f1f23",
    muted: "#27272a",
    brand: "#14b8a6",
    brandText: "#5eead4",
    agent: "#8b5cf6",
    agentSubtle: "#2e1065",
    agentText: "#c4b5fd",
    text: "#fafafa",
    text2: "#a1a1aa",
    text3: "#71717a",
    success: "#a3e635",
    successBg: "#365314",
    warning: "#fbbf24",
    warningBg: "#78350f",
    warningBorder: "#d97706",
    border: "#27272a",
    borderStrong: "#3f3f46",
    onBrand: "#09090b",
  },
  light: {
    canvas: "#fafafa",
    surface: "#ffffff",
    raised: "#ffffff",
    subtle: "#f4f4f5",
    muted: "#e4e4e7",
    brand: "#0d9488",
    brandText: "#0f766e",
    agent: "#7c3aed",
    agentSubtle: "#f5f3ff",
    agentText: "#7c3aed",
    text: "#18181b",
    text2: "#52525b",
    text3: "#71717a",
    success: "#65a30d",
    successBg: "#f7fee7",
    warning: "#d97706",
    warningBg: "#fffbeb",
    warningBorder: "#fbbf24",
    border: "#e4e4e7",
    borderStrong: "#d4d4d8",
    onBrand: "#ffffff",
  },
} as const;

const STEPS = [
  { label: "Define the vendor set and evaluation criteria", s: "done", meta: "6 sources" },
  { label: "Gather pricing and deployment models", s: "done", meta: "11 sources" },
  { label: "Cross-check benchmark methodology for bias", s: "active", meta: "running" },
  { label: "Draft the recommendation with citations", s: "pending", meta: "" },
] as const;

export default function AtlasPanel({ mode }: { mode: keyof typeof MODES }) {
  const t = MODES[mode];
  return (
    <div
      className="absolute inset-0 flex [font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe_UI',sans-serif]"
      style={{ background: t.canvas, color: t.text }}
    >
      <aside
        className="hidden w-[190px] shrink-0 flex-col gap-1 border-r p-4 sm:flex"
        style={{ borderColor: t.border, background: t.surface }}
      >
        <p className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
          <span
            className="grid h-6 w-6 place-items-center rounded-[6px] text-[12px] font-bold"
            style={{ background: t.brand, color: t.onBrand }}
          >
            A
          </span>
          Atlas
        </p>
        <span
          className="mb-2 rounded-[6px] py-1.5 text-center text-[12px] font-semibold"
          style={{ background: t.brand, color: t.onBrand }}
        >
          New research
        </span>
        {["Runs", "Library", "Sources", "Settings"].map((n, i) => (
          <span
            key={n}
            className="rounded-[6px] px-2.5 py-1.5 text-[13px]"
            style={i === 0 ? { background: t.subtle } : { color: t.text2 }}
          >
            {n}
          </span>
        ))}
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[18px] font-semibold">Vector DB competitive landscape</p>
          <span
            className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
            style={{ borderColor: t.agent, background: t.agentSubtle, color: t.agentText }}
          >
            Researching
          </span>
        </div>
        <p className="mt-1 font-mono text-[11px]" style={{ color: t.text3 }}>
          $1.24 of $5.00 budget
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[12px] border p-3" style={{ borderColor: t.border, background: t.surface }}>
            <p className="px-2 text-[14px] font-semibold">Research plan</p>
            <ul className="mt-2 space-y-0.5">
              {STEPS.map((s) => (
                <li
                  key={s.label}
                  className="flex items-center gap-3 rounded-[8px] px-2.5 py-2"
                  style={s.s === "active" ? { background: t.agentSubtle } : undefined}
                >
                  <span
                    className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-[1.5px]"
                    style={
                      s.s === "done"
                        ? { borderColor: t.success, background: t.successBg, color: t.success }
                        : s.s === "active"
                          ? { borderColor: t.agent, background: t.agent }
                          : { borderColor: t.borderStrong }
                    }
                  >
                    {s.s === "done" && <IconCheck size={11} />}
                    {s.s === "active" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span
                    className="flex-1 text-[13px] leading-5"
                    style={{ color: s.s === "active" ? t.text : s.s === "done" ? t.text2 : t.text3 }}
                  >
                    {s.label}
                  </span>
                  <span className="hidden font-mono text-[10px] sm:inline" style={{ color: t.text3 }}>
                    {s.meta}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2.5">
            <div
              className="flex items-center gap-3 rounded-[10px] border px-3 py-2.5"
              style={{ borderColor: t.border, background: t.subtle }}
            >
              <span className="rounded-[8px] p-1.5" style={{ background: t.muted }}>
                <IconGlobe size={15} />
              </span>
              <span className="flex-1">
                <span className="block font-mono text-[12px]">web_search</span>
                <span className="block text-[11px]" style={{ color: t.text3 }}>
                  ANN benchmark results, p95 latency
                </span>
              </span>
              <IconCheckCircle size={14} className="shrink-0" />
            </div>
            <div
              className="flex items-center gap-3 rounded-[10px] border px-3 py-2.5"
              style={{ borderColor: t.agent, background: t.agentSubtle, boxShadow: `0 0 22px -6px ${t.agent}` }}
            >
              <span className="rounded-[8px] p-1.5 text-white" style={{ background: t.agent }}>
                <IconFile size={15} />
              </span>
              <span className="flex-1">
                <span className="block font-mono text-[12px]">read_source</span>
                <span className="block text-[11px]" style={{ color: t.text3 }}>
                  Reading 6 sources
                </span>
              </span>
              <IconSpinner className="shrink-0" />
            </div>
            <div
              className="rounded-[12px] border px-3.5 py-3"
              style={{ borderColor: t.warningBorder, background: t.warningBg }}
            >
              <p className="flex items-center gap-2 text-[13px] font-semibold">
                <span className="rounded-full p-1.5 text-white" style={{ background: "#d97706" }}>
                  <IconShield size={13} />
                </span>
                Atlas is asking permission
              </p>
              <p className="mt-1.5 text-[11px] leading-4" style={{ color: t.text2 }}>
                It wants to read your connected Notion workspace and run 6 more searches. Estimated cost $0.42.
              </p>
              <p className="mt-2.5 flex gap-2 text-[11px] font-semibold">
                <span className="px-2 py-1" style={{ color: t.text2 }}>
                  Deny
                </span>
                <span
                  className="rounded-[6px] border px-2 py-1"
                  style={{ borderColor: t.border, background: t.subtle }}
                >
                  Always allow
                </span>
                <span className="rounded-[6px] px-2 py-1" style={{ background: t.brand, color: t.onBrand }}>
                  Approve
                </span>
              </p>
            </div>
          </div>
        </div>
      </main>

      <span
        className="absolute bottom-4 rounded-full px-3 py-1.5 text-xs font-medium"
        style={
          mode === "dark"
            ? { left: 16, background: "#fafafa", color: "#09090b" }
            : { right: 16, background: "#18181b", color: "#fafafa" }
        }
      >
        {mode === "dark" ? "Dark mode" : "Light mode"}
      </span>
    </div>
  );
}
