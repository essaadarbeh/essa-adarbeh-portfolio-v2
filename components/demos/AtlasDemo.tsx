"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconCheck,
  IconCheckCircle,
  IconDatabase,
  IconFile,
  IconGlobe,
  IconReplay,
  IconShield,
  IconSpinner,
} from "./icons";

// Values below come from the Atlas design file (Plan Step, Tool Call Card,
// Approval Card): bg/subtle #1F1F23, border/default #27272A, border/strong
// #3F3F46, text/primary #FAFAFA, text/secondary #A1A1AA, text/tertiary
// #71717A, agent #8B5CF6, agent-subtle #2E1065, success #A3E635 on #365314,
// warning/600 #D97706 on #78350F, brand #14B8A6.

type StepStatus = "pending" | "active" | "done" | "skipped";
type Step = { label: string; meta?: string; status: StepStatus };
type ToolKind = "search" | "read" | "extract";
type FeedItem =
  | { id: number; kind: "tool"; tool: string; desc: string; type: ToolKind; done: boolean; meta: string }
  | { id: number; kind: "msg"; text: string }
  | { id: number; kind: "approval"; decided?: "approved" | "denied" };
type NewItem = FeedItem extends infer T ? (T extends FeedItem ? Omit<T, "id"> : never) : never;
type RunStatus = "idle" | "running" | "waiting" | "done";

const PLAN: string[] = [
  "Define the vendor set and evaluation criteria",
  "Gather pricing and deployment models",
  "Collect published benchmark results",
  "Cross-check benchmark methodology for bias",
  "Draft the recommendation with citations",
];

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("aborted", "AbortError"));
    });
  });

function PlanStep({ step }: { step: Step }) {
  const s = step.status;
  return (
    <li
      className={`flex items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors duration-500 ${
        s === "active" ? "bg-[#2e1065]" : ""
      }`}
    >
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
          s === "done"
            ? "border-[1.5px] border-[#a3e635] bg-[#365314] text-[#a3e635]"
            : s === "active"
              ? "bg-[#8b5cf6]"
              : s === "skipped"
                ? "border-[1.5px] border-[#27272a]"
                : "border-[1.5px] border-[#3f3f46]"
        }`}
      >
        {s === "done" && <IconCheck size={12} />}
        {s === "active" && <span className="h-2 w-2 rounded-full bg-white" />}
        {s === "skipped" && <span className="h-[1.5px] w-2 bg-[#3f3f46]" />}
      </span>
      <span
        className={`flex-1 text-[14px] leading-[22px] ${
          s === "active"
            ? "text-[#fafafa]"
            : s === "done"
              ? "text-[#a1a1aa]"
              : s === "skipped"
                ? "text-[#52525b] line-through"
                : "text-[#71717a]"
        }`}
      >
        {step.label}
      </span>
      <span className="hidden font-mono text-[11px] leading-4 text-[#71717a] sm:inline">
        {s === "active" ? "running" : s === "done" ? step.meta : s === "skipped" ? "skipped" : ""}
      </span>
    </li>
  );
}

function ToolCard({ item }: { item: Extract<FeedItem, { kind: "tool" }> }) {
  const Icon = item.type === "search" ? IconGlobe : item.type === "read" ? IconFile : IconDatabase;
  return (
    <div
      className={`feed-in flex items-center gap-3 rounded-[10px] border py-[11px] pl-3 pr-3.5 transition-[background-color,border-color,box-shadow] duration-500 ${
        item.done
          ? "border-[#27272a] bg-[#1f1f23]"
          : "border-[#8b5cf6] bg-[#2e1065] shadow-[0_0_24px_-4px_rgba(139,92,246,0.4)]"
      }`}
    >
      <span
        className={`rounded-[8px] p-2 text-[#fafafa] transition-colors duration-500 ${item.done ? "bg-[#27272a]" : "bg-[#8b5cf6]"}`}
      >
        <Icon size={16} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="font-mono text-[13px] leading-5 text-[#fafafa]">{item.tool}</span>
        <span className="truncate text-[12px] leading-[18px] text-[#71717a]">{item.desc}</span>
      </span>
      <span className="flex items-center gap-[7px] font-mono text-[11px] leading-4 text-[#71717a]">
        {item.done && item.meta}
        {item.done ? (
          <IconCheckCircle size={15} className="text-[#a3e635]" />
        ) : (
          <IconSpinner className="text-[#a78bfa]" />
        )}
      </span>
    </div>
  );
}

export default function AtlasDemo() {
  const root = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const [steps, setSteps] = useState<Step[]>(PLAN.map((label) => ({ label, status: "pending" })));
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [cost, setCost] = useState(0);
  const decision = useRef<((d: "approved" | "denied") => void) | null>(null);
  const abort = useRef<AbortController | null>(null);
  const idRef = useRef(0);

  const setStep = (i: number, status: StepStatus, meta?: string) =>
    setSteps((s) => s.map((st, k) => (k === i ? { ...st, status, meta: meta ?? st.meta } : st)));
  const push = (item: NewItem) => {
    const id = ++idRef.current;
    setFeed((f) => [...f, { ...item, id } as FeedItem]);
    return id;
  };
  const finishTool = (id: number, meta: string) =>
    setFeed((f) => f.map((it) => (it.id === id && it.kind === "tool" ? { ...it, done: true, meta } : it)));

  const run = useCallback(async () => {
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    const { signal } = ctl;
    setSteps(PLAN.map((label) => ({ label, status: "pending" })));
    setFeed([]);
    setCost(0);
    setStatus("running");

    const tool = async (
      step: number,
      t: ToolKind,
      name: string,
      desc: string,
      ms: number,
      meta: string,
      sources: string,
    ) => {
      const id = push({ kind: "tool", tool: name, desc, type: t, done: false, meta: "" });
      await wait(ms, signal);
      finishTool(id, meta);
      setCost((c) => c + 0.14);
      setStep(step, "done", sources);
    };

    try {
      push({
        kind: "msg",
        text: "Starting with scope: Pinecone, Weaviate, Qdrant, Milvus and pgvector, excluding managed search products.",
      });
      setStep(0, "active");
      await tool(0, "search", "web_search", "vector database market share 2026", 1500, "3.4s", "6 sources");
      setStep(1, "active");
      await tool(1, "read", "read_source", "Read 6 sources: pricing pages and docs", 1500, "6.8s", "11 sources");
      setStep(2, "active");
      await tool(2, "search", "web_search", "ANN benchmark results, p95 latency", 1400, "4.1s", "8 sources");
      setStep(3, "active");
      await wait(500, signal);
      push({
        kind: "msg",
        text: "Worth flagging: three of the eight benchmarks reuse the same harness, so their numbers aren’t independent. I’d like to check the self-hosted figures myself.",
      });
      await wait(700, signal);
      const approvalId = push({ kind: "approval" });
      setStatus("waiting");
      const d = await new Promise<"approved" | "denied">((resolve) => (decision.current = resolve));
      decision.current = null;
      setFeed((f) => f.map((it) => (it.id === approvalId && it.kind === "approval" ? { ...it, decided: d } : it)));
      setStatus("running");

      if (d === "approved") {
        await tool(
          3,
          "extract",
          "extract_data",
          "Pulling p95 latency and recall@10 into a table",
          1600,
          "12s",
          "6 sources",
        );
      } else {
        await wait(400, signal);
        push({ kind: "msg", text: "Understood. I’ll mark the self-hosted numbers as unverified and move on." });
        setStep(3, "skipped");
      }
      setStep(4, "active");
      await wait(1300, signal);
      setStep(4, "done", "report");
      setCost((c) => c + 0.2);
      push({
        kind: "msg",
        text:
          d === "approved"
            ? "Report ready. Qdrant and Milvus lead on self-hosted p95 latency; Pinecone wins on time to first query."
            : "Report ready, with the self-hosted latency figures flagged as vendor-published and unverified.",
      });
      setStatus("done");
    } catch {
      // aborted by a replay or unmount
    }
  }, []);

  // start once, when the window is actually on screen
  useEffect(() => {
    const el = root.current!;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      abort.current?.abort();
    };
  }, [run]);

  // keep the newest activity in view
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [feed]);

  const badge =
    status === "waiting"
      ? { text: "Needs your approval", cls: "border-[#d97706] bg-[#78350f] text-[#fde68a]" }
      : status === "done"
        ? { text: "Complete", cls: "border-[#a3e635]/50 bg-[#365314] text-[#d9f99d]" }
        : { text: "Researching", cls: "border-[#8b5cf6] bg-[#2e1065] text-[#ddd6fe]" };

  return (
    <div
      ref={root}
      className="overflow-hidden rounded-[24px] bg-[#0c0c0e] text-[#fafafa] ring-1 ring-white/10 [font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe_UI',sans-serif]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272a] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px] bg-[#14b8a6] text-[13px] font-bold text-[#09090b]">
            A
          </span>
          <span className="truncate text-[15px] font-semibold">Vector DB competitive landscape</span>
          <span
            className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium sm:inline ${badge.cls}`}
          >
            {badge.text}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-[#71717a]">
          <span>${cost.toFixed(2)} of $5.00 budget</span>
          <button
            type="button"
            onClick={run}
            className="flex items-center gap-1.5 rounded-[6px] border border-[#27272a] bg-[#1f1f23] px-2.5 py-1 font-sans text-[12px] font-semibold text-[#fafafa] transition-colors hover:border-[#3f3f46]"
          >
            <IconReplay size={13} />
            Replay
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* plan */}
        <div className="border-b border-[#27272a] p-4 sm:p-5 md:border-b-0 md:border-r">
          <p className="text-[14px] font-semibold leading-[22px]">Research plan</p>
          <p className="text-[12px] leading-[18px] text-[#71717a]">
            Atlas drafted this from your brief. Every step is editable.
          </p>
          <ol className="mt-3 space-y-1" aria-label="Research plan steps">
            {steps.map((s) => (
              <PlanStep key={s.label} step={s} />
            ))}
          </ol>
        </div>

        {/* activity */}
        <div className="flex flex-col p-4 sm:p-5">
          <p className="text-[11px] font-semibold tracking-[0.06em] text-[#71717a]">Activity</p>
          <div
            ref={feedRef}
            aria-live="polite"
            data-lenis-prevent
            className="mt-3 h-[340px] space-y-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] sm:h-[360px]"
          >
            {feed.map((item) =>
              item.kind === "tool" ? (
                <ToolCard key={item.id} item={item} />
              ) : item.kind === "msg" ? (
                <div key={item.id} className="feed-in flex gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#2e1065] text-[#a78bfa]">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  </span>
                  <p className="text-[13px] leading-5 text-[#d4d4d8]">{item.text}</p>
                </div>
              ) : item.decided ? (
                <p
                  key={item.id}
                  className={`feed-in flex items-center gap-2 text-[12px] ${
                    item.decided === "approved" ? "text-[#a3e635]" : "text-[#a1a1aa]"
                  }`}
                >
                  <IconShield size={14} />
                  {item.decided === "approved"
                    ? "You approved the Notion read and 6 searches"
                    : "You denied the request"}
                </p>
              ) : (
                <div
                  key={item.id}
                  className="feed-in rounded-[12px] border border-[#d97706] bg-[#78350f] px-4 py-[15px]"
                >
                  <div className="flex items-start gap-3">
                    <span className="rounded-full bg-[#d97706] p-2 text-[#fafafa]">
                      <IconShield size={16} />
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold leading-[22px]">Atlas is asking permission</p>
                      <p className="text-[12px] leading-[18px] text-[#e4d3c3]">
                        To verify the self-hosted numbers it wants to read your connected Notion workspace and run 6
                        more searches. Estimated cost $0.42.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3.5 flex flex-wrap items-center gap-2 pl-[10px]">
                    <button
                      type="button"
                      onClick={() => decision.current?.("denied")}
                      className="rounded-[6px] px-[11px] py-[6px] text-[12px] font-semibold text-[#e4d3c3] transition-colors hover:text-white"
                    >
                      Deny
                    </button>
                    <button
                      type="button"
                      onClick={() => decision.current?.("approved")}
                      className="rounded-[6px] border border-[#27272a] bg-[#1f1f23] px-[11px] py-[6px] text-[12px] font-semibold transition-colors hover:border-[#3f3f46]"
                    >
                      Always allow
                    </button>
                    <button
                      type="button"
                      onClick={() => decision.current?.("approved")}
                      className="approve-pulse rounded-[6px] bg-[#14b8a6] px-[11px] py-[6px] text-[12px] font-semibold text-[#09090b] transition-transform active:scale-95"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
