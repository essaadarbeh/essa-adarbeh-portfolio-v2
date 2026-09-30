"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDecode } from "@/components/useDecode";
import { categories, keyRows, tools, type ToolCategory } from "@/data/skills";

const dot: Record<ToolCategory, string> = {
  design: "bg-field ring-1 ring-chalk/40",
  frontend: "bg-sky",
  craft: "bg-signal",
  ai: "bg-chalk ring-1 ring-ink/30",
  human: "bg-transparent ring-1 ring-current",
};

function Screen({ letter, filter }: { letter: string | null; filter: ToolCategory | null }) {
  const tool = letter ? tools[letter] : null;
  const cat = tool ? categories.find((c) => c.id === tool.category)! : null;
  const note = useDecode<HTMLSpanElement>(tool?.note ?? "", 550);
  const filtered = filter ? Object.entries(tools).filter(([, t]) => t.category === filter) : [];

  return (
    <div
      aria-live="polite"
      className="relative min-h-[240px] overflow-hidden rounded-[22px] bg-[color-mix(in_oklab,var(--color-ink)_70%,black)] p-6 ring-1 ring-chalk/10 sm:min-h-[270px] sm:p-9"
    >
      {/* faint scanlines, like an old display */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background:repeating-linear-gradient(0deg,var(--color-chalk)_0_1px,transparent_1px_4px)]"
      />
      {tool && cat ? (
        <div className="relative">
          <p className="flex items-center gap-2.5 text-sm text-chalk-muted">
            <span className="grid h-6 min-w-6 place-items-center rounded-[6px] bg-chalk px-1.5 text-xs font-semibold text-ink">
              {letter}
            </span>
            {cat.label}
          </p>
          <p className="display mt-4 text-[clamp(2.4rem,7vw,5.5rem)] uppercase [--wdth:88]">{tool.name}</p>
          <p className="mt-4 max-w-[52ch] text-lg leading-snug text-chalk/85">
            <span className="sr-only">{tool.note}</span>
            <span aria-hidden ref={note} />
          </p>
          {letter === "O" && (
            <a
              href="#contact"
              className="mt-5 inline-flex rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-ink transition-transform active:scale-95"
            >
              Get in touch
            </a>
          )}
        </div>
      ) : filter ? (
        <div className="relative">
          <p className="text-sm text-chalk-muted">{categories.find((c) => c.id === filter)!.label}</p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
            {filtered.map(([k, t]) => (
              <li key={k} className="display text-[clamp(1.6rem,4vw,3rem)] uppercase [--wdth:80]">
                {t.name}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="relative">
          <p className="text-sm text-chalk-muted">Toolkit</p>
          <p className="display mt-4 text-[clamp(2.4rem,7vw,5.5rem)] uppercase [--wdth:88]">
            Press any key
            <span aria-hidden className="caret ml-2 inline-block h-[0.8em] w-[0.45em] translate-y-[0.05em] bg-signal" />
          </p>
          <p className="mt-4 max-w-[52ch] text-lg leading-snug text-chalk/85">
            Every key is something I use. Try F, R or G, or type on your own keyboard.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Toolkit() {
  const root = useRef<HTMLElement>(null);
  const [letter, setLetter] = useState<string | null>(null);
  const [filter, setFilter] = useState<ToolCategory | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const letterRef = useRef(letter);

  useEffect(() => {
    letterRef.current = letter;
  }, [letter]);

  const press = useCallback((k: string) => {
    setLetter(k);
    setFilter(null);
    setPressed(k);
    window.setTimeout(() => setPressed((p) => (p === k ? null : p)), 140);
  }, []);

  const shuffle = useCallback(() => {
    const keys = Object.keys(tools).filter((k) => k !== letterRef.current);
    press(keys[(Math.random() * keys.length) | 0]);
    setPressed("space");
    window.setTimeout(() => setPressed((p) => (p === "space" ? null : p)), 140);
  }, [press]);

  // type on a real keyboard while the section is on screen
  useEffect(() => {
    const el = root.current!;
    let inView = false;
    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    const onKey = (e: KeyboardEvent) => {
      if (!inView || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true]")) return;
      const k = e.key.toUpperCase();
      const onPage = t === document.body || t === document.documentElement;
      if (k.length === 1 && tools[k]) {
        press(k);
      } else if (e.key === " " && onPage) {
        e.preventDefault();
        shuffle();
      } else if (e.key === "Escape") {
        setLetter(null);
        setFilter(null);
      } else if (e.key === "Enter" && onPage && letterRef.current === "O") {
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      io.disconnect();
      window.removeEventListener("keydown", onKey);
    };
  }, [press, shuffle]);

  return (
    <section
      ref={root}
      id="toolkit"
      aria-labelledby="toolkit-title"
      className="bg-ink px-3 py-24 text-chalk sm:px-6 md:py-36"
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="toolkit-title" className="display text-[clamp(3rem,9vw,8rem)] uppercase [--wdth:125]">
            Toolkit
          </h2>
          <p className="max-w-[34ch] pb-2 text-lg leading-snug text-chalk-muted">
            What I design and build with, laid out on the thing I spend all day on.
          </p>
        </div>

        <div className="mt-12 md:mt-16">
          <Screen letter={letter} filter={filter} />

          {/* keyboard deck */}
          <div className="kb-deck mt-4 rounded-[26px] p-2.5 sm:mt-5 sm:p-4">
            <div className="space-y-1.5 sm:space-y-2.5">
              {keyRows.map((row, r) => (
                <div
                  key={row}
                  className="flex justify-center gap-1.5 sm:gap-2.5"
                  style={{ paddingLeft: `${r * 4}%`, paddingRight: `${r * 4}%` }}
                >
                  {row.split("").map((k) => {
                    const t = tools[k];
                    const dim = filter !== null && t.category !== filter;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => press(k)}
                        aria-label={`${k}: ${t.name}`}
                        aria-pressed={letter === k}
                        data-pressed={pressed === k || undefined}
                        data-active={letter === k || (filter !== null && !dim) || undefined}
                        data-dim={dim || undefined}
                        className="keycap relative flex aspect-square min-w-0 flex-1 flex-col justify-between p-1.5 text-left sm:aspect-[1/0.92] sm:p-2.5 md:max-w-[104px]"
                      >
                        <span className="flex h-full items-center justify-center sm:h-auto sm:items-start sm:justify-between">
                          <span className="text-[13px] font-semibold leading-none sm:text-base">{k}</span>
                          <span
                            className={`absolute right-1 top-1 h-1 w-1 rounded-full sm:static sm:h-2 sm:w-2 ${dot[t.category]}`}
                          />
                        </span>
                        <span className="hidden text-[11px] font-medium leading-tight opacity-80 md:block">
                          {t.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* category keys + space */}
              <div className="flex gap-1.5 sm:gap-2.5">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={filter === c.id}
                    onClick={() => {
                      setLetter(null);
                      setFilter((f) => (f === c.id ? null : c.id));
                    }}
                    data-active={filter === c.id || undefined}
                    className="keycap flex h-11 min-w-0 flex-1 items-center justify-center gap-2 px-1 text-[11px] font-semibold sm:h-14 sm:text-sm"
                  >
                    <span className={`hidden h-2 w-2 shrink-0 rounded-full sm:block ${dot[c.id]}`} />
                    {c.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={shuffle}
                  data-pressed={pressed === "space" || undefined}
                  className="keycap hidden h-14 flex-[2.2] items-center justify-center text-sm font-semibold sm:flex"
                >
                  Shuffle
                </button>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-chalk-muted">
            <span className="[@media(pointer:coarse)]:hidden">
              Type a letter, press Space to shuffle, Esc to clear. The bottom row groups the tools by kind.
            </span>
            <span className="hidden [@media(pointer:coarse)]:inline">
              Tap a key. The bottom row groups the tools by kind.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
