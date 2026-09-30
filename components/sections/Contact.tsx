"use client";

import { useEffect, useRef, useState } from "react";
import { DrawScope, Mark, Written } from "@/components/hand/Marks";
import PaletteSwitcher from "@/components/PaletteSwitcher";
import { site } from "@/data/site";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";

export const PREFILL_EVENT = "contact:prefill";
const TYPES = ["Website", "Product UI", "Design system", "Something else"] as const;
const WHEN = ["As soon as possible", "In 1–3 months", "Just exploring"] as const;

function AmmanTime() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: site.timeZone });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{time ?? "--:--"}</span>;
}

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-medium text-ink-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium ring-1 transition-[background-color,color,box-shadow] duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-signal ${
              value === o ? "bg-ink text-chalk ring-ink" : "ring-ink/20 hover:ring-ink/50"
            }`}
          >
            <input
              type="radio"
              name={label}
              value={o}
              checked={value === o}
              onChange={() => onChange(o)}
              className="sr-only"
            />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** A small email composer: builds the message, then hands it to the mail app. */
function Composer() {
  const [type, setType] = useState<(typeof TYPES)[number] | null>(null);
  const [when, setWhen] = useState<(typeof WHEN)[number] | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [flash, setFlash] = useState(false);

  // the contact card in the Process section hands over its project type
  useEffect(() => {
    const on = (e: Event) => {
      const t = (e as CustomEvent<string>).detail;
      const match = TYPES.find((x) => x === t);
      if (match) {
        setType(match);
        setFlash(true);
        setTimeout(() => setFlash(false), 1200);
      }
    };
    window.addEventListener(PREFILL_EVENT, on);
    return () => window.removeEventListener(PREFILL_EVENT, on);
  }, []);

  const subject = [
    type ? `${type} project` : "A new project",
    when && when !== "Just exploring" ? when.toLowerCase() : null,
  ]
    .filter(Boolean)
    .join(", ");
  const body = [
    "Hi Essa,",
    "",
    note.trim() || "I’d like to talk about a project.",
    "",
    type && `Project: ${type}`,
    when && `Timeline: ${when}`,
    "",
    name.trim() || null,
  ]
    .filter((l) => l !== null)
    .join("\n");
  const href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = href;
      }}
      className={`paper overflow-hidden rounded-[24px] text-ink md:shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)] transition-shadow duration-700 ${
        flash ? "ring-4 ring-signal" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-3 py-3 text-sm sm:px-5">
        <span className="hidden font-medium sm:inline">New message</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-2 rounded-full px-3 py-1 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
        >
          To: <span className="text-ink">{site.email}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${copied ? "bg-signal text-ink" : "bg-ink/10"}`}
          >
            {copied ? "Copied" : "Copy"}
          </span>
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Email address copied to clipboard" : ""}
      </p>

      <div className="space-y-6 p-5 sm:p-7">
        {/* it's a letter: it starts the way the email will */}
        <p aria-hidden className="font-hand -rotate-1 text-3xl text-field">
          Hi Essa,
        </p>
        <Chips label="What are we building?" options={TYPES} value={type} onChange={setType} />
        <Chips label="When?" options={WHEN} value={when} onChange={setWhen} />
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink-muted">Your name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="w-full rounded-[12px] bg-white px-4 py-3 ring-1 ring-ink/15 transition-shadow focus:outline-none focus:ring-2 focus:ring-field"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink-muted">A bit more</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="What it is, who it’s for, what’s hard about it."
              className="w-full resize-none rounded-[12px] bg-white px-4 py-3 ring-1 ring-ink/15 transition-shadow placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-field"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5">
          <p className="min-w-0 text-sm text-ink-muted">
            Subject: <span className="text-ink">{subject}</span>
          </p>
          <button
            type="submit"
            className="rounded-full bg-field px-6 py-3 font-semibold text-chalk transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            Open in your mail app
          </button>
        </div>
      </div>
    </form>
  );
}

export default function Contact() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const wide = matchMedia("(min-width: 768px) and (pointer: fine)").matches;
        const split = SplitText.create(".contact-title", {
          type: "lines,words,chars",
          charsClass: "char",
          mask: "lines",
        });
        gsap.from(split.chars, {
          yPercent: 110,
          // letters stretching re-lays out text every frame: desktop only
          ...(wide ? { "--wdth": 50 } : {}),
          ease: "expo.out",
          duration: 1.4,
          stagger: 0.025,
          scrollTrigger: { trigger: ".contact-title", start: "top 80%" },
          onComplete: () => gsap.set(split.chars, { clearProps: "--wdth" }),
        });
        return () => split.revert();
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="contact"
      aria-labelledby="contact-title"
      className="relative overflow-hidden bg-field px-4 pb-16 pt-28 text-chalk sm:px-6 md:pt-40"
    >
      <div className="mx-auto max-w-[1400px]">
        <h2 id="contact-title" className="contact-title display text-[clamp(3.5rem,12vw,13rem)] uppercase [--wdth:130]">
          Let’s build the next one
        </h2>

        <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="max-w-[38ch] text-xl leading-snug text-field-muted">
              I’m open to full-time roles and freelance projects. Tell me what you’re working on and I’ll reply within a
              day.
            </p>

            {/* signed by hand */}
            <DrawScope threshold={0.6} className="relative mt-8 flex items-end gap-6">
              <span className="block">
                <Written className="-rotate-2 text-2xl text-field-muted" delay={0.1}>
                  talk soon,
                </Written>
                <span className="relative mt-1 block w-fit">
                  <Written className="-rotate-3 text-6xl leading-none text-chalk" delay={0.6}>
                    Essa
                  </Written>
                  <Mark
                    kind="underline"
                    delay={1.0}
                    duration={0.5}
                    className="absolute -bottom-3 -left-2 h-4 w-[130%] text-sky"
                    width={3}
                  />
                </span>
              </span>
              <span
                className="stamp mb-2 rounded-[8px] border-[3px] border-chalk px-3 py-1.5 text-chalk"
                style={{ "--r": "7deg", "--delay": "1.5s", transform: "rotate(7deg)" } as React.CSSProperties}
              >
                <span className="display block whitespace-nowrap text-sm uppercase leading-none tracking-wide [--wdth:115] sm:text-base">
                  Replies within a day
                </span>
              </span>
            </DrawScope>

            <dl className="mt-10 grid grid-cols-2 gap-8 border-t border-chalk/25 pt-6 text-sm">
              <div>
                <dt className="text-field-muted">Local time in Amman</dt>
                <dd className="mt-1 text-lg font-medium">
                  <AmmanTime />
                </dd>
              </div>
              <div>
                <dt className="text-field-muted">Status</dt>
                <dd className="mt-1 flex items-center gap-2 text-lg font-medium">
                  <span className="h-2 w-2 rounded-full bg-signal" />
                  {site.available ? "Available" : "Booked"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-field-muted">Elsewhere</dt>
                <dd className="mt-1 flex gap-5 text-lg font-medium">
                  {site.socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-chalk/40 underline-offset-4 transition-colors hover:decoration-chalk"
                    >
                      {s.label}
                    </a>
                  ))}
                </dd>
              </div>
              <div className={`col-span-2 ${site.features.palettes ? "" : "hidden"}`}>
                <dt className="text-field-muted">Site palette</dt>
                <dd className="mt-2">
                  <PaletteSwitcher labelled className="flex-wrap" />
                </dd>
              </div>
            </dl>
          </div>

          <div className="md:col-span-7">
            <Composer />
          </div>
        </div>
      </div>
    </section>
  );
}
